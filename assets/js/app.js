/* ============================================================
   HARVIN DISTRIBUCIONES — App de Inteligencia Directiva
   ============================================================ */
const D = window.HARVIN;

/* ---------- Formateadores ---------- */
const fMX = (n,dec=0)=> n==null?'—':'$'+Number(n).toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const fCompact = (n)=>{
  if(n==null) return '—';
  const a=Math.abs(n);
  if(a>=1e6) return '$'+(n/1e6).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})+'M';
  if(a>=1e3) return '$'+(n/1e3).toLocaleString('es-MX',{minimumFractionDigits:1,maximumFractionDigits:1})+'K';
  return '$'+Math.round(n).toLocaleString('es-MX');
};
const fNum = (n,dec=0)=> n==null?'—':Number(n).toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const fPct = (n,dec=1)=> n==null?'—':Number(n).toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec})+'%';
const trunc = (s,n=46)=> !s?'':(s.length>n?s.slice(0,n)+'…':s);

/* ---------- Paleta de gráficas ---------- */
const C = {
  amber:'#f6b042', amber2:'#ffce7a', teal:'#36d6c3', teal2:'#7af0e2',
  violet:'#8b7cf6', rose:'#fb6f84', green:'#3ddc97', blue:'#5aa9ff',
  txt:'#9aa6bd', grid:'#1c2434', line:'#243047'
};
const SERIES = [C.amber,C.teal,C.violet,C.green,C.blue,C.rose,C.amber2,C.teal2];

/* ---------- ECharts theme base ---------- */
const charts = [];
function mk(el, opt){
  const c = echarts.init(document.getElementById(el),null,{renderer:'canvas'});
  opt.textStyle = {fontFamily:'Manrope', color:C.txt};
  opt.grid = Object.assign({left:8,right:18,top:24,bottom:8,containLabel:true}, opt.grid||{});
  if(opt.tooltip!==null) opt.tooltip = Object.assign({
    backgroundColor:'#0e131e', borderColor:'#243047', borderWidth:1,
    textStyle:{color:'#e8edf6',fontFamily:'Manrope',fontSize:12},
    extraCssText:'border-radius:10px;box-shadow:0 12px 30px -8px rgba(0,0,0,.6);padding:10px 12px;'
  }, opt.tooltip||{});
  c.setOption(opt);
  charts.push(c);
  return c;
}
function axisStyle(){return {
  axisLine:{lineStyle:{color:C.line}}, axisTick:{show:false},
  axisLabel:{color:C.txt,fontSize:11}, splitLine:{lineStyle:{color:C.grid,type:'dashed'}}
};}

/* ---------- Iconos (lucide-style inline) ---------- */
const I = {
  home:'<path d="M3 12l9-9 9 9M5 10v10h14V10"/>',
  sales:'<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',
  margin:'<path d="M12 2v20M5 7h9a3 3 0 010 6H7a3 3 0 000 6h10"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0112 0M16 5.5a3 3 0 010 5.6M21 20a5.5 5.5 0 00-4-5.3"/>',
  box:'<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
  rotate:'<path d="M3 12a9 9 0 019-9 9 9 0 016.7 3M21 5v4h-4M21 12a9 9 0 01-9 9 9 9 0 01-6.7-3M3 19v-4h4"/>',
  ghost:'<path d="M9 10h.01M15 10h.01M5 21V9a7 7 0 0114 0v12l-3-2-2 2-2-2-2 2-2-2-3 2z"/>',
  cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
  cart:'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 13h10.2l1.8-9H6"/>',
  tag:'<path d="M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01"/>',
  layers:'<path d="M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  star:'<path d="M12 2l2.9 6.3 6.8.8-5 4.7 1.3 6.8L12 17.8 5.7 21l1.3-6.8-5-4.7 6.8-.8z"/>',
  alert:'<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.4 3.9a2 2 0 00-3.4 0z"/>',
  trend:'<path d="M22 7l-9 9-4-4-6 6"/><path d="M16 7h6v6"/>',
  pkg:'<path d="M16.5 9.4L7.5 4.2M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
  doc:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6"/>',
  spark:'<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',
  check:'<path d="M20 6L9 17l-5-5"/>'
};
const svg = (p)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

/* ---------- Navegación ---------- */
const NAV = [
  {sec:'Visión General'},
  {id:'resumen', name:'Resumen Ejecutivo', ico:I.home},
  {id:'ventas', name:'Ventas & Facturación', ico:I.sales},
  {id:'margen', name:'Margen & Rentabilidad', ico:I.margin},
  {sec:'Comercial'},
  {id:'clientes', name:'Mejores Clientes', ico:I.users},
  {id:'articulos', name:'Artículos & ABC', ico:I.star},
  {id:'lineas', name:'Líneas de Producto', ico:I.layers},
  {id:'crosssell', name:'Cliente × Artículo', ico:I.grid},
  {sec:'Operación'},
  {id:'inventario', name:'Inventario & Valuación', ico:I.box},
  {id:'rotacion', name:'Rotación de Inventario', ico:I.rotate},
  {id:'inactivos', name:'Capital Inmovilizado', ico:I.ghost},
  {sec:'Decisiones'},
  {id:'compras', name:'Sugerencias de Compra', ico:I.cart},
  {id:'promociones', name:'Promociones & Liquidación', ico:I.tag},
  {id:'cobranza', name:'Cobranza & Cartera', ico:I.cash},
];

/* ---------- KPI helper ---------- */
function kpi({lbl,val,unit='',sub='',ico,cls='',glow}){
  return `<div class="kpi ${cls}" ${glow?`style="--glow:${glow}"`:''}>
    <div class="lbl"><span class="ic">${svg(ico||I.spark)}</span>${lbl}</div>
    <div class="val">${val}${unit?`<span class="u">${unit}</span>`:''}</div>
    <div class="sub">${sub}</div>
  </div>`;
}
function sHead(title,desc,extra=''){
  return `<div class="shead"><div><h3><span class="bar"></span>${title}</h3>${desc?`<p>${desc}</p>`:''}</div>${extra}</div>`;
}
function insight(type,icon,title,body){
  return `<div class="insight ${type}"><div class="ic">${svg(icon)}</div><div><h4>${title}</h4><p>${body}</p></div></div>`;
}

/* ============================================================
   VISTAS
   ============================================================ */
const VIEWS = {};

