/* ============================================================
   HARVIN — Autenticación y gestión de usuarios (cliente estático)
   ------------------------------------------------------------
   - Superusuario fijo: b3t0 (no puede borrarse ni degradarse).
   - Usuarios adicionales viven en assets/data/users.json
     (publicado al repositorio mediante el token de GitHub) y,
     mientras no se publiquen, en localStorage como borrador.
   - Las contraseñas NUNCA se guardan: solo SHA-256(salt|user|pass).
   NOTA: en un sitio estático esto es un control de acceso de
   interfaz, no seguridad de servidor. Usar contraseñas fuertes
   y, de preferencia, repositorio privado con GitHub Pages.
   ============================================================ */
(function(){
  'use strict';

  const SU = {
    user: 'b3t0',
    salt: 'HARVIN-SU-2026',
    hash: 'ada4ed637642a03d7f2fe58dba8b6f0583fd2b2682b5c21a9f59b6f96cc926e3',
    role: 'admin'
  };
  const USERS_PATH   = 'assets/data/users.json';
  const LS_DRAFT     = 'harvin.users.draft';      // usuarios aún no publicados
  const SS_SESSION   = 'harvin.session';
  const SESSION_TTL  = 8 * 60 * 60 * 1000;        // 8 horas

  let remoteUsers = [];   // usuarios cargados del repo (users.json)
  let loaded = false;

  /* ---------- utilidades ---------- */
  async function sha256(str){
    if (window.crypto && crypto.subtle && window.isSecureContext !== false){
      try{
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
      }catch(e){ /* cae al fallback */ }
    }
    return sha256Fallback(str); // file:// u orígenes no seguros
  }

  /* SHA-256 puro JS (fallback para contexts sin crypto.subtle) */
  function sha256Fallback(ascii){
    function rr(v,a){return (v>>>a)|(v<<(32-a));}
    let maxWord=Math.pow(2,32), result='', words=[], asciiBitLength=ascii.length*8;
    let hash=sha256Fallback.h=sha256Fallback.h||[], k=sha256Fallback.k=sha256Fallback.k||[], primeCounter=k.length;
    const isComposite={};
    for(let candidate=2; primeCounter<64; candidate++){
      if(!isComposite[candidate]){
        for(let i=0;i<313;i+=candidate) isComposite[i]=candidate;
        hash[primeCounter]=(Math.pow(candidate,.5)*maxWord)|0;
        k[primeCounter++]=(Math.pow(candidate,1/3)*maxWord)|0;
      }
    }
    ascii=unescape(encodeURIComponent(ascii))+'\x80';
    while(ascii.length%64-56) ascii+='\x00';
    for(let i=0;i<ascii.length;i++){
      const j=ascii.charCodeAt(i); if(j>>8) return '';
      words[i>>2]|=j<<((3-i)%4)*8;
    }
    words[words.length]=(asciiBitLength/maxWord)|0;
    words[words.length]=asciiBitLength;
    for(let j=0;j<words.length;){
      const w=words.slice(j,j+=16), oldHash=hash.slice(0);
      for(let i=0;i<64;i++){
        const w15=w[i-15], w2=w[i-2];
        const a=hash[0], e=hash[4];
        const temp1=hash[7]
          +(rr(e,6)^rr(e,11)^rr(e,25))
          +((e&hash[5])^(~e&hash[6]))
          +k[i]
          +(w[i]=(i<16)?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
        const temp2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
        hash=[(temp1+temp2)|0].concat(hash);
        hash[4]=(hash[4]+temp1)|0;
      }
      for(let i=0;i<8;i++) hash[i]=(hash[i]+oldHash[i])|0;
    }
    for(let i=0;i<8;i++)
      for(let j=3;j+1;j--){
        const b=(hash[i]>>(j*8))&255;
        result+=((b<16)?0:'')+b.toString(16);
      }
    return result;
  }

  function randomSalt(){
    const a = new Uint8Array(12);
    (window.crypto||{}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_,i)=>a[i]=Math.floor(Math.random()*256));
    return [...a].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function readDraft(){
    try{ return JSON.parse(localStorage.getItem(LS_DRAFT)||'[]')||[]; }catch(e){ return []; }
  }
  function writeDraft(list){
    try{ localStorage.setItem(LS_DRAFT, JSON.stringify(list)); }catch(e){}
  }

  /* ---------- carga de usuarios remotos ---------- */
  async function loadUsers(){
    if(loaded) return;
    try{
      const r = await fetch(USERS_PATH + '?ts=' + Date.now(), {cache:'no-store'});
      if(r.ok){
        const j = await r.json();
        if(j && Array.isArray(j.users)) remoteUsers = j.users;
      }
    }catch(e){ /* file:// o aún no existe: solo superusuario + borradores */ }
    loaded = true;
  }

  /* Lista efectiva (remotos + borradores locales; el borrador con mismo
     usuario sobreescribe al remoto, p.ej. cambio de contraseña pendiente) */
  function allUsers(){
    const map = new Map();
    remoteUsers.forEach(u=>map.set(u.user.toLowerCase(), {...u, origen:'publicado'}));
    readDraft().forEach(u=>map.set(u.user.toLowerCase(), {...u, origen:'borrador'}));
    return [...map.values()];
  }

  /* ---------- sesión ---------- */
  function session(){
    try{
      const s = JSON.parse(sessionStorage.getItem(SS_SESSION)||'null');
      if(!s) return null;
      if(Date.now() > s.exp){ sessionStorage.removeItem(SS_SESSION); return null; }
      return s;
    }catch(e){ return null; }
  }
  function setSession(user, role){
    sessionStorage.setItem(SS_SESSION, JSON.stringify({user, role, exp: Date.now()+SESSION_TTL}));
  }
  function logout(){
    sessionStorage.removeItem(SS_SESSION);
    sessionStorage.removeItem('harvin.gh.token');
    location.hash = '';
    location.reload();
  }

  /* ---------- login ---------- */
  async function login(user, pass){
    await loadUsers();
    user = String(user||'').trim();
    pass = String(pass||'');
    if(!user || !pass) return {ok:false, msg:'Escribe usuario y contraseña.'};

    if(user.toLowerCase() === SU.user){
      const h = await sha256(SU.salt + '|' + SU.user + '|' + pass);
      if(h === SU.hash){ setSession(SU.user, 'admin'); return {ok:true}; }
      return {ok:false, msg:'Contraseña incorrecta.'};
    }
    const u = allUsers().find(x=>x.user.toLowerCase() === user.toLowerCase() && x.activo !== false);
    if(!u) return {ok:false, msg:'Usuario no encontrado o inactivo.'};
    const h = await sha256(u.salt + '|' + u.user + '|' + pass);
    if(h === u.hash){ setSession(u.user, u.role || 'viewer'); return {ok:true}; }
    return {ok:false, msg:'Contraseña incorrecta.'};
  }

  /* ---------- administración (solo admin) ---------- */
  async function addUser(user, pass, role){
    const s = session();
    if(!s || s.role!=='admin') return {ok:false, msg:'Solo el superusuario puede dar de alta usuarios.'};
    user = String(user||'').trim();
    if(!/^[a-zA-Z0-9._-]{3,24}$/.test(user)) return {ok:false, msg:'Usuario inválido (3–24 caracteres, letras/números/._-).'};
    if(user.toLowerCase()===SU.user) return {ok:false, msg:'Ese nombre está reservado.'};
    if(String(pass||'').length < 6) return {ok:false, msg:'La contraseña debe tener al menos 6 caracteres.'};
    if(allUsers().some(u=>u.user.toLowerCase()===user.toLowerCase() && u.activo!==false))
      return {ok:false, msg:'Ese usuario ya existe. Elimínalo primero o usa otro nombre.'};
    const salt = randomSalt();
    const hash = await sha256(salt + '|' + user + '|' + pass);
    const draft = readDraft().filter(u=>u.user.toLowerCase()!==user.toLowerCase());
    draft.push({user, salt, hash, role: role==='admin'?'admin':'viewer', activo:true,
                creado_por: s.user, creado: new Date().toISOString()});
    writeDraft(draft);
    return {ok:true};
  }

  function removeUser(user){
    const s = session();
    if(!s || s.role!=='admin') return {ok:false, msg:'Sin permisos.'};
    if(user.toLowerCase()===SU.user) return {ok:false, msg:'El superusuario no puede eliminarse.'};
    // si está publicado, lo marcamos inactivo en borrador; si solo era borrador, se quita
    const draft = readDraft().filter(u=>u.user.toLowerCase()!==user.toLowerCase());
    if(remoteUsers.some(u=>u.user.toLowerCase()===user.toLowerCase())){
      const r = remoteUsers.find(u=>u.user.toLowerCase()===user.toLowerCase());
      draft.push({...r, activo:false, baja_por:s.user, baja:new Date().toISOString()});
    }
    writeDraft(draft);
    return {ok:true};
  }

  /* JSON listo para publicar al repo */
  function exportUsersJson(){
    const map = new Map();
    remoteUsers.forEach(u=>map.set(u.user.toLowerCase(), u));
    readDraft().forEach(u=>map.set(u.user.toLowerCase(), u));
    const users = [...map.values()].map(({origen, ...u})=>u);
    return JSON.stringify({version:1, actualizado:new Date().toISOString(), users}, null, 2);
  }
  function markPublished(){
    // los borradores ya viven en el repo: se promueven a "remotos"
    const map = new Map();
    remoteUsers.forEach(u=>map.set(u.user.toLowerCase(), u));
    readDraft().forEach(u=>map.set(u.user.toLowerCase(), u));
    remoteUsers = [...map.values()].map(({origen, ...u})=>u);
    writeDraft([]);
  }
  function pendingUsers(){ return readDraft().length; }

  window.HAUTH = { login, logout, session, loadUsers, allUsers, addUser, removeUser,
                   exportUsersJson, markPublished, pendingUsers, sha256, SU_USER: SU.user };
})();
