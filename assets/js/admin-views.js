/* ============================================================
   HARVIN — Vistas de administración
   ------------------------------------------------------------
   - Pantalla de inicio de sesión (gate sobre todo el tablero)
   - "Actualizar Datos": carga de reportes ERP → consolidación
     → previsualización → aplicar / publicar al repo (token GH)
   - "Usuarios": altas y bajas (solo superusuario/admins)
   Se carga DESPUÉS de app.js: comparte NAV, VIEWS, kpi, sHead,
   insight, svg, I, fMX, fNum, fPct, fCompact del ámbito global.
   ============================================================ */
'use strict';

/* =================== LOGIN GATE =================== */
function showLoginGate(onSuccess){
  const old = document.getElementById('login-gate');
  if(old) old.remove();
  const div = document.createElement('div');
  div.id = 'login-gate';
  div.innerHTML = `
  <div class="login-card">
    <img src="assets/img/logo.jpg" alt="Harvin Distribuciones" class="login-brandimg">
    <p class="login-sub">Centro de Inteligencia Directiva · Acceso restringido</p>
    <form id="login-form" autocomplete="off">
      <label>Usuario</label>
      <input id="lg-user" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>
      <label>Contraseña</label>
      <input id="lg-pass" type="password" autocomplete="current-password" required>
      <div id="lg-msg" class="login-msg"></div>
      <button type="submit" class="btn btn-amber" id="lg-btn">Entrar</button>
    </form>
    <div class="login-foot">Sesión válida por 8 horas · Tablero ejecutivo MXN</div>
  </div>`;
  document.body.appendChild(div);
  const form = div.querySelector('#login-form');
  const msg = div.querySelector('#lg-msg');
  const btn = div.querySelector('#lg-btn');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    btn.disabled = true; btn.textContent = 'Verificando…'; msg.textContent='';
    try{
      const r = await HAUTH.login(div.querySelector('#lg-user').value, div.querySelector('#lg-pass').value);
      if(r.ok){
        div.classList.add('bye');
        setTimeout(()=>{ div.remove(); onSuccess && onSuccess(); }, 220);
      }else{
        msg.textContent = r.msg || 'No fue posible iniciar sesión.';
        btn.disabled=false; btn.textContent='Entrar';
      }
    }catch(err){
      msg.textContent = 'Error: '+err.message;
      btn.disabled=false; btn.textContent='Entrar';
    }
  });
  setTimeout(()=>div.querySelector('#lg-user').focus(), 60);
}

/* =================== ESTADO DE LA ACTUALIZACIÓN =================== */
const UPD = {
  files: [],          // {name, sheets[], sheetIdx, headerIdx, headers[], type, map{}, grouped, ignored, period, status, error}
  store: null,        // raw store resultante
  result: null,       // {data, warnings}
  modo: 'auto'
};