/* ---------- 1. RESUMEN EJECUTIVO ---------- */
VIEWS.resumen = ()=>{
  const r=D.resumen, m=D.margen, inv=D.inventario, cob=D.cobranza;
  const html = `
  <div class="cover">
    <div class="eyebrow">Centro de Inteligencia Directiva</div>
    <h2>Estado del negocio <em>Harvin Distribuciones</em></h2>
    <p>Tablero ejecutivo consolidado de ventas, rentabilidad, inventario, rotación y cobranza para la toma de decisiones de alta dirección. Costeo basado en el último costo de compra por artículo.</p>
    <div class="period">${svg(I.doc)} ${r.periodo}</div>
  </div>

  <div class="grid g-4" style="margin-top:18px">
    ${kpi({lbl:'Ventas Netas',val:fCompact(r.ventas_netas),sub:`${fNum(r.facturas)} facturas · ticket ${fMX(r.ticket_promedio)}`,ico:I.sales,cls:'feat',glow:'rgba(246,176,66,.22)'})}
    ${kpi({lbl:'Margen Bruto',val:fCompact(r.margen_bruto),sub:`<span class="chg up">${fPct(r.margen_pct)}</span> sobre ventas`,ico:I.margin,glow:'rgba(54,214,195,.18)'})}
    ${kpi({lbl:'Valor Inventario',val:fCompact(r.inventario_valor),sub:`${fNum(inv.dias_inventario)} días · ${fNum(inv.turnover_real_anual,2)}x rotación real`,ico:I.box,glow:'rgba(139,124,246,.16)'})}
    ${kpi({lbl:'Cartera por Cobrar',val:fCompact(r.cartera),sub:`DSO ${fNum(r.dso,1)} días · ${fNum(cob.clientes_con_saldo)} clientes`,ico:I.cash,cls:'',glow:'rgba(61,220,151,.16)'})}
  </div>

  <div class="grid g-4" style="margin-top:16px">
    ${kpi({lbl:'Capital Inmovilizado',val:fCompact(r.capital_muerto),sub:`<span class="chg down">${fPct(inv.pct_muerto)}</span> del inventario en SKUs sin venta`,ico:I.ghost,cls:'alert'})}
    ${kpi({lbl:'Clientes Activos',val:fNum(r.clientes_activos),sub:`venta media ${fMX(D.clientes.ticket_promedio_cliente)}`,ico:I.users})}
    ${kpi({lbl:'Unidades Vendidas',val:fNum(r.unidades_vendidas),unit:'pzas',sub:`${fNum(r.skus_vendidos)} SKUs con venta`,ico:I.pkg})}
    ${kpi({lbl:'Markup Promedio',val:fPct(m.markup_pct),sub:`utilidad sobre costo de compra`,ico:I.trend})}
  </div>

  ${sHead('Composición del resultado','Cómo se transforman las ventas en utilidad bruta y dónde está concentrado el valor del inventario.')}
  <div class="grid g-2">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Cascada de Rentabilidad</span><span class="tag teal">Periodo</span></div>
      <div id="c_waterfall" class="chart h-md"></div>
    </div>
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Inventario: Capital Activo vs. Inmovilizado</span><span class="tag red">Alerta</span></div>
      <div id="c_capital" class="chart h-md"></div>
      <div class="note">Solo ${fCompact(inv.capital_activo)} (${fPct(100-inv.pct_muerto)}) del inventario corresponde a artículos con venta en el periodo. El resto es capital de lento o nulo desplazamiento.</div>
    </div>
  </div>

  ${sHead('Lectura ejecutiva','Síntesis de hallazgos y prioridades de gestión.')}
  <div class="grid g-2-1">
    <div style="display:flex;flex-direction:column;gap:12px">
      ${insight('crit',I.alert,'El inventario es el principal riesgo de capital','El '+fPct(inv.pct_muerto)+' del valor de inventario ('+fMX(r.capital_muerto)+') está en '+fNum(D.inactivos.count)+' SKUs sin ventas en el periodo. La rotación real (COGS/inventario) es de apenas <b>'+fNum(inv.turnover_real_anual,2)+'x anual</b> (~'+fNum(inv.dias_inventario)+' días). Liberar este capital es la palanca financiera #1.')}
      ${insight('good',I.cash,'Cobranza sana y bajo riesgo crediticio','La cartera ('+fMX(r.cartera)+') está concentrada en tramos de 0–30 días, con DSO de '+fNum(r.dso,1)+' días. No hay saldos vencidos a más de 30 días. La conversión de venta a efectivo es eficiente.')}
      ${insight('',I.users,'Alta dependencia de pocos clientes','El '+fPct(D.clientes.pareto_pct_clientes)+' de los clientes ('+fNum(D.clientes.pareto_clientes_80pct)+' cuentas) genera el 80% de la venta. Existe oportunidad de venta cruzada por línea y de blindar las cuentas clave.')}
    </div>
    <div class="card">
      <div class="card-h"><span class="t">Prioridades de Dirección</span></div>
      <ul class="bullets">
        <li><span class="b"></span><span><b>Activar capital inmovilizado:</b> liberar flujo con promociones dirigidas y depuración de catálogo.</span></li>
        <li><span class="b"></span><span><b>Compra inteligente:</b> reabastecer ${fNum(D.sugerencias_compra.items_a_reabastecer)} SKUs de alta demanda (${fCompact(D.sugerencias_compra.inversion_estimada)}).</span></li>
        <li><span class="b"></span><span><b>Defender el margen:</b> revisar precios en la línea Soporte motor/trans (mayor venta, menor margen).</span></li>
        <li><span class="b"></span><span><b>Crecer cuentas clave:</b> venta cruzada en clientes con pocas líneas activas.</span></li>
        <li><span class="b"></span><span><b>Proveedor único:</b> negociar volumen y plazos sobre la compra sugerida.</span></li>
      </ul>
    </div>
  </div>`;

  const init = ()=>{
    const cogs=m.cogs, gm=m.margen_bruto, rev=m.ventas_con_costo;
    mk('c_waterfall',{
      grid:{left:8,right:18,top:30,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>fMX(v)},
      xAxis:{type:'category',data:['Ventas\n(c/ costo)','(–) Costo\nmercancía','Utilidad\nBruta'],...axisStyle(),axisLabel:{color:C.txt,fontSize:11,lineHeight:14}},
      yAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,fontSize:11,formatter:v=>fCompact(v)}},
      series:[
        {type:'bar',stack:'t',itemStyle:{color:'transparent'},data:[0,gm,0],silent:true},
        {type:'bar',stack:'t',barWidth:'52%',itemStyle:{borderRadius:[6,6,0,0]},
         data:[
           {value:rev,itemStyle:{color:C.amber}},
           {value:cogs,itemStyle:{color:C.rose}},
           {value:gm,itemStyle:{color:C.teal}}
         ],
         label:{show:true,position:'top',color:'#e8edf6',fontFamily:'IBM Plex Mono',fontSize:11,formatter:p=>fCompact(p.value)}}
      ]
    });
    mk('c_capital',{
      tooltip:{trigger:'item',valueFormatter:v=>fMX(v)},
      legend:{bottom:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:12,itemHeight:12},
      series:[{type:'pie',radius:['52%','78%'],center:['50%','44%'],avoidLabelOverlap:true,
        itemStyle:{borderColor:'#121826',borderWidth:3,borderRadius:6},
        label:{show:false},
        data:[
          {name:'Capital inmovilizado',value:inv.capital_muerto,itemStyle:{color:C.rose}},
          {name:'Capital activo',value:inv.capital_activo,itemStyle:{color:C.teal}}
        ]}],
      graphic:{type:'text',left:'center',top:'38%',style:{text:fPct(inv.pct_muerto),fill:C.rose,fontSize:26,fontFamily:'IBM Plex Mono',fontWeight:600},z:10}
    });
  };
  return {html,init};
};

