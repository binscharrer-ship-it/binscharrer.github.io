const state = {
  items: [],
  query: "",
  category: "",
  sort: "score",
  quick: "recommend",
  favorites: new Set(JSON.parse(localStorage.getItem("haojia_favorites") || "[]")),
};

const categoryGroups = [
  "食品饮料",
  "居家日用",
  "母婴用品",
  "个护美妆",
  "服饰鞋包",
  "鞋靴",
  "厨房电器",
  "健康护理",
  "汽车用品",
  "数码配件",
  "饰品",
  "其他好物",
];

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const compactNumber = new Intl.NumberFormat("zh-CN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const brandPattern =
  /骆驼|飞利浦|南极人|恒源祥|洁丽雅|蓝月亮|立白|维达|心相印|苏菲|护舒宝|七度空间|高露洁|云南白药|冷酸灵|舒肤佳|潘婷|海飞丝|飘柔|力士|多芬|妮维雅|大宝|百雀羚|自然堂|珀莱雅|韩束|欧莱雅|清风|洁柔|得宝|超能|奥妙|汰渍|滴露|威露士|六神|隆力奇|凡士林|曼秀雷敦|海天|李锦记|安踏|美的|欧姆龙|小米|农夫山泉|绿联|倍思|中国黄金|周六福/;

const elements = {
  grid: document.querySelector("#product-grid"),
  empty: document.querySelector("#empty-state"),
  template: document.querySelector("#product-card-template"),
  search: document.querySelector("#search-input"),
  category: document.querySelector("#category-filter"),
  categoryStrip: document.querySelector("#category-strip"),
  quickFilters: document.querySelector("#quick-filters"),
  sort: document.querySelector("#sort-select"),
  resultCount: document.querySelector("#result-count"),
  productCount: document.querySelector("#hero-product-count"),
  hotCount: document.querySelector("#hero-hot-count"),
  topCoupon: document.querySelector("#hero-top-coupon"),
  heroShowcase: document.querySelector("#hero-showcase"),
  updatedAt: document.querySelector("#updated-at"),
  mobileSearch: document.querySelector("#mobile-search-button"),
  mobileFavorites: document.querySelector("#mobile-favorites-button"),
  favoritesCount: document.querySelector("#favorites-count"),
  mobileProfile: document.querySelector("#mobile-profile-button"),
  profileDialog: document.querySelector("#profile-dialog"),
  profileDialogClose: document.querySelector("#profile-dialog-close"),
  profileFavoriteList: document.querySelector("#profile-favorite-list"),
  profileFavoriteNote: document.querySelector("#profile-favorite-note"),
  dialog: document.querySelector("#product-dialog"),
  dialogClose: document.querySelector("#dialog-close"),
  dialogImage: document.querySelector("#dialog-image"),
  dialogCategory: document.querySelector("#dialog-category"),
  dialogSales: document.querySelector("#dialog-sales"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogPrice: document.querySelector("#dialog-price"),
  dialogOriginalPrice: document.querySelector("#dialog-original-price"),
  dialogCoupon: document.querySelector("#dialog-coupon"),
  dialogTags: document.querySelector("#dialog-tags"),
  dialogBuy: document.querySelector("#dialog-buy"),
  dialogFavorite: document.querySelector("#dialog-favorite"),
  dialogShare: document.querySelector("#dialog-share"),
  toast: document.querySelector("#toast"),
};

let activeProduct = null;

function formatDate(value) {
  if (!value) return "尚未导入";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function dealLabel(item) {
  const coupon = Number(item.coupon || 0);
  const price = Number(item.price || 0);
  const original = Number(item.original_price || 0);
  if (coupon > 0 && coupon < price) return `券 ${currency.format(coupon)}`;
  if (original > price) return `直降 ${currency.format(original - price)}`;
  return "今日好价";
}

function productGroup(item) {
  if (item.display_group) return item.display_group;
  const title = String(item.title || "");
  const rules = [
    [
      "母婴用品",
      /婴儿|宝宝|新生|奶嘴|纸尿裤|尿裤|抚触油|纱布浴巾|婴童/,
    ],
    [
      "食品饮料",
      /面包|吐司|零食|食品|营养|牛奶|酸奶|苹果|枣|姜|水果|拌面|泡面|奶茶|坚果/,
    ],
    [
      "个护美妆",
      /卫生巾|安心裤|护理|洗面|洁面|面膜|护肤|精华|乳液|面霜|身体乳|洗发|护发|防晒|卸妆|彩妆|口红|香水|眼影|粉底|沐浴|牙膏|湿巾|护手|精油|衣领净/,
    ],
    ["鞋靴", /运动鞋|休闲鞋|板鞋|老爹鞋|拖鞋|徒步鞋|登山鞋|靴/],
    ["服饰鞋包", /袜|女装|男装|上衣|外套|裤|鞋|包/],
    ["居家日用", /卷纸|卫生纸|纸巾|洗衣|清洁|家用|家庭装|收纳|浴巾|家纺/],
  ];
  for (const [group, pattern] of rules) {
    if (pattern.test(title)) return group;
  }
  return "其他好物";
}

function filteredProducts() {
  const query = normalizeText(state.query);
  const items = state.items.filter((item) => {
    if (item.status && item.status !== "active") return false;
    if (state.category && productGroup(item) !== state.category) return false;
    if (state.quick === "coupon" && !(Number(item.coupon) > 0)) return false;
    if (state.quick === "favorites" && !state.favorites.has(item.id)) return false;
    if (state.quick === "ordered" && !(Number(item.order_count) > 0)) return false;
    if (state.quick === "compare" && !item.compare_group) return false;
    if (state.quick === "large" && !(Number(item.price) >= 199)) return false;
    if (state.quick === "brand") {
      const hasBrand = Object.prototype.hasOwnProperty.call(item, "brand")
        ? Boolean(item.brand)
        : brandPattern.test(String(item.title || ""));
      if (!hasBrand) return false;
    }
    if (!query) return true;
    const haystack = [
      item.title,
      item.merchant,
      productGroup(item),
      ...(item.tags || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const sorters = {
    score: (a, b) =>
      Number(b.order_count || 0) - Number(a.order_count || 0) ||
      Number(b.hot_score || 0) - Number(a.hot_score || 0) ||
      Number(b.sales_30d || 0) - Number(a.sales_30d || 0),
    sales: (a, b) => b.sales_30d - a.sales_30d,
    coupon: (a, b) => b.coupon - a.coupon,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  };
  const selectedSort = state.quick === "hot" ? "sales" : state.sort;
  return items.sort(sorters[selectedSort] || sorters.score);
}

function updateCategoryOptions(items) {
  const current = elements.category.value;
  const available = new Set(items.map(productGroup));
  const categories = categoryGroups.filter((category) => available.has(category));
  elements.category.innerHTML = '<option value="">全部类目</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.category.append(option);
  });
  if (categories.includes(current)) elements.category.value = current;
}

function updateCategoryStrip(items) {
  const available = new Set(items.map(productGroup));
  const groups = categoryGroups.filter((category) => available.has(category));
  elements.categoryStrip.replaceChildren();
  ["推荐", ...groups].forEach((label) => {
    const value = label === "推荐" ? "" : label;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = value;
    button.textContent = label;
    button.classList.toggle("active", value === state.category);
    elements.categoryStrip.append(button);
  });
}

function updateQuickFilters() {
  const filters = [
    ["recommend", "猜你喜欢"],
    ["hot", "今日热榜"],
    ["coupon", "有券专区"],
    ["ordered", "真实成交"],
    ["compare", "同款比价"],
    ["large", "大件好物"],
    ["brand", "大牌好物"],
    ["favorites", `我的收藏 ${state.favorites.size}`],
  ];
  elements.quickFilters.replaceChildren();
  filters.forEach(([value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.quick = value;
    button.textContent = label;
    button.classList.toggle("active", state.quick === value);
    elements.quickFilters.append(button);
  });
}

function saveFavorites() {
  localStorage.setItem("haojia_favorites", JSON.stringify([...state.favorites]));
  updateQuickFilters();
  if (elements.profileDialog?.open) renderProfileFavorites();
}

function imageSource(imageUrl) {
  if (!imageUrl) return "";
  return imageUrl.startsWith("./") || imageUrl.startsWith("/")
    ? imageUrl
    : `./api/image?url=${encodeURIComponent(imageUrl)}`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 1800);
}

function toggleFavorite(productId) {
  if (state.favorites.has(productId)) {
    state.favorites.delete(productId);
    showToast("已取消收藏");
  } else {
    state.favorites.add(productId);
    showToast("已加入收藏");
  }
  saveFavorites();
  render();
  if (activeProduct?.id === productId) updateDialogFavorite();
}

function updateDialogFavorite() {
  if (!activeProduct) return;
  const active = state.favorites.has(activeProduct.id);
  elements.dialogFavorite.textContent = active ? "已收藏" : "收藏";
  elements.dialogFavorite.classList.toggle("active", active);
}

function openProduct(item) {
  activeProduct = item;
  elements.dialogImage.src = imageSource(item.image_url);
  elements.dialogImage.alt = item.title;
  elements.dialogCategory.textContent = productGroup(item);
  const orderNote = Number(item.order_count) > 0 ? " · 已有成交" : "";
  elements.dialogSales.textContent =
    `30日销量 ${compactNumber.format(item.sales_30d || 0)}${orderNote}`;
  elements.dialogTitle.textContent = item.title;
  elements.dialogPrice.textContent = currency.format(item.price || 0);
  elements.dialogOriginalPrice.textContent =
    item.original_price > item.price ? currency.format(item.original_price) : "";
  const validCoupon = item.coupon > 0 && item.coupon < item.price;
  elements.dialogCoupon.textContent = validCoupon
    ? `优惠券 ${currency.format(item.coupon)}`
    : item.original_price > item.price
      ? `已直降 ${currency.format(item.original_price - item.price)}`
      : "今日好价";
  const dialogTags = [...(item.tags || [])];
  if (item.compare_group) {
    dialogTags.unshift(`同款比价 · ${item.compare_label || "方案"}`);
  }
  elements.dialogTags.textContent = dialogTags.slice(0, 6).join(" · ");
  elements.dialogBuy.href = item.url;
  updateDialogFavorite();
  if (typeof elements.dialog.showModal === "function") {
    elements.dialog.showModal();
  } else {
    elements.dialog.setAttribute("open", "");
  }
}

async function shareProduct(item) {
  const shareData = {
    title: item.title,
    text: `发现一个好价：${item.title}`,
    url: item.url,
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(item.url);
    showToast("链接已复制，可发给朋友");
  } catch {
    showToast("长按“立即购买”也可以分享");
  }
}

function renderMetrics(items) {
  const active = items.filter((item) => !item.status || item.status === "active");
  elements.productCount.textContent = String(active.length);
  elements.hotCount.textContent = String(
    active.filter((item) => Number(item.coupon) > 0).length,
  );
  const topSaving = active.reduce(
    (highest, item) =>
      Math.max(
        highest,
        Math.max(
          0,
          Number(item.original_price || 0) - Number(item.price || 0),
        ),
      ),
    0,
  );
  elements.topCoupon.textContent = `¥${topSaving.toFixed(topSaving % 1 ? 2 : 0)}`;
}

function renderHeroShowcase(items) {
  if (!elements.heroShowcase) return;
  const ranked = items
    .filter((item) => (!item.status || item.status === "active") && item.image_url)
    .sort(
      (a, b) =>
        Number(b.order_count || 0) - Number(a.order_count || 0) ||
        Number(b.original_price || 0) - Number(b.price || 0) -
          (Number(a.original_price || 0) - Number(a.price || 0)) ||
        Number(b.sales_30d || 0) - Number(a.sales_30d || 0),
    );
  const featured = [];
  const seenGroups = new Set();
  for (const item of ranked) {
    const group = productGroup(item);
    if (seenGroups.has(group)) continue;
    seenGroups.add(group);
    featured.push(item);
    if (featured.length === 3) break;
  }
  if (featured.length < 3) {
    for (const item of ranked) {
      if (featured.includes(item)) continue;
      featured.push(item);
      if (featured.length === 3) break;
    }
  }
  if (!featured.length) {
    elements.heroShowcase.innerHTML =
      '<div class="hero-showcase-empty">今日精选正在更新</div>';
    return;
  }

  const card = (item, index) => `
    <a class="hero-feature-card ${index === 0 ? "hero-feature-main" : "hero-feature-small"}"
       href="${item.url}" target="_blank" rel="nofollow sponsored noopener">
      <img src="${imageSource(item.image_url)}" alt="${item.title}" ${index === 0 ? 'loading="eager"' : 'loading="lazy"'} />
      <div class="hero-feature-copy">
        <span class="hero-feature-rank">${index === 0 ? "编辑首选" : `0${index + 1} / 今日精选`}</span>
        <strong>${item.title}</strong>
        <div class="hero-feature-price">
          <b>${currency.format(item.price || 0)}</b>
          <small>${dealLabel(item)}</small>
        </div>
        <span class="hero-feature-cta">立即去看看 →</span>
      </div>
    </a>
  `;
  elements.heroShowcase.innerHTML = featured
    .map((item, index) => card(item, index))
    .join("");
}

function renderProfileFavorites() {
  const items = state.items.filter((item) => state.favorites.has(item.id));
  elements.profileFavoriteNote.textContent = items.length
    ? `已收藏 ${items.length} 件商品`
    : "还没有收藏商品。";
  elements.profileFavoriteList.replaceChildren(
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
          <span>${productGroup(item)}</span>
          <strong>${item.title}</strong>
          <small>${currency.format(item.price || 0)}</small>
        </div>
        <div class="profile-favorite-actions">
          <a href="${item.url}" target="_blank" rel="nofollow sponsored noopener">去看看</a>
          <button type="button">移除</button>
        </div>
      `;
      row.querySelector("button").addEventListener("click", () =>
        toggleFavorite(item.id),
      );
      return row;
    }),
  );
}

function buildCard(item) {
  const card = elements.template.content.firstElementChild.cloneNode(true);
  const media = card.querySelector(".product-media");
  const image = card.querySelector("img");
  const fallback = card.querySelector(".image-fallback");
  const title = card.querySelector(".product-title");
  const dealButton = card.querySelector(".deal-button");
  const favoriteButton = card.querySelector(".favorite-button");

  media.href = "#";
  media.addEventListener("click", (event) => {
    event.preventDefault();
    openProduct(item);
  });
  title.addEventListener("click", () => openProduct(item));
  dealButton.href = item.url;
  title.textContent = item.title;
  card.querySelector(".category-chip").textContent = productGroup(item);
  if (item.compare_group) {
    const compareChip = document.createElement("span");
    compareChip.className = "compare-chip";
    compareChip.textContent = `同款${String(item.compare_label || "").replace("方案 ", "")}`;
    card.querySelector(".product-meta").prepend(compareChip);
  }
  const merchant = card.querySelector(".merchant");
  merchant.textContent = item.merchant || "";

  if (item.image_url) {
    image.src = imageSource(item.image_url);
    image.alt = item.title;
  } else {
    fallback.textContent = productGroup(item).slice(0, 1);
  }

  const currentPrice = card.querySelector(".current-price");
  currentPrice.innerHTML = `${currency.format(item.price || 0)}`;
  const originalPrice = card.querySelector(".original-price");
  if (item.original_price > item.price) {
    originalPrice.textContent = currency.format(item.original_price);
  } else {
    originalPrice.remove();
  }

  const coupon = card.querySelector(".coupon-badge");
  coupon.textContent = dealLabel(item);
  card.querySelector(".sales-text").textContent =
    `30日 ${compactNumber.format(item.sales_30d || 0)}`;
  card.querySelector(".rating-text").textContent = item.rating
    ? `评分 ${Number(item.rating).toFixed(1)}`
    : "";

  const tagList = card.querySelector(".tag-list");
  if (item.compare_group) {
    const compareBadge = document.createElement("span");
    compareBadge.className = "compare-badge";
    compareBadge.textContent = `同款比价 · ${item.compare_label || "方案"}`;
    tagList.append(compareBadge);
  }
  if (Number(item.order_count) > 0) {
    const orderBadge = document.createElement("span");
    orderBadge.className = "order-badge";
    orderBadge.textContent = "有人买过";
    tagList.append(orderBadge);
  }
  (item.tags || []).slice(0, 3).forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = tag;
    tagList.append(chip);
  });

  const favoriteActive = state.favorites.has(item.id);
  favoriteButton.textContent = favoriteActive ? "♥" : "♡";
  favoriteButton.classList.toggle("active", favoriteActive);
  favoriteButton.addEventListener("click", () => toggleFavorite(item.id));

  return card;
}

function render() {
  const items = filteredProducts();
  elements.grid.replaceChildren(...items.map(buildCard));
  elements.resultCount.textContent = String(items.length);
  elements.grid.hidden = items.length === 0;
  elements.empty.hidden = items.length !== 0;
}

async function loadProducts() {
  if (window.__HAOJIA_PRODUCTS__) {
    const payload = window.__HAOJIA_PRODUCTS__;
    state.items = Array.isArray(payload.items) ? payload.items : [];
    updateCategoryOptions(state.items);
    updateCategoryStrip(state.items);
    updateQuickFilters();
    saveFavorites();
    renderMetrics(state.items);
    renderHeroShowcase(state.items);
    elements.updatedAt.textContent = formatDate(payload.updated_at);
    render();
    return;
  }

  const response = await fetch("./api/products", { cache: "no-store" });
  if (!response.ok) throw new Error("商品数据读取失败");
  const payload = await response.json();
  state.items = Array.isArray(payload.items) ? payload.items : [];
  updateCategoryOptions(state.items);
  updateCategoryStrip(state.items);
  updateQuickFilters();
  saveFavorites();
  renderMetrics(state.items);
  renderHeroShowcase(state.items);
  elements.updatedAt.textContent = formatDate(payload.updated_at);
  render();
}

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

elements.category.addEventListener("change", (event) => {
  state.category = event.target.value;
  state.quick = "recommend";
  updateQuickFilters();
  updateCategoryStrip(state.items);
  render();
});

elements.categoryStrip.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.category = button.dataset.category || "";
  state.quick = "recommend";
  elements.category.value = state.category;
  updateQuickFilters();
  updateCategoryStrip(state.items);
  render();
});

elements.quickFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-quick]");
  if (!button) return;
  state.quick = button.dataset.quick || "recommend";
  updateQuickFilters();
  render();
  if (state.quick === "favorites") {
    elements.grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

elements.mobileSearch.addEventListener("click", () => {
  elements.search.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => elements.search.focus(), 250);
});

elements.sort.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

elements.mobileFavorites.addEventListener("click", () => {
  state.quick = "favorites";
  updateQuickFilters();
  render();
  elements.grid.scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.dialogClose.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
elements.dialogFavorite.addEventListener("click", () => {
  if (activeProduct) toggleFavorite(activeProduct.id);
});
elements.dialogShare.addEventListener("click", () => {
  if (activeProduct) shareProduct(activeProduct);
});

document.querySelector("#current-year").textContent = String(new Date().getFullYear());

if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http") &&
  !["127.0.0.1", "localhost"].includes(location.hostname)
) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

loadProducts().catch((error) => {
  elements.empty.hidden = false;
  elements.empty.querySelector("h3").textContent = "本地服务未启动";
  elements.empty.querySelector("p").textContent =
    "请先运行 python server.py，再从浏览器打开本地地址。";
  console.error(error);
});
