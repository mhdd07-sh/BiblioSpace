async function loadHomeStats(){
  try{
    const token=localStorage.getItem('token');
    if(!token)return;
    const res=await fetch('/api/stats',{headers:{Authorization:`Bearer ${token}`}});
    if(!res.ok)return;
    const {data}=await res.json();
    document.getElementById('statBooks').textContent=data.totalBooks;
    document.getElementById('statMembers').textContent=data.totalMembers;
    document.getElementById('statLoans').textContent=data.activeLoans;
  }catch(e){console.error(e)}
}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
loadHomeStats();
