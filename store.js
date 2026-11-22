(() => {
  const apiBase = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const catalog = document.getElementById("product-catalog");
  const status = document.getElementById("catalog-status");
  const heroImage = document.getElementById("campaign-shirt");
  if (!apiBase) { status.textContent = "The Printful connection is not configured."; return; }

  const readPayload = async (path) => {
    const response = await fetch(apiBase + path, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok || payload.code >= 400 || payload.error) {
      throw new Error(payload.error?.message || payload.error || "Printful request failed");
    }
    return payload;
  };
  const listFrom = (payload) => {
    const result = payload?.result;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.products)) return result.products;
    return [];
  };
  const syncVariantsFrom = (entry) => {
    if (Array.isArray(entry?.sync_variants)) return entry.sync_variants;
    if (Array.isArray(entry?.variants)) return entry.variants;
    return [];
  };
  const priceForTemplate = (template, syncedProducts) => {
    const ids = new Set((template.available_variant_ids || []).map(Number));
    const prices = [];
    (template.variants || []).forEach(v => {
      const raw = v.retail_price ?? v.price;
      if (raw != null && Number.isFinite(Number(raw))) prices.push(Number(raw));
    });
    syncedProducts.forEach(entry => {
      syncVariantsFrom(entry).forEach(v => {
        const catalogVariantId = Number(v.variant_id ?? v.product_variant_id);
        const raw = v.retail_price ?? v.price;
        if ((!ids.size || ids.has(catalogVariantId)) && raw != null && Number.isFinite(Number(raw))) prices.push(Number(raw));
      });
    });
    if (!prices.length) return null;
    return Math.min(...prices);
  };
  const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  Promise.all([readPayload("/api/printful/templates"), readPayload("/api/printful/products")])
    .then(([templatePayload, productPayload]) => {
      const templates = listFrom(templatePayload).sort((a,b) => (a.created_at || 0) - (b.created_at || 0));
      const syncedProducts = listFrom(productPayload);
      if (!templates.length) throw new Error("No product templates were returned by Printful.");
      const featured = templates[templates.length - 1];
      if (featured.mockup_file_url) heroImage.src = featured.mockup_file_url;
      catalog.replaceChildren();

      templates.forEach((item, index) => {
        const price = priceForTemplate(item, syncedProducts);
        const card = document.createElement("article");
        card.className = "catalog-card";

        const imageLink = document.createElement("a");
        imageLink.className = "catalog-image";
        imageLink.href = "./product.html?template=" + encodeURIComponent(item.id);
        const image = document.createElement("img");
        image.src = item.mockup_file_url || "";
        image.alt = "Front product view of BANK OF SPANKY shirt " + String(index + 1).padStart(2,"0");
        image.loading = "lazy";
        const tag = document.createElement("span");
        tag.className = "catalog-tag";
        tag.textContent = "FRONT VIEW / BOS " + String(index + 1).padStart(2,"0");
        imageLink.append(image, tag);

        const details = document.createElement("div");
        details.className = "catalog-details";
        const titleRow = document.createElement("div");
        titleRow.className = "catalog-title-row";
        const name = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = "BANK OF SPANKY";
        const subtitle = document.createElement("p");
        subtitle.textContent = "SQUAD SHIRT / " + String(index + 1).padStart(2,"0");
        name.append(title, subtitle);
        titleRow.append(name);

        const priceNode = document.createElement("p");
        priceNode.className = "price";
        if (price == null) {
          priceNode.classList.add("price-missing");
          priceNode.textContent = "PRICE UNAVAILABLE";
        } else {
          const label = document.createElement("small");
          label.textContent = "FROM";
          priceNode.append(label, document.createTextNode(money(price)));
        }

        const order = document.createElement("a");
        order.className = "order-button";
        order.href = imageLink.href;
        order.innerHTML = "<span>ORDER NOW</span><span>↗</span>";

        const meta = document.createElement("p");
        meta.className = "catalog-meta";
        const sizes = (item.sizes || []).join(" · ");
        const colors = (item.colors || []).map(c => c.color_name).filter(Boolean).join(", ");
        meta.textContent = [colors, sizes].filter(Boolean).join(" / ") || "View available options";

        details.append(titleRow, priceNode, order, meta);
        card.append(imageLink, details);
        catalog.appendChild(card);
      });

      const priced = templates.filter(t => priceForTemplate(t, syncedProducts) != null).length;
      status.textContent = templates.length + " shirts loaded from Printful · " + priced + " with live USD pricing";
      if (!priced) status.textContent += " · Check that the shirts are synced store products with retail prices set in Printful.";
    })
    .catch(error => {
      status.textContent = "The live collection could not load: " + error.message;
    });
})();