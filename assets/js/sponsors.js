(function(){
  const section=document.getElementById("sponsorSection");
  const list=document.getElementById("sponsorCards");
  if(!section||!list)return;
  const safeUrl=value=>{
    try{const url=new URL(value,location.href);return url.protocol==="https:"?url.href:null}catch{return null}
  };
  const isInWindow=sponsor=>{
    const now=Date.now();
    const start=sponsor.starts_at?Date.parse(sponsor.starts_at):0;
    const end=sponsor.ends_at?Date.parse(sponsor.ends_at):Infinity;
    return (!sponsor.starts_at||Number.isFinite(start)&&start<=now)&&(!sponsor.ends_at||Number.isFinite(end)&&end>=now);
  };
  function render(sponsors){
    const active=sponsors.filter(s=>s&&s.active===true&&typeof s.name==="string"&&s.name.trim()&&typeof s.description==="string"&&s.description.trim()&&safeUrl(s.destination_url)&&isInWindow(s)).slice(0,4);
    if(!active.length)return;
    active.forEach(sponsor=>{
      const card=document.createElement("article");card.className="sponsor-card";
      const label=document.createElement("span");label.className="sponsor-label";label.textContent="PATROCINADO";card.append(label);
      if(sponsor.image_url&&safeUrl(sponsor.image_url)){
        const image=document.createElement("img");image.className="sponsor-image";image.src=safeUrl(sponsor.image_url);image.alt=typeof sponsor.image_alt==="string"?sponsor.image_alt:sponsor.name;image.loading="lazy";image.decoding="async";card.append(image);
      }
      const title=document.createElement("h3");title.textContent=sponsor.name;card.append(title);
      const description=document.createElement("p");description.textContent=sponsor.description;card.append(description);
      const link=document.createElement("a");link.className="sponsor-link";link.href=safeUrl(sponsor.destination_url);link.target="_blank";link.rel="sponsored noopener noreferrer";link.textContent="Conheça o parceiro →";card.append(link);
      list.append(card);
    });
    section.hidden=list.childElementCount===0;
  }
  fetch("data/sponsors.json",{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("sponsor_config_unavailable");return response.json()}).then(data=>render(Array.isArray(data.sponsors)?data.sponsors:[])).catch(()=>{});
})();
