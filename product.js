(() => {
 const api=(window.BOS_API_BASE||"").replace(/\/$/,"");
 const params=new URLSearchParams(location.search);
 const requestedId=Number(params.get("product")||params.get("template"))||497644939;
 const image=document.getElementById("product-image"),sizeWrap=document.getElementById("sizes"),addButton=document.getElementById("add-to-cart"),feedback=document.getElementById("cart-feedback"),countNode=document.getElementById("cart-count");
 let product={id:requestedId,name:"BANK OF SPANKY SHIRT",sync_variants:[]},selectedSize="";
 const readCart=()=>{try{return JSON.parse(localStorage.getItem("bos-cart")||"[]");}catch{return[];}};
 const updateCount=()=>{countNode.textContent=String(readCart().reduce((s,x)=>s+(x.quantity||1),0));};
 const getProduct=p=>p.result?.sync_product||p.result?.product||p.result||p;
 const getVariants=p=>p.result?.sync_variants||p.result?.variants||p.sync_variants||p.variants||[];
 const sizesOf=vs=>[...new Set(vs.flatMap(v=>{if(v.size)return[v.size];return(v.options||[]).filter(o=>/size/i.test(o.id||o.name||"")).map(o=>o.value||o.name);} ))];
 const imageOf=(p,vs)=>{const f=vs.flatMap(v=>v.files||[]).find(x=>x.preview_url||x.thumbnail_url||x.url)||{};return p.thumbnail_url||p.image||f.preview_url||f.thumbnail_url||f.url||(p.id===497644939?"https://files.cdn.printful.com/files/2ac/2ac548df7763315a1fa6e6609f60827b_thumb.png":"");};
 function renderSizes(sizes){sizeWrap.replaceChildren();sizes.forEach(size=>{const b=document.createElement("button");b.type="button";b.textContent=size;b.addEventListener("click",()=>{selectedSize=size;sizeWrap.querySelectorAll("button").forEach(n=>n.classList.toggle("selected",n===b));document.getElementById("size-hint").textContent="Selected: "+size;feedback.textContent="Size "+size+" selected. Ready to add to your bag.";});sizeWrap.append(b);});}
 updateCount();
 if(api){
  fetch(api+"/api/printful/products/"+requestedId,{headers:{Accept:"application/json"}}).then(async r=>{const p=await r.json();if(!r.ok||p.error||p.code>=400)throw new Error(p.error?.message||p.error||"Printful product lookup failed");return p;}).then(payload=>{
   const p=getProduct(payload),vs=getVariants(payload);product={...p,id:Number(p.id)||requestedId,sync_variants:vs};
   const src=imageOf(product,vs);if(src)image.src=src;
   const title=product.name||"BANK OF SPANKY SHIRT";
   document.getElementById("product-style").textContent=title.toUpperCase();
   document.getElementById("product-color").textContent="BLACK";
   const heading=document.querySelector(".details h1");if(heading)heading.innerHTML="BANK OF SPANKY.<br><em>"+title.replace(/[&<>"]/g,"")+".</em>";
   renderSizes(sizesOf(vs));
   feedback.textContent="Live published Printful product connected · #"+product.id+". Choose a size.";
  }).catch(error=>{renderSizes(["S","M","L","XL","2XL","3XL","4XL","5XL"]);feedback.textContent="Live product details unavailable: "+error.message;});
 }else{renderSizes(["S","M","L","XL","2XL","3XL","4XL","5XL"]);feedback.textContent="Choose a size to add to your bag.";}
 addButton.addEventListener("click",()=>{
  if(!selectedSize){feedback.textContent="Please choose your shirt size first.";sizeWrap.scrollIntoView({behavior:"smooth",block:"center"});return;}
  const cart=readCart(),existing=cart.find(x=>x.productId===product.id&&x.size===selectedSize);
  if(existing)existing.quantity=(existing.quantity||1)+1;
  else cart.push({productName:product.name||"BANK OF SPANKY SHIRT",productId:product.id,size:selectedSize,color:"Black",quantity:1,image:image.src});
  localStorage.setItem("bos-cart",JSON.stringify(cart));updateCount();feedback.textContent="Added to your bag · "+selectedSize+". Payment checkout is not active yet.";
  addButton.querySelector("span").textContent="ADDED TO BAG";window.setTimeout(()=>{addButton.querySelector("span").textContent="ADD TO CART";},1700);
 });
})();