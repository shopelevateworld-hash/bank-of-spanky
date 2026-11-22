(() => {
  const apiBase = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const state = document.getElementById("printful-state");
  const facts = document.getElementById("printful-products");
  const catalog = document.getElementById("product-catalog");
  const catalogState = document.getElementById("catalog-status");
  if (!apiBase) {
    if (state) state.textContent = "The Printful connection is not configured.";
    if (catalogState) catalogState.textContent = "The catalogue connection is not configured.";
    return;
  }
  if (state) state.textContent = "Retrieving official shirt details from Printful…";
  if (catalogState) catalogState.textContent = "Loading the latest shirts from Printful…";

  fetch(apiBase + "/api/printful/templates", { headers: { Accept: "application/json" } })
    .then(async response => {
      const payload = await response.json();
      if (!response.ok || payload.code >= 400) throw new Error(payload.error?.message || payload.error || "Printful request failed");
      return payload;
    })
    .then(payload => {
      const templates = payload.result?.items || [];
      if (!templates.length) throw new Error("No product templates were returned.");
      const ordered = [...templates].sort((a,b) => (a.created_at || 0) - (b.created_at || 0));
      const featured = ordered[0];
      if (featured.mockup_file_url) {
        const hero = document.getElementById("latest-mockup");
        const photo = document.getElementById("product-mockup");
        if (hero) hero.src = featured.mockup_file_url;
        if (photo) photo.src = featured.mockup_file_url;
      }
      if (facts) {
        const values = [
          ["COLLECTION", "BOS SQUAD"],
          ["FIT", featured.title || "Unisex classic tee"],
          ["COLOR", (featured.colors || []).map(c => c.color_name).filter(Boolean).join(", ") || "See Printful variants"],
          ["SIZES", (featured.sizes || []).join(", ") || "See Printful variants"],
          ["AVAILABLE VARIANTS", String(featured.available_variant_ids?.length || 0)]
        ];
        facts.replaceChildren();
        values.forEach(([label,value]) => {
          const row = document.createElement("div");
          const name = document.createElement("span"); name.textContent = label;
          const detail = document.createElement("b"); detail.textContent = value;
          row.append(name,detail); facts.appendChild(row);
        });
      }
      if (state) state.textContent = "Live product data connected · Printful template #" + featured.id;

      if (catalog) {
        catalog.replaceChildren();
        ordered.forEach((item,index) => {
          const card = document.createElement("article");
          card.className = "catalog-card";
          const link = document.createElement("a");
          link.className = "catalog-image";
          link.href = "./product.html?template=" + encodeURIComponent(item.id);
          const image = document.createElement("img");
          image.src = item.mockup_file_url || "";
          image.alt = "Front view of BANK OF SPANKY shirt " + (index + 1);
          image.loading = "lazy";
          const tag = document.createElement("span");
          tag.className = "catalog-tag";
          tag.textContent = "FRONT VIEW  /  BOS " + String(index + 1).padStart(2,"0");
          link.append(image,tag);
          const meta = document.createElement("div");
          meta.className = "catalog-card-meta";
          const name = document.createElement("div");
          const title = document.createElement("h3");
          title.textContent = "BANK OF SPANKY / SHIRT " + String(index + 1).padStart(2,"0");
          const sub = document.createElement("p");
          sub.textContent = item.title || "Unisex classic tee";
          name.append(title,sub);
          const arrow = document.createElement("a");
          arrow.className = "catalog-arrow";
          arrow.href = link.href;
          arrow.setAttribute("aria-label","View shirt " + (index + 1));
          arrow.textContent = "↗";
          meta.append(name,arrow);
          const details = document.createElement("p");
          details.className = "catalog-availability";
          const colors = (item.colors || []).map(c => c.color_name).filter(Boolean).join(", ");
          details.textContent = [colors, (item.sizes || []).join(" · ")].filter(Boolean).join("  /  ");
          card.append(link,meta,details);
          catalog.appendChild(card);
        });
      }
      if (catalogState) catalogState.textContent = templates.length + " shirt designs currently available · Live from Printful";
    })
    .catch(error => {
      if (state) state.textContent = "Printful data could not be loaded: " + error.message;
      if (catalogState) catalogState.textContent = "The live catalogue could not load: " + error.message;
    });
})();