/* ---------- 2. VENTAS & FACTURACIÓN ---------- */
VIEWS.ventas = ()=>{
  const v=D.ventas, abc=D.abc;
  const html=`
  ${sHead('Indicadores de venta','Volumen facturado en el periodo y eficiencia comercial.')}
  <div class="grid g-4">
    ${kpi({lbl:'Venta Neta',val:fCompact(v.neto),sub:'antes de IVA',ico:I.sales,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'Venta Total c/IVA',val:fCompact(v.total),sub:`IVA ${fCompact(v.iva)}`,ico:I.cash})}
    ${kpi({lbl:'Documentos',val:fNum(v.documentos),unit:'facturas',sub:'normales',ico:I.doc})}
    ${kpi({lbl:'Ticket Promedio',val:fMX(v.ticket_promedio),sub:'venta neta / factura',ico:I.trend})}
  </div>
  <div class="grid g-4" style="margin-top:16px">
    ${kpi({lbl:'Unidades Vendidas',val:fNum(v.unidades_vendidas),unit:'pzas',sub:'piezas facturadas',ico:I.pkg})}
    ${kpi({lbl:'SKUs con Venta',val:fNum(v.skus_vendidos),sub:`de ${fNum(D.inventario.skus_total)} en catálogo`,ico:I.box})}
    ${kpi({lbl:'Precio Medio / Pza',val:fMX(v.neto/v.unidades_vendidas),sub:'venta neta / unidades',ico:I.tag})}
    ${kpi({lbl:'Pzas / Factura',val:fNum(v.unidades_vendidas/v.documentos,1),sub:'densidad de ticket',ico:I.cart})}
  </div>

  ${sHead('Curva ABC de artículos','Clasificación de Pareto: qué porción del catálogo genera la mayor parte de la venta.')}
  <div class="grid g-2-1">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Concentración de Ventas (Pareto)</span><span class="tag amber">ABC</span></div>
      <div id="c_abc" class="chart h-md"></div>
    </div>
    <div class="card">
      <div class="card-h"><span class="t">Segmentos</span></div>
      <div class="prow"><span class="nm"><span class="chip a">A</span> Críticos</span><div class="track"><i style="width:${abc.A.venta/v.neto*100}%;background:linear-gradient(90deg,#f6b042,#ffce7a)"></i></div><span class="vv">${fCompact(abc.A.venta)}</span></div>
      <div class="prow"><span class="nm"><span class="chip t">B</span> Importantes</span><div class="track"><i style="width:${abc.B.venta/v.neto*100}%;background:linear-gradient(90deg,#36d6c3,#7af0e2)"></i></div><span class="vv">${fCompact(abc.B.venta)}</span></div>
      <div class="prow"><span class="nm"><span class="chip r">C</span> Marginales</span><div class="track"><i style="width:${abc.C.venta/v.neto*100}%;background:linear-gradient(90deg,#8b7cf6,#b3a8fb)"></i></div><span class="vv">${fCompact(abc.C.venta)}</span></div>
      <div class="note" style="margin-top:14px">Los <b style="color:var(--amber-2)">${fNum(abc.A.skus)} artículos "A"</b> (${fPct(abc.A.pct_skus)} del catálogo vendido) concentran el 80% de la venta. Foco de disponibilidad, precio y compra.</div>
    </div>
  </div>

  ${sHead('Mayor demanda por unidades','Artículos con mayor rotación física — referencia para disponibilidad y compra.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Artículo</th><th>Descripción</th><th class="num">Unidades</th><th class="num">Venta</th><th>Peso</th></tr></thead><tbody>
    ${D.articulos.top_unidades.slice(0,12).map((a,i)=>{const mx=D.articulos.top_unidades[0].u;return `<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-code">${a.code}</td>
      <td class="t-desc" title="${a.desc.replace(/"/g,'&quot;')}">${trunc(a.desc,52)}</td>
      <td class="num">${fNum(a.u)}</td>
      <td class="num">${fMX(a.venta)}</td>
      <td><div class="minibar teal"><i style="width:${a.u/mx*100}%"></i></div></td>
    </tr>`}).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const cum=[{n:'A',sk:abc.A.skus,vt:abc.A.venta},{n:'B',sk:abc.B.skus,vt:abc.B.venta},{n:'C',sk:abc.C.skus,vt:abc.C.venta}];
    let acc=0; const line=cum.map(s=>{acc+=s.vt;return +(acc/v.neto*100).toFixed(1)});
    mk('c_abc',{
      grid:{left:8,right:42,top:24,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'}},
      legend:{top:0,right:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:11,itemHeight:11},
      xAxis:{type:'category',data:['Segmento A','Segmento B','Segmento C'],...axisStyle()},
      yAxis:[
        {type:'value',name:'Venta',...axisStyle(),axisLabel:{color:C.txt,fontSize:11,formatter:val=>fCompact(val)}},
        {type:'value',name:'% acum',max:100,...axisStyle(),splitLine:{show:false},axisLabel:{color:C.txt,fontSize:11,formatter:'{value}%'}}
      ],
      series:[
        {name:'Venta',type:'bar',barWidth:'46%',itemStyle:{borderRadius:[6,6,0,0],color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.amber2},{offset:1,color:C.amber}])},data:cum.map(s=>s.vt)},
        {name:'% acumulado',type:'line',yAxisIndex:1,smooth:true,symbol:'circle',symbolSize:8,lineStyle:{color:C.teal,width:3},itemStyle:{color:C.teal2},data:line,label:{show:true,color:C.teal2,formatter:'{c}%',fontFamily:'IBM Plex Mono',fontSize:11}}
      ]
    });
  };
  return {html,init};
};

/* ---------- 3. MARGEN & RENTABILIDAD ---------- */
VIEWS.margen = ()=>{
  const m=D.margen;
  const dist=m.distribucion;
  const html=`
  ${sHead('Rentabilidad consolidada','Margen bruto calculado artículo por artículo usando el último costo de compra (valuación EXIVAL).')}
  <div class="grid g-4">
    ${kpi({lbl:'Ventas Costeadas',val:fCompact(m.ventas_con_costo),sub:`${fNum(m.skus_con_costeo)} SKUs costeados`,ico:I.sales,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'Costo de Mercancía',val:fCompact(m.cogs),sub:'COGS del periodo',ico:I.box,glow:'rgba(251,111,132,.16)'})}
    ${kpi({lbl:'Margen Bruto',val:fCompact(m.margen_bruto),sub:`utilidad bruta total`,ico:I.margin,glow:'rgba(54,214,195,.2)'})}
    ${kpi({lbl:'Margen %',val:fPct(m.margen_pct),sub:`markup ${fPct(m.markup_pct)} s/costo`,ico:I.trend,glow:'rgba(61,220,151,.16)'})}
  </div>

  ${sHead('Distribución de márgenes','Cuántos artículos caen en cada banda de rentabilidad — detecta ventas a bajo o nulo margen.')}
  <div class="grid g-2">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Artículos por banda de margen</span></div>
      <div id="c_mdist" class="chart h-md"></div>
    </div>
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Margen por línea de producto</span><span class="tag teal">% margen</span></div>
      <div id="c_mline" class="chart h-md"></div>
    </div>
  </div>

  ${sHead('Mayores generadores de utilidad','Artículos que más utilidad bruta aportan — el corazón del resultado.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Artículo</th><th>Descripción</th><th class="num">Venta</th><th class="num">Costo Un.</th><th class="num">Utilidad</th><th class="num">Margen</th></tr></thead><tbody>
    ${m.top_articulos_utilidad.slice(0,12).map((a,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-code">${a.code}</td>
      <td class="t-desc" title="${a.desc.replace(/"/g,'&quot;')}">${trunc(a.desc,46)}</td>
      <td class="num">${fMX(a.venta)}</td>
      <td class="num">${fMX(a.costo_unit)}</td>
      <td class="num" style="color:var(--green)">${fMX(a.margen)}</td>
      <td class="num"><span class="chip ${a.margen_pct>=25?'g':a.margen_pct>=15?'a':'r'}">${fPct(a.margen_pct)}</span></td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const keys=Object.keys(dist);
    mk('c_mdist',{
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>fNum(v)+' artículos'},
      xAxis:{type:'category',data:keys,...axisStyle()},
      yAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,fontSize:11}},
      series:[{type:'bar',barWidth:'56%',itemStyle:{borderRadius:[6,6,0,0]},
        data:keys.map(k=>({value:dist[k],itemStyle:{color:k==='<0%'?C.rose:k==='0-15%'?'#e8965a':k==='15-25%'?C.amber:k==='25-35%'?C.teal:C.green}})),
        label:{show:true,position:'top',color:C.txt,fontFamily:'IBM Plex Mono',fontSize:11}}]
    });
    const ln=[...m.por_linea].sort((a,b)=>a.margen_pct-b.margen_pct);
    mk('c_mline',{
      grid:{left:8,right:36,top:14,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const d=ln[p[0].dataIndex];return `<b>${d.linea}</b><br/>Venta: ${fMX(d.venta)}<br/>Utilidad: ${fMX(d.margen)}<br/>Margen: ${fPct(d.margen_pct)}`}},
      xAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,fontSize:11,formatter:'{value}%'}},
      yAxis:{type:'category',data:ln.map(l=>l.linea),...axisStyle(),axisLabel:{color:C.txt,fontSize:11}},
      series:[{type:'bar',barWidth:'58%',itemStyle:{borderRadius:[0,6,6,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:C.teal},{offset:1,color:C.teal2}])},
        data:ln.map(l=>l.margen_pct),label:{show:true,position:'right',color:C.teal2,fontFamily:'IBM Plex Mono',fontSize:11,formatter:'{c}%'}}]
    });
  };
  return {html,init};
};

