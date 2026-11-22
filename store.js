(() => {
  const apiBase = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const grid = document.getElementById("printful-products");
  const state = document.getElementById("printful-state");
  if (!grid || !state) return;
  if (!apiBase) {
    state.textContent = "Store connection is not configured.";
    return;
  }
  state.textContent = "Retrieving the official BOS shirt template from Printful…";
  fetch(apiBase + "/api/printful/template", { headers: { Accept: "application/json" } })
    .then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Printful request failed (" + response.status + ")");
      return payload;
    })
    .then(payload => {
      const product = payload.result || {};
      const colors = (product.colors || []).map(c => c.color_name).filter(Boolean);
      const sizes = product.sizes || [];
      const variants = product.available_variant_ids || [];
      const mockup = product.mockup_file?.imageURL || product.mockup_file?.thumbnailURL || product.mockup_file_url;
      if (mockup) {
        document.querySelectorAll(".shirt-image-wrap img, .featured-image img").forEach(img => {
          img.src = mockup;
          img.alt = product.title || "Official Bank of Spanky shirt";
        });
      }
      state.textContent = product.title || "Official Bank of Spanky shirt";
      const rows = [
        ["PRINTFUL TEMPLATE", String(product.id || "497623456")],
        ["PRODUCT ID", String(product.product_id || "Not supplied")],
        ["COLORS", colors.length ? colors.join(", ") : "See available variants"],
        ["SIZES", sizes.length ? sizes.join(", ") : "See available variants"],
        ["AVAILABLE VARIANTS", String(variants.length)],
        ["COLLECTION", "BOS SQUAD SHIRT COLLECTION"]
      ];
      grid.replaceChildren();
      rows.forEach(([label, value]) => {
        const row = document.createElement("div");
        const name = document.createElement("span");
        name.textContent = label;
        const detail = document.createElement("b");
        detail.textContent = value;
        row.append(name, detail);
        grid.appendChild(row);
      });
      const note = document.createElement("p");
      note.className = "fine-print";
      note.textContent = "Product details are synced live from Printful. Retail pricing and customer checkout still need to be configured.";
      grid.appendChild(note);
    })
    .catch(error => {
      state.textContent = "Could not retrieve the real shirt data: " + error.message + ". Add PRINTFUL_API_KEY in Cloudflare Worker secrets, then redeploy.";
    });
})();