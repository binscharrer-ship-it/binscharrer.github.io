(function () {
  const TOKEN_KEY = "cihu-union-token";
  const PAYMENT_LABELS = {
    pending: "待汇款",
    bank_file_generated: "已生成银行盘",
    bank_processing: "银行处理中",
    credited: "已到账",
    failed_card: "卡号错误",
    failed_frozen: "账户冻结"
  };
  const TITLES = {
    home: "工作台",
    snapshot: "节点复盘",
    payments: "资金流转",
    people: "人员落实",
    me: "我的"
  };

  const loginView = document.getElementById("mobile-login");
  const shell = document.getElementById("mobile-shell");
  const content = document.getElementById("mobile-content");
  const installBar = document.getElementById("mobile-install");
  const toastNode = document.getElementById("mobile-toast");

  let token = sessionStorage.getItem(TOKEN_KEY) || "";
  let user = null;
  let currentTab = location.hash.replace("#", "") || "home";
  let departments = [];
  let members = [];
  let dashboard = null;
  let payments = [];
  let installPrompt = null;

  boot();

  async function boot() {
    bindEvents();
    if (!token) {
      loginView.classList.remove("hidden");
      shell.classList.add("hidden");
      return;
    }
    try {
      const result = await api("/auth/me");
      user = result.user;
      departments = await api("/departments");
      loginView.classList.add("hidden");
      shell.classList.remove("hidden");
      document.getElementById("mobile-department").textContent = user.department_name || "区总工会";
      await render();
    } catch (error) {
      logout();
    }
  }

  function bindEvents() {
    document.getElementById("mobile-login-form").addEventListener("submit", login);
    document.getElementById("mobile-register-form").addEventListener("submit", register);
    document.getElementById("mobile-register-toggle").addEventListener("click", () => {
      document.getElementById("mobile-register-form").classList.toggle("hidden");
    });
    document.getElementById("mobile-avatar").addEventListener("click", () => switchTab("me"));
    document.querySelectorAll("[data-mobile-tab]").forEach((button) => {
      button.addEventListener("click", () => switchTab(button.dataset.mobileTab));
    });
    document.getElementById("mobile-install-button").addEventListener("click", async () => {
      if (!installPrompt) {
        toast("请使用浏览器菜单中的“添加到主屏幕”");
        return;
      }
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installBar.hidden = true;
    });
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      installBar.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      installBar.hidden = true;
      toast("已安装到手机桌面");
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    }
  }

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: { username: form.get("username"), password: form.get("password") },
        auth: false
      });
      saveToken(result.access_token);
      await boot();
    } catch (error) {
      document.getElementById("mobile-login-note").textContent = error.message;
    }
  }

  async function register(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const result = await api("/auth/register", {
        method: "POST",
        auth: false,
        body: {
          invite_code: form.get("invite_code"),
          display_name: form.get("display_name"),
          username: form.get("username"),
          password: form.get("password")
        }
      });
      saveToken(result.access_token);
      await boot();
    } catch (error) {
      toast(error.message);
    }
  }

  function saveToken(value) {
    token = value;
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  async function switchTab(tab) {
    currentTab = tab;
    location.hash = tab;
    document.querySelectorAll("[data-mobile-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.mobileTab === tab);
    });
    await render();
    window.scrollTo({ top: 0 });
  }

  async function render() {
    document.getElementById("mobile-title").textContent = TITLES[currentTab] || "工作台";
    content.innerHTML = '<div class="mobile-card">正在加载...</div>';
    try {
      if (currentTab === "home") content.innerHTML = await renderHome();
      if (currentTab === "snapshot") content.innerHTML = await renderSnapshot();
      if (currentTab === "payments") content.innerHTML = await renderPayments();
      if (currentTab === "people") content.innerHTML = await renderPeople();
      if (currentTab === "me") content.innerHTML = renderMe();
    } catch (error) {
      content.innerHTML = `<div class="mobile-card">${escapeHtml(error.message)}</div>`;
    }
  }

  async function renderHome() {
    dashboard = await api(`/dashboard?year=${new Date().getFullYear()}`);
    const metrics = user.role === "member"
      ? [
        ["我的福利", `${dashboard.benefit_count}笔`, `${money(dashboard.benefit_total)}元`],
        ["体检", dashboard.exam_rate === 100 ? "已完成" : "未完成", "组织状态"],
        ["疗休养", dashboard.retreat_rate === 100 ? "已报名" : "未报名", "报名状态"],
        ["待处理汇款", `${dashboard.payment_pending}笔`, "含处理中"]
      ]
      : [
        ["人员", `${dashboard.member_count}人`, "权限范围内"],
        ["福利金额", `${money(dashboard.benefit_total)}元`, `${dashboard.benefit_count}笔`],
        ["体检覆盖", `${dashboard.exam_rate}%`, `${dashboard.exam_covered}人`],
        ["疗休养", `${dashboard.retreat_rate}%`, `${dashboard.retreat_covered}人`]
      ];
    return `
      <section class="mobile-section">
        <div class="mobile-metrics">
          ${metrics.map(([label, value, note]) => `
            <article class="mobile-metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>
          `).join("")}
        </div>
      </section>
      <section class="mobile-section">
        <div class="mobile-section-head"><h2>快捷操作</h2><span>常用入口</span></div>
        <div class="mobile-action-row">
          ${user.role !== "member" ? '<button class="mobile-button" data-mobile-jump="snapshot">生成节点报告</button>' : ""}
          <button class="mobile-button primary" data-mobile-jump="payments">查看汇款</button>
          <button class="mobile-button" data-mobile-jump="people">人员落实</button>
          ${user.role !== "member" ? '<button class="mobile-button" data-mobile-jump="people">导出催办名单</button>' : ""}
        </div>
      </section>
      <section class="mobile-section">
        <div class="mobile-section-head"><h2>风险提醒</h2><span>${dashboard.open_alerts.length}项</span></div>
        <div class="mobile-stack">
          ${dashboard.open_alerts.length ? dashboard.open_alerts.map((item) => `
            <article class="mobile-card">
              <span class="mobile-status red">${item.priority === "high" ? "高优" : "关注"}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.detail)}</p>
            </article>
          `).join("") : '<div class="mobile-card">当前没有待处理风险</div>'}
        </div>
      </section>
    `;
  }

  async function renderSnapshot() {
    if (user.role === "member") {
      return '<div class="mobile-card">普通会员无权生成部门节点报告。</div>';
    }
    const snapshots = await api("/snapshots");
    return `
      <section class="mobile-section">
        <div class="mobile-section-head"><h2>时间节点</h2><span>点击切换</span></div>
        <div class="mobile-chip-row">
          <button class="mobile-chip active" data-snapshot-preset="first_quarter">第一季度</button>
          <button class="mobile-chip" data-snapshot-preset="may_day">五一节点</button>
          <button class="mobile-chip" data-snapshot-preset="retreat_special">疗休养专项</button>
          <button class="mobile-chip" data-snapshot-preset="half_year">半年节点</button>
          <button class="mobile-chip" data-snapshot-preset="annual">年度</button>
        </div>
      </section>
      <section class="mobile-section">
        <div class="mobile-card mobile-form">
          <label>报告标题<input id="mobile-snapshot-title" value="${new Date().getFullYear()}年第一季度工会工作复盘报告"></label>
          <label>部门<select id="mobile-snapshot-department">${departmentOptions()}</select></label>
          <label>开始日期<input id="mobile-snapshot-start" type="date" value="${new Date().getFullYear()}-01-01"></label>
          <label>结束日期<input id="mobile-snapshot-end" type="date" value="${today()}"></label>
          <button class="mobile-button primary" id="mobile-snapshot-preview">生成复盘矩阵</button>
        </div>
      </section>
      <section class="mobile-section" id="mobile-snapshot-result">
        ${snapshots.length ? `<div class="mobile-card"><strong>最近报告</strong><span>${escapeHtml(snapshots[0].title)}</span></div>` : ""}
      </section>
    `;
  }

  async function renderPayments() {
    members = await api("/members");
    payments = await api("/payments");
    return `
      <section class="mobile-section">
        <div class="mobile-section-head"><h2>工资卡汇款</h2><span>${payments.length}笔</span></div>
        <div class="mobile-stack">
          ${payments.slice(0, 30).map((item) => `
            <article class="mobile-card">
              <div class="mobile-section-head">
                <strong>${escapeHtml(memberName(item.member_id))}</strong>
                ${paymentStatus(item.state)}
              </div>
              <span>尾号 ${item.bank_card_last4} · ${escapeHtml(item.bank_name)}</span>
              <strong>${money(item.amount)}元</strong>
              ${item.failure_reason ? `<span class="mobile-status red">${escapeHtml(item.failure_reason)}</span>` : ""}
              <div class="mobile-action-row" style="margin-top:10px">
                ${paymentAction(item)}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  async function renderPeople() {
    members = await api("/members");
    const gaps = user.role !== "member" ? await api(`/people/gaps?year=${new Date().getFullYear()}`) : [];
    return `
      <section class="mobile-section">
        <div class="mobile-section-head"><h2>个人全景</h2><span>${members.length}人</span></div>
        <div class="mobile-card mobile-form">
          <label>选择人员<select id="mobile-person-select">${members.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} · ${escapeHtml(item.employee_no || "无编号")}</option>`).join("")}</select></label>
          <button class="mobile-button primary" id="mobile-load-person">查询年度事项</button>
        </div>
        <div id="mobile-person-result" style="margin-top:10px"></div>
      </section>
      ${user.role !== "member" ? `
        <section class="mobile-section">
          <div class="mobile-section-head"><h2>应做未做名单</h2><span>${gaps.length}人</span></div>
          <div class="mobile-stack">
            ${gaps.slice(0, 20).map((item) => `
              <article class="mobile-list-item">
                <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.department_name)}</span></div>
                <small>${escapeHtml(item.gap)}</small>
              </article>
            `).join("") || '<div class="mobile-card">没有识别到应做未做人员</div>'}
          </div>
        </section>
      ` : ""}
    `;
  }

  function renderMe() {
    return `
      <section class="mobile-section">
        <article class="mobile-card">
          <strong>${escapeHtml(user.display_name)}</strong>
          <span>${escapeHtml(user.department_name || "区总工会")}</span>
          <span>${roleLabel(user.role)}</span>
        </article>
      </section>
      <section class="mobile-section">
        <div class="mobile-stack">
          <button class="mobile-button" id="mobile-install-from-me">安装到手机桌面</button>
          <a class="mobile-button" href="index.html" style="display:grid;place-items:center;text-decoration:none">打开桌面管理版</a>
          <button class="mobile-button danger" id="mobile-logout">退出登录</button>
        </div>
      </section>
      <section class="mobile-section">
        <article class="mobile-card">
          <strong>移动端安全提示</strong>
          <span>手机端不展示完整身份证和工资卡，不保存业务数据到本地。</span>
          <span>丢失手机后应立即修改密码并联系超级管理员停用账号。</span>
        </article>
      </section>
    `;
  }

  document.addEventListener("click", async (event) => {
    const jump = event.target.closest("[data-mobile-jump]");
    if (jump) return switchTab(jump.dataset.mobileJump);

    const preset = event.target.closest("[data-snapshot-preset]");
    if (preset) {
      document.querySelectorAll("[data-snapshot-preset]").forEach((item) => item.classList.toggle("active", item === preset));
      applyPreset(preset.dataset.snapshotPreset);
      return;
    }

    if (event.target.id === "mobile-snapshot-preview") await previewSnapshot();
    if (event.target.id === "mobile-load-person") await loadPerson();
    if (event.target.id === "mobile-logout") logout();
    if (event.target.id === "mobile-install-from-me") {
      if (installPrompt) installPrompt.prompt();
      else toast("请使用浏览器菜单中的“添加到主屏幕”");
    }
    const paymentButton = event.target.closest("[data-mobile-payment]");
    if (paymentButton) {
      await transitionPayment(paymentButton.dataset.id, paymentButton.dataset.state);
    }
  });

  function applyPreset(preset) {
    const year = new Date().getFullYear();
    const title = document.getElementById("mobile-snapshot-title");
    const start = document.getElementById("mobile-snapshot-start");
    const end = document.getElementById("mobile-snapshot-end");
    const config = {
      first_quarter: ["第一季度", `${year}-01-01`, `${year}-03-31`],
      may_day: ["五一节点", `${year}-04-15`, `${year}-05-10`],
      retreat_special: ["疗休养专项", `${year}-06-01`, `${year}-09-30`],
      half_year: ["半年节点", `${year}-01-01`, `${year}-06-30`],
      annual: ["年度节点", `${year}-01-01`, `${year}-12-31`]
    }[preset];
    title.value = `${year}年${config[0]}工会工作复盘报告`;
    start.value = config[1];
    end.value = config[2];
  }

  async function previewSnapshot() {
    const payload = {
      department_id: document.getElementById("mobile-snapshot-department").value,
      title: document.getElementById("mobile-snapshot-title").value,
      start_date: document.getElementById("mobile-snapshot-start").value,
      end_date: document.getElementById("mobile-snapshot-end").value,
      labels: ["移动端复盘"]
    };
    const result = await api("/snapshots/preview", { method: "POST", body: payload });
    document.getElementById("mobile-snapshot-result").innerHTML = `
      <div class="mobile-section-head"><h2>任务矩阵</h2><span>${result.summary.exam_coverage_percent}%体检覆盖</span></div>
      <div class="mobile-stack">
        ${result.summary.tasks.map((task) => `
          <article class="mobile-task ${task.state}">
            <strong>${escapeHtml(task.title)}</strong>
            <span>${escapeHtml(task.detail)}</span>
          </article>
        `).join("")}
      </div>
    `;
  }

  async function loadPerson() {
    const id = document.getElementById("mobile-person-select").value;
    const result = await api(`/people/${id}/panorama?year=${new Date().getFullYear()}`);
    document.getElementById("mobile-person-result").innerHTML = `
      <article class="mobile-card">
        <strong>${escapeHtml(result.member.name)}</strong>
        <span>福利${result.benefits.length}笔 · 体检${result.exam.status === "completed" ? "已完成" : "未完成"} · 疗休养${result.retreat.registered ? "已报名" : "未报名"}</span>
        <span>${result.gaps.length ? escapeHtml(result.gaps.join("、")) : "本年度事项均已落实"}</span>
      </article>
    `;
  }

  async function transitionPayment(id, state) {
    await api(`/payments/${id}/transition`, {
      method: "POST",
      body: { target_state: state, failure_reason: state.startsWith("failed") ? "移动端登记失败" : null }
    });
    toast("汇款状态已更新");
    await render();
  }

  function paymentAction(item) {
    const next = {
      bank_file_generated: ["bank_processing", "银行处理中"],
      bank_processing: ["credited", "确认到账"],
      failed_card: ["pending", "修正后重试"],
      failed_frozen: ["pending", "解除冻结后重试"]
    }[item.state];
    if (!next || user.role === "member") return "";
    return `<button class="mobile-button primary" data-mobile-payment data-id="${item.id}" data-state="${next[0]}">${next[1]}</button>`;
  }

  function paymentStatus(state) {
    const tone = state === "credited" ? "green" : state.startsWith("failed") ? "red" : "amber";
    return `<span class="mobile-status ${tone}">${PAYMENT_LABELS[state] || state}</span>`;
  }

  function departmentOptions() {
    const visible = user.role === "super_admin"
      ? departments
      : departments.filter((item) => item.id === user.department_id);
    return visible.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  }

  function memberName(memberId) {
    return members.find((item) => item.id === memberId)?.name || "未知人员";
  }

  function roleLabel(role) {
    return { super_admin: "超级管理员", department_admin: "部门管理员", member: "普通会员" }[role] || role;
  }

  function money(value) {
    return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }

  function today() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function toast(message) {
    toastNode.textContent = message;
    toastNode.classList.add("show");
    setTimeout(() => toastNode.classList.remove("show"), 3200);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    token = "";
    loginView.classList.remove("hidden");
    shell.classList.add("hidden");
  }

  async function api(path, options = {}) {
    if (window.CihuStaticDemo) return window.CihuStaticDemo.handle(path, options);
    const headers = { "Content-Type": "application/json" };
    if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`/api${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    if (response.status === 401) {
      logout();
      throw new Error("登录状态已失效");
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `请求失败（${response.status}）`);
    }
    return response.json();
  }
})();