/* ---------- 4. MEJORES CLIENTES ---------- */
VIEWS.clientes = ()=>{
  const cl=D.clientes;
  const top=cl.top;
  const html=`
  ${sHead('Cartera de clientes','Concentración de ventas y desempeño de las cuentas en el periodo.')}
  <div class="grid g-4">
    ${kpi({lbl:'Clientes Activos',val:fNum(cl.total),sub:'con venta en el periodo',ico:I.users,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'Venta Promedio',val:fMX(cl.ticket_promedio_cliente),sub:'por cliente',ico:I.trend})}
    ${kpi({lbl:'Concentración 80%',val:fNum(cl.pareto_clientes_80pct),unit:'clientes',sub:`${fPct(cl.pareto_pct_clientes)} de la base`,ico:I.star,cls:'',glow:'rgba(251,111,132,.14)'})}
    ${kpi({lbl:'Cliente #1',val:fCompact(top[0].venta),sub:trunc(top[0].name,22),ico:I.spark,glow:'rgba(54,214,195,.16)'})}
  </div>

  ${sHead('Ranking de clientes','Los que más facturan — cuentas a blindar y potenciar.')}
  <div class="grid g-2-1">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Top 12 por venta neta</span></div>
      <div id="c_cli" class="chart h-xl"></div>
    </div>
    <div class="card">
      <div class="card-h"><span class="t">Distribución de la base</span></div>
      <div id="c_cli_pie" class="chart h-lg"></div>
      <div class="note">El cliente principal representa <b style="color:var(--amber-2)">${fPct(top[0].venta/cl.venta_total*100)}</b> de la venta total. Una base concentrada exige planes de retención y respaldo de crédito.</div>
    </div>
  </div>

  ${sHead('Detalle de cuentas','Listado completo con peso relativo sobre la venta total.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Código</th><th>Cliente</th><th class="num">Venta Neta</th><th class="num">% del Total</th><th>Peso</th></tr></thead><tbody>
    ${top.slice(0,20).map((c,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-code">${c.code}</td>
      <td style="font-weight:600">${trunc(c.name,40)}</td>
      <td class="num">${fMX(c.venta)}</td>
      <td class="num">${fPct(c.venta/cl.venta_total*100)}</td>
      <td><div class="minibar"><i style="width:${c.venta/top[0].venta*100}%"></i></div></td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const t=top.slice(0,12).reverse();
    mk('c_cli',{
      grid:{left:8,right:54,top:10,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>fMX(v)},
      xAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,fontSize:11,formatter:v=>fCompact(v)}},
      yAxis:{type:'category',data:t.map(c=>trunc(c.name,24)),...axisStyle(),axisLabel:{color:C.txt,fontSize:11}},
      series:[{type:'bar',barWidth:'62%',itemStyle:{borderRadius:[0,6,6,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:C.amber},{offset:1,color:C.amber2}])},
        data:t.map(c=>c.venta),label:{show:true,position:'right',color:C.amber2,fontFamily:'IBM Plex Mono',fontSize:10.5,formatter:p=>fCompact(p.value)}}]
    });
    const t10=top.slice(0,8); const otros=cl.venta_total-t10.reduce((s,c)=>s+c.venta,0);
    mk('c_cli_pie',{
      tooltip:{trigger:'item',valueFormatter:v=>fMX(v)},
      series:[{type:'pie',radius:['40%','72%'],center:['50%','46%'],itemStyle:{borderColor:'#121826',borderWidth:2,borderRadius:4},
        label:{show:false},
        data:[...t10.map((c,i)=>({name:trunc(c.name,16),value:c.venta,itemStyle:{color:SERIES[i%SERIES.length]}})),
              {name:'Resto de clientes',value:otros,itemStyle:{color:'#2a3550'}}]}]
    });
  };
  return {html,init};
};

/* ---------- 5. ARTÍCULOS & ABC ---------- */
VIEWS.articulos = ()=>{
  const a=D.articulos, abc=D.abc;
  const html=`
  ${sHead('Desempeño de artículos','Productos de mayor desplazamiento por valor y por volumen.')}
  <div class="grid g-4">
    ${kpi({lbl:'SKUs con Venta',val:fNum(a.total_skus_vendidos),sub:'referencias movidas',ico:I.box,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'Artículo Top Venta',val:fCompact(a.top_venta[0].venta),sub:a.top_venta[0].code,ico:I.star,glow:'rgba(54,214,195,.16)'})}
    ${kpi({lbl:'Artículo Top Unidades',val:fNum(a.top_unidades[0].u),unit:'pzas',sub:a.top_unidades[0].code,ico:I.pkg,glow:'rgba(139,124,246,.14)'})}
    ${kpi({lbl:'Segmento A',val:fNum(abc.A.skus),unit:'SKUs',sub:`generan el 80% de venta`,ico:I.trend,glow:'rgba(61,220,151,.16)'})}
  </div>

  ${sHead('Top artículos por venta','Los que más facturación generan — máxima prioridad de disponibilidad.')}
  <div class="card pad-lg">
    <div class="card-h"><span class="t">15 artículos líderes por valor de venta</span><span class="tag amber">$ venta</span></div>
    <div id="c_art" class="chart h-xl"></div>
  </div>

  ${sHead('Comparativo de líderes','Tabla detallada: valor vs. volumen vs. precio implícito.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Artículo</th><th>Descripción</th><th class="num">Unidades</th><th class="num">Venta</th><th class="num">Precio Medio</th></tr></thead><tbody>
    ${a.top_venta.slice(0,15).map((x,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-code">${x.code}</td>
      <td class="t-desc" title="${x.desc.replace(/"/g,'&quot;')}">${trunc(x.desc,50)}</td>
      <td class="num">${fNum(x.u)}</td>
      <td class="num">${fMX(x.venta)}</td>
      <td class="num">${fMX(x.u?x.venta/x.u:0)}</td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const t=a.top_venta.slice(0,15).reverse();
    mk('c_art',{
      grid:{left:8,right:54,top:10,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const d=t[p[0].dataIndex];return `<b>${d.code}</b><br/>${trunc(d.desc,50)}<br/>Venta: ${fMX(d.venta)} · ${fNum(d.u)} pzas`}},
      xAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,fontSize:11,formatter:v=>fCompact(v)}},
      yAxis:{type:'category',data:t.map(x=>x.code),...axisStyle(),axisLabel:{color:C.amber2,fontSize:11,fontFamily:'IBM Plex Mono'}},
      series:[{type:'bar',barWidth:'60%',itemStyle:{borderRadius:[0,6,6,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:C.amber},{offset:1,color:C.amber2}])},
        data:t.map(x=>x.venta),label:{show:true,position:'right',color:C.amber2,fontFamily:'IBM Plex Mono',fontSize:10.5,formatter:p=>fCompact(p.value)}}]
    });
  };
  return {html,init};
};