function escA(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

/* =================== VISTA: ACTUALIZAR DATOS =================== */
VIEWS.actualizar = ()=>{
  const meta = (D.meta)||{};
  const corteDefault = meta.corte || new Date().toISOString().slice(0,10);
  const repo = HGH.getRepo();
  const canPublish = !!(window.HAUTH && HAUTH.canPublish());
  const html = `
  ${sHead('Actualizar Datos', canPublish
      ? 'Carga los reportes del ERP (XLSX/CSV), consolida la información y publica el tablero actualizado al repositorio mediante tu token de GitHub.'
      : 'Carga los reportes del ERP (XLSX/CSV), consolida la información y visualiza el tablero actualizado. La publicación al repositorio la realiza un administrador.')}

  <div class="card pad-lg">
    <div class="card-h"><span class="t">1 · Parámetros del periodo</span><span class="tag amber">Obligatorio</span></div>
    <div class="adm-grid">
      <div class="fld"><label>Fecha de inicio del periodo</label><input type="date" id="up-inicio" value="${escA(rawStoreMetaGuess('inicio') || '2026-01-01')}"></div>
      <div class="fld"><label>Fecha de corte (datos al…)</label><input type="date" id="up-corte" value="${escA(corteDefault)}"></div>
      <div class="fld">
        <label>Modo de integración</label>
        <select id="up-modo">
          <option value="auto" selected>Automático — según las fechas de los reportes (recomendado)</option>
          <option value="reemplazar">Reemplazar — los reportes cubren TODO el periodo</option>
          <option value="acumular">Acumular — sumar ventas nuevas sobre lo ya publicado</option>
        </select>
      </div>
    </div>
    <div class="note">Las <b>fechas se detectan solas</b> del título de los reportes al cargarlos (puedes corregirlas). El <b>número de facturas y el IVA</b> se obtienen del reporte <b>Diarios de ventas</b> automáticamente. En <b>Automático</b>: si los reportes cubren todo el periodo desde el inicio, se reemplaza; si solo traen días nuevos posteriores al último corte publicado, las ventas se acumulan al histórico. Existencia, cobranza, rotación e inactivos siempre se toman del archivo más reciente porque son fotografías del momento.</div>
  </div>

  <div class="card pad-lg" style="margin-top:16px">
    <div class="card-h"><span class="t">2 · Reportes del ERP</span><span class="s">XLSX · XLS · CSV — puedes soltar varios a la vez</span></div>
    <div id="dropzone" class="dropzone">
      <div class="dz-ico">${svg(I.upload)}</div>
      <div><b>Arrastra aquí los reportes</b> o <span class="dz-link">haz clic para elegirlos</span></div>
      <div class="dz-sub">Ventas por artículo · Ventas por cliente · Cliente×Artículo · Existencia y valor · Inactivos · Rotación · Cobranza · Diario de ventas · Diario de compras · Cobros · Pedidos</div>
      <input type="file" id="file-input" multiple accept=".xlsx,.xls,.csv" style="display:none">
    </div>
    <div id="file-list" class="file-list"></div>
  </div>

  <div class="card pad-lg" style="margin-top:16px">
    <div class="card-h"><span class="t">3 · Procesar y previsualizar</span></div>
    <div class="adm-actions">
      <button class="btn btn-amber" id="btn-process">${svg(I.spark)} Procesar reportes</button>
      <span id="proc-msg" class="proc-msg"></span>
    </div>
    <div id="preview"></div>
  </div>

  <div class="card pad-lg" style="margin-top:16px">
    <div class="card-h"><span class="t">4 · Aplicar${canPublish?' y publicar':' al tablero'}</span><span class="tag teal">${canPublish?'GitHub Pages':'Vista previa'}</span></div>
    ${canPublish ? `
    <div class="adm-grid">
      <div class="fld"><label>Propietario (owner)</label><input id="gh-owner" value="${escA(repo.owner)}" placeholder="usuario u organización"></div>
      <div class="fld"><label>Repositorio</label><input id="gh-repo" value="${escA(repo.repo)}" placeholder="harvin-dashboard"></div>
      <div class="fld"><label>Rama</label><input id="gh-branch" value="${escA(repo.branch||'main')}"></div>
      <div class="fld" style="grid-column:1/-1"><label>Token de GitHub (fine-grained o classic con permiso <i>contents: write</i>)</label>
        <input id="gh-token" type="password" placeholder="github_pat_… / ghp_…" value="${escA(HGH.getToken())}">
      </div>
    </div>
    <div class="adm-actions" style="margin-top:14px">
      <button class="btn" id="btn-validate">${svg(I.key)} Validar token</button>
      <button class="btn btn-teal" id="btn-apply" disabled>${svg(I.check)} Aplicar al tablero (vista previa local)</button>
      <button class="btn btn-amber" id="btn-publish" disabled>${svg(I.upload)} Publicar al repositorio</button>
      <button class="btn" id="btn-download" disabled>${svg(I.doc)} Descargar JSON</button>
    </div>
    <div id="pub-msg" class="proc-msg"></div>
    <div class="note">El token se guarda solo en esta pestaña (sessionStorage) y nunca se escribe en el repositorio. La publicación actualiza <code>assets/data/harvin-data.json</code> y <code>assets/data/raw-store.json</code>; GitHub Pages refleja el cambio en 1–2 minutos y el tablero lo lee sin caché.</div>
    ` : `
    <div class="adm-actions" style="margin-top:4px">
      <button class="btn btn-teal" id="btn-apply" disabled>${svg(I.check)} Aplicar al tablero (ver en esta sesión)</button>
    </div>
    <div id="pub-msg" class="proc-msg"></div>
    <div class="note">Tu perfil puede cargar reportes y revisar el tablero consolidado en esta sesión, pero <b>no publica los cambios al repositorio</b>. Para dejarlos en línea de forma permanente, un administrador debe publicarlos. Si lo necesitas, puedes avisar al administrador una vez que la consolidación se vea correcta.</div>
    `}
  </div>`;

  const init = ()=>{
    const $ = id=>document.getElementById(id);
    const dz=$('dropzone'), fi=$('file-input');

    dz.addEventListener('click', ()=>fi.click());
    dz.addEventListener('dragover', e=>{e.preventDefault(); dz.classList.add('over');});
    dz.addEventListener('dragleave', ()=>dz.classList.remove('over'));
    dz.addEventListener('drop', e=>{e.preventDefault(); dz.classList.remove('over'); handleFiles(e.dataTransfer.files);});
    fi.addEventListener('change', ()=>{handleFiles(fi.files); fi.value='';});
    $('up-modo').value = UPD.modo;
    $('up-modo').addEventListener('change', e=>{UPD.modo=e.target.value;});

    $('btn-process').addEventListener('click', processAll);
    const bind=(id,fn)=>{ const el=$(id); if(el) el.addEventListener('click', fn); };
    bind('btn-validate', validateToken);
    bind('btn-apply', applyLocal);
    bind('btn-publish', publish);
    bind('btn-download', downloadJsons);
    renderFileList();
    refreshActionState();
  };
  return {html, init};
};

function rawStoreMetaGuess(k){
  try{ return (UPD.store && UPD.store.meta && UPD.store.meta[k]) || null; }catch(e){ return null; }
}

/* ---------- manejo de archivos ---------- */
async function handleFiles(fileList){
  const files = [...fileList].filter(f=>/\.(xlsx|xls|csv)$/i.test(f.name));
  if(!files.length){ alert('Solo se aceptan archivos .xlsx, .xls o .csv'); return; }
  for(const f of files){
    const item = {name:f.name, status:'leyendo…', error:null, sheets:null, sheetIdx:0, headerIdx:0, headers:[], type:null, map:{}, rowsCount:0};
    UPD.files.push(item);
    renderFileList();
    try{
      item.sheets = await HINGEST.parseFile(f);
      selectSheet(item, 0);
      item.status = 'listo';
    }catch(e){
      item.status='error'; item.error=e.message;
    }
    renderFileList();
  }
  UPD.result=null; refreshActionState();
}

function selectSheet(item, idx){
  item.sheetIdx = idx;
  const aoa = item.sheets[idx].aoa;
  const a = HINGEST.analyzeSheet(aoa, item.name);
  item.headerIdx = a.headerIdx;
  item.headers = a.headers;
  item.type = a.type;
  item.map = a.map;
  item.grouped = a.grouped;
  item.ignored = a.ignored;
  item.period = a.period;
  item.rowsCount = Math.max(0, aoa.length - a.headerIdx - 1);
  autofillPeriod();
}

/* Autollenar inicio/corte con las fechas detectadas en los títulos de los reportes */
function autofillPeriod(){
  const ins = UPD.files.map(f=>f.period&&f.period.inicio).filter(Boolean).sort();
  const cors = UPD.files.map(f=>f.period&&f.period.corte).filter(Boolean).sort();
  const i = document.getElementById('up-inicio'), c = document.getElementById('up-corte');
  if(i && ins.length) i.value = ins[0];
  if(c && cors.length) c.value = cors[cors.length-1];
}

function renderFileList(){
  const el = document.getElementById('file-list');
  if(!el) return;
  if(!UPD.files.length){ el.innerHTML = '<div class="empty-files">Aún no hay reportes cargados.</div>'; return; }
  el.innerHTML = UPD.files.map((f,fi)=>{
    const T = HINGEST.REPORT_TYPES;
    const typeOpts = Object.entries(T).map(([k,v])=>`<option value="${k}" ${f.type===k?'selected':''}>${v.nombre}</option>`).join('');
    const sheetOpts = (f.sheets||[]).map((s,i)=>`<option value="${i}" ${i===f.sheetIdx?'selected':''}>${escA(s.name)}</option>`).join('');
    if(f.ignored){
      return `<div class="file-card">
        <div class="fc-head">
          <span class="fc-name">${svg(I.doc)} ${escA(f.name)}</span>
          <span class="tag violet">No requerido</span>
          <span class="fc-meta">${escA(f.ignored)}: este reporte no alimenta el tablero y se omitirá.</span>
          <button class="btn btn-xs" data-rm="${fi}">Quitar</button>
        </div>
      </div>`;
    }
    let mapping = '';
    if(f.grouped && f.type){
      mapping = `<div class="note" style="margin-top:2px">Formato <b>agrupado por bloques</b> detectado (${escA(T[f.type].nombre)}): las columnas se interpretan automáticamente, no requiere mapeo manual.</div>`;
    }else if(f.type && f.headers.length){
      const fields = [...T[f.type].req, ...T[f.type].opt];
      mapping = `<div class="map-grid">` + fields.map(field=>{
        const req = T[f.type].req.includes(field);
        const opts = ['<option value="">— sin asignar —</option>']
          .concat(f.headers.filter(h=>h.key).map(h=>`<option value="${h.i}" ${f.map[field]===h.i?'selected':''}>${escA(h.raw)}</option>`)).join('');
        return `<div class="fld sm ${req && f.map[field]==null ? 'missing':''}">
          <label>${fieldLabel(field)} ${req?'<i>*</i>':''}</label>
          <select data-fi="${fi}" data-field="${field}" class="map-sel">${opts}</select>
        </div>`;
      }).join('') + `</div>`;
    }
    return `<div class="file-card ${f.status==='error'?'err':''}">
      <div class="fc-head">
        <span class="fc-name">${svg(I.doc)} ${escA(f.name)}</span>
        <span class="fc-meta">${f.rowsCount?fNum(f.rowsCount)+' filas':''} · ${f.status}${f.period&&f.period.corte?' · periodo detectado: '+escA((f.period.inicio||'…')+' → '+f.period.corte):''}${f.error?' — '+escA(f.error):''}</span>
        <button class="btn btn-xs" data-rm="${fi}">Quitar</button>
      </div>
      ${f.sheets ? `<div class="fc-row">
        <div class="fld sm"><label>Hoja</label><select class="sheet-sel" data-fi="${fi}">${sheetOpts}</select></div>
        <div class="fld sm"><label>Tipo de reporte</label><select class="type-sel" data-fi="${fi}"><option value="">— detectar —</option>${typeOpts}</select></div>
      </div>${mapping}` : ''}
    </div>`;
  }).join('');

  el.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click', ()=>{
    UPD.files.splice(+b.dataset.rm,1); UPD.result=null; renderFileList(); refreshActionState();
  }));
  el.querySelectorAll('.sheet-sel').forEach(s=>s.addEventListener('change', ()=>{
    const f=UPD.files[+s.dataset.fi]; selectSheet(f, +s.value); UPD.result=null; renderFileList(); refreshActionState();
  }));
  el.querySelectorAll('.type-sel').forEach(s=>s.addEventListener('change', ()=>{
    const f=UPD.files[+s.dataset.fi];
    f.type = s.value || HINGEST.detectType(f.headers, f.name).type;
    UPD.result=null; renderFileList(); refreshActionState();
  }));
  el.querySelectorAll('.map-sel').forEach(s=>s.addEventListener('change', ()=>{
    const f=UPD.files[+s.dataset.fi];
    f.map[s.dataset.field] = s.value===''?null:+s.value;
    UPD.result=null; renderFileList(); refreshActionState();
  }));
}

