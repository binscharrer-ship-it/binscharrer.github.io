const crystalData = window.XG_CRYSTAL_DATA || { stores: [], products: [] };
const crystalProducts = document.querySelector("#crystal-products");
const crystalStores = document.querySelector("#crystal-stores-grid");
const crystalToast = document.querySelector("#toast");

const storeById = Object.fromEntries(
  crystalData.stores.map((store) => [store.id, store]),
);

function showCrystalToast(message) {
  crystalToast.textContent = message;
  crystalToast.classList.add("show");
  window.clearTimeout(showCrystalToast.timer);
  showCrystalToast.timer = window.setTimeout(
    () => crystalToast.classList.remove("show"),
    1800,
  );
}

function renderProducts() {
  crystalProducts.replaceChildren(
    ...crystalData.products.map((product) => {
      const card = document.createElement("article");
      const store = storeById[product.storeId];
      card.className = "crystal-product";
      card.innerHTML = `
        <div class="crystal-product-visual" style="--gem:${product.color}">
          ${product.image ? `<img src="${product.image}" alt="${product.crystal}" loading="lazy" style="position:relative;z-index:2;width:100%;height:100%;padding:10px;box-sizing:border-box;object-fit:contain" />` : ""}
        </div>
        <span class="crystal-product-store">${store?.name || "晶序店铺"}</span>
        <h3>${product.name}</h3>
        <p>${product.crystal} · 颜色与天然特征以店铺页面为准</p>
        <a target="_blank" rel="noopener" href="${product.url}">去店铺查看 →</a>
      `;
      return card;
    }),
  );
}

function renderStores() {
  crystalStores.replaceChildren(
    ...crystalData.stores.map((store) => {
      const card = document.createElement("article");
      card.className = "crystal-store-card";
      card.innerHTML = `
        <span class="crystal-store-mark">${store.name.slice(0, 1)}</span>
        <div><strong>${store.name}</strong><small>${store.note}</small></div>
        <div class="crystal-store-actions">
          <a target="_blank" rel="noopener" href="${store.url}">进入店铺</a>
          <button type="button">复制链接</button>
        </div>
      `;
      card.querySelector("button").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(store.url);
          showCrystalToast("店铺链接已复制");
        } catch {
          showCrystalToast("复制失败，请长按进入店铺");
        }
      });
      return card;
    }),
  );
}

renderProducts();
renderStores();