/* ---------- 6. LÍNEAS DE PRODUCTO ---------- */
VIEWS.lineas = ()=>{
  const lm=D.margen.por_linea;
  const totV=lm.reduce((s,l)=>s+l.venta,0);
  const html=`
  ${sHead('Análisis por línea de producto','Familias de producto clasificadas por su aporte de venta, margen y volumen.')}
  <div class="grid g-3">
    ${lm.slice(0,3).map((l,i)=>kpi({lbl:l.linea,val:fCompact(l.venta),sub:`margen ${fPct(l.margen_pct)} · ${fNum(l.skus)} SKUs`,ico:[I.layers,I.box,I.pkg][i],cls:i===0?'feat':'',glow:i===0?'rgba(246,176,66,.2)':'rgba(54,214,195,.14)'})).join('')}
  </div>

  ${sHead('Venta y utilidad por familia','Composición del portafolio: dónde está el volumen y dónde el margen.')}
  <div class="grid g-2">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Venta vs. Utilidad por línea</span></div>
      <div id="c_ln_dual" class="chart h-md"></div>
    </div>
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Participación en la venta</span></div>
      <div id="c_ln_pie" class="chart h-md"></div>
    </div>
  </div>

  ${sHead('Matriz de líneas','Cuadro completo de rendimiento por familia de producto.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th>Línea de Producto</th><th class="num">Venta</th><th class="num">% Mix</th><th class="num">Utilidad</th><th class="num">Margen %</th><th class="num">Unidades</th><th class="num">SKUs</th></tr></thead><tbody>
    ${lm.map(l=>`<tr>
      <td style="font-weight:600">${l.linea}</td>
      <td class="num">${fMX(l.venta)}</td>
      <td class="num">${fPct(l.venta/totV*100)}</td>
      <td class="num" style="color:var(--green)">${fMX(l.margen)}</td>
      <td class="num"><span class="chip ${l.margen_pct>=22?'g':l.margen_pct>=18?'a':'r'}">${fPct(l.margen_pct)}</span></td>
      <td class="num">${fNum(l.unidades)}</td>
      <td class="num">${fNum(l.skus)}</td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>
  ${insight('',I.layers,'Foco estratégico de portafolio','La línea <b>'+lm[0].linea+'</b> lidera en venta ('+fCompact(lm[0].venta)+') pero su margen ('+fPct(lm[0].margen_pct)+') está por debajo del promedio. Las familias de mayor margen son candidatas a impulso comercial para mejorar la rentabilidad mix.')}`;
  const init=()=>{
    const d=[...lm].sort((a,b)=>b.venta-a.venta);
    mk('c_ln_dual',{
      grid:{left:8,right:18,top:30,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>fMX(v)},
      legend:{top:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:11,itemHeight:11},
      xAxis:{type:'category',data:d.map(l=>trunc(l.linea,12)),...axisStyle(),axisLabel:{color:C.txt,fontSize:10,interval:0,rotate:22}},
      yAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,fontSize:11,formatter:v=>fCompact(v)}},
      series:[
        {name:'Venta',type:'bar',barWidth:'34%',itemStyle:{borderRadius:[5,5,0,0],color:C.amber},data:d.map(l=>l.venta)},
        {name:'Utilidad',type:'bar',barWidth:'34%',itemStyle:{borderRadius:[5,5,0,0],color:C.teal},data:d.map(l=>l.margen)}
      ]
    });
    mk('c_ln_pie',{
      tooltip:{trigger:'item',valueFormatter:v=>fMX(v)},
      legend:{type:'scroll',orient:'vertical',right:0,top:'center',textStyle:{color:C.txt,fontSize:11},icon:'roundRect',itemWidth:11,itemHeight:11},
      series:[{type:'pie',radius:['38%','70%'],center:['34%','50%'],itemStyle:{borderColor:'#121826',borderWidth:2,borderRadius:4},label:{show:false},
        data:d.map((l,i)=>({name:trunc(l.linea,16),value:l.venta,itemStyle:{color:SERIES[i%SERIES.length]}}))}]
    });
  };
  return {html,init};
};

/* ---------- 7. CLIENTE × ARTÍCULO (cross-sell) ---------- */
VIEWS.crosssell = ()=>{
  const ca=D.cliente_articulo;
  const pot=ca.potenciar;
  const lineas=ca.ventas_por_linea;
  const html=`
  ${sHead('Inteligencia de venta cruzada','Análisis de qué líneas compra cada cliente para diseñar planes de potenciación dirigidos.')}
  <div class="grid g-4">
    ${kpi({lbl:'Clientes Analizados',val:fNum(ca.clientes_analizados),sub:'con detalle de artículos',ico:I.grid,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'Líneas de Producto',val:fNum(Object.keys(lineas).length),sub:'familias comercializadas',ico:I.layers,glow:'rgba(54,214,195,.16)'})}
    ${kpi({lbl:'Potencial Alto',val:fNum(pot.filter(p=>p.potencial==='Alto').length),unit:'cuentas',sub:'alto volumen, pocas líneas',ico:I.trend,glow:'rgba(61,220,151,.16)'})}
    ${kpi({lbl:'Línea Líder',val:trunc(Object.keys(lineas)[0],14),sub:fCompact(Object.values(lineas)[0]),ico:I.star,glow:'rgba(139,124,246,.14)'})}
  </div>

  ${sHead('Oportunidad de potenciación','Clientes de alto volumen concentrados en pocas líneas — máxima oportunidad de venta cruzada.')}
  <div class="card pad-lg">
    <div class="card-h"><span class="t">Volumen vs. amplitud de líneas</span><span class="tag teal">Cross-sell</span></div>
    <div id="c_cross" class="chart h-lg"></div>
    <div class="legend"><div class="lg"><i style="background:var(--rose)"></i>Potencial Alto</div><div class="lg"><i style="background:var(--amber)"></i>Potencial Medio</div><div class="lg"><i style="background:var(--teal)"></i>Base</div></div>
  </div>

  ${sHead('Plan de cuentas','Cliente, línea principal y cobertura de líneas — base para el plan comercial.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Cliente</th><th>Línea Principal</th><th class="num">Líneas Activas</th><th class="num">SKUs</th><th class="num">Venta</th><th>Potencial</th></tr></thead><tbody>
    ${pot.slice(0,18).map((p,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td style="font-weight:600">${trunc(p.cliente,32)}</td>
      <td><span class="chip t">${trunc(p.linea_principal,18)}</span></td>
      <td class="num">${p.lineas_activas} / 9</td>
      <td class="num">${fNum(p.skus)}</td>
      <td class="num">${fMX(p.venta)}</td>
      <td><span class="chip ${p.potencial==='Alto'?'r':p.potencial==='Medio'?'a':'g'}">${p.potencial}</span></td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const col={'Alto':C.rose,'Medio':C.amber,'Base':C.teal};
    mk('c_cross',{
      grid:{left:8,right:24,top:18,bottom:36,containLabel:true},
      tooltip:{trigger:'item',formatter:p=>{const d=p.data;return `<b>${d[3]}</b><br/>Venta: ${fMX(d[0])}<br/>Líneas activas: ${d[1]} de 9<br/>SKUs: ${d[2]}<br/>Potencial: ${d[4]}`}},
      xAxis:{type:'value',name:'Venta',nameLocation:'middle',nameGap:30,nameTextStyle:{color:C.txt},...axisStyle(),axisLabel:{color:C.txt,fontSize:11,formatter:v=>fCompact(v)}},
      yAxis:{type:'value',name:'Líneas activas',max:9,...axisStyle(),axisLabel:{color:C.txt,fontSize:11}},
      series:[{type:'scatter',symbolSize:d=>Math.max(12,Math.min(46,Math.sqrt(d[2])*4)),
        itemStyle:{opacity:.82,borderColor:'#0a0e16',borderWidth:1},
        data:pot.map(p=>[p.venta,p.lineas_activas,p.skus,p.cliente,p.potencial]),
        color:'#fff',
        // color by potencial
        }],
    });
    // recolor points
    const c=charts[charts.length-1];
    c.setOption({series:[{data:pot.map(p=>({value:[p.venta,p.lineas_activas,p.skus,p.cliente,p.potencial],itemStyle:{color:col[p.potencial]}}))}]});
  };
  return {html,init};
};

/* ---------- 8. INVENTARIO & VALUACIÓN ---------- */
VIEWS.inventario = ()=>{
  const inv=D.inventario;
  const html=`
  ${sHead('Valuación del inventario','Existencias al corte valuadas a último costo de compra (EXIVAL al 23/may/2026).')}
  <div class="grid g-4">
    ${kpi({lbl:'Valor del Inventario',val:fCompact(inv.valor_total),sub:'valuado a último costo',ico:I.box,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'SKUs en Catálogo',val:fNum(inv.skus_total),sub:`${fNum(inv.skus_con_existencia)} con existencia`,ico:I.layers})}
    ${kpi({lbl:'Rotación Real',val:fNum(inv.turnover_real_anual,2),unit:'x/año',sub:`${fNum(inv.dias_inventario)} días de inventario`,ico:I.rotate,glow:'rgba(139,124,246,.16)'})}
    ${kpi({lbl:'Capital Inmovilizado',val:fCompact(inv.capital_muerto),sub:`<span class="chg down">${fPct(inv.pct_muerto)}</span> del valor total`,ico:I.ghost,cls:'alert'})}
  </div>

  ${sHead('Salud del capital de inventario','La distribución entre inventario productivo (con venta) e improductivo es la métrica crítica.')}
  <div class="grid g-1-2">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Activo vs. Inmovilizado</span></div>
      <div id="c_inv_donut" class="chart h-md"></div>
    </div>
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Cobertura de existencias por SKU</span></div>
      <div id="c_inv_stock" class="chart h-md"></div>
      <div class="note">De ${fNum(inv.skus_total)} referencias en catálogo, ${fNum(inv.skus_sin_existencia)} no tienen existencia. El reto no es falta de stock, sino exceso de stock sin demanda.</div>
    </div>
  </div>

  <div class="strip" style="margin-top:18px">
    <div class="s"><div class="l">Capital Activo</div><div class="v te">${fCompact(inv.capital_activo)}</div></div>
    <div class="s"><div class="l">Capital Improductivo</div><div class="v rd">${fCompact(inv.capital_muerto)}</div></div>
    <div class="s"><div class="l">Días de Inventario</div><div class="v am">${fNum(inv.dias_inventario)}</div></div>
    <div class="s"><div class="l">SKUs con Existencia</div><div class="v">${fNum(inv.skus_con_existencia)}</div></div>
    <div class="s"><div class="l">Eficiencia de Capital</div><div class="v gr">${fPct(100-inv.pct_muerto)}</div></div>
  </div>

  ${insight('crit',I.alert,'Oportunidad de liberación de efectivo','Con una rotación real de solo <b>'+fNum(inv.turnover_real_anual,2)+'x anual</b>, el inventario tarda ~'+fNum(inv.dias_inventario)+' días en convertirse en venta. Reducir el capital inmovilizado en un 30% liberaría cerca de <b>'+fCompact(inv.capital_muerto*0.3)+'</b> de flujo, reinvertible en artículos de alta rotación.')}`;
  const init=()=>{
    mk('c_inv_donut',{
      tooltip:{trigger:'item',valueFormatter:v=>fMX(v)},
      legend:{bottom:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:11,itemHeight:11},
      series:[{type:'pie',radius:['54%','80%'],center:['50%','44%'],itemStyle:{borderColor:'#121826',borderWidth:3,borderRadius:6},label:{show:false},
        data:[{name:'Inmovilizado',value:inv.capital_muerto,itemStyle:{color:C.rose}},{name:'Activo',value:inv.capital_activo,itemStyle:{color:C.teal}}]}],
      graphic:{type:'text',left:'center',top:'37%',style:{text:fPct(inv.pct_muerto),fill:C.rose,fontSize:24,fontFamily:'IBM Plex Mono',fontWeight:600}}
    });
    mk('c_inv_stock',{
      tooltip:{trigger:'item',valueFormatter:v=>fNum(v)+' SKUs'},
      series:[{type:'pie',radius:['54%','80%'],center:['50%','44%'],roseType:false,itemStyle:{borderColor:'#121826',borderWidth:3,borderRadius:6},label:{show:false},
        data:[{name:'Con existencia',value:inv.skus_con_existencia,itemStyle:{color:C.amber}},{name:'Sin existencia',value:inv.skus_sin_existencia,itemStyle:{color:'#2a3550'}}]}],
      legend:{bottom:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:11,itemHeight:11},
      graphic:{type:'text',left:'center',top:'37%',style:{text:fNum(inv.skus_con_existencia),fill:C.amber2,fontSize:22,fontFamily:'IBM Plex Mono',fontWeight:600}}
    });
  };
  return {html,init};
};

/* ---------- 9. ROTACIÓN DE INVENTARIO ---------- */
VIEWS.rotacion = ()=>{
  const ro=D.rotacion;
  const html=`
  ${sHead('Rotación de inventario','Velocidad de desplazamiento por artículo (salidas / inventario promedio). Base para compra inteligente.')}
  <div class="grid g-4">
    ${kpi({lbl:'Rotación Global',val:fNum(ro.rotacion_global,1),unit:'x',sub:'sistema (salidas/inv. prom.)',ico:I.rotate,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'Ítems con Rotación',val:fNum(ro.con_rotacion_count),sub:`de ${fNum(ro.total_items)} medidos`,ico:I.trend,glow:'rgba(61,220,151,.16)'})}
    ${kpi({lbl:'Ítems sin Rotación',val:fNum(ro.sin_rotacion_count),sub:`${fPct(ro.sin_rotacion_count/ro.total_items*100)} del catálogo`,ico:I.ghost,cls:'alert'})}
    ${kpi({lbl:'Salidas Totales',val:fNum(ro.salidas_total),sub:'movimientos del periodo',ico:I.pkg,glow:'rgba(54,214,195,.16)'})}
  </div>

  ${sHead('Distribución de movimiento','La gran mayoría del catálogo no rota — concentra esfuerzo en lo que sí se mueve.')}
  <div class="grid g-2-1">
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Top 12 artículos de mayor rotación</span><span class="tag teal">demanda</span></div>
      <div id="c_rot" class="chart h-xl"></div>
    </div>
    <div class="card pad-lg">
      <div class="card-h"><span class="t">Catálogo: rota vs. no rota</span></div>
      <div id="c_rot_pie" class="chart h-lg"></div>
      <div class="note">${fPct(ro.sin_rotacion_count/ro.total_items*100)} de las referencias medidas tuvieron <b>cero salidas</b>. Son el universo a depurar o liquidar.</div>
    </div>
  </div>

  ${sHead('Artículos de máxima rotación','Mayor demanda relativa — prioridad #1 de disponibilidad y reorden.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Descripción</th><th class="num">Salidas</th><th class="num">Inv. Promedio</th><th class="num">Rotación</th></tr></thead><tbody>
    ${ro.alta_rotacion.slice(0,14).map((x,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-desc" title="${x.desc.replace(/"/g,'&quot;')}">${trunc(x.desc,58)}</td>
      <td class="num">${fNum(x.salidas)}</td>
      <td class="num">${fNum(x.inv_prom,2)}</td>
      <td class="num"><span class="chip t">${fNum(x.rotacion,1)}x</span></td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const t=ro.alta_rotacion.slice(0,12).reverse();
    mk('c_rot',{
      grid:{left:8,right:48,top:10,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const d=t[p[0].dataIndex];return `${trunc(d.desc,54)}<br/>Rotación: <b>${fNum(d.rotacion,1)}x</b> · Salidas: ${fNum(d.salidas)}`}},
      xAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,fontSize:11}},
      yAxis:{type:'category',data:t.map(x=>trunc(x.desc,26)),...axisStyle(),axisLabel:{color:C.txt,fontSize:10}},
      series:[{type:'bar',barWidth:'62%',itemStyle:{borderRadius:[0,6,6,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:C.teal},{offset:1,color:C.teal2}])},
        data:t.map(x=>x.rotacion),label:{show:true,position:'right',color:C.teal2,fontFamily:'IBM Plex Mono',fontSize:11,formatter:p=>fNum(p.value,1)+'x'}}]
    });
    mk('c_rot_pie',{
      tooltip:{trigger:'item',valueFormatter:v=>fNum(v)+' SKUs'},
      legend:{bottom:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:11,itemHeight:11},
      series:[{type:'pie',radius:['46%','74%'],center:['50%','46%'],itemStyle:{borderColor:'#121826',borderWidth:3,borderRadius:6},label:{show:false},
        data:[{name:'Con rotación',value:ro.con_rotacion_count,itemStyle:{color:C.teal}},{name:'Sin rotación',value:ro.sin_rotacion_count,itemStyle:{color:C.rose}}]}]
    });
  };
  return {html,init};
};

/* ---------- 11. CAPITAL INMOVILIZADO (dead / slow stock) ---------- */
VIEWS.inactivos = ()=>{
  const a=D.inactivos, inv=D.inventario;
  const top=a.top_valor;
  const sinReg = top.filter(x=>x.ultima_venta==='Sin registro').length;
  const html=`
  ${sHead('Capital Inmovilizado','Artículos con existencia valorizada que no registraron ninguna venta en el periodo. Es el principal foco de liberación de efectivo.')}
  <div class="grid g-4">
    ${kpi({lbl:'Valor Inmovilizado',val:fCompact(a.valor_total),sub:`<span class="chg down">${fPct(a.pct_del_inventario)}</span> del inventario total`,ico:I.ghost,cls:'alert',glow:'rgba(251,111,132,.18)'})}
    ${kpi({lbl:'SKUs sin Venta',val:fNum(a.count),sub:`de ${fNum(inv.skus_total)} referencias del catálogo`,ico:I.box})}
    ${kpi({lbl:'Unidades Detenidas',val:fNum(a.unidades),sub:'piezas en almacén sin desplazamiento',ico:I.layers})}
    ${kpi({lbl:'Capital Activo',val:fCompact(inv.capital_activo),sub:`${fPct(100-a.pct_del_inventario)} del inventario sí rota`,ico:I.spark,cls:'',glow:'rgba(54,214,195,.16)'})}
  </div>

  <div class="grid g-2-1" style="margin-top:16px">
    <div class="card">
      <div class="card-h"><span class="t">Composición del inventario</span><span class="tag red">Riesgo de capital</span></div>
      <div id="c_ina_bar" class="chart h-md"></div>
      <div class="note">El inventario productivo (con venta en el periodo) representa apenas ${fCompact(inv.capital_activo)}. El resto permanece inmovilizado y consume flujo, espacio y costo de oportunidad.</div>
    </div>
    <div class="card">
      <div class="card-h"><span class="t">Concentración del top 30</span></div>
      <div id="c_ina_donut" class="chart h-md"></div>
    </div>
  </div>

  ${insight('crit',I.alert,'Acción recomendada','De los 30 artículos de mayor valor detenido, '+fNum(sinReg)+' no tienen ninguna fecha de última venta registrada (posible obsolescencia). Se recomienda: (1) campaña de liquidación dirigida, (2) suspender recompra de estas referencias y (3) depurar del catálogo lo verdaderamente obsoleto. Ver el módulo de Promociones para precios sugeridos.')}

  ${sHead('Top 30 — Mayor capital detenido','Ordenado por valor inmovilizado. La "última venta" proviene del reporte de inactivos del ERP.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Código</th><th>Descripción</th><th class="num">Exist.</th><th class="num">Costo Unit.</th><th class="num">Valor Detenido</th><th>Última Venta</th></tr></thead><tbody>
    ${top.map((x,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-code">${x.code}</td>
      <td class="t-desc" title="${(x.desc||'').replace(/"/g,'&quot;')}">${trunc(x.desc,52)}</td>
      <td class="num">${fNum(x.existencia)}</td>
      <td class="num">${fMX(x.costo_unit)}</td>
      <td class="num"><b>${fMX(x.valor)}</b></td>
      <td>${x.ultima_venta==='Sin registro'?'<span class="chip" style="background:rgba(251,111,132,.13);color:var(--red)">Sin registro</span>':`<span style="color:var(--txt-2);font-family:var(--mono);font-size:12px">${x.ultima_venta}</span>`}</td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    mk('c_ina_bar',{
      grid:{left:8,right:18,top:30,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>fMX(v)},
      legend:{show:false},
      xAxis:{type:'category',data:['Inventario'],...axisStyle(),axisLabel:{show:false}},
      yAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,formatter:v=>fCompact(v)}},
      series:[
        {name:'Capital activo',type:'bar',stack:'t',barWidth:90,itemStyle:{color:C.teal,borderRadius:[0,0,0,0]},data:[inv.capital_activo],
         label:{show:true,position:'inside',color:'#06241f',fontFamily:'IBM Plex Mono',fontWeight:600,formatter:()=>'Activo '+fCompact(inv.capital_activo)}},
        {name:'Capital inmovilizado',type:'bar',stack:'t',barWidth:90,itemStyle:{color:C.rose,borderRadius:[8,8,0,0]},data:[a.valor_total],
         label:{show:true,position:'inside',color:'#3a0c13',fontFamily:'IBM Plex Mono',fontWeight:600,formatter:()=>'Inmovilizado '+fCompact(a.valor_total)}}
      ]
    });
    const others=a.valor_total - top.reduce((s,x)=>s+x.valor,0);
    mk('c_ina_donut',{
      tooltip:{trigger:'item',valueFormatter:v=>fMX(v)},
      legend:{bottom:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:11,itemHeight:11},
      series:[{type:'pie',radius:['46%','74%'],center:['50%','46%'],itemStyle:{borderColor:'#121826',borderWidth:3,borderRadius:6},
        label:{show:false},data:[
          {name:'Top 30 detenidos',value:top.reduce((s,x)=>s+x.valor,0),itemStyle:{color:C.rose}},
          {name:'Resto inmovilizado',value:others>0?others:0,itemStyle:{color:C.violet}}
        ]}]
    });
  };
  return {html,init};
};

/* ---------- 12. SUGERENCIAS DE COMPRA (single supplier) ---------- */
VIEWS.compras = ()=>{
  const s=D.sugerencias_compra, top=s.top;
  const sinStock = top.filter(x=>x.existencia<=0).length;
  const html=`
  ${sHead('Sugerencias de Compra al Proveedor','Propuesta de reabastecimiento para el proveedor único, priorizada por demanda y cobertura. '+s.criterio+'.')}
  <div class="grid g-4">
    ${kpi({lbl:'Artículos a Reabastecer',val:fNum(s.items_a_reabastecer),sub:'con cobertura menor a 30 días',ico:I.cart,cls:'feat',glow:'rgba(246,176,66,.2)'})}
    ${kpi({lbl:'Inversión Estimada',val:fCompact(s.inversion_estimada),sub:'a último costo de compra',ico:I.pkg,glow:'rgba(54,214,195,.16)'})}
    ${kpi({lbl:'Quiebres de Stock',val:fNum(sinStock),sub:'top 40 ya en existencia cero',ico:I.alert,cls:'alert'})}
    ${kpi({lbl:'Orden Sugerida (Top 40)',val:fCompact(top.reduce((a,x)=>a+(x.inversion||0),0)),sub:'prioridad inmediata de pedido',ico:I.trend})}
  </div>

  <div class="grid g-2-1" style="margin-top:16px">
    <div class="card">
      <div class="card-h"><span class="t">Top 12 por venta del periodo</span><span class="tag amber">Prioridad de reorden</span></div>
      <div id="c_cmp" class="chart h-lg"></div>
    </div>
    <div class="card">
      <div class="card-h"><span class="t">Cobertura actual (top 40)</span></div>
      <div id="c_cmp_cov" class="chart h-lg"></div>
      <div class="note">Días de inventario que quedan al ritmo de venta actual. En rojo, las referencias en quiebre que deben pedirse de inmediato.</div>
    </div>
  </div>

  ${insight('warn',I.cart,'Cómo leer esta propuesta','La sugerencia equilibra el inventario a ~45 días de demanda para los artículos que más rotan, evitando sobrestock. Se recomienda consolidar estas '+fNum(s.items_a_reabastecer)+' líneas en un solo pedido al proveedor para optimizar logística y condiciones de compra. La inversión total estimada es de '+fMX(s.inversion_estimada)+'.')}

  ${sHead('Pedido sugerido — Top 40','Ordenado por venta del periodo. "Sugerido" = unidades a comprar para alcanzar 45 días de cobertura.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Código</th><th>Descripción</th><th class="num">Vendidas</th><th class="num">Exist.</th><th class="num">Cobertura</th><th class="num">Sugerido</th><th class="num">Inversión</th></tr></thead><tbody>
    ${top.map((x,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-code">${x.code}</td>
      <td class="t-desc" title="${(x.desc||'').replace(/"/g,'&quot;')}">${trunc(x.desc,46)}</td>
      <td class="num">${fNum(x.vendidas)}</td>
      <td class="num">${fNum(x.existencia)}</td>
      <td class="num"><span class="chip ${x.cobertura_dias<=7?'':'a'}" style="${x.cobertura_dias<=7?'background:rgba(251,111,132,.13);color:var(--red)':''}">${fNum(x.cobertura_dias,0)}d</span></td>
      <td class="num"><b class="am" style="color:var(--amber-2)">${fNum(x.sugerido_comprar)}</b></td>
      <td class="num">${fMX(x.inversion)}</td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const t=top.slice(0,12).reverse();
    mk('c_cmp',{
      grid:{left:8,right:54,top:10,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const d=t[p[0].dataIndex];return `${trunc(d.desc,50)}<br/>Sugerido: <b>${fNum(d.sugerido_comprar)} u</b> · Inversión: ${fMX(d.inversion)}<br/>Vendidas: ${fNum(d.vendidas)} · Exist: ${fNum(d.existencia)}`}},
      xAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,formatter:v=>fNum(v)}},
      yAxis:{type:'category',data:t.map(x=>trunc(x.desc,24)),...axisStyle(),axisLabel:{color:C.txt,fontSize:10}},
      series:[{type:'bar',barWidth:'62%',itemStyle:{borderRadius:[0,6,6,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:C.amber},{offset:1,color:C.amber2}])},
        data:t.map(x=>x.sugerido_comprar),label:{show:true,position:'right',color:C.amber2,fontFamily:'IBM Plex Mono',fontSize:11,formatter:p=>fNum(p.value)+' u'}}]
    });
    const t2=top.slice(0,20);
    mk('c_cmp_cov',{
      grid:{left:8,right:18,top:14,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const d=t2[p[0].dataIndex];return `${trunc(d.desc,50)}<br/>Cobertura: <b>${fNum(d.cobertura_dias,0)} días</b>`}},
      xAxis:{type:'category',data:t2.map((_,i)=>i+1),...axisStyle(),axisLabel:{color:C.txt,fontSize:9}},
      yAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,formatter:v=>v+'d'}},
      series:[{type:'bar',barWidth:'58%',data:t2.map(x=>({value:Math.round(x.cobertura_dias),itemStyle:{color:x.cobertura_dias<=7?C.rose:(x.cobertura_dias<=15?C.amber:C.teal),borderRadius:[5,5,0,0]}}))},
        {type:'line',markLine:{silent:true,symbol:'none',lineStyle:{color:C.violet,type:'dashed'},data:[{yAxis:30,label:{formatter:'Objetivo 30d',color:C.violet,fontSize:10}}]}}]
    });
  };
  return {html,init};
};

/* ---------- 13. PROMOCIONES & LIQUIDACIÓN ---------- */
VIEWS.promociones = ()=>{
  const p=D.promociones, top=p.top;
  const descPromedio = top.length? top.reduce((a,x)=>a+(1-x.precio_promo_est/x.precio_normal_est),0)/top.length*100 : 0;
  const html=`
  ${sHead('Promociones & Liquidación','Estrategia para activar capital inmovilizado: precios promocionales sobre artículos sin rotación, reduciendo el margen de referencia (${fPct(p.margen_referencia_pct)}) a la mitad para acelerar su venta.')}
  <div class="grid g-4">
    ${kpi({lbl:'Candidatos a Promoción',val:fNum(p.candidatos),sub:'artículos detenidos con costo y existencia',ico:I.tag,cls:'feat',glow:'rgba(139,124,246,.2)'})}
    ${kpi({lbl:'Capital a Liberar',val:fCompact(p.valor_a_liberar),sub:'valor inmovilizado de los candidatos',ico:I.cash,glow:'rgba(54,214,195,.16)'})}
    ${kpi({lbl:'Descuento Promedio',val:fPct(descPromedio,0),sub:'sobre precio de lista estimado',ico:I.trend})}
    ${kpi({lbl:'Margen tras Promo',val:fPct(p.margen_referencia_pct*0.5,1),sub:`vs ${fPct(p.margen_referencia_pct)} de referencia`,ico:I.margin})}
  </div>

  <div class="grid g-2" style="margin-top:16px">
    <div class="card">
      <div class="card-h"><span class="t">Precio normal vs. precio promocional</span></div>
      <div id="c_promo" class="chart h-lg"></div>
      <div class="legend"><span class="lg"><i style="background:${C.violet}"></i>Precio lista estimado</span><span class="lg"><i style="background:${C.teal}"></i>Precio promoción</span></div>
    </div>
    <div class="card">
      <div class="card-h"><span class="t">Valor a liberar por artículo (top 12)</span></div>
      <div id="c_promo_val" class="chart h-lg"></div>
    </div>
  </div>

  ${insight('info',I.tag,'Lógica de precios','El precio de lista se estima a partir del último costo y el margen global. El precio promocional reduce el margen a la mitad ('+fPct(p.margen_referencia_pct*0.5,1)+'), manteniendo rentabilidad positiva mientras se recupera efectivo. Liquidar estos '+fNum(p.candidatos)+' artículos libera '+fMX(p.valor_a_liberar)+' reinvertibles en referencias de alta rotación.')}

  ${sHead('Catálogo de liquidación sugerido','Precios estimados. Ajustar según política comercial y elasticidad por línea.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Código</th><th>Descripción</th><th class="num">Exist.</th><th class="num">Costo</th><th class="num">P. Normal</th><th class="num">P. Promo</th><th class="num">Valor Inmov.</th></tr></thead><tbody>
    ${top.map((x,i)=>`<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-code">${x.code}</td>
      <td class="t-desc" title="${(x.desc||'').replace(/"/g,'&quot;')}">${trunc(x.desc,44)}</td>
      <td class="num">${fNum(x.existencia)}</td>
      <td class="num">${fMX(x.costo)}</td>
      <td class="num" style="color:var(--txt-3)">${fMX(x.precio_normal_est)}</td>
      <td class="num"><b class="te" style="color:var(--teal-2)">${fMX(x.precio_promo_est)}</b></td>
      <td class="num">${fMX(x.valor_inmovilizado)}</td>
    </tr>`).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    const t=top.slice(0,12);
    mk('c_promo',{
      grid:{left:8,right:18,top:14,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const d=t[p[0].dataIndex];return `${trunc(d.desc,46)}<br/>Lista: ${fMX(d.precio_normal_est)} → Promo: <b>${fMX(d.precio_promo_est)}</b>`}},
      legend:{show:false},
      xAxis:{type:'category',data:t.map((_,i)=>i+1),...axisStyle(),axisLabel:{color:C.txt,fontSize:9}},
      yAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,formatter:v=>fCompact(v)}},
      series:[
        {name:'Lista',type:'bar',barGap:'-100%',barWidth:'56%',itemStyle:{color:'rgba(139,124,246,.35)',borderRadius:[5,5,0,0]},data:t.map(x=>x.precio_normal_est)},
        {name:'Promo',type:'bar',barWidth:'56%',itemStyle:{color:C.teal,borderRadius:[5,5,0,0]},data:t.map(x=>x.precio_promo_est)}
      ]
    });
    const tv=top.slice(0,12).reverse();
    mk('c_promo_val',{
      grid:{left:8,right:50,top:10,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const d=tv[p[0].dataIndex];return `${trunc(d.desc,46)}<br/>Valor inmovilizado: <b>${fMX(d.valor_inmovilizado)}</b>`}},
      xAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,formatter:v=>fCompact(v)}},
      yAxis:{type:'category',data:tv.map(x=>trunc(x.desc,22)),...axisStyle(),axisLabel:{color:C.txt,fontSize:10}},
      series:[{type:'bar',barWidth:'62%',itemStyle:{borderRadius:[0,6,6,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:C.violet},{offset:1,color:'#b3a8fb'}])},
        data:tv.map(x=>x.valor_inmovilizado),label:{show:true,position:'right',color:'#b3a8fb',fontFamily:'IBM Plex Mono',fontSize:11,formatter:p=>fCompact(p.value)}}]
    });
  };
  return {html,init};
};

