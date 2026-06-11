/* ============================================================
   HARVIN — Cargador de datos
   ------------------------------------------------------------
   Fuente primaria:  assets/data/harvin-data.json (publicable
   desde la interfaz vía GitHub) — se pide SIEMPRE sin caché
   para que las actualizaciones se reflejen de inmediato aun
   con el CDN de GitHub Pages.
   Respaldo:         assets/js/data.js (window.HARVIN embebido),
   útil al abrir el archivo localmente (file://) o si el JSON
   aún no existe en el repositorio.
   ============================================================ */
(function(){
  'use strict';
  const JSON_PATH = 'assets/data/harvin-data.json';

  async function load(){
    let source = 'embebido (data.js)';
    try{
      const r = await fetch(JSON_PATH + '?ts=' + Date.now(), {cache:'no-store'});
      if(r.ok){
        const j = await r.json();
        if(j && j.resumen && j.ventas){
          // El JSON publicado manda sobre el data.js embebido
          window.HARVIN = j;
          source = 'publicado (harvin-data.json)';
        }
      }
    }catch(e){ /* file:// o sin red: usamos el respaldo embebido */ }

    if(!window.HARVIN){
      console.error('HARVIN: no hay datos disponibles (ni JSON ni data.js).');
      window.HARVIN = {};
    }
    window.HARVIN_SOURCE = source;
    document.dispatchEvent(new CustomEvent('harvin:data-ready', {detail:{source}}));
  }

  // data.js ya corrió (script anterior); ahora intentamos mejorar con el JSON
  window.HARVIN_READY = load();
})();
