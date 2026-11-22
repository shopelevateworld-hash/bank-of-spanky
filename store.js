(() => {
  const apiBase = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const state = document.getElementById("printful-state");
  const facts = document.getElementById("printful-products");
  if (!state || !facts) return;
  if (!apiBase) { state.textContent = "The Printful connection is not configured."; return; }
  state.textContent = "Retrieving official shirt details from Printful…";
  fetch(apiBase + "/api/printful/templates", { headers: { Accept: "application/json" } })
    .then(async response => {
      const payload = await response.json();
      if (!response.ok || payload.code >= 400) throw new Error(payload.error?.message || payload.error || "Printful request failed");
      return payload;
    })
    .then(payload => {
      const templates = payload.result?.items || [];
      if (!templates.length) throw new Error("No product templates were returned.");
      const product = [...templates].sort((a,b) => (b.sizes?.length || 0) - (a.sizes?.length || 0))[0];
      const mockup = product.mockup_file_url;
      if (mockup) {
        document.getElementById("latest-mockup").src = mockup;
        document.getElementById("product-mockup").src = mockup;
      }
      const sizes = product.sizes || [];
      const colors = (product.colors || []).map(c => c.color_name).filter(Boolean);
      const values = [
        ["COLLECTION", "BOS SQUAD"],
        ["FIT", product.title || "Unisex classic tee"],
        ["COLOR", colors.join(", ") || "See Printful variants"],
        ["SIZES", sizes.join(", ") || "See Printful variants"],
        ["AVAILABLE VARIANTS", String(product.available_variant_ids?.length || 0)]
      ];
      facts.replaceChildren();
      values.forEach(([label,value]) => {
        const row = document.createElement("div");
        const name = document.createElement("span"); name.textContent = label;
        const detail = document.createElement("b"); detail.textContent = value;
        row.append(name,detail); facts.appendChild(row);
      });
      state.textContent = "Live product data connected · Printful template #" + product.id;
      document.getElementById("product-title").innerHTML = "Not Your Money.<br><em>Cash Game #01.</em>";
    })
    .catch(error => { state.textContent = "Printful data could not be loaded: " + error.message; });
})();