/* ---------- 14. COBRANZA & CARTERA ---------- */
VIEWS.cobranza = ()=>{
  const c=D.cobranza, ag=c.aging, top=c.top_deudores;
  const agKeys=['0-7','8-15','16-30','31-60','>60'];
  const agColors={'0-7':C.green,'8-15':C.teal,'16-30':C.amber,'31-60':C.amber2,'>60':C.rose};
  const vencido = (ag['16-30']||0)+(ag['31-60']||0)+(ag['>60']||0);
  const html=`
  ${sHead('Cobranza & Cartera','Estado de la cartera por cobrar y antigüedad de saldos. Indicador clave de liquidez y disciplina de crédito.')}
  <div class="grid g-4">
    ${kpi({lbl:'Cartera por Cobrar',val:fCompact(c.cartera_total),sub:`${fNum(c.facturas_pendientes)} facturas · ${fNum(c.clientes_con_saldo)} clientes`,ico:I.cash,cls:'feat',glow:'rgba(61,220,151,.18)'})}
    ${kpi({lbl:'Días Cartera (DSO)',val:fNum(c.dso_dias,1),unit:'días',sub:'rotación de cuentas por cobrar',ico:I.rotate,glow:'rgba(54,214,195,.16)'})}
    ${kpi({lbl:'Atraso Promedio',val:fNum(c.atraso_promedio,1),unit:'días',sub:'sobre fecha de vencimiento',ico:I.spark})}
    ${kpi({lbl:'Saldo > 15 días',val:fCompact(vencido),sub:`${fPct(vencido/c.cartera_total*100)} de la cartera total`,ico:I.alert,cls:vencido>0?'':'',glow:'rgba(246,176,66,.16)'})}
  </div>

  <div class="grid g-2-1" style="margin-top:16px">
    <div class="card">
      <div class="card-h"><span class="t">Antigüedad de saldos (aging)</span><span class="tag green">Cartera sana</span></div>
      <div id="c_cob_age" class="chart h-md"></div>
      <div class="note">El ${fPct((ag['0-7']+ag['8-15'])/c.cartera_total*100)} de la cartera tiene menos de 15 días. No hay saldos vencidos a más de 60 días: la gestión de crédito y cobranza es saludable.</div>
    </div>
    <div class="card">
      <div class="card-h"><span class="t">Distribución por antigüedad</span></div>
      <div id="c_cob_pie" class="chart h-md"></div>
    </div>
  </div>

  ${insight('good',I.check,'Cartera bajo control','Con un DSO de '+fNum(c.dso_dias,1)+' días y atraso promedio de solo '+fNum(c.atraso_promedio,1)+' días, la conversión de ventas en efectivo es excelente. La cartera ('+fMX(c.cartera_total)+') está concentrada en pocos clientes; conviene mantener límites de crédito y seguimiento preventivo sobre los mayores deudores.')}

  ${sHead('Principales deudores','Clientes con mayor saldo pendiente. Foco de seguimiento de cobranza.')}
  <div class="card">
    <div class="tbl-wrap"><table class="dt"><thead><tr><th></th><th>Cliente</th><th class="num">Facturas</th><th class="num">Saldo</th><th class="num">% Cartera</th><th>Participación</th></tr></thead><tbody>
    ${top.map((x,i)=>{const pct=x.saldo/c.cartera_total*100;return `<tr>
      <td><span class="t-rank ${i<3?'top':''}">${i+1}</span></td>
      <td class="t-desc" title="${(x.cliente||'').replace(/"/g,'&quot;')}">${trunc(x.cliente,40)}</td>
      <td class="num">${fNum(x.facturas)}</td>
      <td class="num"><b>${fMX(x.saldo)}</b></td>
      <td class="num">${fPct(pct)}</td>
      <td><div class="minibar teal"><i style="width:${Math.min(100,pct).toFixed(1)}%"></i></div></td>
    </tr>`}).join('')}
    </tbody></table></div>
  </div>`;
  const init=()=>{
    mk('c_cob_age',{
      grid:{left:8,right:18,top:24,bottom:8,containLabel:true},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>fMX(v)},
      xAxis:{type:'category',data:agKeys.map(k=>k+' días'),...axisStyle(),axisLabel:{color:C.txt,fontSize:11}},
      yAxis:{type:'value',...axisStyle(),axisLabel:{color:C.txt,formatter:v=>fCompact(v)}},
      series:[{type:'bar',barWidth:'52%',data:agKeys.map(k=>({value:ag[k]||0,itemStyle:{color:agColors[k],borderRadius:[6,6,0,0]}})),
        label:{show:true,position:'top',color:C.txt,fontFamily:'IBM Plex Mono',fontSize:10,formatter:p=>p.value>0?fCompact(p.value):''}}]
    });
    mk('c_cob_pie',{
      tooltip:{trigger:'item',valueFormatter:v=>fMX(v)},
      legend:{bottom:0,textStyle:{color:C.txt},icon:'roundRect',itemWidth:11,itemHeight:11},
      series:[{type:'pie',radius:['46%','74%'],center:['50%','45%'],itemStyle:{borderColor:'#121826',borderWidth:3,borderRadius:6},label:{show:false},
        data:agKeys.filter(k=>(ag[k]||0)>0).map(k=>({name:k+' días',value:ag[k],itemStyle:{color:agColors[k]}}))}]
    });
  };
  return {html,init};
};

