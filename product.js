(() => {
  const apiBase = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const requestedId = Number(new URLSearchParams(window.location.search).get("template")) || 110786051;
  const image = document.getElementById("product-image");
  const sizeWrap = document.getElementById("sizes");
  const addButton = document.getElementById("add-to-cart");
  const feedback = document.getElementById("cart-feedback");
  const countNode = document.getElementById("cart-count");
  let product = { id: requestedId, title: "Unisex classic tee", sizes: [], colors: [{color_name:"Black"}], mockup_file_url: image.src };
  let selectedSize = "";

  function readCart() {
    try { return JSON.parse(localStorage.getItem("bos-cart") || "[]"); }
    catch { return []; }
  }
  function updateCount() {
    countNode.textContent = String(readCart().reduce((sum,item) => sum + (item.quantity || 1), 0));
  }
  function renderSizes(sizes) {
    sizeWrap.replaceChildren();
    sizes.forEach(size => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = size;
      button.addEventListener("click", () => {
        selectedSize = size;
        sizeWrap.querySelectorAll("button").forEach(node => node.classList.toggle("selected", node === button));
        document.getElementById("size-hint").textContent = "Selected: " + size;
        feedback.textContent = "Size " + size + " selected. Ready to add to your bag.";
      });
      sizeWrap.appendChild(button);
    });
  }
  updateCount();

  if (apiBase) {
    fetch(apiBase + "/api/printful/templates", { headers: { Accept: "application/json" } })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok || payload.code >= 400) throw new Error(payload.error?.message || "Printful request failed");
        return payload;
      })
      .then(payload => {
        const templates = payload.result?.items || [];
        if (!templates.length) throw new Error("No Printful templates found");
        const index = templates.findIndex(item => Number(item.id) === requestedId);
        product = index >= 0 ? templates[index] : templates[0];
        if (product.mockup_file_url) image.src = product.mockup_file_url;
        document.getElementById("product-style").textContent = (product.title || "Unisex classic tee").toUpperCase();
        document.getElementById("product-color").textContent = (product.colors || []).map(item => item.color_name).join(", ").toUpperCase() || "BLACK";
        const heading = document.querySelector(".details h1");
        if (heading) heading.innerHTML = "BANK OF SPANKY.<br><em>Shirt " + String(templates.indexOf(product) + 1).padStart(2,"0") + ".</em>";
        renderSizes(product.sizes || []);
        feedback.textContent = "Live Printful data connected · template #" + product.id + ". Choose a size.";
      })
      .catch(error => {
        renderSizes(["S","M","L","XL","2XL","3XL","4XL","5XL"]);
        feedback.textContent = "Showing the product preview. Live size refresh unavailable: " + error.message;
      });
  } else {
    renderSizes(["S","M","L","XL","2XL","3XL","4XL","5XL"]);
    feedback.textContent = "Choose a size to add to your bag.";
  }

  addButton.addEventListener("click", () => {
    if (!selectedSize) {
      feedback.textContent = "Please choose your shirt size first.";
      sizeWrap.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const cart = readCart();
    const existing = cart.find(item => item.templateId === product.id && item.size === selectedSize);
    if (existing) existing.quantity = (existing.quantity || 1) + 1;
    else cart.push({
      productName: "BANK OF SPANKY / " + (product.title || "SHIRT"),
      templateId: product.id,
      size: selectedSize,
      color: (product.colors || []).map(item => item.color_name).join(", ") || "Black",
      quantity: 1,
      image: product.mockup_file_url || image.src
    });
    localStorage.setItem("bos-cart", JSON.stringify(cart));
    updateCount();
    feedback.textContent = "Added to your bag · " + selectedSize + ". Payment checkout is not active yet.";
    addButton.querySelector("span").textContent = "ADDED TO BAG";
    window.setTimeout(() => { addButton.querySelector("span").textContent = "ADD TO CART"; }, 1700);
  });
})();