function fieldLabel(f){
  return ({code:'Código artículo',desc:'Descripción',units:'Unidades',amount:'Importe/Venta',stock:'Existencia',
    cost:'Costo unitario',value:'Valor inventario',client:'Cliente',clientCode:'Clave cliente',balance:'Saldo',
    days:'Días/antigüedad',invoices:'Facturas',outflow:'Salidas',avgInv:'Inv. promedio',turnover:'Rotación',
    lastSale:'Última venta',fecha:'Fecha',cobro:'Importe cobrado',recibo:'Recibo/Referencia',forma:'Forma de cobro',
    folio:'Folio',tax:'Impuesto/IVA',total:'Total',proveedor:'Proveedor',estatus:'Estatus',entrega:'Fecha de entrega',
    cancelado:'Cancelado'})[f]||f;
}

/* ---------- procesamiento ---------- */
async function loadPreviousRawStore(){
  try{
    const r = await fetch('assets/data/raw-store.json?ts='+Date.now(), {cache:'no-store'});
    if(r.ok){
      const j = await r.json();
      if(j && j.version) return j;
    }
  }catch(e){}
  return null;
}

async function processAll(){
  const $ = id=>document.getElementById(id);
  const msg = $('proc-msg');
  msg.className='proc-msg'; msg.textContent='Procesando…';
  UPD.result = null;
  try{
    const ready = UPD.files.filter(f=>f.sheets && f.type && !f.ignored);
    if(!ready.length) throw new Error('Carga al menos un reporte válido del ERP.');
    const inicio = $('up-inicio').value, corte = $('up-corte').value;
    if(!inicio || !corte) throw new Error('Indica fecha de inicio y fecha de corte del periodo.');
    const d0=new Date(inicio+'T00:00:00'), d1=new Date(corte+'T00:00:00');
    const dias = Math.round((d1-d0)/86400000)+1;
    if(!(dias>0)) throw new Error('La fecha de corte debe ser posterior a la de inicio.');
    const warnings = [];

    /* ----- resolución del modo (automático según fechas) ----- */
    const previo = await loadPreviousRawStore();
    const tienePrevio = !!(previo && Object.keys(previo.ventasArt||{}).length);
    let modoSel = $('up-modo').value;
    let modo = modoSel;
    if(modoSel==='auto'){
      if(!tienePrevio){
        modo='reemplazar';
        warnings.push('Automático: no hay histórico publicado, se integró todo como periodo completo.');
      }else if(previo.meta && previo.meta.inicio && inicio<=previo.meta.inicio){
        modo='reemplazar';   // los reportes cubren desde el inicio del histórico (o antes)
      }else if(previo.meta && previo.meta.corte && inicio>previo.meta.corte){
        modo='acumular';     // los reportes traen SOLO días posteriores al último corte
        warnings.push(`Automático: los reportes inician el ${inicio}, después del último corte publicado (${previo.meta.corte}); las ventas se ACUMULARON al histórico.`);
      }else{
        throw new Error(`Los reportes inician el ${inicio} pero el histórico publicado va del ${previo.meta.inicio} al ${previo.meta.corte}: el periodo se traslapa parcialmente y acumular duplicaría ventas. Exporta los reportes desde ${previo.meta.inicio} (para Reemplazar) o desde el día siguiente al último corte (para Acumular).`);
      }
    }
    if(modo==='acumular'){
      if(!tienePrevio) throw new Error('Acumular requiere un histórico publicado con ventas. Publica primero una actualización completa (Reemplazar).');
      if(previo.meta && previo.meta.corte && inicio<=previo.meta.corte)
        warnings.push(`Cuidado: los reportes inician el ${inicio} y el histórico publicado llega al ${previo.meta.corte}. Si los reportes incluyen días ya publicados, las ventas de esos días se DUPLICARÁN.`);
    }
    UPD.modo = modo;

    const store = (modo==='acumular') ? previo : HINGEST.emptyStore();
    store.meta = store.meta || {};
    store.meta.empresa = 'HARVIN DISTRIBUCIONES';
    store.meta.inicio = modo==='acumular' ? (store.meta.inicio||inicio) : inicio;
    store.meta.corte = corte;
    {
      const di=new Date(store.meta.inicio+'T00:00:00');
      store.meta.dias = Math.round((d1-di)/86400000)+1;
    }
    // facturas e IVA se derivan del Diario de ventas (DRVETS) en buildHarvin
    store.meta.actualizado = new Date().toISOString();

    // EXIVAL primero: las descripciones/costos sirven a los demás
    const order = ['EXIVAL','INACTIVOS','VENTAS_ART','VENTAS_CLI','CLI_ART','ROTACION','COBRANZA','COBROS','DRVETS','COMPRAS','PEDIDOS'];
    const byType = {};
    ready.forEach(f=>{ (byType[f.type]=byType[f.type]||[]).push(f); });
    const dup = Object.entries(byType).filter(([,v])=>v.length>1).map(([k])=>HINGEST.REPORT_TYPES[k].nombre);
    if(dup.length) warnings.push('Hay más de un archivo del mismo tipo ('+dup.join(', ')+'): se integraron en orden de carga.');

    for(const t of order){
      for(const f of (byType[t]||[])){
        const aoa = f.sheets[f.sheetIdx].aoa;
        const rows = HINGEST.normalizeRows(aoa, f.headerIdx, f.type, f.map, warnings, f.grouped);
        // dentro de una misma corrida, archivos repetidos del mismo tipo se acumulan entre sí
        const modoArchivo = (modo==='acumular' || (byType[t].indexOf(f)>0)) ? 'acumular' : 'reemplazar';
        HINGEST.mergeIntoStore(store, f.type, rows, modoArchivo);
        f.status = fNum(rows.length)+' filas integradas';
      }
    }

    const res = HINGEST.buildHarvin(store, window.HARVIN);
    res.warnings = [...warnings, ...res.warnings];
    UPD.store = store; UPD.result = res;
    msg.className='proc-msg ok';
    msg.textContent='Consolidación lista (modo '+(modoSel==='auto'?'automático → ':'')+modo+'). Revisa la previsualización.';
    renderFileList();
    renderPreview();
  }catch(e){
    msg.className='proc-msg bad'; msg.textContent='✗ '+e.message;
    console.error(e);
  }
  refreshActionState();
}

