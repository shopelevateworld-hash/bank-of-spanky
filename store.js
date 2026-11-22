(() => {
 const api=(window.BOS_API_BASE||"").replace(/\/$/,"");
 const grid=document.getElementById("product-catalog"),status=document.getElementById("catalog-status"),hero=document.getElementById("hero-shirts");
 const known={497644939:{name:"Not Your Money. Cash Game #04",image:"https://files.cdn.printful.com/files/2ac/2ac548df7763315a1fa6e6609f60827b_thumb.png",price:29.99,sizes:["S","L","2XL","4XL"]}};
 const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
 const items=p=>{const r=p?.result;return Array.isArray(r)?r:Array.isArray(r?.items)?r.items:Array.isArray(r?.products)?r.products:[];};
 const get=async path=>{const r=await fetch(api+path,{headers:{Accept:"application/json"}}),b=await r.json();if(!r.ok||b.error||b.code>=400)throw new Error(b.error?.message||b.error||"Printful request failed");return b;};
 const create=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
 if(!api){status.textContent="Store connection is not configured.";return;}
 get("/api/printful/templates").then(async tp=>{
   const templates=items(tp);
   if(!templates.length)throw new Error("Printful returned no published product templates.");
   let products=[];try{products=items(await get("/api/printful/products"));}catch(e){}
   const list=templates.map(t=>{
     const k=known[Number(t.id)]||{};
     const ids=new Set((t.available_variant_ids||[]).map(Number));
     const synced=products.find(p=>(p.sync_variants||p.variants||[]).some(v=>ids.has(Number(v.variant_id))));
     const sv=synced?.sync_variants||synced?.variants||[];
     const prices=sv.map(v=>Number(v.retail_price??v.price)).filter(n=>n>0&&Number.isFinite(n));
     const own=(t.variants||[]).map(v=>Number(v.retail_price??v.price)).filter(n=>n>0&&Number.isFinite(n));
     const price=k.price??(prices.length?Math.min(...prices):own.length?Math.min(...own):null);
     return {id:Number(t.id),name:k.name||t.title||"BANK OF SPANKY SHIRT",image:k.image||t.mockup_file_url||t.image||"",price,sizes:k.sizes||t.sizes||[],};
   });
   const knownIds=new Set(list.map(x=>x.id));
   Object.entries(known).forEach(([id,p])=>{if(!knownIds.has(Number(id)))list.push({id:Number(id),...p});});
   list.sort((a,b)=>a.id-b.id);
   grid.replaceChildren();hero.replaceChildren();
   list.slice(-3).reverse().forEach(p=>{if(p.image){const im=create("img");im.src=p.image;im.alt=p.name+" front view";im.loading="eager";hero.append(im);}});
   list.forEach((p,i)=>{
     const url="./product.html?template="+encodeURIComponent(p.id),card=create("article","product-card"),visual=create("a","product-visual");visual.href=url;
     const img=create("img");img.src=p.image;img.alt=p.name+" front view";img.loading="lazy";visual.append(img,create("span","product-index","FRONT VIEW / 0"+(i+1)));
     const info=create("div","product-info");info.append(create("h3","",p.name.toUpperCase()),create("p","product-subtitle","BOS SQUAD SHIRT · EDITION 0"+(i+1)));
     const price=create("p","product-price");if(p.price===null){price.classList.add("price-error");price.textContent="PRICE NOT RETURNED BY PRINTFUL";}else price.append(create("small","","RETAIL PRICE"),document.createTextNode(money(p.price)));
     const order=create("a","order-button");order.href=url;order.append(create("span","","ORDER NOW"),create("b","","↗"));
     info.append(price,order,create("p","product-meta",p.sizes.join(" · ")||"Choose your size on the product page"));card.append(visual,info);grid.append(card);
   });
   status.textContent=list.length+" PUBLISHED SHIRTS LOADED · PRINTFUL TEMPLATE FEED";
 }).catch(e=>{status.textContent="THE COLLECTION COULD NOT LOAD: "+e.message;});
})();