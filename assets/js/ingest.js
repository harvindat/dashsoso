/* ============================================================
   HARVIN — Motor de ingesta y consolidación de reportes ERP
   ------------------------------------------------------------
   1. Lee los reportes (XLSX / XLS / CSV) con SheetJS.
   2. Detecta el tipo de reporte y mapea columnas (editable).
   3. Normaliza filas a un "almacén crudo" (raw store).
   4. Reconstruye el objeto HARVIN completo que consumen las
      vistas, con la misma metodología documentada en el README:
      - costeo a último costo de compra (EXIVAL)
      - capital inmovilizado validado contra ventas reales
      - rotación real anualizada (COGS/inventario)
      - sugerencia de compra: cobertura <30 días → 45 días
   Modos: "reemplazar" (reportes del periodo completo) o
   "acumular" (sumar ventas semana a semana sobre lo publicado).
   ============================================================ */
(function(global){
  'use strict';

  /* ================= utilidades ================= */
  const strip = s => String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const num = v => {
    if(v==null || v==='') return 0;
    if(typeof v==='number') return isFinite(v)?v:0;
    let s = String(v).trim();
    if(!s) return 0;
    const neg = /^\(.*\)$/.test(s);
    s = s.replace(/[()$\s]/g,'').replace(/[A-Za-z%]+$/,'');
    const lastC = s.lastIndexOf(','), lastD = s.lastIndexOf('.');
    if(lastC>-1 && lastD>-1){
      // ambos separadores: el último es el decimal
      if(lastD>lastC) s = s.replace(/,/g,'');                       // 1,234,567.89
      else            s = s.replace(/\./g,'').replace(',', '.');    // 1.234.567,89
    }else if(lastC>-1){
      // solo comas: miles si patrón ,ddd; decimal en caso contrario
      if(/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g,'');
      else s = s.replace(',', '.');
    }
    const n = parseFloat(s);
    return isFinite(n) ? (neg?-n:n) : 0;
  };
  const round2 = n => Math.round(n*100)/100;
  const safeDiv = (a,b) => (b && isFinite(a/b)) ? a/b : 0;

  /* ================= clasificación de línea ================= */
  function classifyLinea(desc){
    const d = strip(desc);
    if(/amortiguador|base de amort|strut|am\.?\s*gas|am\.?\s*hid/.test(d)) return 'AMORTIGUADOR/BASE';
    if(/horquilla|buje/.test(d))                               return 'HORQUILLA/BUJES';
    if(/soporte|sop\.?\s/.test(d))                             return 'SOPORTE MOTOR/TRANS';
    if(/terminal|barra dir|cremallera/.test(d))                return 'TERMINAL/BARRA DIR';
    if(/estabilizador|tornillo estab/.test(d))                 return 'ESTABILIZADOR';
    if(/rotula/.test(d))                                       return 'ROTULA';
    if(/tope|goma|hule/.test(d))                               return 'TOPE/GOMA';
    return 'OTROS';
  }
  const LINEA_NICE = {
    'SOPORTE MOTOR/TRANS':'Soporte motor/trans','HORQUILLA/BUJES':'Horquilla/Bujes','OTROS':'Otros',
    'AMORTIGUADOR/BASE':'Amortiguador/Base','TERMINAL/BARRA DIR':'Terminal/Barra dir',
    'ESTABILIZADOR':'Estabilizador','ROTULA':'Rótula','TOPE/GOMA':'Tope/Goma'
  };

  /* ================= tipos de reporte ================= */
  const FIELD_SYNONYMS = {
    code:    ['articulo','art','clave','codigo','cve','sku','no. parte','numero de parte','clave articulo','cve. articulo','clave del articulo'],
    desc:    ['descripcion','nombre','desc','nombre del articulo','articulo descripcion','concepto'],
    units:   ['unidades','cantidad','piezas','pzas','cant','uds','unidades vendidas','cantidad vendida'],
    amount:  ['importe','venta','ventas','neto','importe neto','total','monto','venta neta','importe venta','subtotal'],
    stock:   ['existencia','exist','inventario','stock','existencias','exist.'],
    cost:    ['costo','costo unitario','ultimo costo','costo u','cu','costo unit','ult. costo','ultimo costo de compra'],
    value:   ['valor','valor inventario','importe inventario','valor total','valuacion','costo total'],
    client:  ['cliente','nombre cliente','razon social','nombre del cliente'],
    clientCode:['clave cliente','cve cliente','codigo cliente','no. cliente','cliente clave','num. cliente'],
    balance: ['saldo','saldo pendiente','por cobrar','adeudo','saldo actual'],
    days:    ['dias','antiguedad','dias vencido','atraso','dias de atraso','dias transcurridos','edad'],
    invoices:['facturas','documentos','docs','no. facturas','folios','num facturas'],
    outflow: ['salidas','salida','unidades salida','salidas del periodo'],
    avgInv:  ['inventario promedio','inv promedio','inv. promedio','promedio','existencia promedio'],
    turnover:['rotacion','indice de rotacion','rotacion del periodo'],
    lastSale:['ultima venta','fecha ultima venta','ult venta','ult. venta','fecha de ultima venta']
  };

  const REPORT_TYPES = {
    VENTAS_ART:{ nombre:'Ventas por artículo',          req:['code','desc','units','amount'], opt:[] },
    VENTAS_CLI:{ nombre:'Ventas por cliente',           req:['client','amount'],              opt:['clientCode'] },
    CLI_ART:   { nombre:'Cliente × Artículo',           req:['client','desc','amount'],       opt:['code','units'] },
    EXIVAL:    { nombre:'Existencia y valor (EXIVAL)',  req:['code','desc','stock','cost'],   opt:['value'] },
    INACTIVOS: { nombre:'Artículos inactivos',          req:['code','lastSale'],              opt:['desc','stock','value'] },
    ROTACION:  { nombre:'Rotación de inventario',       req:['desc','outflow','avgInv'],      opt:['turnover','code'] },
    COBRANZA:  { nombre:'Cobranza / Cartera',           req:['client','balance'],             opt:['days','invoices'] }
  };

  /* ================= lectura de archivos ================= */
  async function parseFile(file){
    if(typeof XLSX === 'undefined') throw new Error('SheetJS (XLSX) no está cargado. Revisa tu conexión a internet.');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {type:'array', cellDates:true});
    const sheets = wb.SheetNames.map(name=>{
      const ws = wb.Sheets[name];
      const aoa = XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:null, blankrows:false});
      return {name, aoa};
    }).filter(s=>s.aoa.length>0);
    if(!sheets.length) throw new Error('El archivo no contiene hojas con datos.');
    return sheets;
  }

  /* Localiza la fila de encabezados: la de mayor coincidencia con sinónimos
     dentro de las primeras 25 filas; en empate, la de más celdas de texto. */
  function findHeaderRow(aoa){
    let best = {idx:0, score:-1, textCells:0};
    const allSyn = Object.values(FIELD_SYNONYMS).flat();
    const lim = Math.min(aoa.length, 25);
    for(let i=0;i<lim;i++){
      const row = aoa[i]||[];
      let score=0, textCells=0;
      row.forEach(c=>{
        const s = strip(c);
        if(!s) return;
        if(typeof c==='string') textCells++;
        if(allSyn.some(sy=>s===sy || s.startsWith(sy+' ') || s.includes(sy))) score++;
      });
      if(score>best.score || (score===best.score && textCells>best.textCells))
        best = {idx:i, score, textCells};
    }
    return best.idx;
  }

  function headerCells(aoa, headerIdx){
    return (aoa[headerIdx]||[]).map((c,i)=>({i, raw:c, key:strip(c)}));
  }

  /* Mapea automáticamente columnas → campos por sinónimos (mejor coincidencia) */
  function autoMapColumns(headers){
    const map = {};
    const used = new Set();
    // primero coincidencias exactas, luego parciales
    for(const pass of ['exact','partial']){
      for(const [field, syns] of Object.entries(FIELD_SYNONYMS)){
        if(map[field]!=null) continue;
        for(const h of headers){
          if(!h.key || used.has(h.i)) continue;
          const hit = syns.some(sy => pass==='exact' ? h.key===sy : (h.key.includes(sy)||sy.includes(h.key)) && h.key.length>=3);
          if(hit){ map[field]=h.i; used.add(h.i); break; }
        }
      }
    }
    return map;
  }

  /* Detecta el tipo de reporte por columnas + nombre de archivo */
  function detectType(headers, filename){
    const map = autoMapColumns(headers);
    const has = f => map[f]!=null;
    const fn = strip(filename||'');
    const scores = {};
    const bump = (t,n)=>scores[t]=(scores[t]||0)+n;

    if(has('stock') && has('cost')) bump('EXIVAL',4);
    if(has('lastSale')) bump('INACTIVOS',4);
    if(has('outflow') && has('avgInv')) bump('ROTACION',5);
    if(has('balance')) bump('COBRANZA',4);
    if(has('client') && (has('code')||has('desc')) && has('amount')) bump('CLI_ART',3);
    if(has('client') && has('amount') && !has('code') && !has('desc')) bump('VENTAS_CLI',4);
    if(has('code') && has('units') && has('amount') && !has('client') && !has('stock')) bump('VENTAS_ART',4);

    if(/exival|exist/.test(fn)) bump('EXIVAL',3);
    if(/inact/.test(fn)) bump('INACTIVOS',3);
    if(/rot/.test(fn)) bump('ROTACION',3);
    if(/cobr|cartera|cxc/.test(fn)) bump('COBRANZA',3);
    if(/vtsart|art/.test(fn)) bump('VENTAS_ART',2);
    if(/cliente.*art|art.*cliente|cliart|cruce/.test(fn)) bump('CLI_ART',3);
    if(/vtscli|cliente/.test(fn)) bump('VENTAS_CLI',2);

    let bestT=null, bestS=0;
    for(const [t,s] of Object.entries(scores)) if(s>bestS){bestS=s;bestT=t;}
    return {type:bestT, map, scores};
  }

  /* Convierte la hoja a registros normalizados según tipo + mapeo */
  function normalizeRows(aoa, headerIdx, type, map, warnings){
    const out = [];
    const T = REPORT_TYPES[type];
    if(!T) return out;
    const missing = T.req.filter(f=>map[f]==null);
    if(missing.length) throw new Error(`Faltan columnas obligatorias (${missing.join(', ')}) para "${T.nombre}". Asigna las columnas manualmente.`);
    const get = (row,f)=> map[f]==null ? null : row[map[f]];
    const isTotalRow = (txt)=>/^(total|totales|suma|gran total|subtotal)/.test(strip(txt));

    for(let i=headerIdx+1;i<aoa.length;i++){
      const row = aoa[i]||[];
      if(!row.some(c=>c!=null && c!=='')) continue;
      const firstTxt = row.find(c=>typeof c==='string' && c.trim());
      if(firstTxt && isTotalRow(firstTxt)) continue;  // filas de totales del ERP

      if(type==='VENTAS_ART'){
        const code = String(get(row,'code')??'').trim();
        if(!code) continue;
        out.push({code, desc:String(get(row,'desc')??'').trim(), u:num(get(row,'units')), venta:num(get(row,'amount'))});
      }else if(type==='VENTAS_CLI'){
        const name = String(get(row,'client')??'').trim();
        if(!name) continue;
        out.push({code:String(get(row,'clientCode')??'').trim(), name, venta:num(get(row,'amount'))});
      }else if(type==='CLI_ART'){
        const cli = String(get(row,'client')??'').trim();
        const desc = String(get(row,'desc')??'').trim();
        if(!cli || (!desc && !get(row,'code'))) continue;
        out.push({cli, code:String(get(row,'code')??'').trim(), desc, u:num(get(row,'units')), venta:num(get(row,'amount'))});
      }else if(type==='EXIVAL'){
        const code = String(get(row,'code')??'').trim();
        if(!code) continue;
        const exist = num(get(row,'stock')), costo = num(get(row,'cost'));
        let valor = map.value!=null ? num(get(row,'value')) : exist*costo;
        if(!valor && exist && costo) valor = exist*costo;
        out.push({code, desc:String(get(row,'desc')??'').trim(), exist, costo:round2(costo), valor:round2(valor)});
      }else if(type==='INACTIVOS'){
        const code = String(get(row,'code')??'').trim();
        if(!code) continue;
        let lv = get(row,'lastSale');
        if(lv instanceof Date) lv = (lv.getMonth()+1).toString().padStart(2,'0')+'/'+lv.getDate().toString().padStart(2,'0')+'/'+lv.getFullYear();
        out.push({code, ultima_venta: lv?String(lv).trim():'Sin registro'});
      }else if(type==='ROTACION'){
        const desc = String(get(row,'desc')??'').trim();
        if(!desc) continue;
        const salidas=num(get(row,'outflow')), inv=num(get(row,'avgInv'));
        const rot = map.turnover!=null ? num(get(row,'turnover')) : safeDiv(salidas, inv);
        out.push({desc, salidas, inv_prom:inv, rotacion:round2(rot)});
      }else if(type==='COBRANZA'){
        const cli = String(get(row,'client')??'').trim();
        if(!cli) continue;
        out.push({cliente:cli, saldo:num(get(row,'balance')),
                  dias: map.days!=null ? num(get(row,'days')) : null,
                  facturas: map.invoices!=null ? Math.round(num(get(row,'invoices'))) : 1});
      }
    }
    if(!out.length && warnings) warnings.push(`El reporte "${T.nombre}" no produjo filas válidas — revisa el mapeo de columnas.`);
    return out;
  }

  /* ================= almacén crudo (raw store) ================= */
  function emptyStore(){
    return {
      version:1,
      meta:{empresa:'HARVIN DISTRIBUCIONES', inicio:null, corte:null, dias:0, facturas:null, iva:null, actualizado:null},
      ventasArt:{}, ventasCli:{}, cliArt:[], exival:{}, inactivosUV:{}, rotacion:[], cobranza:[]
    };
  }

  /* Integra registros normalizados al almacén. modo: 'reemplazar' | 'acumular'
     - ventas (art/cli/cliart): acumulables (se SUMAN sobre lo existente)
     - exival / cobranza / rotación / inactivos: fotografías (siempre se reemplazan) */
  function mergeIntoStore(store, type, records, modo){
    const acum = modo==='acumular';
    if(type==='VENTAS_ART'){
      if(!acum) store.ventasArt = {};
      records.forEach(r=>{
        const k=r.code;
        if(!store.ventasArt[k]) store.ventasArt[k]={desc:r.desc, u:0, venta:0};
        if(r.desc) store.ventasArt[k].desc=r.desc;
        store.ventasArt[k].u += r.u;
        store.ventasArt[k].venta = round2(store.ventasArt[k].venta + r.venta);
      });
    }else if(type==='VENTAS_CLI'){
      if(!acum) store.ventasCli = {};
      records.forEach(r=>{
        const k = r.name.toUpperCase();
        if(!store.ventasCli[k]) store.ventasCli[k]={code:r.code||'', name:r.name, venta:0};
        if(r.code) store.ventasCli[k].code=r.code;
        store.ventasCli[k].venta = round2(store.ventasCli[k].venta + r.venta);
      });
    }else if(type==='CLI_ART'){
      if(!acum){ store.cliArt = []; }
      if(acum){
        // acumular: sumar por (cliente, código/desc)
        const idx = new Map(store.cliArt.map((r,i)=>[r.cli.toUpperCase()+'¦'+(r.code||strip(r.desc)), i]));
        records.forEach(r=>{
          const k = r.cli.toUpperCase()+'¦'+(r.code||strip(r.desc));
          if(idx.has(k)){
            const t = store.cliArt[idx.get(k)];
            t.u=(t.u||0)+(r.u||0); t.venta=round2(t.venta+r.venta);
          }else{ idx.set(k, store.cliArt.push(r)-1); }
        });
      }else{
        store.cliArt = records;
      }
    }else if(type==='EXIVAL'){
      store.exival = {};
      records.forEach(r=>{ store.exival[r.code]={desc:r.desc, exist:r.exist, costo:r.costo, valor:r.valor}; });
    }else if(type==='INACTIVOS'){
      store.inactivosUV = {};
      records.forEach(r=>{ store.inactivosUV[r.code]=r.ultima_venta; });
    }else if(type==='ROTACION'){
      store.rotacion = records;
    }else if(type==='COBRANZA'){
      store.cobranza = records;
    }
  }

  /* ================= reconstrucción del agregado HARVIN ================= */
  function fmtPeriodo(inicio, corte, dias){
    const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const f = d => { const x=new Date(d+'T00:00:00'); return isNaN(x)?d:(String(x.getDate()).padStart(2,'0')+' '+MES[x.getMonth()]+' '+x.getFullYear()); };
    if(!inicio || !corte) return 'Periodo actualizado ('+dias+' días)';
    return f(inicio)+' — '+f(corte)+' ('+dias+' días)';
  }

  function buildHarvin(store, baseline){
    const W = [];                                   // advertencias
    const B = baseline || {};                       // datos previos como respaldo
    const meta = store.meta || {};
    const dias = Math.max(1, meta.dias || 0);

    const ventasArr = Object.entries(store.ventasArt).map(([code,v])=>({code, desc:v.desc, u:v.u, venta:v.venta}))
                            .filter(r=>r.venta!==0 || r.u!==0);
    const hayVentas = ventasArr.length>0;
    const hayExival = Object.keys(store.exival).length>0;
    const hayCli    = Object.keys(store.ventasCli).length>0;
    const hayCliArt = store.cliArt.length>0;
    const hayCob    = store.cobranza.length>0;
    const hayRot    = store.rotacion.length>0;

    /* ---------- VENTAS ---------- */
    let ventas;
    if(hayVentas){
      const neto = round2(ventasArr.reduce((s,r)=>s+r.venta,0));
      const unidades = Math.round(ventasArr.reduce((s,r)=>s+r.u,0));
      const iva = meta.iva!=null ? round2(meta.iva) : round2(neto*0.16);
      const documentos = meta.facturas!=null ? meta.facturas : (B.ventas?B.ventas.documentos:0);
      if(meta.facturas==null) W.push('No se indicó el número de facturas del periodo; se conservó el valor anterior. El ticket promedio depende de este dato.');
      ventas = { neto, iva, total: round2(neto+iva), documentos,
                 ticket_promedio: round2(safeDiv(neto, documentos)),
                 unidades_vendidas: unidades, skus_vendidos: ventasArr.length };
    }else{
      ventas = B.ventas || emptyVentas();
      W.push('No se cargó "Ventas por artículo": se conservaron las cifras de ventas anteriores.');
    }

    /* ---------- MARGEN (costeo a último costo, EXIVAL) ---------- */
    let margen, costed = [];
    if(hayVentas && hayExival){
      let cogs=0, ventaConCosto=0, sinCosteo=0;
      ventasArr.forEach(r=>{
        const ex = store.exival[r.code];
        const costo = ex ? ex.costo : 0;
        if(costo>0){
          const c = round2(costo*r.u);
          const mg = round2(r.venta - c);
          costed.push({code:r.code, desc:r.desc||(ex&&ex.desc)||'', u:r.u, venta:r.venta,
                       costo_unit:costo, cogs:c, margen:mg, margen_pct: round2(safeDiv(mg,r.venta)*100)});
          cogs+=c; ventaConCosto+=r.venta;
        }else sinCosteo++;
      });
      cogs=round2(cogs); ventaConCosto=round2(ventaConCosto);
      const margenBruto = round2(ventaConCosto - cogs);
      const dist = {'<0%':0,'0-15%':0,'15-25%':0,'25-35%':0,'35-50%':0,'>50%':0};
      costed.forEach(c=>{
        const p=c.margen_pct;
        if(p<0)dist['<0%']++; else if(p<15)dist['0-15%']++; else if(p<25)dist['15-25%']++;
        else if(p<35)dist['25-35%']++; else if(p<=50)dist['35-50%']++; else dist['>50%']++;
      });
      const porLineaMap = {};
      costed.forEach(c=>{
        const L = LINEA_NICE[classifyLinea(c.desc)] || 'Otros';
        if(!porLineaMap[L]) porLineaMap[L]={linea:L, venta:0, margen:0, unidades:0, skus:0};
        const o=porLineaMap[L];
        o.venta=round2(o.venta+c.venta); o.margen=round2(o.margen+c.margen);
        o.unidades+=Math.round(c.u); o.skus++;
      });
      const porLinea = Object.values(porLineaMap).map(l=>({...l, margen_pct: round2(safeDiv(l.margen,l.venta)*100)}))
                             .sort((a,b)=>b.venta-a.venta);
      margen = {
        ventas_con_costo: ventaConCosto, cogs, margen_bruto: margenBruto,
        margen_pct: round2(safeDiv(margenBruto,ventaConCosto)*100),
        skus_con_costeo: costed.length, skus_sin_costeo: sinCosteo,
        markup_pct: round2(safeDiv(margenBruto,cogs)*100),
        top_articulos_utilidad: [...costed].sort((a,b)=>b.margen-a.margen).slice(0,25),
        peor_margen_pct: [...costed].filter(c=>c.u>=2 || c.margen<0).sort((a,b)=>a.margen_pct-b.margen_pct).slice(0,20),
        distribucion: dist, por_linea: porLinea
      };
      if(sinCosteo>0) W.push(`${sinCosteo} SKUs vendidos no tienen costo en EXIVAL y se excluyeron del cálculo de margen.`);
    }else{
      margen = B.margen || emptyMargen();
      W.push('Para recalcular margen se requieren "Ventas por artículo" y "Existencia y valor": se conservó el margen anterior.');
    }

    /* ---------- ARTÍCULOS / ABC ---------- */
    let articulos, abc;
    if(hayVentas){
      const byVenta = [...ventasArr].sort((a,b)=>b.venta-a.venta);
      const byU = [...ventasArr].sort((a,b)=>b.u-a.u || b.venta-a.venta);
      articulos = { top_venta: byVenta.slice(0,30), top_unidades: byU.slice(0,30), total_skus_vendidos: ventasArr.length };
      let acc=0; const tot=ventas.neto || 1;
      const cls={A:{skus:0,venta:0},B:{skus:0,venta:0},C:{skus:0,venta:0}};
      byVenta.forEach(r=>{
        acc+=r.venta;
        const k = acc<=tot*0.80 ? 'A' : (acc<=tot*0.95 ? 'B' : 'C');
        cls[k].skus++; cls[k].venta=round2(cls[k].venta+r.venta);
      });
      const n=ventasArr.length||1;
      abc = { A:{...cls.A, pct_skus:round2(cls.A.skus/n*100)}, B:{...cls.B, pct_skus:round2(cls.B.skus/n*100)},
              C:{...cls.C, pct_skus:round2(cls.C.skus/n*100)}, total_skus:ventasArr.length };
    }else{
      articulos = B.articulos || {top_venta:[],top_unidades:[],total_skus_vendidos:0};
      abc = B.abc || {A:{skus:0,venta:0,pct_skus:0},B:{skus:0,venta:0,pct_skus:0},C:{skus:0,venta:0,pct_skus:0},total_skus:0};
    }

    /* ---------- CLIENTES ---------- */
    let clientes;
    if(hayCli){
      const top = Object.values(store.ventasCli).filter(c=>c.venta!==0).sort((a,b)=>b.venta-a.venta);
      const ventaTotal = round2(top.reduce((s,c)=>s+c.venta,0));
      let acc=0, p80=0;
      for(const c of top){ acc+=c.venta; p80++; if(acc>=ventaTotal*0.8) break; }
      clientes = { total: top.length, venta_total: ventaTotal, top,
                   ticket_promedio_cliente: round2(safeDiv(ventaTotal, top.length)),
                   pareto_clientes_80pct: p80,
                   pareto_pct_clientes: round2(safeDiv(p80, top.length)*100) };
    }else{
      clientes = B.clientes || {total:0,venta_total:0,top:[],ticket_promedio_cliente:0,pareto_clientes_80pct:0,pareto_pct_clientes:0};
      W.push('No se cargó "Ventas por cliente": se conservó la información anterior de clientes.');
    }

    /* ---------- CLIENTE × ARTÍCULO ---------- */
    let cliente_articulo;
    if(hayCliArt){
      const porCli = {};
      const porLineaTot = {};
      store.cliArt.forEach(r=>{
        const L = classifyLinea(r.desc || (store.exival[r.code]&&store.exival[r.code].desc) || '');
        const k = r.cli.toUpperCase();
        if(!porCli[k]) porCli[k]={cliente:r.cli, venta:0, skus:0, lineas:{}};
        const o=porCli[k];
        o.venta=round2(o.venta+r.venta); o.skus++;
        o.lineas[L]=round2((o.lineas[L]||0)+r.venta);
        porLineaTot[L]=round2((porLineaTot[L]||0)+r.venta);
      });
      const topClientes = Object.values(porCli).map(c=>{
        const lineasOrd = Object.fromEntries(Object.entries(c.lineas).sort((a,b)=>b[1]-a[1]));
        return {...c, lineas:lineasOrd, linea_principal: Object.keys(lineasOrd)[0]||'OTROS'};
      }).sort((a,b)=>b.venta-a.venta);
      const potenciar = topClientes.map(c=>{
        const la = Object.keys(c.lineas).length;
        const pot = (c.venta>=100000 && la<=3) ? 'Alto' : (c.venta>=100000 ? 'Medio' : 'Base');
        return {cliente:c.cliente, venta:c.venta, lineas_activas:la, skus:c.skus, linea_principal:c.linea_principal, potencial:pot};
      });
      cliente_articulo = { clientes_analizados: topClientes.length, top_clientes: topClientes,
                           ventas_por_linea: Object.fromEntries(Object.entries(porLineaTot).sort((a,b)=>b[1]-a[1])),
                           potenciar };
    }else{
      cliente_articulo = B.cliente_articulo || {clientes_analizados:0, top_clientes:[], ventas_por_linea:{}, potenciar:[]};
      W.push('No se cargó "Cliente × Artículo": se conservó el cruce anterior.');
    }

    /* ---------- INVENTARIO / INACTIVOS ---------- */
    let inventario, inactivos, promociones, sugerencias;
    if(hayExival){
      const exArr = Object.entries(store.exival).map(([code,v])=>({code, ...v}));
      const valorTotal = round2(exArr.reduce((s,r)=>s+(r.valor||0),0));
      const conExist = exArr.filter(r=>r.exist>0).length;
      const soldSet = new Set(ventasArr.map(r=>r.code));
      if(!hayVentas && B.articulos) (B.articulos.top_venta||[]).forEach(r=>soldSet.add(r.code));
      const muertos = exArr.filter(r=>r.exist>0 && (r.valor||0)>0 && !soldSet.has(r.code));
      const capMuerto = round2(muertos.reduce((s,r)=>s+r.valor,0));
      const cogsP = margen.cogs || (B.margen?B.margen.cogs:0);
      const turnover = round2(safeDiv(cogsP/dias*365, valorTotal)*100)/100;
      inventario = {
        valor_total: valorTotal, skus_total: exArr.length,
        skus_con_existencia: conExist, skus_sin_existencia: exArr.length-conExist,
        turnover_real_anual: round2(turnover),
        dias_inventario: round2(safeDiv(365, turnover||1)),
        capital_activo: round2(valorTotal-capMuerto), capital_muerto: capMuerto,
        pct_muerto: round2(safeDiv(capMuerto,valorTotal)*100)
      };
      const topMuertos = [...muertos].sort((a,b)=>b.valor-a.valor);
      inactivos = {
        count: muertos.length, valor_total: capMuerto,
        unidades: Math.round(muertos.reduce((s,r)=>s+r.exist,0)),
        pct_del_inventario: inventario.pct_muerto,
        criterio: 'Existencia valorizada en EXIVAL sin ninguna venta registrada en el periodo (validado contra el reporte de ventas)',
        top_valor: topMuertos.slice(0,30).map(r=>({code:r.code, desc:r.desc,
          ultima_venta: store.inactivosUV[r.code] || 'Sin registro',
          existencia: r.exist, valor: r.valor, costo_unit: r.costo}))
      };
      const mk = (margen.markup_pct||20.2)/100;
      const cand = topMuertos.slice(0,30);
      promociones = {
        candidatos: cand.length,
        valor_a_liberar: round2(cand.reduce((s,r)=>s+r.valor,0)),
        top: cand.map(r=>({code:r.code, desc:r.desc, existencia:r.exist, costo:r.costo,
          precio_normal_est: round2(r.costo*(1+mk)),
          precio_promo_est: round2(r.costo*(1+mk*0.4437)),
          valor_inmovilizado: r.valor,
          ultima_venta: store.inactivosUV[r.code] || 'Sin registro'})),
        margen_referencia_pct: margen.margen_pct || 20.2
      };
      /* sugerencias de compra: cobertura < 30 días → reabastecer a 45 días */
      if(hayVentas){
        const sug = [];
        ventasArr.forEach(r=>{
          if(r.u<=0) return;
          const ex = store.exival[r.code];
          const exist = ex?ex.exist:0, costo = ex?ex.costo:0;
          const ventaDiaria = r.u/dias;
          const cobertura = safeDiv(exist, ventaDiaria);
          if(cobertura<30 && costo>0){
            const comprar = Math.max(1, Math.ceil(ventaDiaria*45 - exist));
            sug.push({code:r.code, desc:r.desc||(ex&&ex.desc)||'', vendidas:Math.round(r.u), existencia:exist,
                      cobertura_dias: round2(cobertura), sugerido_comprar: comprar,
                      costo_unit: costo, inversion: round2(comprar*costo), venta_periodo: r.venta});
          }
        });
        sug.sort((a,b)=>b.venta_periodo-a.venta_periodo);
        sugerencias = { items_a_reabastecer: sug.length,
                        inversion_estimada: round2(sug.reduce((s,x)=>s+x.inversion,0)),
                        top: sug.slice(0,40),
                        criterio: 'Cobertura < 30 días; reabastecer a 45 días de demanda; costo = último costo de compra' };
      }else{
        sugerencias = B.sugerencias_compra || {items_a_reabastecer:0, inversion_estimada:0, top:[], criterio:''};
      }
    }else{
      inventario  = B.inventario  || emptyInventario();
      inactivos   = B.inactivos   || {count:0,valor_total:0,unidades:0,pct_del_inventario:0,criterio:'',top_valor:[]};
      promociones = B.promociones || {candidatos:0,valor_a_liberar:0,top:[],margen_referencia_pct:0};
      sugerencias = B.sugerencias_compra || {items_a_reabastecer:0,inversion_estimada:0,top:[],criterio:''};
      W.push('No se cargó "Existencia y valor (EXIVAL)": se conservó inventario, capital inmovilizado, promociones y compras anteriores.');
    }

    /* ---------- ROTACIÓN ---------- */
    let rotacion;
    if(hayRot){
      const rows = store.rotacion;
      const salidasTot = round2(rows.reduce((s,r)=>s+r.salidas,0));
      const invProm = round2(rows.reduce((s,r)=>s+r.inv_prom,0));
      const con = rows.filter(r=>r.salidas>0).length;
      rotacion = { rotacion_global: round2(safeDiv(salidasTot, invProm)),
                   salidas_total: salidasTot, inv_promedio: invProm,
                   alta_rotacion: [...rows].filter(r=>r.rotacion>0).sort((a,b)=>b.rotacion-a.rotacion).slice(0,25),
                   sin_rotacion_count: rows.length-con, con_rotacion_count: con, total_items: rows.length };
    }else if(hayVentas && hayExival){
      // derivada: salidas = unidades vendidas; inv_prom ≈ existencia actual
      const rows = ventasArr.map(r=>{
        const ex = store.exival[r.code];
        const inv = ex?Math.max(ex.exist,0.01):0.01;
        return {desc:r.desc, salidas:r.u, inv_prom:inv, rotacion: round2(r.u/inv)};
      });
      const exTotal = Object.keys(store.exival).length;
      rotacion = { rotacion_global: round2(safeDiv(ventas.unidades_vendidas, rows.reduce((s,r)=>s+r.inv_prom,0))),
                   salidas_total: ventas.unidades_vendidas,
                   inv_promedio: round2(rows.reduce((s,r)=>s+r.inv_prom,0)),
                   alta_rotacion: [...rows].sort((a,b)=>b.rotacion-a.rotacion).slice(0,25),
                   sin_rotacion_count: Math.max(0, exTotal-rows.length), con_rotacion_count: rows.length,
                   total_items: exTotal };
      W.push('No se cargó el reporte de rotación: la rotación por artículo se derivó de ventas y existencia actual (aproximación).');
    }else{
      rotacion = B.rotacion || {rotacion_global:0,salidas_total:0,inv_promedio:0,alta_rotacion:[],sin_rotacion_count:0,con_rotacion_count:0,total_items:0};
      W.push('No se cargó el reporte de rotación: se conservó la rotación anterior.');
    }

    /* ---------- COBRANZA ---------- */
    let cobranza;
    if(hayCob){
      const rows = store.cobranza.filter(r=>r.saldo!==0);
      const cartera = round2(rows.reduce((s,r)=>s+r.saldo,0));
      const porCli = {};
      rows.forEach(r=>{
        const k=r.cliente.toUpperCase();
        if(!porCli[k]) porCli[k]={cliente:r.cliente, saldo:0, facturas:0};
        porCli[k].saldo=round2(porCli[k].saldo+r.saldo);
        porCli[k].facturas+= (r.facturas||1);
      });
      const aging = {'0-7':0,'8-15':0,'16-30':0,'31-60':0,'>60':0};
      let conDias = 0, sumDias=0, sumPond=0;
      rows.forEach(r=>{
        if(r.dias==null) return;
        conDias++;
        sumDias += r.dias; sumPond += r.dias*r.saldo;
        const d=r.dias;
        const k = d<=7?'0-7':d<=15?'8-15':d<=30?'16-30':d<=60?'31-60':'>60';
        aging[k]=round2(aging[k]+r.saldo);
      });
      if(!conDias){
        aging['0-7']=cartera;
        W.push('El reporte de cobranza no incluye columna de días/antigüedad: toda la cartera se mostró en 0-7 días. Mapea la columna de días para el aging real.');
      }
      const nFact = rows.reduce((s,r)=>s+(r.facturas||1),0);
      cobranza = { cartera_total: cartera,
                   clientes_con_saldo: Object.keys(porCli).length,
                   facturas_pendientes: nFact,
                   aging,
                   top_deudores: Object.values(porCli).sort((a,b)=>b.saldo-a.saldo),
                   atraso_promedio: conDias ? round2(sumDias/conDias) : (B.cobranza?B.cobranza.atraso_promedio:0),
                   saldo_promedio_factura: round2(safeDiv(cartera, nFact)),
                   dso_dias: round2(safeDiv(cartera, safeDiv(ventas.neto, dias))) };
    }else{
      cobranza = B.cobranza || {cartera_total:0,clientes_con_saldo:0,facturas_pendientes:0,aging:{'0-7':0,'8-15':0,'16-30':0,'31-60':0,'>60':0},top_deudores:[],atraso_promedio:0,saldo_promedio_factura:0,dso_dias:0};
      W.push('No se cargó el reporte de cobranza: se conservó la cartera anterior.');
    }

    /* ---------- RESUMEN + META ---------- */
    const resumen = {
      empresa: meta.empresa || 'HARVIN DISTRIBUCIONES',
      periodo: fmtPeriodo(meta.inicio, meta.corte, dias),
      ventas_netas: ventas.neto, ventas_totales_cf: ventas.total,
      facturas: ventas.documentos, ticket_promedio: ventas.ticket_promedio,
      margen_bruto: margen.margen_bruto, margen_pct: margen.margen_pct,
      inventario_valor: inventario.valor_total,
      rotacion: rotacion.rotacion_global,
      cartera: cobranza.cartera_total, dso: cobranza.dso_dias,
      clientes_activos: clientes.total, skus_vendidos: ventas.skus_vendidos,
      capital_muerto: inventario.capital_muerto, unidades_vendidas: ventas.unidades_vendidas
    };

    const data = { ventas, inventario, margen, articulos, clientes, rotacion, inactivos,
                   cobranza, cliente_articulo, sugerencias_compra: sugerencias, promociones,
                   resumen, abc,
                   meta: { actualizado: new Date().toISOString(),
                           periodo: resumen.periodo,
                           corte: meta.corte || null,
                           dias, version: 2 } };
    return { data, warnings: W };
  }

  function emptyVentas(){ return {neto:0,iva:0,total:0,documentos:0,ticket_promedio:0,unidades_vendidas:0,skus_vendidos:0}; }
  function emptyMargen(){ return {ventas_con_costo:0,cogs:0,margen_bruto:0,margen_pct:0,skus_con_costeo:0,skus_sin_costeo:0,markup_pct:0,top_articulos_utilidad:[],peor_margen_pct:[],distribucion:{'<0%':0,'0-15%':0,'15-25%':0,'25-35%':0,'35-50%':0,'>50%':0},por_linea:[]}; }
  function emptyInventario(){ return {valor_total:0,skus_total:0,skus_con_existencia:0,skus_sin_existencia:0,turnover_real_anual:0,dias_inventario:0,capital_activo:0,capital_muerto:0,pct_muerto:0}; }

  const API = { strip, num, classifyLinea, REPORT_TYPES, FIELD_SYNONYMS,
                parseFile, findHeaderRow, headerCells, autoMapColumns, detectType,
                normalizeRows, emptyStore, mergeIntoStore, buildHarvin };
  if(typeof module!=='undefined' && module.exports) module.exports = API;
  global.HINGEST = API;
})(typeof window!=='undefined' ? window : globalThis);
