const profileDialog = document.querySelector("#profile-dialog");
const profileButton = document.querySelector("#mobile-profile-button");
const profileClose = document.querySelector("#profile-dialog-close");
const profileList = document.querySelector("#profile-favorite-list");
const profileNote = document.querySelector("#profile-favorite-note");
let profileItems = [];

function favoriteIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem("haojia_favorites") || "[]"));
  } catch {
    return new Set();
  }
}

function imageSource(imageUrl) {
  if (!imageUrl) return "";
  return imageUrl.startsWith("./") || imageUrl.startsWith("/")
    ? imageUrl
    : `./api/image?url=${encodeURIComponent(imageUrl)}`;
}

async function loadProfileItems() {
  if (Array.isArray(window.__HAOJIA_PRODUCTS__?.items)) {
    profileItems = window.__HAOJIA_PRODUCTS__.items;
    return;
  }
  const response = await fetch("./api/products", { cache: "no-store" });
  if (!response.ok) return;
  const payload = await response.json();
  profileItems = Array.isArray(payload.items) ? payload.items : [];
}

function syncCardFavorite(title, active) {
  document.querySelectorAll(".product-card").forEach((card) => {
    const cardTitle = card.querySelector(".product-title")?.textContent?.trim();
    if (cardTitle !== title) return;
    const button = card.querySelector(".favorite-button");
    if (!button) return;
    button.textContent = active ? "♥" : "♡";
    button.classList.toggle("active", active);
  });
}

function renderProfile() {
  const ids = favoriteIds();
  const items = profileItems.filter((item) => ids.has(item.id));
  profileNote.textContent = items.length
    ? `已收藏 ${items.length} 件商品`
    : "还没有收藏商品。";
  profileList.replaceChildren(
    ...items.map((item) => {
      const row = document.createElement("article");
      row.className = "profile-favorite-item";
      row.innerHTML = `
        <div class="profile-favorite-media">${
          item.image_url
            ? `<img src="${imageSource(item.image_url)}" alt="" loading="lazy" />`
            : ""
        }</div>
        <div class="profile-favorite-copy">
          <span>${item.display_group || item.category || "精选"}</span>
          <strong>${item.title}</strong>
          <small>¥${Number(item.price || 0).toFixed(2)}</small>
        </div>
        <div class="profile-favorite-actions">
          <a href="${item.url}" target="_blank" rel="nofollow sponsored noopener">去看看</a>
          <button type="button">移除</button>
        </div>
      `;
      row.querySelector("button").addEventListener("click", () => {
        const next = favoriteIds();
        next.delete(item.id);
        localStorage.setItem("haojia_favorites", JSON.stringify([...next]));
        syncCardFavorite(item.title, false);
        renderProfile();
      });
      return row;
    }),
  );
}

profileButton?.addEventListener("click", async () => {
  await loadProfileItems();
  renderProfile();
  profileDialog?.showModal();
});

profileClose?.addEventListener("click", () => profileDialog?.close());
profileDialog?.addEventListener("click", (event) => {
  if (event.target === profileDialog) profileDialog.close();
});

const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = (key, value) => {
  originalSetItem(key, value);
  if (key === "haojia_favorites" && profileDialog?.open) renderProfile();
};
