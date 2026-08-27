const Biblio={
 token(){return localStorage.getItem('token')},
 user(){try{return JSON.parse(localStorage.getItem('user')||'null')}catch{return null}},
 headers(json=true){const h={};if(json)h['Content-Type']='application/json';if(this.token())h.Authorization=`Bearer ${this.token()}`;return h},
 async request(url,options={}){const res=await fetch(url,{...options,headers:{...this.headers(options.body!==undefined),...(options.headers||{})}});let data={};try{data=await res.json()}catch{}if(res.status===401){localStorage.removeItem('token');localStorage.removeItem('user');if(!location.pathname.endsWith('login.html'))location.href='/login.html'}if(!res.ok)throw new Error(data.message||'Une erreur est survenue.');return data},
 logout(){localStorage.clear();location.href='/'},
 escape(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))},
 cover(url,title='Livre'){const safe=this.escape(url||'');const fallback=`https://placehold.co/500x700/e9edff/3157d5?text=${encodeURIComponent(title.slice(0,24))}`;return safe||fallback},
 toast(message,type='success'){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el)}el.textContent=message;el.className=`toast show ${type}`;clearTimeout(this._toast);this._toast=setTimeout(()=>el.className='toast',3000)},
 formatDate(v){return v?new Date(v).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):'—'},
 statusLabel(s){return ({EN_COURS:'En cours',RETOURNE:'Retourné',EN_RETARD:'En retard'})[s]||s},
 statusClass(s){return s==='RETOURNE'?'success':s==='EN_RETARD'?'danger':'warning'},
 requireUser(){if(!this.token()){location.href='/login.html';return false}return true},
 requireAdmin(){const u=this.user();if(!this.token()||!u||u.role!=='admin'){location.href='/login.html';return false}return true}
};
window.Biblio=Biblio;
