const catalog = window.XG_OPERATOR_CATALOG;
const categories = catalog.categories;
const products = catalog.products;
const categoryNames = Object.fromEntries(categories.map((item) => [item.id, item.name]));

const state = {
  category: "",
  selected: new Set(),
  activeProduct: null,
  requirement: null,
};

const elements = {
  categoryNav: document.querySelector("#operator-categories"),
  grid: document.querySelector("#operator-grid"),
  form: document.querySelector("#custom-form"),
  picker: document.querySelector("#operator-picker"),
  result: document.querySelector("#requirement-result"),
  code: document.querySelector("#requirement-code"),
  price: document.querySelector("#requirement-price"),
  json: document.querySelector("#requirement-json"),
  copy: document.querySelector("#copy-requirement"),
  dialog: document.querySelector("#operator-dialog"),
  dialogClose: document.querySelector("#operator-dialog-close"),
  dialogSku: document.querySelector("#operator-dialog-sku"),
  dialogEvidence: document.querySelector("#operator-dialog-evidence"),
  dialogTitle: document.querySelector("#operator-dialog-title"),
  dialogSummary: document.querySelector("#operator-dialog-summary"),
  dialogMetrics: document.querySelector("#operator-dialog-metrics"),
  dialogSelect: document.querySelector("#operator-dialog-select"),
  toast: document.querySelector("#toast"),
};

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 1800);
}

function renderCategories() {
  elements.categoryNav.replaceChildren();
  [
    ["", "全部"],
    ...categories.map((item) => [item.id, item.name]),
  ].forEach(([value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.classList.toggle("active", state.category === value);
    button.addEventListener("click", () => {
      state.category = value;
      renderCategories();
      renderProducts();
    });
    elements.categoryNav.append(button);
  });
}

function productCard(product) {
  const card = document.createElement("article");
  card.className = "operator-card";
  card.innerHTML = `
    <div class="operator-card-head">
      <span>${product.sku}</span>
      <span class="evidence-pill">${product.evidence}</span>
    </div>
    <h3>${product.name}</h3>
    <p>${product.summary}</p>
    <div class="operator-card-metrics">
      <span><strong>${product.lut}</strong>LUT</span>
      <span><strong>${product.dsp}</strong>DSP</span>
      <span><strong>${product.wns ?? "--"}</strong>WNS ns</span>
    </div>
    <div class="operator-card-footer">
      <span><strong>${currency.format(product.price)}</strong><small>项目授权基准价</small></span>
      <button type="button">查看契约</button>
    </div>
  `;
  card.querySelector("button").addEventListener("click", () => openOperator(product));
  return card;
}

function renderProducts() {
  const filtered = products.filter(
    (product) => !state.category || product.category === state.category,
  );
  elements.grid.replaceChildren(...filtered.map(productCard));
}

function openOperator(product) {
  state.activeProduct = product;
  elements.dialogSku.textContent = `${product.sku} · ${categoryNames[product.category]}`;
  elements.dialogEvidence.textContent = product.evidence;
  elements.dialogTitle.textContent = product.name;
  elements.dialogSummary.textContent = product.summary;
  elements.dialogMetrics.innerHTML = [
    ["LUT", product.lut],
    ["FF", product.ff],
    ["DSP", product.dsp],
    ["延迟周期", product.latency],
    ["WNS", product.wns == null ? "待实测" : `${product.wns} ns`],
    ["黄金模型误差", `${product.goldenError} LSB`],
  ]
    .map(
      ([label, value]) =>
        `<div><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join("");
  elements.dialogSelect.textContent = state.selected.has(product.id)
    ? "已加入需求"
    : "加入定制需求";
  elements.dialog.showModal();
}

function renderPicker() {
  elements.picker.replaceChildren();
  products.forEach((product) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = product.id;
    checkbox.checked = state.selected.has(product.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.selected.add(product.id);
      else state.selected.delete(product.id);
    });
    label.append(checkbox, document.createTextNode(product.name));
    elements.picker.append(label);
  });
}

function generateRequirement() {
  const formData = new FormData(elements.form);
  const selectedProducts = products.filter((product) => state.selected.has(product.id));
  const operatorPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0);
  const now = new Date();
  const seed = [
    now.toISOString(),
    formData.get("scenario"),
    formData.get("board"),
    ...state.selected,
  ].join("|");
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const code = `XG-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${hash.toString(36).toUpperCase().slice(0, 6)}`;

  return {
    requirement_code: code,
    created_at: now.toISOString(),
    scenario: formData.get("scenario"),
    target_board: formData.get("board"),
    max_latency_us: Number(formData.get("latency")),
    redundancy: formData.get("redundancy"),
    operator_chain: selectedProducts.map((product) => product.id),
    operator_license_reference_cny: operatorPrice,
    deliverables: formData.getAll("deliverable"),
    pricing_note:
      "参考价不含 NRE、板卡、机械、流体、工艺、生产、后端实现、封装和认证费用。",
    compliance_note:
      "XG 仅授权前端 IP。客户负责自身板卡、机械、流体、工艺、生产、后端实现、封装和认证。",
  };
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.selected.size) {
    showToast("至少选择一个算子");
    return;
  }
  const requirement = generateRequirement();
  state.requirement = requirement;
  elements.code.textContent = requirement.requirement_code;
  elements.price.textContent = `${currency.format(requirement.operator_license_reference_cny)} 起`;
  elements.json.textContent = JSON.stringify(requirement, null, 2);
  elements.result.hidden = false;
  elements.copy.disabled = false;
  elements.result.scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.copy.addEventListener("click", async () => {
  if (!state.requirement) return;
  const text = JSON.stringify(state.requirement, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    showToast("需求单已复制");
  } catch {
    showToast("复制失败，请手动选择需求单");
  }
});

elements.dialogClose.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
elements.dialogSelect.addEventListener("click", () => {
  if (!state.activeProduct) return;
  if (state.selected.has(state.activeProduct.id)) {
    showToast("该算子已在需求中");
    return;
  }
  state.selected.add(state.activeProduct.id);
  elements.dialogSelect.textContent = "已加入需求";
  const checkbox = elements.picker.querySelector(`input[value="${state.activeProduct.id}"]`);
  if (checkbox) checkbox.checked = true;
  showToast("已加入定制需求");
});

renderCategories();
renderProducts();
renderPicker();
