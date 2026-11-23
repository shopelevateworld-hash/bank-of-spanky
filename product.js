(() => {
  const api = (window.BOS_API_BASE || "").replace(/\/$/, "");
  const params = new URLSearchParams(location.search);
  const requestedId = Number(params.get("product") || params.get("template")) || 497623456;
  const image = document.getElementById("product-image");
  const sizeWrap = document.getElementById("sizes");
  const addButton = document.getElementById("add-to-cart");
  const feedback = document.getElementById("cart-feedback");
  const countNode = document.getElementById("cart-count");
  let product = { id: requestedId, title: "BANK OF SPANKY SHIRT", sizes: [], image: image.src, price: null };
  let selectedSize = "";

  const readCart = () => { try { return JSON.parse(localStorage.getItem("bos-cart") || "[]"); } catch { return []; } };
  const updateCount = () => { countNode.textContent = String(readCart().reduce((sum, item) => sum + (item.quantity || 1), 0)); };
  const money = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const renderSizes = sizes => {
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
      sizeWrap.append(button);
    });
  };

  updateCount();
  if (!api) {
    renderSizes([]);
    feedback.textContent = "Store connection is not configured.";
    return;
  }

  fetch(api + "/api/printful/products/" + encodeURIComponent(requestedId), { headers: { Accept: "application/json" } })
    .then(async response => {
      const body = await response.json();
      if (!response.ok || body.error || body.code >= 400) throw new Error(body.error?.message || body.error || "Printful request failed");
      return body.result || {};
    })
    .then(result => {
      const summary = result.sync_product || {};
      const variants = (result.sync_variants || []).filter(v => v.synced !== false && v.availability_status !== "discontinued");
      product = {
        id: Number(summary.id || requestedId),
        title: summary.name || "BANK OF SPANKY SHIRT",
        image: summary.thumbnail_url || image.src,
        sizes: [...new Set(variants.map(v => v.size || v.name?.split("/").pop()?.trim()).filter(Boolean))],
        price: (() => {
          const values = variants.map(v => Number(v.retail_price)).filter(n => Number.isFinite(n) && n > 0);
          return values.length ? Math.min(...values) : null;
        })()
      };

      image.src = product.image;
      image.alt = product.title + " front view";
      document.title = product.title.toUpperCase() + " — BANK OF SPANKY";
      document.getElementById("product-style").textContent = "UNISEX CLASSIC TEE · GILDAN 5000";
      document.getElementById("product-color").textContent = "BLACK";
      const heading = document.querySelector(".details h1");
      if (heading) {
        const safeTitle = product.title.replace(/[&<>"]/g, "");
        heading.textContent = safeTitle;
      }
      const oldPrice = document.getElementById("live-product-price");
      if (oldPrice) oldPrice.remove();
      if (product.price !== null) {
        const price = document.createElement("p");
        price.id = "live-product-price";
        price.className = "product-live-price";
        price.textContent = money(product.price) + " USD";
        const rule = document.querySelector(".details .rule");
        rule?.insertAdjacentElement("afterend", price);
      }
      renderSizes(product.sizes);
      feedback.textContent = "Live Printful product #" + product.id + " · Choose an available size.";
    })
    .catch(error => {
      renderSizes([]);
      feedback.textContent = "Could not load this Printful product: " + error.message;
    });

  addButton.addEventListener("click", () => {
    if (!selectedSize) {
      feedback.textContent = "Please choose an available shirt size first.";
      sizeWrap.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const cart = readCart();
    const existing = cart.find(item => item.productId === product.id && item.size === selectedSize);
    if (existing) existing.quantity = (existing.quantity || 1) + 1;
    else cart.push({
      productName: product.title,
      productId: product.id,
      templateId: product.id,
      size: selectedSize,
      color: "Black",
      price: product.price,
      quantity: 1,
      image: product.image
    });
    localStorage.setItem("bos-cart", JSON.stringify(cart));
    updateCount();
    feedback.textContent = "Added to your bag · " + selectedSize + ". Payment checkout is not active yet.";
    addButton.querySelector("span").textContent = "ADDED TO BAG";
    window.setTimeout(() => { addButton.querySelector("span").textContent = "ADD TO CART"; }, 1700);
  });
})();