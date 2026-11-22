(() => {
  const apiBase = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const image = document.getElementById("product-image");
  const sizeWrap = document.getElementById("sizes");
  const addButton = document.getElementById("add-to-cart");
  const feedback = document.getElementById("cart-feedback");
  const countNode = document.getElementById("cart-count");
  let product = { id: 110786051, title: "Unisex classic tee", sizes: ["S","M","L","XL","2XL","3XL","4XL","5XL"], colors: [{color_name:"Black"}], mockup_file_url: image.src };
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
      button.dataset.size = size;
      button.addEventListener("click", () => {
        selectedSize = size;
        sizeWrap.querySelectorAll("button").forEach(node => node.classList.toggle("selected", node === button));
        document.getElementById("size-hint").textContent = "Selected: " + size;
        feedback.textContent = "Size " + size + " selected. Ready to add to your bag.";
      });
      sizeWrap.appendChild(button);
    });
  }

  renderSizes(product.sizes);
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
        product = templates.find(item => item.id === 110786051) || [...templates].sort((a,b) => (b.sizes?.length || 0) - (a.sizes?.length || 0))[0];
        if (product.mockup_file_url) image.src = product.mockup_file_url;
        document.getElementById("product-style").textContent = (product.title || "Unisex classic tee").toUpperCase();
        document.getElementById("product-color").textContent = (product.colors || []).map(item => item.color_name).join(", ").toUpperCase() || "BLACK";
        renderSizes(product.sizes || []);
        feedback.textContent = "Live Printful data connected · template #" + product.id + ". Choose a size.";
      })
      .catch(error => {
        feedback.textContent = "Showing the saved product preview. Live size refresh unavailable: " + error.message;
      });
  } else {
    feedback.textContent = "Choose a size to add this shirt to your bag.";
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
      productName: "Not Your Money. Cash Game #01.",
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