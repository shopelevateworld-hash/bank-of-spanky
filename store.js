(() => {
  const api = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const grid = document.getElementById("product-catalog");
  const status = document.getElementById("catalog-status");
  const hero = document.getElementById("hero-shirts");
  const money = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  const rows = payload => Array.isArray(payload?.result) ? payload.result : Array.isArray(payload?.result?.items) ? payload.result.items : [];
  const get = async path => {
    const response = await fetch(api + path, { headers: { Accept: "application/json" } });
    const body = await response.json();
    if (!response.ok || body.error || body.code >= 400) throw new Error(body.error?.message || body.error || "Printful request failed");
    return body;
  };
  const el = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  if (!api) { status.textContent = "Store connection is not configured."; return; }

  get("/api/printful/products").then(async payload => {
    const products = rows(payload).filter(p => !p.is_ignored);
    if (!products.length) throw new Error("No synced Printful products were returned.");
    const catalog = await Promise.all(products.map(async summary => {
      const detail = await get("/api/printful/products/" + encodeURIComponent(summary.id));
      const result = detail.result || {};
      const variants = (result.sync_variants || []).filter(v => v.synced !== false && v.availability_status !== "discontinued");
      const sizes = [...new Set(variants.map(v => v.size || v.name?.split("/").pop()?.trim()).filter(Boolean))];
      const prices = variants.map(v => Number(v.retail_price)).filter(n => Number.isFinite(n) && n > 0);
      return {
        id: Number(summary.id),
        name: result.sync_product?.name || summary.name || "BANK OF SPANKY SHIRT",
        image: summary.thumbnail_url || result.sync_product?.thumbnail_url || "",
        price: prices.length ? Math.min(...prices) : null,
        sizes,
        variants
      };
    }));

    grid.replaceChildren();
    hero.replaceChildren();
    catalog.slice(0, 3).forEach(product => {
      if (!product.image) return;
      const img = el("img");
      img.src = product.image;
      img.alt = product.name + " front view";
      img.loading = "eager";
      hero.append(img);
    });

    catalog.forEach((product, index) => {
      const url = "./product.html?product=" + encodeURIComponent(product.id);
      const card = el("article", "product-card");
      const visual = el("a", "product-visual");
      visual.href = url;
      const img = el("img");
      img.src = product.image;
      img.alt = product.name + " front view";
      img.loading = "lazy";
      visual.append(img, el("span", "product-index", "FRONT VIEW / 0" + (index + 1)));

      const info = el("div", "product-info");
      info.append(el("h3", "", product.name.toUpperCase()));
      info.append(el("p", "product-subtitle", "BOS SQUAD SHIRT · EDITION 0" + (index + 1)));
      const price = el("p", "product-price");
      if (product.price === null) {
        price.classList.add("price-error");
        price.textContent = "PRICE NOT RETURNED BY PRINTFUL";
      } else {
        price.append(el("small", "", "RETAIL PRICE"), document.createTextNode(money(product.price)));
      }
      const order = el("a", "order-button");
      order.href = url;
      order.append(el("span", "", "ORDER NOW"), el("b", "", "↗"));
      info.append(price, order, el("p", "product-meta", product.sizes.join(" · ") || "Choose your size on the product page"));
      card.append(visual, info);
      grid.append(card);
    });
    status.textContent = catalog.length + " SYNCED SHIRTS LOADED · LIVE PRINTFUL STORE";
  }).catch(error => {
    status.textContent = "THE COLLECTION COULD NOT LOAD: " + error.message;
  });
})();