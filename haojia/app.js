const state = {
  items: [],
  query: "",
  category: "",
  sort: "score",
};

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

const elements = {
  grid: document.querySelector("#product-grid"),
  empty: document.querySelector("#empty-state"),
  template: document.querySelector("#product-card-template"),
  search: document.querySelector("#search-input"),
  category: document.querySelector("#category-filter"),
  sort: document.querySelector("#sort-select"),
  resultCount: document.querySelector("#result-count"),
  productCount: document.querySelector("#hero-product-count"),
  hotCount: document.querySelector("#hero-hot-count"),
  topCoupon: document.querySelector("#hero-top-coupon"),
  updatedAt: document.querySelector("#updated-at"),
};

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

function filteredProducts() {
  const query = normalizeText(state.query);
  const items = state.items.filter((item) => {
    if (item.status && item.status !== "active") return false;
    if (state.category && item.category !== state.category) return false;
    if (!query) return true;
    const haystack = [
      item.title,
      item.merchant,
      item.category,
      ...(item.tags || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const sorters = {
    score: () => 0,
    sales: (a, b) => b.sales_30d - a.sales_30d,
    coupon: (a, b) => b.coupon - a.coupon,
    "price-asc": (a, b) => a.price - b.price,
  };
  return items.sort(sorters[state.sort] || sorters.score);
}

function updateCategoryOptions(items) {
  const current = elements.category.value;
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "zh-CN"),
  );
  elements.category.innerHTML = '<option value="">全部类目</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.category.append(option);
  });
  if (categories.includes(current)) elements.category.value = current;
}

function renderMetrics(items) {
  const active = items.filter((item) => !item.status || item.status === "active");
  elements.productCount.textContent = String(active.length);
  elements.hotCount.textContent = String(
    active.filter((item) => Number(item.coupon) > 0).length,
  );
  const topCoupon = active.reduce(
    (highest, item) => Math.max(highest, Number(item.coupon) || 0),
    0,
  );
  elements.topCoupon.textContent = `¥${topCoupon.toFixed(topCoupon % 1 ? 2 : 0)}`;
}

function buildCard(item) {
  const card = elements.template.content.firstElementChild.cloneNode(true);
  const media = card.querySelector(".product-media");
  const image = card.querySelector("img");
  const fallback = card.querySelector(".image-fallback");
  const title = card.querySelector(".product-title");
  const dealButton = card.querySelector(".deal-button");

  media.href = item.url;
  dealButton.href = item.url;
  title.textContent = item.title;
  card.querySelector(".category-chip").textContent = item.category || "百货";
  const merchant = card.querySelector(".merchant");
  merchant.textContent = item.merchant || "";

  if (item.image_url) {
    image.src =
      item.image_url.startsWith("./") || item.image_url.startsWith("/")
        ? item.image_url
        : `./api/image?url=${encodeURIComponent(item.image_url)}`;
    image.alt = item.title;
  } else {
    fallback.textContent = (item.category || "选品").slice(0, 1);
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
  coupon.textContent = item.coupon > 0 ? `券 ${currency.format(item.coupon)}` : "暂无券";
  card.querySelector(".sales-text").textContent =
    `30日 ${compactNumber.format(item.sales_30d || 0)}`;
  card.querySelector(".rating-text").textContent = item.rating
    ? `评分 ${Number(item.rating).toFixed(1)}`
    : "评分未填";

  const tagList = card.querySelector(".tag-list");
  (item.tags || []).slice(0, 3).forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = tag;
    tagList.append(chip);
  });

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
    renderMetrics(state.items);
    elements.updatedAt.textContent = formatDate(payload.updated_at);
    render();
    return;
  }

  const response = await fetch("./api/products", { cache: "no-store" });
  if (!response.ok) throw new Error("商品数据读取失败");
  const payload = await response.json();
  state.items = Array.isArray(payload.items) ? payload.items : [];
  updateCategoryOptions(state.items);
  renderMetrics(state.items);
  elements.updatedAt.textContent = formatDate(payload.updated_at);
  render();
}

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

elements.category.addEventListener("change", (event) => {
  state.category = event.target.value;
  render();
});

elements.sort.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

document.querySelector("#current-year").textContent = String(new Date().getFullYear());

loadProducts().catch((error) => {
  elements.empty.hidden = false;
  elements.empty.querySelector("h3").textContent = "本地服务未启动";
  elements.empty.querySelector("p").textContent =
    "请先运行 python server.py，再从浏览器打开本地地址。";
  console.error(error);
});
