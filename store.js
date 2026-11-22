(() => {
 const api=(window.BOS_API_BASE||"").replace(/\/$/,"");
 const grid=document.getElementById("product-catalog"),status=document.getElementById("catalog-status"),hero=document.getElementById("hero-shirts");
 const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
 const items=p=>{const r=p&&p.result;return Array.isArray(r)?r:Array.isArray(r?.items)?r.items:Array.isArray(r?.products)?r.products:[];};
 const get=async path=>{const res=await fetch(api+path,{headers:{Accept:"application/json"}});const body=await res.json();if(!res.ok||body.error||body.code>=400)throw new Error(body.error?.message||body.error||"Printful request failed");return body;};
 const variants=p=>Array.isArray(p?.sync_variants)?p.sync_variants:Array.isArray(p?.variants)?p.variants:[];
 const productOf=item=>item.sync_product||item.product||item;
 const nameOf=item=>productOf(item).name||item.name||"BANK OF SPANKY SHIRT";
 const idOf=item=>Number(productOf(item).id||item.id);
 const imageOf=item=>{
   const p=productOf(item),vs=variants(item);
   const f=(vs.flatMap(v=>v.files||[]).find(x=>x.preview_url||x.thumbnail_url||x.url))||{};
   return p.thumbnail_url||p.image||item.thumbnail_url||item.image||f.preview_url||f.thumbnail_url||f.url||
    (idOf(item)===497644939?"https://files.cdn.printful.com/files/2ac/2ac548df7763315a1fa6e6609f60827b_thumb.png":"");
 };
 const priceOf=item=>{
   const prices=variants(item).map(v=>Number(v.retail_price??v.price)).filter(n=>Number.isFinite(n)&&n>0);
   const own=Number(productOf(item).retail_price??item.retail_price);
   if(prices.length)return Math.min(...prices);
   return Number.isFinite(own)&&own>0?own:null;
 };
 const sizesOf=item=>[...new Set(variants(item).flatMap(v=>(v.size?[v.size]:((v.options||[]).filter(o=>/size/i.test(o.id||o.name||"")).map(o=>o.value||o.name)))) )];
 const create=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;};
 if(!api){status.textContent="Store connection is not configured.";return;}
 get("/api/printful/products").then(payload=>{
   const products=items(payload).filter(p=>idOf(p));
   if(!products.length)throw new Error("Printful returned no published store products. Check that all four shirts are synced to store #19111295.");
   grid.replaceChildren();hero.replaceChildren();
   products.slice(0,3).forEach(p=>{const src=imageOf(p);if(src){const im=create("img");im.src=src;im.alt=nameOf(p)+" front view";im.loading="eager";hero.append(im);}});
   products.forEach((p,i)=>{
     const id=idOf(p),name=nameOf(p),src=imageOf(p),price=priceOf(p),url="./product.html?product="+encodeURIComponent(id);
     const card=create("article","product-card"),visual=create("a","product-visual");visual.href=url;
     const img=create("img");img.src=src;img.alt=name+" front view";img.loading="lazy";visual.append(img,create("span","product-index","FRONT VIEW / 0"+(i+1)));
     const info=create("div","product-info");info.append(create("h3","",name.toUpperCase()),create("p","product-subtitle","BOS SQUAD SHIRT · EDITION 0"+(i+1)));
     const priceEl=create("p","product-price");
     if(price===null){priceEl.classList.add("price-error");priceEl.textContent="PRICE NOT RETURNED BY PRINTFUL";}
     else priceEl.append(create("small","","RETAIL PRICE"),document.createTextNode(money(price)));
     const order=create("a","order-button");order.href=url;order.append(create("span","","ORDER NOW"),create("b","","↗"));
     info.append(priceEl,order,create("p","product-meta",sizesOf(p).join(" · ")||"Choose your size on the product page"));
     card.append(visual,info);grid.append(card);
   });
   const priced=products.filter(p=>priceOf(p)!==null).length;
   status.textContent=products.length+" PUBLISHED SHIRTS LOADED · "+priced+" WITH LIVE USD PRICING";
 }).catch(err=>{status.textContent="THE COLLECTION COULD NOT LOAD: "+err.message;});
})();