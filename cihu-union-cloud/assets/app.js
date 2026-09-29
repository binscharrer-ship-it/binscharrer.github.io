(function () {
  const STORAGE_KEY = "cihu-union-token";
  const ROLE_LABELS = {
    super_admin: "超级管理员",
    department_admin: "部门管理员",
    member: "普通会员"
  };
  const PAYMENT_LABELS = {
    pending: "待汇款",
    bank_file_generated: "已生成银行盘",
    bank_processing: "银行处理中",
    credited: "已到账",
    failed_card: "卡号错误",
    failed_frozen: "账户冻结"
  };
  const ROUTES = {
    dashboard: { label: "总览", sub: "风险与进度", roles: ["super_admin", "department_admin", "member"] },
    snapshots: { label: "节点总结", sub: "复盘报告", roles: ["super_admin", "department_admin"] },
    payments: { label: "资金流转", sub: "工资卡汇款", roles: ["super_admin", "department_admin", "member"] },
    people: { label: "人员全景", sub: "应做未做", roles: ["super_admin", "department_admin", "member"] },
    members: { label: "人员登记", sub: "部门隔离", roles: ["super_admin", "department_admin"] },
    benefits: { label: "福利发放", sub: "审批签收", roles: ["super_admin", "department_admin", "member"] },
    exams: { label: "职工体检", sub: "组织覆盖", roles: ["super_admin", "department_admin", "member"] },
    retreats: { label: "疗休养", sub: "报名批次", roles: ["super_admin", "department_admin", "member"] },
    admin: { label: "部门与授权", sub: "邀请码/二维码", roles: ["super_admin", "department_admin"] }
  };

  const loginView = document.getElementById("login-view");
  const cloudApp = document.getElementById("cloud-app");
  const content = document.getElementById("cloud-content");
  const dialog = document.getElementById("cloud-dialog");
  const toastRegion = document.getElementById("cloud-toast");
  const nav = document.getElementById("cloud-nav");
  const yearSelect = document.getElementById("cloud-year");
  const sidebar = document.getElementById("cloud-sidebar");

  let session = {
    token: sessionStorage.getItem(STORAGE_KEY) || "",
    user: null
  };
  let currentRoute = normalizeRoute(location.hash.replace("#", ""));
  let currentYear = new Date().getFullYear();
  let departments = [];
  let dashboardData = null;
  let membersCache = [];
  let lastSnapshot = null;
  let selectedPaymentIds = new Set();

  boot();

  async function boot() {
    bindEvents();
    fillYears();
    if (!session.token) {
      showLogin();
      return;
    }
    try {
      const me = await api("/auth/me");
      session.user = me.user;
      await loadDepartments();
      showApp();
      await render();
    } catch (error) {
      logout();
    }
  }

  function normalizeRoute(route) {
    return ROUTES[route] ? route : "dashboard";
  }

  function showLogin() {
    loginView.classList.remove("hidden");
    cloudApp.classList.add("hidden");
  }

  function showApp() {
    loginView.classList.add("hidden");
    cloudApp.classList.remove("hidden");
    document.getElementById("session-user").textContent =
      `${session.user.display_name} · ${ROLE_LABELS[session.user.role] || session.user.role}`;
    document.getElementById("session-department").textContent =
      session.user.department_name || "全部部门";
    renderNav();
  }

  function renderNav() {
    nav.innerHTML = Object.entries(ROUTES)
      .filter(([, config]) => config.roles.includes(session.user.role))
      .map(([route, config]) => `
        <button class="nav-item ${route === currentRoute ? "active" : ""}" data-route="${route}">
          <span>${config.label}</span><small>${config.sub}</small>
        </button>
      `).join("");
  }

  async function render() {
    document.getElementById("cloud-page-title").textContent = ROUTES[currentRoute].label;
    renderNav();
    content.innerHTML = '<div class="panel"><div class="panel-body">正在安全加载...</div></div>';
    try {
      if (currentRoute === "dashboard") content.innerHTML = await renderDashboard();
      if (currentRoute === "snapshots") content.innerHTML = await renderSnapshots();
      if (currentRoute === "payments") content.innerHTML = await renderPayments();
      if (currentRoute === "people") content.innerHTML = await renderPeople();
      if (currentRoute === "members") content.innerHTML = await renderMembers();
      if (currentRoute === "benefits") content.innerHTML = await renderBenefits();
      if (currentRoute === "exams") content.innerHTML = await renderExams();
      if (currentRoute === "retreats") content.innerHTML = await renderRetreats();
      if (currentRoute === "admin") content.innerHTML = await renderAdmin();
    } catch (error) {
      content.innerHTML = renderError(error.message);
    }
  }

  async function renderDashboard() {
    dashboardData = await api(`/dashboard?year=${currentYear}`);
    membersCache = await api("/members");
    dashboardData.members = membersCache;
    dashboardData.memberMap = Object.fromEntries(membersCache.map((member) => [member.id, member.name]));
    const metrics = dashboardData.scope === "member"
      ? [
        ["我的福利记录", `${dashboardData.benefit_count}笔`, `累计${money(dashboardData.benefit_total)}元`],
        ["我的体检", dashboardData.exam_rate === 100 ? "已完成" : "未完成", "以组织状态为准"],
        ["我的疗休养", dashboardData.retreat_rate === 100 ? "已报名" : "未报名", "按开放批次报名"],
        ["我的待处理汇款", `${dashboardData.payment_pending}笔`, "待汇/盘/处理中"],
        ["我的失败汇款", `${dashboardData.payment_failed}笔`, "需核对工资卡"]
      ]
      : [
        ["在职人员", `${dashboardData.member_count}人`, "当前权限范围内"],
        ["福利金额", `${money(dashboardData.benefit_total)}元`, `${dashboardData.benefit_count}笔`],
        ["体检覆盖", `${dashboardData.exam_rate}%`, `${dashboardData.exam_covered}人完成`],
        ["疗休养覆盖", `${dashboardData.retreat_rate}%`, `${dashboardData.retreat_covered}人纳入`],
        ["汇款待处理", `${dashboardData.payment_pending}笔`, "待汇/盘/处理中"],
        ["汇款失败", `${dashboardData.payment_failed}笔`, "需核对工资卡"]
      ];
    const alerts = dashboardData.open_alerts;
    return `
      ${pageHead(`${currentYear}年度业务总览`, "登录身份不同，看到的数据范围会由后端自动限制。", quickActions())}
      <section class="metric-grid">
        ${metrics.map(([label, value, note]) => `
          <article class="metric">
            <div class="metric-top"><span class="metric-label">${label}</span></div>
            <strong class="metric-value">${value}</strong>
            <span class="metric-note">${note}</span>
          </article>
        `).join("")}
      </section>
      <div class="layout-grid">
        <section class="panel">
          <div class="panel-head">
            <div><h2>自动提醒与风险队列</h2><p>按部门隔离，高优汇款失败会明确提示。</p></div>
          </div>
          <div class="panel-body">
            ${alerts.length ? `<div class="issue-list">${alerts.map(renderAlert).join("")}</div>` :
              '<div class="empty-state"><strong>当前没有未处理风险</strong><span>系统会持续扫描汇款失败、材料缺失和节点逾期。</span></div>'}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h2>可执行动作</h2><p>根据当前角色显示。</p></div></div>
          <div class="panel-body">
            <div class="issue-list">
              ${session.user.role !== "member" ? renderAction("生成节点复盘", "按任意日期范围汇总完成、进行中和未启动任务。", "snapshots") : ""}
              ${session.user.role !== "member" ? renderAction("导出应做未做名单", "按体检、疗休养、福利或到账状态筛选。", "people") : ""}
              ${renderAction("查询资金流转", "查看工资卡汇款状态、失败原因和到账结果。", "payments")}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async function renderSnapshots() {
    const snapshots = await api("/snapshots");
    return `
      ${pageHead("节点总结与复盘引擎", "支持季度、五一、疗休养专项、半年或任意自定义节点。", "")}
      <div class="layout-grid">
        <section class="panel">
          <div class="panel-head"><div><h2>生成节点报告</h2><p>生成前可先预览任务矩阵。</p></div></div>
          <div class="panel-body">
            <form data-form="snapshot-form">
              <div class="form-grid">
                <div class="field">
                  <label for="snapshot-department">部门</label>
                  <select class="select" id="snapshot-department" name="department_id">${departmentOptions()}</select>
                </div>
                <div class="field">
                  <label for="snapshot-preset">时间轴节点</label>
                  <select class="select" id="snapshot-preset" name="preset">
                    <option value="first_quarter">第一季度</option>
                    <option value="may_day">五一节点</option>
                    <option value="retreat_special">疗休养专项节点</option>
                    <option value="half_year">半年节点</option>
                    <option value="annual">年度节点</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
                <div class="field">
                  <label for="snapshot-title">报告标题</label>
                  <input class="input" id="snapshot-title" name="title" value="${currentYear}年五一节点工会工作复盘报告" required />
                </div>
                <div class="field">
                  <label for="snapshot-start">开始日期</label>
                  <input class="input" id="snapshot-start" name="start_date" type="date" value="${currentYear}-01-01" required />
                </div>
                <div class="field">
                  <label for="snapshot-end">结束日期</label>
                  <input class="input" id="snapshot-end" name="end_date" type="date" value="${today()}" required />
                </div>
                <div class="field full">
                  <label for="snapshot-labels">节点标签</label>
                  <input class="input" id="snapshot-labels" name="labels" value="五一节点" placeholder="用逗号分隔多个标签" />
                </div>
              </div>
              <div class="toolbar" style="margin-top:14px">
                <div class="toolbar-group"></div>
                <div class="toolbar-group">
                  <button class="button" type="submit" data-snapshot-mode="preview">预览矩阵</button>
                  <button class="button primary" type="submit" data-snapshot-mode="generate">生成正式报告</button>
                </div>
              </div>
              <input type="hidden" name="mode" value="preview" />
            </form>
            <div id="snapshot-preview">${lastSnapshot ? renderSnapshotResult(lastSnapshot) : ""}</div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h2>历史节点报告</h2><p>PDF/Word 均可导出。</p></div></div>
          <div class="panel-body flush">
            ${snapshots.length ? snapshots.map((item) => `
              <div class="record-row">
                <div><strong>${escapeHtml(item.title)}</strong><span>${item.start_date} 至 ${item.end_date}</span></div>
                <div class="table-actions">
                  <button class="button small" data-cloud-action="download-snapshot" data-id="${item.id}" data-format="pdf">PDF</button>
                  <button class="button small" data-cloud-action="download-snapshot" data-id="${item.id}" data-format="docx">Word</button>
                </div>
              </div>
            `).join("") : '<div class="empty-state"><strong>尚无节点报告</strong><span>生成后会自动保存在部门台账中。</span></div>'}
          </div>
        </section>
      </div>
    `;
  }

  async function renderPayments() {
    membersCache = await api("/members");
    const payments = await api("/payments");
    const pendingIds = payments.filter((item) => item.state === "pending").map((item) => item.id);
    return `
      ${pageHead("资金流转台账", "工资卡仅显示尾号；银行盘由后端解密生成，前端永远拿不到完整卡号。", "")}
      <section class="panel">
        <div class="panel-head">
          <div><h2>工资卡汇款追踪</h2><p>状态机：待汇款 → 已生成银行盘 → 银行处理中 → 已到账 / 汇款失败。</p></div>
          ${session.user.role !== "member" ? `<button class="button primary" data-cloud-action="generate-bank-file" ${pendingIds.length ? "" : "disabled"}>生成银行盘（${pendingIds.length}笔）</button>` : ""}
        </div>
        <div class="panel-body flush">
          ${payments.length ? `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>选择</th><th>收款人/部门</th><th>工资卡</th><th>金额</th><th>汇款状态</th><th>失败原因</th><th>操作</th></tr></thead>
                <tbody>
                  ${payments.map((item) => `
                    <tr>
                      <td>${item.state === "pending" && session.user.role !== "member" ? `<input type="checkbox" data-payment-select value="${item.id}" ${selectedPaymentIds.has(item.id) ? "checked" : ""}>` : "-"}</td>
                      <td>${memberLabel(item.member_id)}<br><span class="muted">${escapeHtml(departmentLabel(item.department_id))}</span></td>
                      <td>尾号 ${item.bank_card_last4}<br><span class="muted">${escapeHtml(item.bank_name)}</span></td>
                      <td>${money(item.amount)}元</td>
                      <td>${paymentBadge(item.state)}</td>
                      <td>${escapeHtml(item.failure_reason || "-")}</td>
                      <td>${renderPaymentActions(item)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : '<div class="empty-state"><strong>尚无银行汇款记录</strong><span>在福利发放中选择“银行汇款”后自动生成。</span></div>'}
        </div>
      </section>
    `;
  }

  async function renderPeople() {
    const members = await api("/members");
    membersCache = members;
    const gaps = session.user.role !== "member" ? await api(`/people/gaps?year=${currentYear}`) : [];
    return `
      ${pageHead("人员节点清册", "输入人员查看年度福利、体检、疗休养和慰问金到账全景。", "")}
      <div class="layout-grid">
        <section class="panel">
          <div class="panel-head"><div><h2>个人全景</h2><p>会员角色只能查询本人。</p></div></div>
          <div class="panel-body">
            <div class="toolbar">
              <select class="select" id="panorama-member">
                ${members.map((member) => `<option value="${member.id}">${escapeHtml(member.name)} · ${escapeHtml(member.employee_no || "无编号")}</option>`).join("")}
              </select>
              <button class="button primary" data-cloud-action="load-panorama">查询</button>
            </div>
            <div id="panorama-result"></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head">
            <div><h2>应做未做名单</h2><p>可直接生成 Excel 发给部门负责人。</p></div>
            ${session.user.role !== "member" ? '<button class="button primary" data-cloud-action="export-gaps">导出Excel</button>' : ""}
          </div>
          <div class="panel-body flush">
            ${session.user.role === "member" ? '<div class="empty-state"><strong>会员无部门名单权限</strong><span>仅部门管理员和区总工会可导出催办名单。</span></div>' :
              gaps.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>部门</th><th>姓名</th><th>编号</th><th>缺失事项</th></tr></thead><tbody>${gaps.map((row) => `<tr><td>${escapeHtml(row.department_name)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.employee_no)}</td><td>${escapeHtml(row.gap)}</td></tr>`).join("")}</tbody></table></div>` :
              '<div class="empty-state"><strong>没有应做未做人员</strong><span>当前年度体检、疗休养、福利和到账记录均已落实。</span></div>'}
          </div>
        </section>
      </div>
    `;
  }

  async function renderMembers() {
    const members = await api("/members");
    membersCache = members;
    return `
      ${pageHead("人员登记", "身份证和工资卡采用加密存储，列表只显示尾号。", `
        <button class="button" data-cloud-action="import-members">批量导入</button>
        <button class="button primary" data-cloud-action="add-member">新增人员</button>
      `)}
      <section class="panel">
        <div class="panel-head"><div><h2>部门人员台账</h2><p>部门管理员只能看到本部门。</p></div></div>
        <div class="panel-body flush">
          ${members.length ? `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>姓名</th><th>编号</th><th>状态</th><th>会费/工资口径</th><th>身份证</th><th>工资卡</th><th>开户行</th><th>操作</th></tr></thead>
                <tbody>
                  ${members.map((member) => `
                    <tr>
                      <td><strong>${escapeHtml(member.name)}</strong></td>
                      <td>${escapeHtml(member.employee_no || "-")}</td>
                      <td>${member.status === "active" ? '<span class="badge green">在职</span>' : `<span class="badge">${escapeHtml(member.status)}</span>`}</td>
                      <td>${member.dues_paid ? "会费已缴" : "会费未缴"} / ${member.salary_included ? "工资已纳入" : "工资未纳入"}</td>
                      <td>${member.id_card_last4 ? `尾号 ${member.id_card_last4}` : "-"}</td>
                      <td>${member.bank_card_last4 ? `尾号 ${member.bank_card_last4}` : "-"}</td>
                      <td>${escapeHtml(member.bank_name || "-")}</td>
                      <td><button class="button small" data-cloud-action="edit-member" data-id="${member.id}">编辑</button></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : '<div class="empty-state"><strong>尚无人员</strong><span>支持单笔新增和 CSV 批量导入。</span></div>'}
        </div>
      </section>
    `;
  }

  async function renderBenefits() {
    membersCache = await api("/members");
    const benefits = await api("/benefits");
    return `
      ${pageHead("福利发放", "强化实物、电子券、银行汇款三种发放方式。", session.user.role !== "member" ? '<button class="button primary" data-cloud-action="add-benefit">登记发放</button>' : "")}
      <section class="panel">
        <div class="panel-head"><div><h2>福利与资金流转</h2><p>银行汇款失败时会自动写入高优风险队列。</p></div></div>
        <div class="panel-body flush">
          ${benefits.length ? `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>日期</th><th>人员</th><th>项目</th><th>金额</th><th>发放方式</th><th>审批/签收</th><th>汇款状态</th></tr></thead>
                <tbody>
                  ${benefits.map((item) => `
                    <tr>
                      <td>${item.issue_date}</td>
                      <td>${memberLabel(item.member_id)}</td>
                      <td>${escapeHtml(item.benefit_type)}</td>
                      <td>${money(item.amount)}元</td>
                      <td>${methodLabel(item.payment_method)}</td>
                      <td>${item.approval_ref ? "已审批" : '<span class="danger-text">缺审批</span>'} / ${item.signed ? "已签收" : '<span class="danger-text">未签收</span>'}</td>
                      <td>${item.payment ? paymentBadge(item.payment.state) : "-"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : '<div class="empty-state"><strong>尚无福利记录</strong><span>选择银行汇款后，资金流转台账会自动生成。</span></div>'}
        </div>
      </section>
    `;
  }

  async function renderExams() {
    const plans = await api("/exams");
    return `
      ${pageHead("职工体检", "只记录组织覆盖与完成状态，不保存体检结果。", session.user.role !== "member" ? '<button class="button primary" data-cloud-action="add-exam">新建体检计划</button>' : "")}
      <section class="panel">
        <div class="panel-head"><div><h2>体检计划</h2><p>体检费用由行政承担，工会受委托承办。</p></div></div>
        <div class="panel-body flush">
          ${plans.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>计划</th><th>时间</th><th>机构</th><th>经费来源</th><th>状态</th></tr></thead><tbody>${plans.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.start_date} 至 ${item.end_date}</td><td>${escapeHtml(item.provider || "-")}</td><td>${escapeHtml(item.fund_source)}</td><td>${escapeHtml(item.status)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty-state"><strong>尚无体检计划</strong><span>新建后会为全部在职人员生成待检记录。</span></div>'}
        </div>
      </section>
    `;
  }

  async function renderRetreats() {
    const plans = await api("/retreats");
    return `
      ${pageHead("职工疗休养", "两级权限分别管理计划和会员报名。", session.user.role !== "member" ? '<button class="button primary" data-cloud-action="add-retreat">新建疗休养计划</button>' : "")}
      <section class="panel">
        <div class="panel-head"><div><h2>疗休养批次</h2><p>会员可对开放计划发起报名。</p></div></div>
        <div class="panel-body flush">
          ${plans.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>计划</th><th>地点</th><th>时间</th><th>日标准</th><th>保障</th><th>状态</th><th>操作</th></tr></thead><tbody>${plans.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.location)}</td><td>${item.start_date} 至 ${item.end_date}</td><td>${money(item.per_person_per_day)}元</td><td>${item.insurance_confirmed ? '<span class="badge green">已购保险</span>' : '<span class="badge red">未购保险</span>'}</td><td>${escapeHtml(item.status)}</td><td>${session.user.role === "member" ? `<button class="button small" data-cloud-action="register-retreat" data-id="${item.id}">报名</button>` : "-"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty-state"><strong>尚无疗休养计划</strong><span>部门管理员可新建批次。</span></div>'}
        </div>
      </section>
    `;
  }

  async function renderAdmin() {
    await loadDepartments();
    return `
      ${pageHead("部门与授权", "部门入口二维码和邀请码是阻止外部人员注册的第一道门。", "")}
      <div class="layout-grid">
        <section class="panel">
          <div class="panel-head">
            <div><h2>部门清单</h2><p>超级管理员可新增，部门管理员只能查看本部门。</p></div>
            ${session.user.role === "super_admin" ? '<button class="button primary" data-cloud-action="add-department">新增部门</button>' : ""}
          </div>
          <div class="panel-body flush">
            ${departments.map((department) => `
              <div class="record-row">
                <div><strong>${escapeHtml(department.name)}</strong><span>${escapeHtml(department.code)}</span></div>
                <div class="table-actions">
                  <button class="button small" data-cloud-action="show-qr" data-id="${department.id}">入口二维码</button>
                  <button class="button small primary" data-cloud-action="create-invite" data-id="${department.id}">生成邀请码</button>
                </div>
              </div>
            `).join("")}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h2>安全边界</h2><p>部署后必须做的四项检查。</p></div></div>
          <div class="panel-body">
            <div class="issue-list">
              ${renderIssue("pass", "登录令牌只保存在会话存储", "关闭浏览器后需要重新登录。")}
              ${renderIssue("pass", "部门管理员禁止跨部门查询", "后端 ScopedRepository 强制注入部门条件。")}
              ${renderIssue("pass", "工资卡仅显示后四位", "完整卡号仅由银行盘导出接口解密。")}
              ${renderIssue("warn", "生产密钥必须更换", "上线前修改 SECRET_KEY 和超级管理员初始密码。")}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function bindEvents() {
    document.getElementById("login-form").addEventListener("submit", submitLogin);
    document.getElementById("register-form").addEventListener("submit", submitRegister);
    document.querySelectorAll("[data-login-tab]").forEach((button) => {
      button.addEventListener("click", () => switchLoginTab(button.dataset.loginTab));
    });
    yearSelect.addEventListener("change", () => {
      currentYear = Number(yearSelect.value);
      render();
    });
    document.addEventListener("click", async (event) => {
      const routeButton = event.target.closest("[data-route]");
      if (routeButton) {
        currentRoute = routeButton.dataset.route;
        location.hash = currentRoute;
        closeMobileMenu();
        await render();
        return;
      }
      const actionButton = event.target.closest("[data-cloud-action]");
      if (actionButton) {
        await handleAction(actionButton.dataset.cloudAction, actionButton);
      }
    });
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-payment-select]")) {
        if (event.target.checked) selectedPaymentIds.add(event.target.value);
        else selectedPaymentIds.delete(event.target.value);
      }
      if (event.target.id === "snapshot-preset") {
        applySnapshotPreset(event.target.value);
      }
      if (event.target.name === "payment_method" && event.target.closest('[data-form="benefit-form"]')) {
        const bankFields = event.target.closest("form").querySelector("[data-bank-fields]");
        bankFields.classList.toggle("hidden", event.target.value !== "bank_transfer");
      }
    });
    document.addEventListener("submit", handleSubmit);
    window.addEventListener("hashchange", async () => {
      currentRoute = normalizeRoute(location.hash.replace("#", ""));
      if (session.user) await render();
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    }
  }

  async function handleAction(action, element) {
    if (action === "logout") logout();
    if (action === "toggle-menu") {
      sidebar.classList.toggle("open");
    }
    if (action === "add-member") openMemberForm();
    if (action === "edit-member") await openMemberForm(element.dataset.id);
    if (action === "import-members") openMemberImport();
    if (action === "add-benefit") openBenefitForm();
    if (action === "add-exam") openExamForm();
    if (action === "add-retreat") openRetreatForm();
    if (action === "add-department") openDepartmentForm();
    if (action === "create-invite") await createInvite(element.dataset.id);
    if (action === "show-qr") await showDepartmentQr(element.dataset.id);
    if (action === "export-gaps") await downloadFile(`/people/gaps/export?year=${currentYear}`, `gaps-${currentYear}.xlsx`);
    if (action === "load-panorama") await loadPanorama();
    if (action === "download-snapshot") {
      await downloadFile(`/snapshots/${element.dataset.id}/export?format=${element.dataset.format}`, `节点复盘报告.${element.dataset.format}`);
    }
    if (action === "generate-bank-file") await generateBankFile();
    if (action === "payment-next") await transitionPayment(element.dataset.id, element.dataset.state);
    if (action === "register-retreat") {
      await api(`/retreats/${element.dataset.id}/register`, { method: "POST", body: {} });
      toast("报名成功");
      await render();
    }
  }

  async function handleSubmit(event) {
    const form = event.target.closest("[data-form]");
    if (!form) return;
    event.preventDefault();
    const type = form.dataset.form;
    try {
      if (type === "member-form") return await submitMember(form);
      if (type === "member-import-form") return await submitMemberImport(form);
      if (type === "benefit-form") return await submitBenefit(form);
      if (type === "exam-form") return await submitExam(form);
      if (type === "retreat-form") return await submitRetreat(form);
      if (type === "department-form") return await submitDepartment(form);
      if (type === "snapshot-form") return await submitSnapshot(form, event.submitter?.dataset.snapshotMode || "preview");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: {
          username: form.get("username"),
          password: form.get("password")
        },
        auth: false
      });
      saveSession(result);
    } catch (error) {
      document.getElementById("login-note").textContent = error.message;
      document.getElementById("login-note").classList.add("danger-text");
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const result = await api("/auth/register", {
        method: "POST",
        body: {
          invite_code: form.get("invite_code"),
          display_name: form.get("display_name"),
          username: form.get("username"),
          password: form.get("password")
        },
        auth: false
      });
      saveSession(result);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function saveSession(result) {
    session.token = result.access_token;
    session.user = result.user;
    sessionStorage.setItem(STORAGE_KEY, session.token);
    try {
      const me = await api("/auth/me");
      session.user = me.user;
    } catch (error) {
      logout();
      return;
    }
    await loadDepartments();
    showApp();
    currentRoute = "dashboard";
    location.hash = "dashboard";
    await render();
  }

  function switchLoginTab(tab) {
    document.querySelectorAll("[data-login-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.loginTab === tab);
    });
    document.getElementById("login-form").classList.toggle("hidden", tab !== "login");
    document.getElementById("register-form").classList.toggle("hidden", tab !== "register");
  }

  function logout() {
    session = { token: "", user: null };
    sessionStorage.removeItem(STORAGE_KEY);
    showLogin();
    document.getElementById("login-note").textContent = "已安全退出。";
  }

  async function loadDepartments() {
    departments = await api("/departments");
  }

  function fillYears() {
    const years = [];
    for (let year = currentYear + 1; year >= currentYear - 3; year -= 1) years.push(year);
    yearSelect.innerHTML = years.map((year) => `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}年</option>`).join("");
  }

  function pageHead(title, description, actions) {
    return `<div class="page-head"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div><div class="page-actions">${actions || ""}</div></div>`;
  }

  function quickActions() {
    const actions = [];
    if (session.user.role !== "member") actions.push('<button class="button" data-route="snapshots">节点复盘</button>');
    actions.push('<button class="button primary" data-route="payments">资金流转</button>');
    return actions.join("");
  }

  function renderAction(title, text, route) {
    return `<button class="action-card" data-route="${route}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></button>`;
  }

  function renderAlert(alert) {
    return renderIssue(alert.priority === "high" ? "block" : "warn", alert.title, alert.detail);
  }

  function renderIssue(level, title, detail) {
    return `<article class="issue ${level}"><span class="issue-mark">${level === "block" ? "!" : level === "pass" ? "✓" : "·"}</span><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div></article>`;
  }

  function renderSnapshotResult(result) {
    const summary = result.summary;
    return `
      <div class="snapshot-result">
        <div class="split-row">
          <div class="metric-mini"><span>活动/专项</span><strong>${summary.activity_count}场</strong></div>
          <div class="metric-mini"><span>体检覆盖</span><strong>${summary.exam_covered_count}人 / ${summary.exam_coverage_percent}%</strong></div>
          <div class="metric-mini"><span>疗休养批次</span><strong>${summary.retreat_completed_batch_count}个</strong></div>
          <div class="metric-mini"><span>汇款到账</span><strong>${summary.payment_credited_count}笔</strong></div>
        </div>
        <div class="task-matrix">
          ${summary.tasks.map((task) => `
            <article class="task-cell ${task.state}">
              <span class="task-dot"></span>
              <div>
                <strong>${escapeHtml(task.title)}</strong>
                <p>${escapeHtml(task.detail)}</p>
                ${task.blockers.length ? `<small>待落实：${escapeHtml(task.blockers.slice(0, 12).join("、"))}</small>` : ""}
              </div>
            </article>
          `).join("")}
        </div>
        <pre class="report-preview">${escapeHtml(result.report_text)}</pre>
      </div>
    `;
  }

  function renderPaymentActions(item) {
    if (session.user.role === "member") return "-";
    const next = {
      bank_file_generated: ["bank_processing", "银行处理中"],
      bank_processing: ["credited", "确认到账"],
      failed_card: ["pending", "修正后重试"],
      failed_frozen: ["pending", "解除冻结后重试"]
    };
    const actions = [];
    if (next[item.state]) {
      actions.push(`<button class="button small" data-cloud-action="payment-next" data-id="${item.id}" data-state="${next[item.state][0]}">${next[item.state][1]}</button>`);
    }
    if (item.state === "bank_processing") {
      actions.push(`<button class="button small danger" data-cloud-action="payment-next" data-id="${item.id}" data-state="failed_card">卡号错误</button>`);
      actions.push(`<button class="button small danger" data-cloud-action="payment-next" data-id="${item.id}" data-state="failed_frozen">账户冻结</button>`);
    }
    return actions.join(" ") || "-";
  }

  function paymentBadge(state) {
    const tone = state === "credited" ? "green" : state.startsWith("failed") ? "red" : state === "pending" ? "amber" : "blue";
    return `<span class="badge ${tone}">${PAYMENT_LABELS[state] || state}</span>`;
  }

  async function transitionPayment(id, state) {
    let failureReason = "";
    if (state.startsWith("failed")) {
      failureReason = prompt("请输入银行返回的失败原因") || (state === "failed_card" ? "卡号错误" : "账户冻结");
    }
    await api(`/payments/${id}/transition`, {
      method: "POST",
      body: { target_state: state, failure_reason: failureReason || null }
    });
    toast("汇款状态已更新");
    await render();
  }

  async function generateBankFile() {
    const ids = [...selectedPaymentIds];
    if (!ids.length) {
      toast("请先勾选待汇款记录", "error");
      return;
    }
    await downloadFile("/payments/bank-file", "银行批量代发盘.xlsx", { payment_ids: ids }, "POST");
    selectedPaymentIds.clear();
    await render();
  }

  async function loadPanorama() {
    const memberId = document.getElementById("panorama-member")?.value;
    if (!memberId) return;
    const result = await api(`/people/${memberId}/panorama?year=${currentYear}`);
    document.getElementById("panorama-result").innerHTML = `
      <div class="answer-box">
        <h3>${escapeHtml(result.member.name)} · ${currentYear}年全景</h3>
        <div class="split-row">
          <div class="metric-mini"><span>福利记录</span><strong>${result.benefits.length}笔</strong></div>
          <div class="metric-mini"><span>体检</span><strong>${result.exam.status === "completed" ? "已完成" : "未完成"}</strong></div>
          <div class="metric-mini"><span>疗休养</span><strong>${result.retreat.registered ? "已报名" : "未报名"}</strong></div>
          <div class="metric-mini"><span>到账</span><strong>${result.payment_ledger.every((item) => item.state === "credited") ? "均已到账" : "存在待处理"}</strong></div>
        </div>
        ${result.gaps.length ? `<div class="issue warn"><span class="issue-mark">!</span><div><strong>待落实事项</strong><span>${escapeHtml(result.gaps.join("、"))}</span></div></div>` : renderIssue("pass", "本年度事项均已落实", "没有识别到应做未做事项。")}
      </div>
    `;
  }

  function openMemberForm(memberId) {
    const member = membersCache.find((item) => item.id === memberId) || {};
    openDialog(`
      ${dialogHead(memberId ? "编辑人员" : "新增人员", "完整身份证与工资卡不会在前端回显。")}
      <form data-form="member-form">
        <input type="hidden" name="id" value="${memberId || ""}">
        <div class="dialog-body">
          <div class="form-grid">
            <div class="field"><label>姓名</label><input class="input" name="name" value="${attr(member.name || "")}" required></div>
            <div class="field"><label>人员编号</label><input class="input" name="employee_no" value="${attr(member.employee_no || "")}"></div>
            <div class="field"><label>部门</label><select class="select" name="department_id">${departmentOptions(member.department_id)}</select></div>
            <div class="field"><label>状态</label><select class="select" name="status">${option("active", "在职", member.status || "active")}${option("retired", "离退休", member.status)}${option("inactive", "其他", member.status)}</select></div>
            <div class="field"><label>身份证号</label><input class="input" name="id_card" placeholder="${member.id_card_last4 ? "已存尾号 " + member.id_card_last4 : "仅用于加密存储"}"></div>
            <div class="field"><label>工资卡号</label><input class="input" name="bank_card" placeholder="${member.bank_card_last4 ? "已存尾号 " + member.bank_card_last4 : "仅用于银行汇款"}"></div>
            <div class="field"><label>开户行</label><input class="input" name="bank_name" value="${attr(member.bank_name || "")}"></div>
            <div class="field"><label>用工形式</label><select class="select" name="employment_type">${option("regular", "在编/正式", member.employment_type || "regular")}${option("contract", "合同制", member.employment_type)}${option("dispatched", "借用/派遣", member.employment_type)}</select></div>
          </div>
        </div>
        <div class="dialog-foot"><button class="button" type="button" data-cloud-action="close-dialog">取消</button><button class="button primary" type="submit">保存人员</button></div>
      </form>
    `);
  }

  async function submitMember(form) {
    const data = Object.fromEntries(new FormData(form));
    const id = data.id;
    delete data.id;
    const payload = {
      ...data,
      is_member: true,
      dues_paid: true,
      salary_included: true,
      benefit_location: "current"
    };
    await api(id ? `/members/${id}` : "/members", { method: id ? "PUT" : "POST", body: payload });
    closeDialog();
    toast("人员信息已保存");
    await render();
  }

  function openMemberImport() {
    openDialog(`
      ${dialogHead("批量导入人员", "CSV字段：姓名,人员编号,部门编码,身份证号,工资卡号,开户行")}
      <form data-form="member-import-form">
        <div class="dialog-body">
          <textarea class="textarea" name="csv" rows="12" placeholder="张晨,001,general-office,320000199001011234,6222020202020202,中国工商银行"></textarea>
        </div>
        <div class="dialog-foot"><button class="button" type="button" data-cloud-action="close-dialog">取消</button><button class="button primary" type="submit">导入</button></div>
      </form>
    `);
  }

  async function submitMemberImport(form) {
    const csv = new FormData(form).get("csv");
    const departmentMap = Object.fromEntries(departments.map((item) => [item.code, item.id]));
    const rows = String(csv || "").split(/\r?\n/).filter(Boolean).map((line) => {
      const [name, employee_no, department_code, id_card, bank_card, bank_name] = line.split(/\t|,/).map((item) => item.trim());
      if (!departmentMap[department_code]) throw new Error(`部门编码不存在：${department_code}`);
      return {
        name,
        employee_no,
        department_id: departmentMap[department_code],
        id_card,
        bank_card,
        bank_name,
        status: "active",
        employment_type: "regular"
      };
    });
    const result = await api("/members/import", { method: "POST", body: rows });
    closeDialog();
    toast(`已导入${result.created}人`);
    await render();
  }

  function openBenefitForm() {
    openDialog(`
      ${dialogHead("登记福利发放", "选择银行汇款后必须登记工资卡和开户行。")}
      <form data-form="benefit-form">
        <div class="dialog-body">
          <div class="form-grid">
            <div class="field"><label>部门</label><select class="select" name="department_id">${departmentOptions()}</select></div>
            <div class="field"><label>人员</label><select class="select" name="member_id" required>${membersCache.map((member) => `<option value="${member.id}">${escapeHtml(member.name)} · ${escapeHtml(member.employee_no || "无编号")}</option>`).join("")}</select></div>
            <div class="field"><label>福利类型</label><input class="input" name="benefit_type" value="节日慰问" required></div>
            <div class="field"><label>金额</label><input class="input" name="amount" type="number" min="0.01" step="0.01" required></div>
            <div class="field"><label>发放日期</label><input class="input" name="issue_date" type="date" value="${today()}" required></div>
            <div class="field"><label>发放方式</label><select class="select" name="payment_method">${option("physical", "实物", "physical")}${option("electronic_voucher", "电子券")}${option("bank_transfer", "银行汇款")}</select></div>
            <div class="field"><label>审批编号</label><input class="input" name="approval_ref"></div>
            <div class="field"><label class="check-item"><input type="checkbox" name="signed"><span>已实名签收</span></label></div>
            <div class="field full hidden" data-bank-fields>
              <div class="form-grid">
                <div class="field"><label>工资卡号</label><input class="input" name="bank_card" placeholder="留空则使用人员档案中的卡号"></div>
                <div class="field"><label>开户行</label><input class="input" name="bank_name"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-foot"><button class="button" type="button" data-cloud-action="close-dialog">取消</button><button class="button primary" type="submit">保存</button></div>
      </form>
    `);
  }

  async function submitBenefit(form) {
    const data = Object.fromEntries(new FormData(form));
    data.amount = Number(data.amount);
    data.signed = form.elements.signed.checked;
    await api("/benefits", { method: "POST", body: data });
    closeDialog();
    toast("福利记录已保存");
    await render();
  }

  function openExamForm() {
    openDialog(`
      ${dialogHead("新建体检计划", "系统只生成组织记录，不收集体检结果。")}
      <form data-form="exam-form">
        <div class="dialog-body"><div class="form-grid">
          <div class="field"><label>部门</label><select class="select" name="department_id">${departmentOptions()}</select></div>
          <div class="field"><label>年度</label><input class="input" name="year" type="number" value="${currentYear}"></div>
          <div class="field full"><label>计划名称</label><input class="input" name="name" value="${currentYear}年度职工体检" required></div>
          <div class="field"><label>开始日期</label><input class="input" name="start_date" type="date" value="${today()}"></div>
          <div class="field"><label>结束日期</label><input class="input" name="end_date" type="date" value="${today()}"></div>
          <div class="field"><label>体检机构</label><input class="input" name="provider"></div>
          <div class="field"><label>行政预算</label><input class="input" name="budget" type="number" value="0"></div>
        </div></div>
        <div class="dialog-foot"><button class="button" type="button" data-cloud-action="close-dialog">取消</button><button class="button primary" type="submit">生成计划</button></div>
      </form>
    `);
  }

  async function submitExam(form) {
    const data = Object.fromEntries(new FormData(form));
    data.year = Number(data.year);
    data.budget = Number(data.budget);
    await api("/exams", { method: "POST", body: data });
    closeDialog();
    toast("体检计划已生成");
    await render();
  }

  function openRetreatForm() {
    openDialog(`
      ${dialogHead("新建疗休养计划", "地点应符合疗休养基地或皖美民宿要求。")}
      <form data-form="retreat-form">
        <div class="dialog-body"><div class="form-grid">
          <div class="field"><label>部门</label><select class="select" name="department_id">${departmentOptions()}</select></div>
          <div class="field full"><label>计划名称</label><input class="input" name="title" value="${currentYear}年疗休养活动"></div>
          <div class="field full"><label>地点</label><input class="input" name="location" value="林海生态园"></div>
          <div class="field"><label>开始日期</label><input class="input" name="start_date" type="date" value="${today()}"></div>
          <div class="field"><label>结束日期</label><input class="input" name="end_date" type="date" value="${today()}"></div>
          <div class="field"><label>每人每天</label><input class="input" name="per_person_per_day" type="number" value="390"></div>
          <div class="field"><label>采购程序</label><input class="input" name="procurement_procedure" value="quotation"></div>
          <div class="field"><label class="check-item"><input type="checkbox" name="insurance_confirmed"><span>已购人身意外保险</span></label></div>
        </div></div>
        <div class="dialog-foot"><button class="button" type="button" data-cloud-action="close-dialog">取消</button><button class="button primary" type="submit">保存计划</button></div>
      </form>
    `);
  }

  async function submitRetreat(form) {
    const data = Object.fromEntries(new FormData(form));
    data.per_person_per_day = Number(data.per_person_per_day);
    data.insurance_confirmed = form.elements.insurance_confirmed.checked;
    await api("/retreats", { method: "POST", body: data });
    closeDialog();
    toast("疗休养计划已保存");
    await render();
  }

  function openDepartmentForm() {
    openDialog(`
      ${dialogHead("新增部门", "部门编码用于批量导入和部门入口链接。")}
      <form data-form="department-form">
        <div class="dialog-body"><div class="form-grid">
          <div class="field"><label>部门名称</label><input class="input" name="name" required></div>
          <div class="field"><label>部门编码</label><input class="input" name="code" placeholder="economic-development" required></div>
        </div></div>
        <div class="dialog-foot"><button class="button" type="button" data-cloud-action="close-dialog">取消</button><button class="button primary" type="submit">保存部门</button></div>
      </form>
    `);
  }

  async function submitDepartment(form) {
    const data = Object.fromEntries(new FormData(form));
    await api("/departments", { method: "POST", body: data });
    closeDialog();
    toast("部门已新增");
    await render();
  }

  async function createInvite(departmentId) {
    const role = session.user.role === "super_admin" ? (prompt("输入角色：department_admin 或 member", "member") || "member") : "member";
    const result = await api("/auth/invites", {
      method: "POST",
      body: { department_id: departmentId, role, max_uses: 1, expires_in_days: 30 }
    });
    openDialog(`
      ${dialogHead("部门邀请码", "请通过内部渠道单独发送，不要公开张贴。")}
      <div class="dialog-body">
        <div class="invite-code">${escapeHtml(result.code)}</div>
        <p class="muted">角色：${ROLE_LABELS[result.role] || result.role}；有效期至 ${formatDateTime(result.expires_at)}。</p>
      </div>
      <div class="dialog-foot"><button class="button primary" data-cloud-action="close-dialog">完成</button></div>
    `);
  }

  async function showDepartmentQr(departmentId) {
    const blob = await apiBlob(`/departments/${departmentId}/qr`);
    const url = URL.createObjectURL(blob);
    openDialog(`
      ${dialogHead("部门专属入口二维码", "扫码后仍必须登录或使用邀请码注册。")}
      <div class="dialog-body qr-wrap"><img src="${url}" alt="部门入口二维码" /></div>
      <div class="dialog-foot"><button class="button primary" data-cloud-action="close-dialog">关闭</button></div>
    `);
  }

  async function submitSnapshot(form, mode) {
    const values = Object.fromEntries(new FormData(form));
    const payload = {
      department_id: values.department_id || session.user.department_id,
      title: values.title,
      start_date: values.start_date,
      end_date: values.end_date,
      labels: String(values.labels || "").split(/[,，、]/).map((item) => item.trim()).filter(Boolean)
    };
    if (!payload.department_id) throw new Error("请先选择或创建部门");
    if (mode === "generate") {
      const saved = await api("/snapshots", { method: "POST", body: payload });
      lastSnapshot = { summary: JSON.parse(saved.summary_json), report_text: saved.report_text };
      toast("节点报告已生成");
      document.getElementById("snapshot-preview").innerHTML = renderSnapshotResult(lastSnapshot);
      await render();
    } else {
      lastSnapshot = await api("/snapshots/preview", { method: "POST", body: payload });
      document.getElementById("snapshot-preview").innerHTML = renderSnapshotResult(lastSnapshot);
      toast("节点矩阵已预览");
    }
  }

  function applySnapshotPreset(preset) {
    const start = document.getElementById("snapshot-start");
    const end = document.getElementById("snapshot-end");
    const title = document.getElementById("snapshot-title");
    const labels = document.getElementById("snapshot-labels");
    if (preset === "first_quarter") {
      start.value = `${currentYear}-01-01`; end.value = `${currentYear}-03-31`; title.value = `${currentYear}年第一季度工会工作复盘报告`; labels.value = "第一季度";
    } else if (preset === "may_day") {
      start.value = `${currentYear}-04-15`; end.value = `${currentYear}-05-10`; title.value = `${currentYear}年五一节点工会工作复盘报告`; labels.value = "五一节点";
    } else if (preset === "retreat_special") {
      start.value = `${currentYear}-06-01`; end.value = `${currentYear}-09-30`; title.value = `${currentYear}年疗休养专项节点复盘报告`; labels.value = "疗休养专项";
    } else if (preset === "half_year") {
      start.value = `${currentYear}-01-01`; end.value = `${currentYear}-06-30`; title.value = `${currentYear}年半年节点工会工作复盘报告`; labels.value = "半年节点";
    } else if (preset === "annual") {
      start.value = `${currentYear}-01-01`; end.value = `${currentYear}-12-31`; title.value = `${currentYear}年度工会工作复盘报告`; labels.value = "年度节点";
    }
  }

  function departmentOptions(selected) {
    const visible = session.user.role === "super_admin"
      ? departments
      : departments.filter((department) => department.id === session.user.department_id);
    return visible.map((department) => option(department.id, department.name, selected || session.user.department_id)).join("");
  }

  function option(value, label, selected) {
    return `<option value="${attr(value)}" ${String(value) === String(selected || "") ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }

  function memberLabel(memberId) {
    return dashboardData?.memberMap?.[memberId]
      || membersCache.find((member) => member.id === memberId)?.name
      || memberId;
  }

  function departmentLabel(departmentId) {
    return departments.find((department) => department.id === departmentId)?.name || departmentId;
  }

  function methodLabel(method) {
    return { physical: "实物", electronic_voucher: "电子券", bank_transfer: "银行汇款" }[method] || method;
  }

  function money(value) {
    return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function today() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function formatDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function attr(value) {
    return escapeHtml(value).replace(/\n/g, " ");
  }

  function renderError(message) {
    return `<section class="panel"><div class="panel-body"><div class="issue block"><span class="issue-mark">!</span><div><strong>加载失败</strong><span>${escapeHtml(message)}</span></div></div></div></section>`;
  }

  function openDialog(html) {
    dialog.innerHTML = html;
    dialog.showModal();
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  function dialogHead(title, description) {
    return `<div class="dialog-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div><button class="button small" data-cloud-action="close-dialog" type="button">关闭</button></div>`;
  }

  function closeMobileMenu() {
    sidebar.classList.remove("open");
  }

  function toast(message, tone) {
    const node = document.createElement("div");
    node.className = `toast ${tone || ""}`;
    node.textContent = message;
    toastRegion.appendChild(node);
    setTimeout(() => node.remove(), 3600);
  }

  async function api(path, options = {}) {
    if (window.CihuStaticDemo) {
      return window.CihuStaticDemo.handle(path, options);
    }
    const config = {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" }
    };
    if (options.auth !== false && session.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
    }
    const response = await fetch(`/api${path}`, config);
    if (response.status === 401) {
      logout();
      throw new Error("登录状态已失效");
    }
    if (!response.ok) {
      let detail = `请求失败（${response.status}）`;
      try {
        const payload = await response.json();
        detail = payload.detail || detail;
      } catch (error) {}
      throw new Error(detail);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async function apiBlob(path, options = {}) {
    if (window.CihuStaticDemo) {
      return window.CihuStaticDemo.blob(path, options);
    }
    const response = await fetch(`/api${path}`, {
      method: options.method || "GET",
      headers: {
        ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {})
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
    if (!response.ok) throw new Error(`下载失败（${response.status}）`);
    return response.blob();
  }

  async function downloadFile(path, filename, body, method) {
    const blob = await apiBlob(path, { body, method });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
})();