function renderPreview(){
  const el = document.getElementById('preview');
  if(!el) return;
  if(!UPD.result){ el.innerHTML=''; return; }
  const nu = UPD.result.data, prev = window.HARVIN || {};
  const row = (lbl, a, b, fmt)=>{ 
    const f = fmt||fCompact;
    const da = a==null?null:a, db = b==null?null:b;
    const delta = (da!=null&&db!=null&&isFinite(db-da)) ? db-da : null;
    const cls = delta==null?'':(delta>0?'up':delta<0?'dn':'');
    return `<tr><td>${lbl}</td><td class="num">${f(da)}</td><td class="num"><b>${f(db)}</b></td>
      <td class="num ${cls}">${delta==null?'—':(delta>0?'+':'')+f(delta)}</td></tr>`;
  };
  const P=prev.resumen||{}, N=nu.resumen||{};
  el.innerHTML = `
    <div class="tbl-wrap" style="margin-top:16px"><table class="dt"><thead>
      <tr><th>Indicador</th><th class="num">Actual</th><th class="num">Nuevo</th><th class="num">Δ</th></tr></thead><tbody>
      ${row('Ventas netas', P.ventas_netas, N.ventas_netas)}
      ${row('Margen bruto', P.margen_bruto, N.margen_bruto)}
      ${row('Margen %', P.margen_pct, N.margen_pct, v=>fPct(v))}
      ${row('Valor de inventario', P.inventario_valor, N.inventario_valor)}
      ${row('Capital inmovilizado', P.capital_muerto, N.capital_muerto)}
      ${row('Cartera por cobrar', P.cartera, N.cartera)}
      ${row('Clientes activos', P.clientes_activos, N.clientes_activos, v=>fNum(v))}
      ${row('SKUs vendidos', P.skus_vendidos, N.skus_vendidos, v=>fNum(v))}
      ${row('Unidades vendidas', P.unidades_vendidas, N.unidades_vendidas, v=>fNum(v))}
      ${row('Facturas', P.facturas, N.facturas, v=>fNum(v))}
      ${row('IVA del periodo', (prev.ventas||{}).iva, (nu.ventas||{}).iva)}
      ${row('Compras del periodo', P.compras_periodo, N.compras_periodo)}
      ${row('Pedidos pendientes', P.pedidos_pendientes, N.pedidos_pendientes, v=>fNum(v))}
      ${row('Backlog sin surtir', P.pedidos_backlog, N.pedidos_backlog)}
    </tbody></table></div>
    <div class="note">El número de facturas y el IVA se tomaron del reporte <b>Diarios de ventas</b>; las fechas, de los títulos de los reportes.</div>
    <div class="prev-meta">Nuevo periodo: <b>${escA(N.periodo||'')}</b></div>
    ${UPD.result.warnings.length? `<div class="insight warn" style="margin-top:14px"><div class="ic">${svg(I.alert)}</div><div><h4>Advertencias (${UPD.result.warnings.length})</h4><p>${UPD.result.warnings.map(escA).join('<br>')}</p></div></div>`:''}
  `;
}