/* ============================================================
   ROUTER & BOOTSTRAP
   ============================================================ */
function buildSidebar(){
  const nav = NAV.map(n=>{
    if(n.sec) return `<div class="nav-sec">${n.sec}</div>`;
    return `<a class="nav-item" href="#${n.id}" data-id="${n.id}"><span class="ico">${svg(n.ico)}</span><span>${n.name}</span></a>`;
  }).join('');
  document.querySelector('.nav').innerHTML = nav;
}
function setActive(id){
  document.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('active', a.dataset.id===id));
  const item = NAV.find(n=>n.id===id);
  const title = document.getElementById('crumb-title');
  if(title && item) title.textContent = item.name;
}
function disposeCharts(){
  while(charts.length){ const c=charts.pop(); try{c.dispose();}catch(e){} }
}
function render(id){
  if(!VIEWS[id]) id='resumen';
  disposeCharts();
  const v = VIEWS[id]();
  const view = document.getElementById('view');
  view.innerHTML = v.html;
  view.scrollTop = 0;
  document.querySelector('.main').scrollTo({top:0,behavior:'instant'});
  setActive(id);
  if(v.init){ try{ v.init(); }catch(e){ console.error('init '+id, e); } }
  // close mobile menu
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.scrim').classList.remove('show');
}
function currentId(){ return (location.hash||'#resumen').replace('#',''); }

window.addEventListener('hashchange', ()=>render(currentId()));
window.addEventListener('resize', ()=>{ charts.forEach(c=>{try{c.resize();}catch(e){}}); });

document.addEventListener('DOMContentLoaded', ()=>{
  buildSidebar();
  const mb = document.querySelector('.menu-btn');
  const sc = document.querySelector('.scrim');
  if(mb) mb.addEventListener('click', ()=>{
    document.querySelector('.sidebar').classList.toggle('open');
    sc.classList.toggle('show');
  });
  if(sc) sc.addEventListener('click', ()=>{
    document.querySelector('.sidebar').classList.remove('open');
    sc.classList.remove('show');
  });
  render(currentId());
});
