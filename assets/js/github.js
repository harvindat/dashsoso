/* ============================================================
   HARVIN — Cliente GitHub (Contents API)
   ------------------------------------------------------------
   Publica los archivos de datos al repositorio usando un token
   personal (PAT) que el usuario pega en la interfaz. El token
   vive SOLO en sessionStorage (se borra al cerrar la pestaña)
   y nunca se escribe en el repositorio.
   ============================================================ */
(function(){
  'use strict';

  const SS_TOKEN = 'harvin.gh.token';
  const LS_REPO  = 'harvin.gh.repo';
  const API = 'https://api.github.com';

  /* ---------- configuración del repo ---------- */
  function guessRepo(){
    // https://USUARIO.github.io/REPO/...  →  {owner:USUARIO, repo:REPO}
    try{
      const h = location.hostname, parts = location.pathname.split('/').filter(Boolean);
      if(/\.github\.io$/i.test(h)){
        const owner = h.replace(/\.github\.io$/i,'');
        const repo  = parts.length ? parts[0] : owner + '.github.io';
        return {owner, repo, branch:'main'};
      }
    }catch(e){}
    return {owner:'', repo:'', branch:'main'};
  }
  function getRepo(){
    try{
      const saved = JSON.parse(localStorage.getItem(LS_REPO)||'null');
      if(saved && saved.owner && saved.repo) return saved;
    }catch(e){}
    return guessRepo();
  }
  function setRepo(cfg){
    localStorage.setItem(LS_REPO, JSON.stringify({
      owner: String(cfg.owner||'').trim(),
      repo:  String(cfg.repo ||'').trim(),
      branch:String(cfg.branch||'main').trim() || 'main'
    }));
  }

  /* ---------- token ---------- */
  function getToken(){ return sessionStorage.getItem(SS_TOKEN) || ''; }
  function setToken(t){
    t = String(t||'').trim();
    if(t) sessionStorage.setItem(SS_TOKEN, t);
    else  sessionStorage.removeItem(SS_TOKEN);
  }

  function headers(){
    return {
      'Authorization': 'Bearer ' + getToken(),
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async function gh(path, opts){
    const r = await fetch(API + path, Object.assign({headers: headers()}, opts||{}));
    let body = null;
    try{ body = await r.json(); }catch(e){}
    if(!r.ok){
      const msg = (body && body.message) ? body.message : ('HTTP ' + r.status);
      const err = new Error(msg); err.status = r.status; err.body = body;
      throw err;
    }
    return body;
  }

  /* ---------- validación ---------- */
  async function validate(){
    if(!getToken()) return {ok:false, msg:'Pega un token de GitHub primero.'};
    const {owner, repo, branch} = getRepo();
    if(!owner || !repo) return {ok:false, msg:'Configura propietario y repositorio.'};
    try{
      const me = await gh('/user');
      const rp = await gh(`/repos/${owner}/${repo}`);
      const perms = rp.permissions || {};
      if(!(perms.push || perms.admin || perms.maintain))
        return {ok:false, msg:`El token de ${me.login} no tiene permiso de escritura (push) sobre ${owner}/${repo}.`};
      try{ await gh(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`); }
      catch(e){ return {ok:false, msg:`La rama "${branch}" no existe en ${owner}/${repo}.`}; }
      return {ok:true, msg:`Token válido · ${me.login} · escritura en ${owner}/${repo}@${branch}.`, login: me.login};
    }catch(e){
      if(e.status===401) return {ok:false, msg:'Token inválido o expirado (401).'};
      if(e.status===404) return {ok:false, msg:'Repositorio no encontrado (verifica propietario/nombre y permisos del token).'};
      return {ok:false, msg:'Error al validar: ' + e.message};
    }
  }

  /* ---------- helpers de contenido ---------- */
  function b64encodeUtf8(str){
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    const CH = 0x8000;
    for(let i=0;i<bytes.length;i+=CH) bin += String.fromCharCode.apply(null, bytes.subarray(i,i+CH));
    return btoa(bin);
  }

  async function getFileSha(path){
    const {owner, repo, branch} = getRepo();
    try{
      const f = await gh(`/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
      return f && f.sha ? f.sha : null;
    }catch(e){
      if(e.status===404) return null;  // archivo nuevo
      throw e;
    }
  }

  /* Sube/actualiza un archivo. Reintenta una vez si el sha quedó viejo (409). */
  async function putFile(path, contentStr, message){
    const {owner, repo, branch} = getRepo();
    const doPut = async ()=>{
      const sha = await getFileSha(path);
      const body = { message, branch, content: b64encodeUtf8(contentStr) };
      if(sha) body.sha = sha;
      return gh(`/repos/${owner}/${repo}/contents/${path}`, {method:'PUT', body: JSON.stringify(body)});
    };
    try{ return await doPut(); }
    catch(e){
      if(e.status===409 || e.status===422){ return await doPut(); } // sha desactualizado → reintento
      throw e;
    }
  }

  /* Publica varios archivos en secuencia, reportando progreso */
  async function publishFiles(files, onProgress){
    const results = [];
    for(let i=0;i<files.length;i++){
      const f = files[i];
      if(onProgress) onProgress(i, files.length, f.path);
      const r = await putFile(f.path, f.content, f.message || ('Actualización de datos · ' + new Date().toISOString()));
      results.push({path:f.path, commit: r && r.commit ? r.commit.sha : null});
    }
    if(onProgress) onProgress(files.length, files.length, null);
    return results;
  }

  window.HGH = { guessRepo, getRepo, setRepo, getToken, setToken, validate, putFile, publishFiles };
})();