function refreshActionState(){
  const ok = !!UPD.result;
  ['btn-apply','btn-publish','btn-download'].forEach(id=>{
    const b=document.getElementById(id); if(b) b.disabled=!ok;
  });
}

/* ---------- acciones ---------- */
function readRepoInputs(){
  const $=id=>document.getElementById(id);
  HGH.setRepo({owner:$('gh-owner').value, repo:$('gh-repo').value, branch:$('gh-branch').value});
  HGH.setToken($('gh-token').value);
}
async function validateToken(){
  const m=document.getElementById('pub-msg');
  readRepoInputs();
  m.className='proc-msg'; m.textContent='Validando…';
  const r = await HGH.validate();
  m.className='proc-msg '+(r.ok?'ok':'bad');
  m.textContent=(r.ok?'✓ ':'✗ ')+r.msg;
}
function applyLocal(){
  if(!UPD.result) return;
  if(window.applyHarvinData(UPD.result.data)){
    const m=document.getElementById('pub-msg');
    const puede = !!(window.HAUTH && HAUTH.canPublish());
    if(m){ m.className='proc-msg ok'; m.textContent = puede
      ? '✓ Tablero actualizado en esta sesión. Navega los módulos para revisarlo; recuerda Publicar para hacerlo permanente.'
      : '✓ Tablero actualizado en esta sesión. Navega los módulos para revisarlo. Un administrador debe publicarlo para dejarlo en línea.'; }
    location.hash = 'actualizar';
  }
}
async function publish(){
  if(!UPD.result) return;
  const m=document.getElementById('pub-msg');
  readRepoInputs();
  m.className='proc-msg'; m.textContent='Validando token…';
  const v = await HGH.validate();
  if(!v.ok){ m.className='proc-msg bad'; m.textContent='✗ '+v.msg; return; }
  const stamp = new Date().toISOString();
  const files = [
    {path:'assets/data/harvin-data.json', content: JSON.stringify(UPD.result.data),
     message:'Actualización del tablero · corte '+(UPD.store.meta.corte||'')+' · '+stamp},
    {path:'assets/data/raw-store.json', content: JSON.stringify(UPD.store),
     message:'Raw store · corte '+(UPD.store.meta.corte||'')+' · '+stamp}
  ];
  try{
    await HGH.publishFiles(files, (i,n,p)=>{
      m.className='proc-msg'; m.textContent = p ? `Publicando ${i+1}/${n}: ${p}…` : 'Finalizando…';
    });
    window.applyHarvinData(UPD.result.data);
    m.className='proc-msg ok';
    m.textContent='✓ Publicado. GitHub Pages reflejará el cambio en 1–2 minutos; el tablero ya quedó actualizado en esta sesión.';
  }catch(e){
    m.className='proc-msg bad';
    m.textContent='✗ Error al publicar: '+e.message+' (verifica permisos contents:write del token sobre el repositorio).';
  }
}
function downloadJsons(){
  if(!UPD.result) return;
  const dl=(name, content)=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  };
  dl('harvin-data.json', JSON.stringify(UPD.result.data));
  dl('raw-store.json', JSON.stringify(UPD.store));
}

