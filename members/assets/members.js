
async function showIdentity(){
  const el=document.getElementById("identity");
  const welcome=document.getElementById("welcome");
  try{
    const r=await fetch("/cdn-cgi/access/get-identity",{credentials:"include"});
    if(!r.ok) throw new Error("identity");
    const j=await r.json();
    const email=j.email||j.user_email||"";
    if(email){
      el.textContent=email;
      const stem=email.split("@")[0].split(/[._-]/)[0];
      const first=stem?stem.charAt(0).toUpperCase()+stem.slice(1):"Member";
      welcome.textContent=`Welcome ${first}. This is your private FF Redditch dashboard.`;
    }else el.textContent="Approved member";
  }catch(e){el.textContent="Approved member";}
}
document.addEventListener("DOMContentLoaded",showIdentity);
