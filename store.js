(() => {
  const apiBase = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const grid = document.getElementById("printful-products");
  const state = document.getElementById("printful-state");
  if (!grid || !state) return;

  if (!apiBase) {
    state.textContent = "Printful connection is ready for setup. Add your Cloudflare Worker URL to store-config.js to load live products.";
    return;
  }

  state.textContent = "Connecting securely to Printful…";
  fetch(apiBase + "/api/printful/products", { headers: { "Accept": "application/json" } })
    .then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Printful request failed (" + response.status + ")");
      return payload;
    })
    .then(payload => {
      const products = Array.isArray(payload.result) ? payload.result : [];
      if (!products.length) {
        state.textContent = "The Printful store is connected, but no synced products were found yet.";
        return;
      }

      state.textContent = products.length + " product" + (products.length === 1 ? "" : "s") + " synced from Printful.";
      grid.replaceChildren();
      products.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card printful-card";

        const visual = document.createElement("div");
        visual.className = "product-visual printful-visual";
        if (product.thumbnail_url) {
          const img = document.createElement("img");
          img.src = product.thumbnail_url;
          img.alt = product.name || "Printful product";
          img.loading = "lazy";
          visual.appendChild(img);
        } else {
          const fallback = document.createElement("span");
          fallback.className = "printful-fallback";
          fallback.textContent = "BANK OF SPANKY";
          visual.appendChild(fallback);
        }

        const info = document.createElement("div");
        info.className = "product-info";
        const details = document.createElement("div");
        const category = document.createElement("span");
        category.className = "category";
        category.textContent = "LIVE FROM PRINTFUL";
        const title = document.createElement("h3");
        title.textContent = product.name || "BANK OF SPANKY PRODUCT";
        const description = document.createElement("p");
        const count = Number(product.variants || 0);
        description.textContent = count + " synced variant" + (count === 1 ? "" : "s") + " · Printful catalog";
        details.append(category, title, description);
        const status = document.createElement("span");
        status.className = "status";
        status.textContent = "SYNCED";
        info.append(details, status);
        card.append(visual, info);
        grid.appendChild(card);
      });
    })
    .catch(error => {
      state.textContent = "Could not load Printful products: " + error.message + ". Check the Worker URL and PRINTFUL_API_KEY secret.";
    });
})();