/* =================== VISTA: USUARIOS =================== */
VIEWS.usuarios = ()=>{
  const html = `
  ${sHead('Usuarios','Altas y bajas de cuentas de acceso al tablero. Solo el superusuario y administradores pueden gestionar usuarios.')}
  <div class="grid g-2">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Dar de alta usuario</span><span class="tag amber">Admin</span></div>
      <div class="adm-grid one">
        <div class="fld"><label>Usuario</label><input id="nu-user" autocapitalize="none" spellcheck="false" placeholder="3–24 caracteres (letras, números, . _ -)"></div>
        <div class="fld"><label>Contraseña</label><input id="nu-pass" type="password" placeholder="mínimo 6 caracteres"></div>
        <div class="fld"><label>Rol</label>
          <select id="nu-role">
            <option value="viewer" selected>Consulta — solo ve los tableros</option>
            <option value="operador">Captura — carga y publica datos, sin gestionar usuarios</option>
            <option value="admin">Administrador — además da de alta y gestiona usuarios</option>
          </select>
        </div>
      </div>
      <div class="adm-actions" style="margin-top:14px">
        <button class="btn btn-amber" id="btn-adduser">${svg(I.users)} Crear usuario</button>
        <span id="nu-msg" class="proc-msg"></span>
      </div>
      <div class="note">Las contraseñas no se guardan: solo su huella SHA-256. Los cambios quedan como <b>borrador local</b> hasta que los publiques con tu token.</div>
    </div>
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Publicar cambios</span><span class="tag teal">users.json</span></div>
      <p class="u-pub-desc">Los usuarios nuevos o eliminados deben publicarse al repositorio para que funcionen desde cualquier dispositivo. Pendientes de publicar: <b id="u-pend">0</b>.</p>
      <div class="fld"><label>Token de GitHub</label><input id="u-token" type="password" placeholder="github_pat_… / ghp_…" value="${escA(HGH.getToken())}"></div>
      <div class="adm-actions" style="margin-top:14px">
        <button class="btn btn-teal" id="btn-pubusers">${svg(I.upload)} Publicar usuarios</button>
        <span id="u-msg" class="proc-msg"></span>
      </div>
      <div class="note">Aviso de seguridad: en un sitio estático las huellas de contraseña son visibles en el repositorio. Usa contraseñas fuertes; idealmente publica el sitio desde un <b>repositorio privado</b> con GitHub Pages.</div>
    </div>
  </div>

  ${sHead('Cuentas registradas','El superusuario b3t0 es fijo y no puede eliminarse.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado por</th><th></th></tr></thead>
    <tbody id="u-tbody"></tbody></table></div>
  </div>`;

  const init = ()=>{
    const $=id=>document.getElementById(id);
    function paint(){
      $('u-pend').textContent = HAUTH.pendingUsers();
      const rows = [
        `<tr><td><b>${HAUTH.SU_USER}</b></td><td><span class="tag amber">superusuario</span></td><td><span class="tag green">activo</span></td><td>—</td><td></td></tr>`
      ].concat(HAUTH.allUsers().map(u=>`
        <tr>
          <td>${escA(u.user)}</td>
          <td><span class="tag ${u.role==='admin'?'amber':(u.role==='operador'?'violet':'teal')}">${u.role==='admin'?'admin':(u.role==='operador'?'captura':'consulta')}</span></td>
          <td>${u.activo===false?'<span class="tag red">baja pendiente</span>':(u.origen==='borrador'?'<span class="tag violet">borrador</span>':'<span class="tag green">activo</span>')}</td>
          <td>${escA(u.creado_por||'—')}</td>
          <td>${u.activo!==false?`<button class="btn btn-xs" data-del="${escA(u.user)}">Eliminar</button>`:''}</td>
        </tr>`));
      $('u-tbody').innerHTML = rows.join('');
      $('u-tbody').querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
        if(!confirm('¿Eliminar al usuario "'+b.dataset.del+'"?')) return;
        const r = HAUTH.removeUser(b.dataset.del);
        if(!r.ok) alert(r.msg); else paint();
      }));
    }
    $('btn-adduser').addEventListener('click', async ()=>{
      const m=$('nu-msg');
      m.className='proc-msg'; m.textContent='Creando…';
      const r = await HAUTH.addUser($('nu-user').value, $('nu-pass').value, $('nu-role').value);
      m.className='proc-msg '+(r.ok?'ok':'bad');
      m.textContent = r.ok ? '✓ Usuario creado como borrador. Publícalo para activarlo en línea.' : '✗ '+r.msg;
      if(r.ok){ $('nu-user').value=''; $('nu-pass').value=''; paint(); }
    });
    $('btn-pubusers').addEventListener('click', async ()=>{
      const m=$('u-msg');
      HGH.setToken($('u-token').value);
      m.className='proc-msg'; m.textContent='Validando…';
      const v = await HGH.validate();
      if(!v.ok){ m.className='proc-msg bad'; m.textContent='✗ '+v.msg+' (configura owner/repo en "Actualizar Datos")'; return; }
      try{
        m.textContent='Publicando users.json…';
        await HGH.putFile('assets/data/users.json', HAUTH.exportUsersJson(), 'Actualización de usuarios · '+new Date().toISOString());
        HAUTH.markPublished();
        m.className='proc-msg ok'; m.textContent='✓ Usuarios publicados.';
        paint();
      }catch(e){
        m.className='proc-msg bad'; m.textContent='✗ '+e.message;
      }
    });
    paint();
  };
  return {html, init};
};
