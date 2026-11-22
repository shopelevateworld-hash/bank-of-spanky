(() => {
 const api=(window.BOS_API_BASE||"").replace(/\/$/,"");
 const grid=document.getElementById("product-catalog");
 const status=document.getElementById("catalog-status");
 const hero=document.getElementById("hero-shirts");
 const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
 const items=p=>{const r=p&&p.result;return Array.isArray(r)?r:Array.isArray(r?.items)?r.items:Array.isArray(r?.products)?r.products:[]};
 const get=async path=>{const res=await fetch(api+path,{headers:{Accept:"application/json"}});const body=await res.json();if(!res.ok||body.error)throw new Error(body.error?.message||body.error||"Printful request failed");return body;};
 const variants=p=>Array.isArray(p?.sync_variants)?p.sync_variants:Array.isArray(p?.variants)?p.variants:[];
 const findPrice=(template,products)=>{
   const ids=new Set((template.available_variant_ids||[]).map(Number));
   const values=[];
   for(const product of products) for(const v of variants(product)){
     const id=Number(v.variant_id??v.product_variant_id);
     const price=Number(v.retail_price??v.price);
     if((!ids.size||ids.has(id))&&Number.isFinite(price)&&price>0) values.push(price);
   }
   if(values.length)return Math.min(...values);
   const own=(template.variants||[]).map(v=>Number(v.retail_price??v.price)).filter(v=>Number.isFinite(v)&&v>0);
   return own.length?Math.min(...own):null;
 };
 const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 if(!api){status.textContent="Store connection is not configured.";return;}
 Promise.all([get("/api/printful/templates"),get("/api/printful/products")]).then(([tp,pp])=>{
   const templates=items(tp).sort((a,b)=>(a.created_at||0)-(b.created_at||0));
   const products=items(pp);
   if(!templates.length)throw new Error("No shirt templates found in Printful.");
   grid.replaceChildren();hero.replaceChildren();
   templates.slice(-3).reverse().forEach((t,i)=>{
     if(!t.mockup_file_url)return;
     const im=create("img");im.src=t.mockup_file_url;im.alt="Front view of BANK OF SPANKY shirt";im.loading="eager";hero.append(im);
   });
   templates.forEach((t,i)=>{
     const price=findPrice(t,products);
     const url="./product.html?template="+encodeURIComponent(t.id);
     const card=create("article","product-card");
     const visual=create("a","product-visual");visual.href=url;
     const img=create("img");img.src=t.mockup_file_url||"";img.alt="Front view of BANK OF SPANKY shirt "+(i+1);img.loading="lazy";
     const index=create("span","product-index","FRONT VIEW / 0"+(i+1));visual.append(img,index);
     const info=create("div","product-info");
     info.append(create("h3","", "BANK OF SPANKY"));
     info.append(create("p","product-subtitle","SQUAD SHIRT · EDITION 0"+(i+1)));
     const priceEl=create("p","product-price");
     if(price===null){priceEl.classList.add("price-error");priceEl.textContent="PRICE NOT RETURNED BY PRINTFUL";}
     else{priceEl.append(create("small","","RETAIL PRICE"),document.createTextNode(money(price)));}
     const order=create("a","order-button");order.href=url;order.append(create("span","","ORDER NOW"),create("b","","↗"));
     const sizes=Array.isArray(t.sizes)?t.sizes.join(" · "):"";
     info.append(priceEl,order,create("p","product-meta",sizes||"Select your size on the product page"));
     card.append(visual,info);grid.append(card);
   });
   const priced=templates.filter(t=>findPrice(t,products)!==null).length;
   status.textContent=templates.length+" SHIRTS LOADED · "+priced+" WITH PRINTFUL USD PRICING";
 }).catch(err=>{status.textContent="THE COLLECTION COULD NOT LOAD: "+err.message;});
})();