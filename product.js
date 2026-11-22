(() => {
 const api=(window.BOS_API_BASE||"").replace(/\/$/,"");
 const requestedId=Number(new URLSearchParams(location.search).get("template"))||497644939;
 const known={497644939:{name:"Not Your Money. Cash Game #04",image:"https://files.cdn.printful.com/files/2ac/2ac548df7763315a1fa6e6609f60827b_thumb.png",sizes:["S","L","2XL","4XL"]}};
 const image=document.getElementById("product-image"),sizeWrap=document.getElementById("sizes"),addButton=document.getElementById("add-to-cart"),feedback=document.getElementById("cart-feedback"),countNode=document.getElementById("cart-count");
 let product={id:requestedId,title:known[requestedId]?.name||"BANK OF SPANKY SHIRT",sizes:known[requestedId]?.sizes||[],colors:[{color_name:"Black"}],mockup_file_url:known[requestedId]?.image||image.src},selectedSize="";
 const readCart=()=>{try{return JSON.parse(localStorage.getItem("bos-cart")||"[]");}catch{return[];}};
 const updateCount=()=>{countNode.textContent=String(readCart().reduce((s,x)=>s+(x.quantity||1),0));};
 const renderSizes=sizes=>{sizeWrap.replaceChildren();sizes.forEach(size=>{const b=document.createElement("button");b.type="button";b.textContent=size;b.addEventListener("click",()=>{selectedSize=size;sizeWrap.querySelectorAll("button").forEach(n=>n.classList.toggle("selected",n===b));document.getElementById("size-hint").textContent="Selected: "+size;feedback.textContent="Size "+size+" selected. Ready to add to your bag.";});sizeWrap.append(b);});};
 updateCount();
 if(api)fetch(api+"/api/printful/templates",{headers:{Accept:"application/json"}}).then(async r=>{const p=await r.json();if(!r.ok||p.error||p.code>=400)throw new Error(p.error?.message||p.error||"Printful request failed");return p;}).then(payload=>{
   const rows=Array.isArray(payload.result)?payload.result:(payload.result?.items||payload.result?.products||[]);
   const t=rows.find(x=>Number(x.id)===requestedId);
   if(t){product={...product,...t};product.title=known[requestedId]?.name||t.title||product.title;product.mockup_file_url=known[requestedId]?.image||t.mockup_file_url||product.mockup_file_url;}
   if(product.mockup_file_url)image.src=product.mockup_file_url;
   document.getElementById("product-style").textContent=product.title.toUpperCase();
   document.getElementById("product-color").textContent=(product.colors||[]).map(x=>x.color_name).join(", ").toUpperCase()||"BLACK";
   const h=document.querySelector(".details h1");if(h)h.innerHTML="BANK OF SPANKY.<br><em>"+product.title.replace(/[&<>"]/g,"")+".</em>";
   renderSizes(product.sizes?.length?product.sizes:["S","M","L","XL","2XL","3XL","4XL","5XL"]);
   feedback.textContent="Published Printful template #"+requestedId+" · Choose your size.";
 }).catch(e=>{renderSizes(product.sizes.length?product.sizes:["S","M","L","XL","2XL","3XL","4XL","5XL"]);feedback.textContent="Showing saved Printful product details. "+e.message;});
 else renderSizes(product.sizes.length?product.sizes:["S","M","L","XL","2XL","3XL","4XL","5XL"]);
 addButton.addEventListener("click",()=>{if(!selectedSize){feedback.textContent="Please choose your shirt size first.";sizeWrap.scrollIntoView({behavior:"smooth",block:"center"});return;}const cart=readCart(),existing=cart.find(x=>x.templateId===product.id&&x.size===selectedSize);if(existing)existing.quantity=(existing.quantity||1)+1;else cart.push({productName:product.title,templateId:product.id,size:selectedSize,color:"Black",quantity:1,image:product.mockup_file_url||image.src});localStorage.setItem("bos-cart",JSON.stringify(cart));updateCount();feedback.textContent="Added to your bag · "+selectedSize+". Payment checkout is not active yet.";addButton.querySelector("span").textContent="ADDED TO BAG";window.setTimeout(()=>{addButton.querySelector("span").textContent="ADD TO CART";},1700);});
})();