(function () {
  const DATA = window.UnionPolicyData;
  const RULES = window.UnionRules;
  const STORAGE_KEY = "cihu-union-platform-state-v1";
  const TODAY = new Date();

  const sourceById = Object.fromEntries(DATA.sourceDocuments.map((source) => [source.id, source]));
  const benefitTypeById = Object.fromEntries(DATA.benefitTypes.map((type) => [type.id, type]));
  const paymentMethodById = Object.fromEntries(DATA.benefitPaymentMethods.map((method) => [method.id, method]));
  const budgetLineById = Object.fromEntries(DATA.budgetLines.map((line) => [line.id, line]));

  const routeTitles = {
    dashboard: "工作台总览",
    members: "会员与资格管理",
    exams: "职工体检",
    benefits: "福利发放",
    retreats: "职工疗休养",
    budget: "工会经费预算",
    policies: "政策规则索引",
    settings: "数据与设置"
  };

  const app = document.getElementById("app");
  const dialog = document.getElementById("dialog");
  const toastRegion = document.getElementById("toast-region");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const fiscalYearSelect = document.getElementById("fiscal-year");

  let state = loadState();
  let currentRoute = normalizeRoute(location.hash.replace("#", ""));
  let currentYear = Number(state.settings.fiscalYear || TODAY.getFullYear());

  initialize();

  function initialize() {
    if (!location.hash) {
      history.replaceState(null, "", "#dashboard");
    }
    try {
      render();
      bindGlobalEvents();
      document.documentElement.dataset.cihuReady = "true";
    } catch (error) {
      document.documentElement.dataset.cihuError = error.message;
      app.innerHTML = `
        <section class="panel">
          <div class="panel-body">
            <div class="issue block">
              <span class="issue-mark">!</span>
              <div>
                <strong>系统初始化失败</strong>
                <span>${escapeHtml(error.message)}</span>
              </div>
            </div>
          </div>
        </section>
      `;
    }
  }

  function createDefaultState() {
    const year = TODAY.getFullYear();
    return {
      version: 1,
      settings: {
        organizationName: DATA.organizationDefaults.name,
        fiscalYear: year,
        dataOwner: DATA.organizationDefaults.dataOwner,
        lastSavedAt: ""
      },
      members: [],
      examPlans: [],
      benefits: [],
      retreats: [],
      budgets: {
        [year]: Object.fromEntries(DATA.budgetLines.map((line) => [line.id, 0]))
      },
      audits: []
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      return migrateState(parsed);
    } catch (error) {
      console.warn("无法读取本机数据，已使用空台账。", error);
      return createDefaultState();
    }
  }

  function migrateState(value) {
    const defaults = createDefaultState();
    const next = {
      ...defaults,
      ...value,
      settings: { ...defaults.settings, ...(value.settings || {}) },
      members: Array.isArray(value.members) ? value.members : [],
      examPlans: Array.isArray(value.examPlans) ? value.examPlans : [],
      benefits: Array.isArray(value.benefits) ? value.benefits : [],
      retreats: Array.isArray(value.retreats) ? value.retreats : [],
      budgets: value.budgets && typeof value.budgets === "object" ? value.budgets : defaults.budgets,
      audits: Array.isArray(value.audits) ? value.audits : []
    };
    if (!next.budgets[next.settings.fiscalYear]) {
      next.budgets[next.settings.fiscalYear] = Object.fromEntries(DATA.budgetLines.map((line) => [line.id, 0]));
    }
    return next;
  }

  function saveState() {
    state.settings.lastSavedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const time = document.getElementById("storage-time");
    if (time) {
      time.textContent = `已保存 ${formatDateTime(state.settings.lastSavedAt)}`;
    }
  }

  function audit(action, detail) {
    state.audits.unshift({
      id: uid("audit"),
      action,
      detail,
      at: new Date().toISOString()
    });
    state.audits = state.audits.slice(0, 200);
  }

  function normalizeRoute(route) {
    return routeTitles[route] ? route : "dashboard";
  }

  function uid(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function attr(value) {
    return escapeHtml(value).replace(/\n/g, " ");
  }

  function formatMoney(value) {
    return `${RULES.roundMoney(value).toLocaleString("zh-CN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}元`;
  }

  function formatNumber(value, suffix) {
    const number = RULES.toNumber(value);
    return `${number.toLocaleString("zh-CN")}${suffix || ""}`;
  }

  function formatDate(value) {
    if (!value) return "-";
    return String(value).replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, "$1-$2-$3");
  }

  function formatDateTime(value) {
    if (!value) return "尚未保存";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function todayIso() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function getYear(value) {
    return RULES.getYear(value) || currentYear;
  }

  function getMember(id) {
    return state.members.find((member) => member.id === id);
  }

  function getBenefitType(id) {
    return benefitTypeById[id] || { id, label: id || "未知类型", limit: 0 };
  }

  function getPaymentMethod(id) {
    return paymentMethodById[id] || { id, label: id || "未填写" };
  }

  function getMemberRecords(memberId) {
    return {
      benefits: state.benefits.filter((entry) => entry.memberId === memberId),
      exams: state.examPlans.filter((plan) => planIncludesMember(plan, memberId)),
      retreats: state.retreats.filter((plan) => planIncludesMember(plan, memberId))
    };
  }

  function planIncludesMember(plan, memberId) {
    if (plan.scope === "selected") return (plan.memberIds || []).includes(memberId);
    const member = getMember(memberId);
    return Boolean(member && member.status === "active");
  }

  function getPlanMembers(plan) {
    if (plan.scope === "selected") {
      return state.members.filter((member) => (plan.memberIds || []).includes(member.id));
    }
    return state.members.filter((member) => member.status === "active");
  }

  function setRoute(route) {
    currentRoute = normalizeRoute(route);
    location.hash = currentRoute;
    closeMobileMenu();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function render() {
    document.getElementById("org-name").textContent = state.settings.organizationName;
    document.getElementById("page-title").textContent = routeTitles[currentRoute];
    document.querySelectorAll("[data-route]").forEach((button) => {
      button.classList.toggle("active", button.dataset.route === currentRoute);
    });
    renderYearPicker();

    const renderers = {
      dashboard: renderDashboard,
      members: renderMembers,
      exams: renderExams,
      benefits: renderBenefits,
      retreats: renderRetreats,
      budget: renderBudget,
      policies: renderPolicies,
      settings: renderSettings
    };
    app.innerHTML = renderers[currentRoute]();

    const time = document.getElementById("storage-time");
    if (time) {
      time.textContent = state.settings.lastSavedAt
        ? `已保存 ${formatDateTime(state.settings.lastSavedAt)}`
        : "尚未保存";
    }
  }

  function renderYearPicker() {
    const years = new Set([
      TODAY.getFullYear() - 2,
      TODAY.getFullYear() - 1,
      TODAY.getFullYear(),
      TODAY.getFullYear() + 1,
      TODAY.getFullYear() + 2,
      currentYear,
      ...Object.keys(state.budgets).map(Number)
    ]);
    fiscalYearSelect.innerHTML = [...years]
      .filter(Number.isFinite)
      .sort((a, b) => b - a)
      .map((year) => `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}年</option>`)
      .join("");
  }

  function renderPageHead(title, description, actions) {
    return `
      <div class="page-head">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="page-actions">${actions || ""}</div>
      </div>
    `;
  }

  function renderDashboard() {
    const activeMembers = state.members.filter((member) => member.status === "active");
    const eligibleMembers = activeMembers.filter((member) => RULES.evaluateMemberEligibility(member).eligible);
    const yearBenefits = state.benefits.filter((entry) => getYear(entry.date) === currentYear && entry.status !== "cancelled");
    const benefitTotal = yearBenefits.reduce((sum, entry) => sum + RULES.toNumber(entry.amount), 0);
    const examPlans = state.examPlans.filter((plan) => getYear(plan.startDate) === currentYear);
    const examCovered = new Set();
    examPlans.forEach((plan) => {
      (plan.completedMemberIds || []).forEach((id) => examCovered.add(id));
    });
    const examRate = activeMembers.length ? Math.round((examCovered.size / activeMembers.length) * 100) : 0;
    const retreatPlans = state.retreats.filter((plan) => getYear(plan.startDate) === currentYear);
    const retreatCovered = new Set();
    retreatPlans.forEach((plan) => {
      getPlanMembers(plan).forEach((member) => retreatCovered.add(member.id));
    });
    const retreatRate = activeMembers.length ? Math.round((retreatCovered.size / activeMembers.length) * 100) : 0;
    const alerts = buildDashboardAlerts();
    const recent = buildRecentRecords().slice(0, 7);

    return `
      ${renderPageHead(
        `${currentYear}年度工会业务总览`,
        "规则引擎会在登记和计划阶段自动校验会员资格、年度限额、重复发放、经费来源和疗休养专项要求。",
        `<button class="button ghost" data-action="load-demo">载入演示数据</button>
         <button class="button primary" data-action="quick-add">登记新业务</button>`
      )}

      <section class="metric-grid">
        ${renderMetric("有效会员", formatNumber(eligibleMembers.length, "人"), `在职${activeMembers.length}人，可享福利${eligibleMembers.length}人`, `${state.members.length}人全部档案`)}
        ${renderMetric("本年度福利支出", formatMoney(benefitTotal), `${yearBenefits.length}笔发放记录`, currentYear + "年")}
        ${renderMetric("体检组织覆盖率", `${examRate}%`, `${examCovered.size}人已完成`, `${examPlans.length}个体检计划`)}
        ${renderMetric("疗休养覆盖参考", `${retreatRate}%`, `${retreatCovered.size}人已纳入计划`, `${retreatPlans.length}个活动计划`)}
      </section>

      <div class="layout-grid">
        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>自动提醒与风险队列</h2>
                <p>按当前台账实时计算，不代替法定审批和财务审核。</p>
              </div>
              <button class="button small" data-action="diagnose">规则诊断</button>
            </div>
            <div class="panel-body">
              ${alerts.length ? `<div class="issue-list">${alerts.map(renderIssue).join("")}</div>` : renderEmpty("当前没有待处理风险", "新增业务后，系统会自动汇总提示。")}
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>近期业务流水</h2>
                <p>按登记时间倒序展示福利、体检和疗休养动态。</p>
              </div>
            </div>
            <div class="panel-body flush">
              ${recent.length ? renderRecentTable(recent) : renderEmpty("尚无业务记录", "可以从会员管理或福利发放开始。")}
            </div>
          </section>
        </div>

        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>经费执行</h2>
                <p>仅统计工会经费列支，体检行政经费单列。</p>
              </div>
              <button class="button small" data-route="budget">查看预算</button>
            </div>
            <div class="panel-body">
              ${renderBudgetSummary(currentYear)}
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>本月生日提醒</h2>
                <p>可一键生成生日慰问草稿，金额和签收信息需人工确认。</p>
              </div>
              <button class="button small" data-action="generate-birthday">生成草稿</button>
            </div>
            <div class="panel-body">
              ${renderBirthdayList()}
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>规则依据</h2>
                <p>系统内置的关键政策为上限标准，具体执行仍需履行本级集体决策。</p>
              </div>
              <button class="button small" data-route="policies">查看全部</button>
            </div>
            <div class="panel-body">
              <div class="rule-list">
                ${DATA.ruleCards.slice(0, 3).map(renderRuleCompact).join("")}
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  function renderMetric(label, value, note, context) {
    return `
      <article class="metric">
        <div class="metric-top">
          <span class="metric-label">${escapeHtml(label)}</span>
          <span class="badge">${escapeHtml(context)}</span>
        </div>
        <strong class="metric-value">${escapeHtml(value)}</strong>
        <span class="metric-note">${escapeHtml(note)}</span>
      </article>
    `;
  }

  function buildDashboardAlerts() {
    const alerts = [];
    const yearBenefitBudget = getBudget(currentYear, "member_activity");
    const benefitUsage = getBudgetUsed(currentYear, "member_activity");
    if (yearBenefitBudget > 0 && benefitUsage / yearBenefitBudget >= 0.8) {
      alerts.push({
        level: benefitUsage > yearBenefitBudget ? "block" : "warn",
        title: "会员活动预算使用较高",
        message: `年度预算${formatMoney(yearBenefitBudget)}，已使用${formatMoney(benefitUsage)}。`,
        reference: { label: "皖工发〔2025〕18号第15页预算管理" }
      });
    }

    state.members
      .filter((member) => member.status === "active")
      .forEach((member) => {
        const result = RULES.evaluateMemberEligibility(member);
        if (!result.eligible) {
          alerts.push({
            level: "warn",
            title: `${member.name}的福利资格不完整`,
            message: result.issues.map((entry) => entry.message).join("；"),
            reference: result.issues[0] ? result.issues[0].reference : null
          });
        }
      });

    state.examPlans
      .filter((plan) => getYear(plan.startDate) === currentYear)
      .forEach((plan) => {
        const result = RULES.validateExamPlan(plan);
        if (result.decision === "block") {
          alerts.push({
            level: "block",
            title: `体检计划“${plan.name}”不符合经费要求`,
            message: result.issues.find((entry) => entry.level === "block")?.message || "请复查计划。",
            reference: result.issues[0]?.reference
          });
        }
      });

    state.retreats
      .filter((plan) => getYear(plan.startDate) === currentYear)
      .forEach((plan) => {
        const result = RULES.validateRetreatPlan(plan, {
          members: state.members,
          allowedLocations: DATA.allowedRetreatLocations,
          budget: {
            annual: getBudget(getYear(plan.startDate), "retreat"),
            used: getBudgetUsed(getYear(plan.startDate), "retreat")
          }
        });
        if (result.decision !== "pass") {
          alerts.push({
            level: result.decision,
            title: `疗休养计划“${plan.title}”需处理`,
            message: result.issues.find((entry) => entry.level === "block")?.message || result.issues[0]?.message || "请复核计划。",
            reference: result.issues[0]?.reference
          });
        }
      });

    if (!state.retreats.some((plan) => getYear(plan.startDate) === currentYear)) {
      alerts.push({
        level: "warn",
        title: "本年度尚未建立疗休养计划",
        message: "市总工会意见明确各单位原则上每年至少开展一次职工“诗城田园游”疗休养活动。",
        reference: { label: "马工发〔2026〕4号第2页" }
      });
    }

    return alerts.slice(0, 8);
  }

  function renderIssue(issue) {
    const level = issue.level || "warn";
    const mark = level === "block" ? "!" : level === "pass" ? "✓" : "·";
    return `
      <article class="issue ${level}">
        <span class="issue-mark">${mark}</span>
        <div>
          <strong>${escapeHtml(issue.title || issue.message)}</strong>
          ${issue.title ? `<span>${escapeHtml(issue.message)}</span>` : ""}
          ${issue.reference ? `<span>依据：${escapeHtml(issue.reference.label)}</span>` : ""}
        </div>
      </article>
    `;
  }

  function buildRecentRecords() {
    const records = [];
    state.benefits.forEach((entry) => {
      const member = getMember(entry.memberId);
      records.push({
        at: entry.createdAt || `${entry.date}T00:00:00`,
        kind: "福利发放",
        title: `${member ? member.name : "未知会员"} · ${getBenefitType(entry.type).label}`,
        detail: `${formatMoney(entry.amount)} · ${getPaymentMethod(entry.paymentMethod).label}`,
        status: entry.status
      });
    });
    state.examPlans.forEach((plan) => {
      records.push({
        at: plan.createdAt || `${plan.startDate}T00:00:00`,
        kind: "职工体检",
        title: plan.name,
        detail: `${formatDate(plan.startDate)}至${formatDate(plan.endDate)} · ${getPlanMembers(plan).length}人`,
        status: plan.status || "planned"
      });
    });
    state.retreats.forEach((plan) => {
      records.push({
        at: plan.createdAt || `${plan.startDate}T00:00:00`,
        kind: "疗休养",
        title: plan.title,
        detail: `${plan.location} · ${getPlanMembers(plan).length}人`,
        status: plan.status || "planned"
      });
    });
    return records.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }

  function renderRecentTable(records) {
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>时间</th><th>业务</th><th>事项</th><th>状态</th></tr></thead>
          <tbody>
            ${records.map((record) => `
              <tr>
                <td>${escapeHtml(formatDateTime(record.at))}</td>
                <td>${escapeHtml(record.kind)}</td>
                <td><strong>${escapeHtml(record.title)}</strong><br><span class="muted">${escapeHtml(record.detail)}</span></td>
                <td>${renderStatusBadge(record.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderBudgetSummary(year) {
    const rows = ["member_activity", "retreat", "rights", "service"].map((lineId) => {
      const annual = getBudget(year, lineId);
      const used = getBudgetUsed(year, lineId);
      const percent = annual > 0 ? Math.round((used / annual) * 100) : 0;
      const level = percent > 100 ? "block" : percent >= 80 ? "warn" : "";
      return `
        <div class="progress-row">
          <strong>${escapeHtml(budgetLineById[lineId].label)}</strong>
          <div>
            <div class="progress ${level}"><span style="width:${Math.min(percent, 100)}%"></span></div>
            <div class="field-help">${percent}%</div>
          </div>
          <span class="amount">${formatMoney(used)} / ${formatMoney(annual)}</span>
        </div>
      `;
    });
    return rows.join("");
  }

  function renderBirthdayList() {
    const month = TODAY.getMonth() + 1;
    const members = state.members
      .filter((member) => member.status === "active" && member.birthDate && Number(String(member.birthDate).slice(5, 7)) === month)
      .sort((a, b) => String(a.birthDate).slice(5, 10).localeCompare(String(b.birthDate).slice(5, 10)));
    if (!members.length) {
      return renderEmpty("本月没有可识别的生日", "补充会员出生日期后，系统会自动提醒。", true);
    }
    return `
      <div class="issue-list">
        ${members.map((member) => {
          const usage = RULES.calculateBenefitUsage(state.benefits, member.id, currentYear);
          return renderIssue({
            level: usage.birthday > 0 ? "pass" : "warn",
            title: `${member.name} · ${String(member.birthDate).slice(5, 10)}`,
            message: usage.birthday > 0 ? `本年度生日慰问已登记${formatMoney(usage.birthday)}。` : "尚未登记生日慰问。",
            reference: { label: "生日慰问上限500元，马/皖工发政策均已内置" }
          });
        }).join("")}
      </div>
    `;
  }

  function renderMembers() {
    const active = state.members.filter((member) => member.status === "active").length;
    const eligible = state.members.filter((member) => RULES.evaluateMemberEligibility(member).eligible).length;
    const retired = state.members.filter((member) => member.status === "retired").length;
    const exceptions = state.members.filter((member) => member.status === "active" && !RULES.evaluateMemberEligibility(member).eligible).length;
    return `
      ${renderPageHead(
        "会员与资格台账",
        "福利和疗休养资格自动读取在职状态、工会会员、会费缴纳、工资纳入口径和用工形式。",
        `<button class="button" data-action="import-members">批量导入</button>
         <button class="button primary" data-action="add-member">新增会员</button>`
      )}
      <section class="metric-grid">
        ${renderMetric("全部档案", formatNumber(state.members.length, "人"), `${active}人在职`, "人事状态")}
        ${renderMetric("可享工会福利", formatNumber(eligible, "人"), "同时满足会员、会费、工资口径", "规则判定")}
        ${renderMetric("资格待核验", formatNumber(exceptions, "人"), "在职但至少一项资格不完整", "优先处理")}
        ${renderMetric("离退休档案", formatNumber(retired, "人"), "工会经费福利模块自动排除", "行政口径")}
      </section>
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>会员资格清单</h2>
            <p>姓名仅用于内部身份识别，建议不要录入体检结果等敏感健康信息。</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="toolbar">
            <div class="toolbar-group">
              <input class="input search" id="member-search" placeholder="搜索姓名、部门或人员类型" />
            </div>
            <div class="toolbar-group">
              <select class="select compact-select" id="member-status-filter">
                <option value="">全部状态</option>
                <option value="active">在职</option>
                <option value="retired">离退休</option>
                <option value="inactive">其他</option>
              </select>
            </div>
          </div>
          <div id="member-table">
            ${renderMemberTable(state.members)}
          </div>
        </div>
      </section>
    `;
  }

  function renderMemberTable(members) {
    if (!members.length) {
      return renderEmpty("尚无会员档案", "新增或批量导入会员后，体检和福利业务可直接引用。");
    }
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>会员</th>
              <th>部门</th>
              <th>状态</th>
              <th>用工形式</th>
              <th>会费/工资口径</th>
              <th>福利资格</th>
              <th>本年度福利</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((member) => {
              const eligibility = RULES.evaluateMemberEligibility(member);
              const usage = RULES.calculateBenefitUsage(state.benefits, member.id, currentYear);
              return `
                <tr data-member-row data-search="${attr(`${member.name} ${member.department || ""} ${member.employmentType || ""}`.toLowerCase())}" data-status="${attr(member.status)}">
                  <td><strong>${escapeHtml(member.name)}</strong><br><span class="muted">${escapeHtml(member.birthDate || "未填生日")}</span></td>
                  <td>${escapeHtml(member.department || "-")}</td>
                  <td>${renderMemberStatus(member.status)}</td>
                  <td>${escapeHtml(employmentTypeLabel(member.employmentType))}</td>
                  <td>
                    <span class="badge ${member.duesPaid ? "green" : "red"}">会费${member.duesPaid ? "已缴" : "未缴"}</span>
                    <span class="badge ${member.salaryIncluded ? "green" : "red"}">工资${member.salaryIncluded ? "已纳入" : "未纳入"}</span>
                  </td>
                  <td>${renderBadgeFromDecision(eligibility.eligible, eligibility.issues[0]?.message || "满足资格条件")}</td>
                  <td>${formatMoney(usage.total)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="button small" data-action="edit-member" data-id="${attr(member.id)}">编辑</button>
                      <button class="button small" data-action="member-benefits" data-id="${attr(member.id)}">额度</button>
                      <button class="button small danger" data-action="delete-member" data-id="${attr(member.id)}">删除</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderMemberStatus(status) {
    const labels = { active: "在职", retired: "离退休", inactive: "其他" };
    const tone = status === "active" ? "green" : status === "retired" ? "blue" : "";
    return `<span class="badge ${tone}">${labels[status] || escapeHtml(status || "未填")}</span>`;
  }

  function employmentTypeLabel(type) {
    const labels = {
      regular: "在编/正式",
      contract: "合同制",
      dispatched: "借用/挂职/派遣",
      other: "其他"
    };
    return labels[type] || "未填";
  }

  function renderBadgeFromDecision(ok, text) {
    return `<span class="badge ${ok ? "green" : "red"}" title="${attr(text)}">${ok ? "可享受" : "不可享受"}</span>`;
  }

  function renderExams() {
    const plans = state.examPlans
      .filter((plan) => getYear(plan.startDate) === currentYear)
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    const activeCount = state.members.filter((member) => member.status === "active").length;
    const covered = new Set();
    plans.forEach((plan) => (plan.completedMemberIds || []).forEach((id) => covered.add(id)));
    const completionRate = activeCount ? Math.round((covered.size / activeCount) * 100) : 0;
    const administrativeBudget = plans.reduce((sum, plan) => sum + RULES.toNumber(plan.budget), 0);
    const blocked = plans.filter((plan) => RULES.validateExamPlan(plan).decision === "block").length;

    return `
      ${renderPageHead(
        "职工体检组织跟踪",
        "职工体检属单位行政保障职责；系统只记录组织进度、经费来源和行政委托依据，不记录体检结果。",
        `<button class="button primary" data-action="add-exam">新建体检计划</button>`
      )}
      <section class="metric-grid">
        ${renderMetric("本年度体检计划", formatNumber(plans.length, "个"), `${activeCount}名在职职工`, "组织覆盖")}
        ${renderMetric("完成覆盖率", `${completionRate}%`, `${covered.size}人已完成或免检`, "只计状态")}
        ${renderMetric("行政体检预算", formatMoney(administrativeBudget), "不计入工会经费预算", "行政列支")}
        ${renderMetric("规则异常计划", formatNumber(blocked, "个"), "经费来源或授权依据不完整", blocked ? "需处理" : "合规")}
      </section>
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>体检计划台账</h2>
            <p>工会受行政委托承办时，经费仍由单位行政负担。</p>
          </div>
        </div>
        <div class="panel-body flush">
          ${plans.length ? `
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr><th>计划名称</th><th>时间</th><th>机构</th><th>经费来源</th><th>完成进度</th><th>规则结论</th><th>操作</th></tr>
                </thead>
                <tbody>
                  ${plans.map((plan) => {
                    const participants = getPlanMembers(plan);
                    const completed = (plan.completedMemberIds || []).filter((id) => participants.some((member) => member.id === id)).length;
                    const percent = participants.length ? Math.round((completed / participants.length) * 100) : 0;
                    const result = RULES.validateExamPlan(plan);
                    return `
                      <tr>
                        <td><strong>${escapeHtml(plan.name)}</strong><br><span class="muted">${escapeHtml(plan.notes || "无备注")}</span></td>
                        <td>${formatDate(plan.startDate)}<br><span class="muted">至 ${formatDate(plan.endDate)}</span></td>
                        <td>${escapeHtml(plan.provider || "-")}</td>
                        <td>${renderExamFundSource(plan)}</td>
                        <td>
                          <div class="progress"><span style="width:${percent}%"></span></div>
                          <span class="field-help">${completed}/${participants.length}人 · ${percent}%</span>
                        </td>
                        <td>${renderDecisionBadge(result.decision)}</td>
                        <td>
                          <div class="table-actions">
                            <button class="button small" data-action="manage-exam" data-id="${attr(plan.id)}">人员进度</button>
                            <button class="button small" data-action="edit-exam" data-id="${attr(plan.id)}">编辑</button>
                            <button class="button small danger" data-action="delete-exam" data-id="${attr(plan.id)}">删除</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmpty("尚无体检计划", "新建计划后自动纳入符合条件的在职人员。")}
        </div>
      </section>
      <section class="panel" style="margin-top:18px">
        <div class="panel-head">
          <div>
            <h2>隐私与经费边界</h2>
            <p>系统不存储检查项目、诊断、检验指标或影像资料。</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="inline-note">依据皖工发〔2025〕18号第17页，职工体检等正常福利是单位行政职责。受单位行政委托，基层工会可协助或承办，经费由单位行政负担，不可直接改由工会经费列支。</div>
        </div>
      </section>
    `;
  }

  function renderExamFundSource(plan) {
    const labels = {
      administration: "行政福利费",
      administration_entrusted: "行政委托工会承办",
      union: "工会经费（不合规）"
    };
    const tone = plan.fundSource === "union" ? "red" : "blue";
    return `<span class="badge ${tone}">${labels[plan.fundSource] || "未填写"}</span>
      ${plan.authorizationRef ? `<br><span class="muted">委托：${escapeHtml(plan.authorizationRef)}</span>` : ""}`;
  }

  function renderBenefits() {
    const yearRecords = state.benefits
      .filter((entry) => getYear(entry.date) === currentYear)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const total = yearRecords.filter((entry) => entry.status !== "cancelled").reduce((sum, entry) => sum + RULES.toNumber(entry.amount), 0);
    const festivalMembers = new Set(yearRecords.filter((entry) => entry.type === "festival" && entry.status !== "cancelled").map((entry) => entry.memberId));
    const pending = yearRecords.filter((entry) => entry.status === "pending").length;
    const nearLimit = state.members.filter((member) => {
      const usage = RULES.calculateBenefitUsage(state.benefits, member.id, currentYear);
      return usage.festival >= 1760;
    }).length;

    return `
      ${renderPageHead(
        "福利发放与额度控制",
        "逐笔累计年度额度，自动校验节日、生日、婚育、住院、丧事、退休和困难帮扶等标准及发放方式。",
        `<button class="button" data-action="generate-birthday">生成生日草稿</button>
         <button class="button primary" data-action="add-benefit">登记发放</button>`
      )}
      <section class="metric-grid">
        ${renderMetric("本年度福利金额", formatMoney(total), `${yearRecords.length}笔记录`, "已登记")}
        ${renderMetric("节日慰问覆盖", formatNumber(festivalMembers.size, "人"), "年度每人累计不超过2200元", "自动累计")}
        ${renderMetric("接近节日上限", formatNumber(nearLimit, "人"), "使用达到80%即提醒", nearLimit ? "请复核" : "无")}
        ${renderMetric("待补资料", formatNumber(pending, "笔"), "审批或签收不完整的记录", pending ? "待办" : "已清")}
      </section>
      <div class="layout-grid">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>福利发放台账</h2>
              <p>点击“规则”查看每笔记录的自动校验结论。</p>
            </div>
          </div>
          <div class="panel-body flush">
            ${yearRecords.length ? renderBenefitsTable(yearRecords) : renderEmpty("本年度尚无福利记录", "可以登记单笔发放，或先生成生日慰问草稿。")}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>会员年度额度</h2>
              <p>节日与服务类临时慰问分开显示。</p>
            </div>
          </div>
          <div class="panel-body flush">
            ${renderMemberQuotaTable()}
          </div>
        </section>
      </div>
    `;
  }

  function renderBenefitsTable(records) {
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>日期</th><th>会员</th><th>项目</th><th>金额</th><th>发放方式</th><th>审批/签收</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${records.map((record) => {
              const member = getMember(record.memberId);
              const result = validateSavedBenefit(record);
              return `
                <tr>
                  <td>${formatDate(record.date)}</td>
                  <td><strong>${escapeHtml(member ? member.name : "未知会员")}</strong></td>
                  <td>${escapeHtml(getBenefitType(record.type).label)}${record.condition ? `<br><span class="muted">${escapeHtml(record.condition)}</span>` : ""}</td>
                  <td>${formatMoney(record.amount)}</td>
                  <td>${escapeHtml(getPaymentMethod(record.paymentMethod).label)}</td>
                  <td>${record.approvalRef ? "审批已填" : "<span class=\"danger-text\">缺审批</span>"}<br>${record.signed ? "已签收" : "<span class=\"danger-text\">未签收</span>"}</td>
                  <td>${renderStatusBadge(record.status)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="button small" data-action="benefit-rules" data-id="${attr(record.id)}">规则</button>
                      <button class="button small" data-action="edit-benefit" data-id="${attr(record.id)}">编辑</button>
                      <button class="button small danger" data-action="delete-benefit" data-id="${attr(record.id)}">删除</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function validateSavedBenefit(record) {
    const member = getMember(record.memberId);
    const lineId = benefitBudgetLine(record.type);
    return RULES.validateBenefit(record, {
      member,
      existing: state.benefits.filter((entry) => entry.id !== record.id),
      fiscalYear: currentYear,
      budget: {
        annual: getBudget(getYear(record.date), lineId),
        used: getBudgetUsed(getYear(record.date), lineId)
      }
    });
  }

  function renderMemberQuotaTable() {
    const members = state.members
      .filter((member) => member.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    if (!members.length) return renderEmpty("尚无在职会员", "先完善会员档案。", true);
    return `
      <div class="table-wrap">
        <table class="data-table" style="min-width:620px">
          <thead><tr><th>会员</th><th>节日慰问</th><th>生日慰问</th><th>本年度合计</th></tr></thead>
          <tbody>
            ${members.map((member) => {
              const usage = RULES.calculateBenefitUsage(state.benefits, member.id, currentYear);
              const festivalPercent = Math.min(Math.round((usage.festival / 2200) * 100), 100);
              const festivalTone = usage.festival > 2200 ? "block" : usage.festival >= 1760 ? "warn" : "";
              return `
                <tr>
                  <td><strong>${escapeHtml(member.name)}</strong></td>
                  <td>
                    <div class="progress ${festivalTone}"><span style="width:${festivalPercent}%"></span></div>
                    <span class="field-help">${formatMoney(usage.festival)} / 2,200元</span>
                  </td>
                  <td>${formatMoney(usage.birthday)} / 500元</td>
                  <td>${formatMoney(usage.total)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRetreats() {
    const plans = state.retreats
      .filter((plan) => getYear(plan.startDate) === currentYear)
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    const participantIds = new Set();
    let projectedTotal = 0;
    let blocked = 0;
    plans.forEach((plan) => {
      const result = RULES.validateRetreatPlan(plan, {
        members: state.members,
        allowedLocations: DATA.allowedRetreatLocations,
        budget: {
          annual: getBudget(currentYear, "retreat"),
          used: getBudgetUsed(currentYear, "retreat")
        }
      });
      if (result.decision === "block") blocked += 1;
      projectedTotal += result.summary.projectedTotal;
      getPlanMembers(plan).forEach((member) => participantIds.add(member.id));
    });
    const avgDaily = plans.length
      ? plans.reduce((sum, plan) => sum + RULES.toNumber(plan.perPersonPerDay), 0) / plans.length
      : 0;

    return `
      ${renderPageHead(
        "职工疗休养计划",
        "地点限定在已维护的疗休养基地和皖美民宿目录内，自动校验2天时限、400元/人/天、保险和采购程序。",
        `<button class="button primary" data-action="add-retreat">新建疗休养计划</button>`
      )}
      <section class="metric-grid">
        ${renderMetric("本年度计划", formatNumber(plans.length, "个"), `${participantIds.size}名职工已纳入`, plans.length ? "已安排" : "待开展")}
        ${renderMetric("平均日标准", formatMoney(avgDaily), "党政机关、事业单位上限400元", "自动测算")}
        ${renderMetric("预计活动总额", formatMoney(projectedTotal), "按计划人数和日标准测算", "计划值")}
        ${renderMetric("规则异常计划", formatNumber(blocked, "个"), "地点、保险或采购等硬性条件", blocked ? "需整改" : "无")}
      </section>
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>疗休养计划台账</h2>
            <p>家属可随行，但费用自理并与承办单位单独订立合同。</p>
          </div>
        </div>
        <div class="panel-body flush">
          ${plans.length ? `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>计划</th><th>时间/地点</th><th>人员</th><th>日标准</th><th>关键保障</th><th>规则结论</th><th>操作</th></tr></thead>
                <tbody>
                  ${plans.map((plan) => {
                    const result = RULES.validateRetreatPlan(plan, {
                      members: state.members,
                      allowedLocations: DATA.allowedRetreatLocations,
                      budget: {
                        annual: getBudget(getYear(plan.startDate), "retreat"),
                        used: getBudgetUsed(getYear(plan.startDate), "retreat")
                      }
                    });
                    const members = getPlanMembers(plan);
                    return `
                      <tr>
                        <td><strong>${escapeHtml(plan.title)}</strong><br><span class="muted">${escapeHtml(plan.leadPerson || "未填负责人")}</span></td>
                        <td>${formatDate(plan.startDate)} 至 ${formatDate(plan.endDate)}<br><span class="muted">${escapeHtml(plan.location)}</span></td>
                        <td>${members.length}人${plan.allowFamily ? "<br><span class=\"muted\">允许家属随行</span>" : ""}</td>
                        <td>${formatMoney(plan.perPersonPerDay)}<br><span class="muted">${result.summary.days}天 · ${formatMoney(result.summary.perPersonTotal)}/人</span></td>
                        <td>
                          <span class="badge ${plan.insuranceConfirmed ? "green" : "red"}">保险${plan.insuranceConfirmed ? "已确认" : "未确认"}</span>
                          <span class="badge ${plan.procurementProcedure && plan.procurementProcedure !== "none" ? "green" : "red"}">采购${plan.procurementProcedure && plan.procurementProcedure !== "none" ? "已登记" : "缺失"}</span>
                        </td>
                        <td>${renderDecisionBadge(result.decision)}</td>
                        <td>
                          <div class="table-actions">
                            <button class="button small" data-action="retreat-rules" data-id="${attr(plan.id)}">规则</button>
                            <button class="button small" data-action="manage-retreat" data-id="${attr(plan.id)}">人员</button>
                            <button class="button small" data-action="edit-retreat" data-id="${attr(plan.id)}">编辑</button>
                            <button class="button small danger" data-action="delete-retreat" data-id="${attr(plan.id)}">删除</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmpty("本年度尚未建立疗休养计划", "市总工会文件要求各单位原则上每年至少开展一次。")}
        </div>
      </section>
      <section class="panel" style="margin-top:18px">
        <div class="panel-head">
          <div>
            <h2>参考线路与报价</h2>
            <p>来源为《职工疗休养基地专属方案》，仅作承办方案参考，不作为政策额度依据。</p>
          </div>
          <button class="button small" data-action="apply-linhai">套用林海参考方案</button>
        </div>
        <div class="panel-body">
          <div class="route-list">
            ${DATA.linhaiRouteOptions.map((route) => `
              <article class="route">
                <h3>${escapeHtml(route.name)}</h3>
                <p>${escapeHtml(route.highlights)}</p>
                <p>${escapeHtml(route.suitableFor)}</p>
              </article>
            `).join("")}
          </div>
          <div class="divider"></div>
          <p class="muted">参考报价：780元/人，两天一晚；按系统日标准测算为390元/人/天，未突破400元上限。最终仍以采购、合同和实际票据为准。</p>
        </div>
      </section>
    `;
  }

  function renderBudget() {
    const budget = getBudgetYear(currentYear);
    const totalBudget = Object.values(budget).reduce((sum, value) => sum + RULES.toNumber(value), 0);
    const totalUsed = DATA.budgetLines.reduce((sum, line) => sum + getBudgetUsed(currentYear, line.id), 0);
    const percent = totalBudget ? Math.round((totalUsed / totalBudget) * 100) : 0;
    const overLines = DATA.budgetLines.filter((line) => {
      const annual = getBudget(currentYear, line.id);
      return annual > 0 && getBudgetUsed(currentYear, line.id) > annual;
    }).length;
    return `
      ${renderPageHead(
        "工会经费预算与执行",
        "预算按工会支出类别管理；系统对超预算业务直接拦截，无预算业务允许登记草稿但会提示审批风险。",
        `<button class="button primary" data-action="edit-budget">设置${currentYear}年预算</button>`
      )}
      <section class="metric-grid">
        ${renderMetric("年度预算总额", formatMoney(totalBudget), `${DATA.budgetLines.filter((line) => getBudget(currentYear, line.id) > 0).length}个预算类别`, "工会经费")}
        ${renderMetric("已登记执行额", formatMoney(totalUsed), `${percent}%执行进度`, "含已登记业务")}
        ${renderMetric("预算余额", formatMoney(Math.max(totalBudget - totalUsed, 0)), totalUsed > totalBudget ? "总额已超预算" : "按上限控制", totalUsed > totalBudget ? "异常" : "正常")}
        ${renderMetric("超预算类别", formatNumber(overLines, "个"), "业务提交时自动拦截", overLines ? "需调整" : "无")}
      </section>
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>${currentYear}年预算执行表</h2>
            <p>体检行政经费不属于工会预算，本表不统计。</p>
          </div>
        </div>
        <div class="panel-body flush">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>支出类别</th><th>年度预算</th><th>已登记</th><th>余额</th><th>执行进度</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                ${DATA.budgetLines.map((line) => {
                  const annual = getBudget(currentYear, line.id);
                  const used = getBudgetUsed(currentYear, line.id);
                  const remaining = annual - used;
                  const linePercent = annual > 0 ? Math.round((used / annual) * 100) : 0;
                  const tone = remaining < 0 ? "block" : linePercent >= 80 ? "warn" : "";
                  return `
                    <tr>
                      <td><strong>${escapeHtml(line.label)}</strong></td>
                      <td>${formatMoney(annual)}</td>
                      <td>${formatMoney(used)}</td>
                      <td class="${remaining < 0 ? "danger-text" : ""}">${formatMoney(remaining)}</td>
                      <td>
                        <div class="progress ${tone}"><span style="width:${Math.min(Math.max(linePercent, 0), 100)}%"></span></div>
                        <span class="field-help">${linePercent}%</span>
                      </td>
                      <td>${remaining < 0 ? '<span class="badge red">超预算</span>' : linePercent >= 80 ? '<span class="badge amber">接近上限</span>' : '<span class="badge green">正常</span>'}</td>
                      <td><button class="button small" data-action="edit-budget" data-line="${attr(line.id)}">编辑</button></td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function renderPolicies() {
    const sourceCards = DATA.sourceDocuments.map((source) => `
      <article class="source">
        <div class="rule-head">
          <h3>${escapeHtml(source.title)}</h3>
          <span class="badge ${source.id === "linhai-package" ? "amber" : "green"}">${escapeHtml(source.role)}</span>
        </div>
        <p>${escapeHtml(source.note)}</p>
        <div class="source-meta">
          <span class="badge">${escapeHtml(source.authority)}</span>
          <span class="badge">${escapeHtml(source.documentNo)}</span>
          <span class="badge">${escapeHtml(source.date)}</span>
          <span class="badge">${source.pages}页</span>
        </div>
      </article>
    `).join("");

    const ruleCards = DATA.ruleCards.map((rule) => {
      const source = sourceById[rule.sourceId];
      return `
        <article class="rule" data-rule-card data-search="${attr(`${rule.title} ${rule.summary} ${source.title} ${source.documentNo}`.toLowerCase())}">
          <div class="rule-head">
            <h3>${escapeHtml(rule.title)}</h3>
            <span class="badge ${rule.level === "block" ? "red" : "amber"}">${rule.level === "block" ? "硬性限制" : "复核提示"}</span>
          </div>
          <p>${escapeHtml(rule.summary)}</p>
          <div class="rule-meta">
            <span class="badge">${escapeHtml(moduleLabel(rule.module))}</span>
            <span class="badge blue">${escapeHtml(source.documentNo)}</span>
            <span class="badge">第${escapeHtml(rule.page)}页</span>
          </div>
        </article>
      `;
    }).join("");

    return `
      ${renderPageHead(
        "政策规则索引",
        "规则引擎将政策要求映射为系统校验项，并保留权威机关、文号、页码和规则层级。",
        `<button class="button primary" data-action="diagnose">打开规则诊断</button>`
      )}
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>依据文件</h2>
            <p>承办单位方案与政策文件已明确区分。</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="source-list">${sourceCards}</div>
        </div>
      </section>
      <section class="panel" style="margin-top:18px">
        <div class="panel-head">
          <div>
            <h2>规则卡片</h2>
            <p>硬性限制会阻断业务提交；复核提示允许保存但会保留风险标记。</p>
          </div>
          <input class="input search" id="rule-search" placeholder="搜索规则关键词" />
        </div>
        <div class="panel-body">
          <div class="rule-list">${ruleCards}</div>
        </div>
      </section>
    `;
  }

  function moduleLabel(module) {
    return {
      general: "通用资格",
      benefits: "福利发放",
      exams: "职工体检",
      retreats: "疗休养",
      budget: "经费预算"
    }[module] || module;
  }

  function renderSettings() {
    const dataCounts = [
      ["会员档案", state.members.length],
      ["体检计划", state.examPlans.length],
      ["福利记录", state.benefits.length],
      ["疗休养计划", state.retreats.length],
      ["审计操作", state.audits.length]
    ];
    return `
      ${renderPageHead(
        "数据与设置",
        "系统为单机本地应用，数据保存在当前浏览器中。建议定期导出JSON备份，并在另一位置留存。",
        `<button class="button" data-action="export-json">导出全部数据</button>
         <button class="button primary" data-action="import-json">导入备份</button>`
      )}
      <div class="layout-grid">
        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>组织信息</h2>
                <p>用于界面标题和导出识别。</p>
              </div>
            </div>
            <div class="panel-body">
              <form data-form="settings-form" class="form-grid">
                <div class="field full">
                  <label for="organization-name">单位工会名称</label>
                  <input class="input" id="organization-name" name="organizationName" value="${attr(state.settings.organizationName)}" required />
                </div>
                <div class="field">
                  <label for="data-owner">数据责任人</label>
                  <input class="input" id="data-owner" name="dataOwner" value="${attr(state.settings.dataOwner)}" />
                </div>
                <div class="field">
                  <label for="default-year">默认年度</label>
                  <input class="input" id="default-year" name="fiscalYear" type="number" min="2020" max="2100" value="${attr(currentYear)}" required />
                </div>
                <div class="field full">
                  <button class="button primary" type="submit">保存设置</button>
                </div>
              </form>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>最近操作</h2>
                <p>最多保留200条本机操作记录。</p>
              </div>
            </div>
            <div class="panel-body flush">
              ${state.audits.length ? `
                <div class="table-wrap">
                  <table class="data-table">
                    <thead><tr><th>时间</th><th>操作</th><th>说明</th></tr></thead>
                    <tbody>
                      ${state.audits.slice(0, 20).map((entry) => `
                        <tr><td>${formatDateTime(entry.at)}</td><td>${escapeHtml(entry.action)}</td><td>${escapeHtml(entry.detail)}</td></tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              ` : renderEmpty("尚无操作记录", "业务变更后自动记录。", true)}
            </div>
          </section>
        </div>

        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>数据概览</h2>
                <p>当前浏览器中的数据规模。</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="issue-list">
                ${dataCounts.map(([label, count]) => `
                  <div class="issue pass">
                    <span class="issue-mark">·</span>
                    <div><strong>${escapeHtml(label)}</strong><span>${formatNumber(count, "条")}</span></div>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>演示与清理</h2>
                <p>演示数据均为虚构示例，正式使用前可清空全部数据。</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="toolbar-group">
                <button class="button" data-action="load-demo">载入演示数据</button>
                <button class="button danger" data-action="clear-data">清空全部数据</button>
              </div>
              <div class="divider"></div>
              <div class="inline-note">本系统不替代财务系统、采购系统和正式审批材料。建议业务完成后将审批单、合同、发票、签到表、保险单、实名签收表按项目归档。</div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>本地数据风险</h2>
                <p>浏览器缓存被清理后数据会丢失。</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="issue warn">
                <span class="issue-mark">!</span>
                <div>
                  <strong>建议每周导出一次备份</strong>
                  <span>如果多人共用数据，需要后续接入服务器数据库和账号权限，不建议共用同一浏览器。</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  function renderEmpty(title, text, compact) {
    return `
      <div class="empty-state" ${compact ? 'style="padding:22px 12px"' : ""}>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(text)}</span>
      </div>
    `;
  }

  function renderStatusBadge(status) {
    const map = {
      paid: ["green", "已发放"],
      approved: ["blue", "已审批"],
      pending: ["amber", "待补资料"],
      planned: ["blue", "已计划"],
      completed: ["green", "已完成"],
      cancelled: ["red", "已取消"]
    };
    const [tone, label] = map[status] || ["", status || "未填"];
    return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
  }

  function renderDecisionBadge(decision) {
    const map = {
      pass: ["green", "可通过"],
      warn: ["amber", "需复核"],
      block: ["red", "已拦截"]
    };
    const [tone, label] = map[decision] || ["", "待判断"];
    return `<span class="badge ${tone}">${label}</span>`;
  }

  function renderRuleCompact(rule) {
    return `
      <article class="rule">
        <div class="rule-head">
          <h3>${escapeHtml(rule.title)}</h3>
          <span class="badge ${rule.level === "block" ? "red" : "amber"}">${rule.level === "block" ? "硬性限制" : "复核提示"}</span>
        </div>
        <p>${escapeHtml(rule.summary)}</p>
      </article>
    `;
  }

  function benefitBudgetLine(type) {
    return type === "difficulty" ? "rights" : type === "other_member" ? "service" : "member_activity";
  }

  function getBudgetYear(year) {
    if (!state.budgets[year]) {
      state.budgets[year] = Object.fromEntries(DATA.budgetLines.map((line) => [line.id, 0]));
    }
    return state.budgets[year];
  }

  function getBudget(year, lineId) {
    return RULES.toNumber(getBudgetYear(year)[lineId]);
  }

  function getBudgetUsed(year, lineId) {
    const benefitUsage = state.benefits
      .filter((entry) => getYear(entry.date) === Number(year) && entry.status !== "cancelled" && benefitBudgetLine(entry.type) === lineId)
      .reduce((sum, entry) => sum + RULES.toNumber(entry.amount), 0);
    const retreatUsage = lineId === "retreat"
      ? state.retreats
        .filter((plan) => getYear(plan.startDate) === Number(year) && ["approved", "completed", "paid"].includes(plan.status))
        .reduce((sum, plan) => {
          const result = RULES.validateRetreatPlan(plan, {
            members: state.members,
            allowedLocations: DATA.allowedRetreatLocations
          });
          return sum + result.summary.projectedTotal;
        }, 0)
      : 0;
    return RULES.roundMoney(benefitUsage + retreatUsage);
  }

  function bindGlobalEvents() {
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("submit", handleDocumentSubmit);
    document.addEventListener("input", handleDocumentInput);
    document.addEventListener("change", handleDocumentChange);
    fiscalYearSelect.addEventListener("change", () => {
      currentYear = Number(fiscalYearSelect.value);
      state.settings.fiscalYear = currentYear;
      getBudgetYear(currentYear);
      saveState();
      render();
    });
    window.addEventListener("hashchange", () => {
      currentRoute = normalizeRoute(location.hash.replace("#", ""));
      render();
    });
    dialog.addEventListener("close", () => {
      overlay.hidden = true;
    });
  }

  function handleDocumentClick(event) {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      setRoute(routeButton.dataset.route);
      return;
    }

    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;

    const actions = {
      "toggle-menu": toggleMobileMenu,
      "quick-add": openQuickAdd,
      "diagnose": openDiagnostic,
      "add-member": () => openMemberForm(),
      "edit-member": () => openMemberForm(id),
      "delete-member": () => deleteMember(id),
      "member-benefits": () => openMemberUsage(id),
      "import-members": openMemberImport,
      "add-exam": () => openExamForm(),
      "edit-exam": () => openExamForm(id),
      "manage-exam": () => openExamProgress(id),
      "delete-exam": () => deleteExamPlan(id),
      "add-benefit": () => openBenefitForm(),
      "edit-benefit": () => openBenefitForm(id),
      "delete-benefit": () => deleteBenefit(id),
      "benefit-rules": () => openBenefitRules(id),
      "generate-birthday": generateBirthdayDrafts,
      "add-retreat": () => openRetreatForm(),
      "edit-retreat": () => openRetreatForm(id),
      "manage-retreat": () => openRetreatMembers(id),
      "retreat-rules": () => openRetreatRules(id),
      "delete-retreat": () => deleteRetreat(id),
      "apply-linhai": () => openRetreatForm(null, true),
      "edit-budget": () => openBudgetForm(actionElement.dataset.line),
      "export-json": exportJson,
      "import-json": openImportDialog,
      "load-demo": loadDemoData,
      "clear-data": clearAllData,
      "close-dialog": closeDialog,
      "quick-member": () => { closeDialog(); openMemberForm(); },
      "quick-exam": () => { closeDialog(); openExamForm(); },
      "quick-benefit": () => { closeDialog(); openBenefitForm(); },
      "quick-retreat": () => { closeDialog(); openRetreatForm(); }
    };

    if (actions[action]) actions[action]();
  }

  function handleDocumentSubmit(event) {
    const form = event.target.closest("[data-form]");
    if (!form) return;
    event.preventDefault();
    const formType = form.dataset.form;
    if (formType === "member-form") submitMemberForm(form);
    if (formType === "exam-form") submitExamForm(form);
    if (formType === "benefit-form") submitBenefitForm(form);
    if (formType === "retreat-form") submitRetreatForm(form);
    if (formType === "exam-progress-form") submitExamProgress(form);
    if (formType === "retreat-members-form") submitRetreatMembers(form);
    if (formType === "budget-form") submitBudgetForm(form);
    if (formType === "settings-form") submitSettingsForm(form);
    if (formType === "diagnose-form") submitDiagnostic(form);
    if (formType === "import-json-form") submitImportJson(form);
    if (formType === "member-import-form") submitMemberImport(form);
  }

  function handleDocumentInput(event) {
    if (event.target.id === "member-search" || event.target.id === "member-status-filter") {
      filterMemberTable();
    }
    if (event.target.id === "rule-search") {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll("[data-rule-card]").forEach((card) => {
        card.classList.toggle("hidden", query && !card.dataset.search.includes(query));
      });
    }
  }

  function handleDocumentChange(event) {
    if (event.target.name === "scenario") {
      updateDiagnosticFields();
    }
    if (event.target.name === "scope" && event.target.closest('[data-form="retreat-form"]')) {
      const form = event.target.closest("form");
      form.querySelector("[data-selected-members]").classList.toggle("hidden", event.target.value !== "selected");
    }
    if (event.target.name === "scope" && event.target.closest('[data-form="exam-form"]')) {
      const form = event.target.closest("form");
      form.querySelector("[data-selected-members]").classList.toggle("hidden", event.target.value !== "selected");
    }
    if (event.target.name === "fundSource" && event.target.closest('[data-form="exam-form"]')) {
      const form = event.target.closest("form");
      form.querySelector("[data-authorization]").classList.toggle("hidden", event.target.value !== "administration_entrusted");
    }
  }

  function toggleMobileMenu() {
    sidebar.classList.toggle("open");
    overlay.hidden = !sidebar.classList.contains("open");
  }

  function closeMobileMenu() {
    sidebar.classList.remove("open");
    overlay.hidden = true;
  }

  function openDialog(content, options) {
    const config = options || {};
    dialog.className = `dialog${config.wide ? " wide" : ""}`;
    dialog.innerHTML = content;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function renderDialogHead(title, subtitle) {
    return `
      <div class="dialog-head">
        <div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle || "")}</p></div>
        <button class="button small" type="button" data-action="close-dialog">关闭</button>
      </div>
    `;
  }

  function openQuickAdd() {
    openDialog(`
      ${renderDialogHead("新增业务", "选择需要登记的业务类型。")}
      <div class="dialog-body">
        <div class="issue-list">
          <button class="button" type="button" data-action="quick-benefit">登记福利发放</button>
          <button class="button" type="button" data-action="quick-exam">新建体检计划</button>
          <button class="button" type="button" data-action="quick-retreat">新建疗休养计划</button>
          <button class="button" type="button" data-action="quick-member">新增会员档案</button>
        </div>
      </div>
    `);
  }

  function openMemberForm(id) {
    const member = id ? getMember(id) : null;
    const formTitle = member ? `编辑会员：${member.name}` : "新增会员";
    openDialog(`
      ${renderDialogHead(formTitle, "资格字段将直接影响福利和疗休养规则判断。")}
      <form data-form="member-form">
        <input type="hidden" name="id" value="${attr(member?.id || "")}" />
        <div class="dialog-body">
          <div class="form-grid">
            <div class="field">
              <label for="member-name">姓名 *</label>
              <input class="input" id="member-name" name="name" value="${attr(member?.name || "")}" required />
            </div>
            <div class="field">
              <label for="member-department">部门</label>
              <input class="input" id="member-department" name="department" value="${attr(member?.department || "")}" />
            </div>
            <div class="field">
              <label for="member-status">人员状态 *</label>
              <select class="select" id="member-status" name="status" required>
                ${option("active", "在职", member?.status || "active")}
                ${option("retired", "离退休", member?.status)}
                ${option("inactive", "其他/离开", member?.status)}
              </select>
            </div>
            <div class="field">
              <label for="member-employment">用工形式</label>
              <select class="select" id="member-employment" name="employmentType">
                ${option("regular", "在编/正式", member?.employmentType || "regular")}
                ${option("contract", "合同制", member?.employmentType)}
                ${option("dispatched", "借用/挂职/派遣", member?.employmentType)}
                ${option("other", "其他", member?.employmentType)}
              </select>
            </div>
            <div class="field">
              <label for="member-birth">出生日期</label>
              <input class="input" id="member-birth" name="birthDate" type="date" value="${attr(member?.birthDate || "")}" />
            </div>
            <div class="field">
              <label for="member-join">入会日期</label>
              <input class="input" id="member-join" name="joinDate" type="date" value="${attr(member?.joinDate || "")}" />
            </div>
            <div class="field full">
              <span class="field-label">资格口径</span>
              <div class="check-grid">
                ${checkbox("isMember", "工会会员", member ? member.isMember : true)}
                ${checkbox("duesPaid", "已按规定缴纳会费", member ? member.duesPaid : true)}
                ${checkbox("salaryIncluded", "工资纳入拨缴工会经费工资总额", member ? member.salaryIncluded : true)}
              </div>
              <div class="field-help">借用、挂职、劳务派遣人员只能享受一处集体福利。</div>
            </div>
            <div class="field full">
              <label for="benefit-location">福利享受地点</label>
              <select class="select" id="benefit-location" name="benefitLocation">
                ${option("current", "本单位工会", member?.benefitLocation || "current")}
                ${option("other", "工资关系所在单位", member?.benefitLocation)}
                ${option("none", "尚未明确", member?.benefitLocation)}
              </select>
            </div>
            <div class="field full">
              <label for="member-notes">备注</label>
              <textarea class="textarea" id="member-notes" name="notes">${escapeHtml(member?.notes || "")}</textarea>
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">保存会员</button>
        </div>
      </form>
    `);
  }

  function option(value, label, selectedValue) {
    return `<option value="${attr(value)}" ${String(value) === String(selectedValue) ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }

  function checkbox(name, label, checked) {
    return `<label class="check-item"><input type="checkbox" name="${attr(name)}" ${checked ? "checked" : ""} /><span>${escapeHtml(label)}</span></label>`;
  }

  function submitMemberForm(form) {
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const existing = id ? getMember(id) : null;
    const member = {
      id: id || uid("member"),
      name: String(formData.get("name") || "").trim(),
      department: String(formData.get("department") || "").trim(),
      status: String(formData.get("status") || "active"),
      employmentType: String(formData.get("employmentType") || "regular"),
      birthDate: String(formData.get("birthDate") || ""),
      joinDate: String(formData.get("joinDate") || ""),
      isMember: formData.has("isMember"),
      duesPaid: formData.has("duesPaid"),
      salaryIncluded: formData.has("salaryIncluded"),
      benefitLocation: String(formData.get("benefitLocation") || "current"),
      notes: String(formData.get("notes") || "").trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!member.name) {
      showToast("姓名不能为空。", "error");
      return;
    }

    if (existing) {
      const index = state.members.findIndex((entry) => entry.id === existing.id);
      state.members[index] = member;
      audit("编辑会员", member.name);
    } else {
      state.members.push(member);
      audit("新增会员", member.name);
    }

    saveState();
    closeDialog();
    render();
    showToast(existing ? "会员信息已更新。" : "会员已新增。", "success");
  }

  function deleteMember(id) {
    const member = getMember(id);
    if (!member) return;
    const related = getMemberRecords(id);
    const relatedCount = related.benefits.length + related.exams.length + related.retreats.length;
    if (relatedCount > 0) {
      showToast("该会员已有业务记录，不能直接删除。可将状态改为离退休或其他。", "error");
      return;
    }
    if (!window.confirm(`确认删除会员“${member.name}”？`)) return;
    state.members = state.members.filter((entry) => entry.id !== id);
    audit("删除会员", member.name);
    saveState();
    render();
    showToast("会员已删除。", "success");
  }

  function openMemberUsage(id) {
    const member = getMember(id);
    if (!member) return;
    const usage = RULES.calculateBenefitUsage(state.benefits, member.id, currentYear);
    const typeRows = Object.entries(usage.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, amount]) => `<tr><td>${escapeHtml(getBenefitType(type).label)}</td><td>${formatMoney(amount)}</td><td>${getBenefitType(type).limit ? formatMoney(Math.max(getBenefitType(type).limit - amount, 0)) : "-"}</td></tr>`)
      .join("");
    const retreatCount = state.retreats.filter((plan) => planIncludesMember(plan, id) && getYear(plan.startDate) === currentYear).length;
    const examCount = state.examPlans.filter((plan) => planIncludesMember(plan, id) && (plan.completedMemberIds || []).includes(id) && getYear(plan.startDate) === currentYear).length;
    openDialog(`
      ${renderDialogHead(`${member.name} · ${currentYear}年度额度`, "额度按已登记且未取消记录累计。")}
      <div class="dialog-body">
        <div class="split-row">
          <div class="metric-mini"><span>节日慰问</span><strong>${formatMoney(usage.festival)} / 2,200元</strong></div>
          <div class="metric-mini"><span>生日慰问</span><strong>${formatMoney(usage.birthday)} / 500元</strong></div>
          <div class="metric-mini"><span>体检完成计划</span><strong>${examCount}个</strong></div>
          <div class="metric-mini"><span>疗休养纳入计划</span><strong>${retreatCount}次</strong></div>
        </div>
        <div class="divider"></div>
        ${typeRows ? `
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>项目</th><th>本年度累计</th><th>单项上限余额</th></tr></thead>
              <tbody>${typeRows}</tbody>
            </table>
          </div>
        ` : renderEmpty("尚无福利记录", "本年度没有已登记福利。", true)}
      </div>
    `);
  }

  function openMemberImport() {
    openDialog(`
      ${renderDialogHead("批量导入会员", "支持CSV文本或从表格直接复制。每行一名人员，首行可为表头。")}
      <form data-form="member-import-form">
        <div class="dialog-body">
          <div class="inline-note">字段顺序：姓名,部门,状态,用工形式,出生日期,入会日期,是否会员,会费已缴,工资已纳入,福利地点。状态可填“在职/离退休/其他”，是/否可用1/0。</div>
          <div class="field" style="margin-top:14px">
            <label for="member-import-text">粘贴CSV数据</label>
            <textarea class="textarea" id="member-import-text" name="csv" rows="12" placeholder="张晨,综合办公室,在职,在编/正式,1988-05-12,2020-01-01,是,是,是,本单位"></textarea>
          </div>
          <div class="field" style="margin-top:14px">
            <label for="member-import-file">或选择CSV文件</label>
            <input class="input" id="member-import-file" name="file" type="file" accept=".csv,text/csv" />
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">导入</button>
        </div>
      </form>
    `);
  }

  async function submitMemberImport(form) {
    const formData = new FormData(form);
    let csv = String(formData.get("csv") || "").trim();
    const file = formData.get("file");
    if (!csv && file && file.size) {
      csv = await file.text();
    }
    if (!csv) {
      showToast("请粘贴CSV数据或选择文件。", "error");
      return;
    }
    const rows = parseCsv(csv);
    if (rows.length && /姓名|name/i.test(rows[0][0] || "")) rows.shift();
    let added = 0;
    rows.forEach((columns) => {
      const name = String(columns[0] || "").trim();
      if (!name) return;
      const employment = mapImportEmployment(columns[3]);
      state.members.push({
        id: uid("member"),
        name,
        department: String(columns[1] || "").trim(),
        status: mapImportStatus(columns[2]),
        employmentType: employment,
        birthDate: normalizeDateString(columns[4]),
        joinDate: normalizeDateString(columns[5]),
        isMember: parseBoolean(columns[6], true),
        duesPaid: parseBoolean(columns[7], true),
        salaryIncluded: parseBoolean(columns[8], true),
        benefitLocation: mapBenefitLocation(columns[9]),
        notes: "批量导入",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      added += 1;
    });
    audit("批量导入会员", `${added}人`);
    saveState();
    closeDialog();
    render();
    showToast(`已导入${added}名会员。`, "success");
  }

  function parseCsv(text) {
    return text
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.split(/\t|,/).map((value) => value.trim().replace(/^"|"$/g, "")))
      .filter((row) => row.some(Boolean));
  }

  function parseBoolean(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    return /^(1|是|有|true|yes|y)$/i.test(String(value).trim());
  }

  function mapImportStatus(value) {
    const text = String(value || "").trim();
    if (/退休|离休/.test(text)) return "retired";
    if (/在职|active/i.test(text)) return "active";
    return "inactive";
  }

  function mapImportEmployment(value) {
    const text = String(value || "").trim();
    if (/派遣|挂职|借用/.test(text)) return "dispatched";
    if (/合同/.test(text)) return "contract";
    if (/在编|正式/.test(text)) return "regular";
    return "other";
  }

  function mapBenefitLocation(value) {
    const text = String(value || "").trim();
    if (/工资|其他/.test(text)) return "other";
    if (/未|无/.test(text)) return "none";
    return "current";
  }

  function normalizeDateString(value) {
    const text = String(value || "").trim().replace(/[./年]/g, "-").replace(/月/g, "-").replace(/日/g, "");
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return "";
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }

  function openExamForm(id) {
    const plan = id ? state.examPlans.find((entry) => entry.id === id) : null;
    const today = todayIso();
    openDialog(`
      ${renderDialogHead(plan ? `编辑体检计划：${plan.name}` : "新建体检计划", "系统不会记录体检结果，只跟踪组织、经费和完成状态。")}
      <form data-form="exam-form">
        <input type="hidden" name="id" value="${attr(plan?.id || "")}" />
        <div class="dialog-body">
          <div class="form-grid">
            <div class="field full">
              <label for="exam-name">计划名称 *</label>
              <input class="input" id="exam-name" name="name" value="${attr(plan?.name || `${currentYear}年度职工体检`)}" required />
            </div>
            <div class="field">
              <label for="exam-start">开始日期 *</label>
              <input class="input" id="exam-start" name="startDate" type="date" value="${attr(plan?.startDate || today)}" required />
            </div>
            <div class="field">
              <label for="exam-end">结束日期 *</label>
              <input class="input" id="exam-end" name="endDate" type="date" value="${attr(plan?.endDate || today)}" required />
            </div>
            <div class="field">
              <label for="exam-provider">体检机构</label>
              <input class="input" id="exam-provider" name="provider" value="${attr(plan?.provider || "")}" />
            </div>
            <div class="field">
              <label for="exam-budget">行政安排预算</label>
              <input class="input" id="exam-budget" name="budget" type="number" min="0" step="0.01" value="${attr(plan?.budget || 0)}" />
            </div>
            <div class="field">
              <label for="exam-source">经费来源 *</label>
              <select class="select" id="exam-source" name="fundSource">
                ${option("administration", "行政福利费/行政专项", plan?.fundSource || "administration")}
                ${option("administration_entrusted", "行政委托工会承办", plan?.fundSource)}
                ${option("union", "工会经费（不合规）", plan?.fundSource)}
              </select>
            </div>
            <div class="field">
              <label for="exam-status">计划状态</label>
              <select class="select" id="exam-status" name="status">
                ${option("planned", "已计划", plan?.status || "planned")}
                ${option("completed", "已完成", plan?.status)}
              </select>
            </div>
            <div class="field full ${plan?.fundSource === "administration_entrusted" ? "" : "hidden"}" data-authorization>
              <label for="exam-authorization">行政委托依据编号</label>
              <input class="input" id="exam-authorization" name="authorizationRef" value="${attr(plan?.authorizationRef || "")}" />
              <div class="field-help">工会承办时应留存单位行政书面委托。</div>
            </div>
            <div class="field full">
              <label for="exam-scope">参加范围 *</label>
              <select class="select" id="exam-scope" name="scope">
                ${option("all", "全部在职职工", plan?.scope || "all")}
                ${option("selected", "指定人员", plan?.scope)}
              </select>
            </div>
            <div class="field full ${plan?.scope === "selected" ? "" : "hidden"}" data-selected-members>
              <span class="field-label">选择参加人员</span>
              <div class="check-grid">${renderMemberCheckboxes(plan?.memberIds || [])}</div>
            </div>
            <div class="field full">
              <label for="exam-notes">备注</label>
              <textarea class="textarea" id="exam-notes" name="notes">${escapeHtml(plan?.notes || "")}</textarea>
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">保存计划</button>
        </div>
      </form>
    `, { wide: true });
  }

  function renderMemberCheckboxes(selectedIds) {
    if (!state.members.length) return '<span class="muted">尚无会员档案</span>';
    return state.members
      .filter((member) => member.status !== "retired")
      .map((member) => `
        <label class="check-item">
          <input type="checkbox" name="memberIds" value="${attr(member.id)}" ${selectedIds.includes(member.id) ? "checked" : ""} />
          <span>${escapeHtml(member.name)} · ${escapeHtml(member.department || "未填部门")}</span>
        </label>
      `).join("");
  }

  function submitExamForm(form) {
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const existing = id ? state.examPlans.find((entry) => entry.id === id) : null;
    const scope = String(formData.get("scope") || "all");
    const plan = {
      id: id || uid("exam"),
      name: String(formData.get("name") || "").trim(),
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || ""),
      provider: String(formData.get("provider") || "").trim(),
      budget: RULES.toNumber(formData.get("budget")),
      fundSource: String(formData.get("fundSource") || ""),
      authorizationRef: String(formData.get("authorizationRef") || "").trim(),
      scope,
      memberIds: scope === "selected" ? formData.getAll("memberIds").map(String) : [],
      status: String(formData.get("status") || "planned"),
      notes: String(formData.get("notes") || "").trim(),
      completedMemberIds: existing?.completedMemberIds || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = RULES.validateExamPlan(plan);
    if (result.decision === "block") {
      showToast(result.issues.find((issue) => issue.level === "block").message, "error");
      return;
    }
    if (!confirmWarnings(result.issues)) return;

    if (existing) {
      const index = state.examPlans.findIndex((entry) => entry.id === id);
      state.examPlans[index] = plan;
      audit("编辑体检计划", plan.name);
    } else {
      state.examPlans.push(plan);
      audit("新建体检计划", plan.name);
    }
    saveState();
    closeDialog();
    render();
    showToast("体检计划已保存。", "success");
  }

  function openExamProgress(id) {
    const plan = state.examPlans.find((entry) => entry.id === id);
    if (!plan) return;
    const participants = getPlanMembers(plan);
    const completed = new Set(plan.completedMemberIds || []);
    openDialog(`
      ${renderDialogHead(`${plan.name} · 人员进度`, "只登记“待检/已完成/免检”，不记录结果。")}
      <form data-form="exam-progress-form">
        <input type="hidden" name="id" value="${attr(plan.id)}" />
        <div class="dialog-body">
          ${participants.length ? `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>姓名</th><th>部门</th><th>完成状态</th></tr></thead>
                <tbody>
                  ${participants.map((member) => `
                    <tr>
                      <td><strong>${escapeHtml(member.name)}</strong></td>
                      <td>${escapeHtml(member.department || "-")}</td>
                      <td><label class="check-item"><input type="checkbox" name="completedIds" value="${attr(member.id)}" ${completed.has(member.id) ? "checked" : ""} /><span>已完成/免检</span></label></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmpty("计划没有参加人员", "请编辑计划并选择人员。", true)}
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">保存进度</button>
        </div>
      </form>
    `, { wide: true });
  }

  function submitExamProgress(form) {
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const plan = state.examPlans.find((entry) => entry.id === id);
    if (!plan) return;
    plan.completedMemberIds = formData.getAll("completedIds").map(String);
    plan.updatedAt = new Date().toISOString();
    audit("更新体检进度", plan.name);
    saveState();
    closeDialog();
    render();
    showToast("体检进度已更新。", "success");
  }

  function deleteExamPlan(id) {
    const plan = state.examPlans.find((entry) => entry.id === id);
    if (!plan || !window.confirm(`确认删除体检计划“${plan.name}”？`)) return;
    state.examPlans = state.examPlans.filter((entry) => entry.id !== id);
    audit("删除体检计划", plan.name);
    saveState();
    render();
    showToast("体检计划已删除。", "success");
  }

  function openBenefitForm(id, preset) {
    const record = id ? state.benefits.find((entry) => entry.id === id) : null;
    const initial = record || preset || {};
    openDialog(`
      ${renderDialogHead(record ? "编辑福利记录" : "登记福利发放", "硬性限制会阻止保存；复核提示会在确认后保留。")}
      <form data-form="benefit-form">
        <input type="hidden" name="id" value="${attr(record?.id || "")}" />
        <div class="dialog-body">
          <div class="form-grid">
            <div class="field">
              <label for="benefit-member">会员 *</label>
              <select class="select" id="benefit-member" name="memberId" required>
                <option value="">请选择</option>
                ${state.members.map((member) => option(member.id, `${member.name} · ${member.department || "未填部门"}`, initial.memberId)).join("")}
              </select>
            </div>
            <div class="field">
              <label for="benefit-type">福利类型 *</label>
              <select class="select" id="benefit-type" name="type" required>
                ${DATA.benefitTypes.map((type) => option(type.id, `${type.label}${type.limit ? `（上限${type.limit}元）` : ""}`, initial.type || "festival")).join("")}
              </select>
            </div>
            <div class="field">
              <label for="benefit-amount">发放金额 *</label>
              <input class="input" id="benefit-amount" name="amount" type="number" min="0.01" step="0.01" value="${attr(initial.amount || "")}" required />
            </div>
            <div class="field">
              <label for="benefit-date">发放日期 *</label>
              <input class="input" id="benefit-date" name="date" type="date" value="${attr(initial.date || todayIso())}" required />
            </div>
            <div class="field">
              <label for="benefit-payment">发放方式 *</label>
              <select class="select" id="benefit-payment" name="paymentMethod" required>
                ${DATA.benefitPaymentMethods.map((method) => option(method.id, method.label, initial.paymentMethod || (initial.type === "birthday" ? "cake_voucher" : "physical"))).join("")}
              </select>
            </div>
            <div class="field">
              <label for="benefit-status">登记状态 *</label>
              <select class="select" id="benefit-status" name="status">
                ${option("paid", "已发放", initial.status || "paid")}
                ${option("approved", "已审批待发", initial.status)}
                ${option("pending", "待补资料", initial.status)}
                ${option("cancelled", "已取消", initial.status)}
              </select>
            </div>
            <div class="field">
              <label for="benefit-condition">病种/事项标识</label>
              <input class="input" id="benefit-condition" name="condition" value="${attr(initial.condition || "")}" placeholder="住院需填病种；其他可填简要事项" />
            </div>
            <div class="field">
              <label for="benefit-event">事件编号</label>
              <input class="input" id="benefit-event" name="eventReference" value="${attr(initial.eventReference || "")}" placeholder="如生育事项、丧事事项编号" />
            </div>
            <div class="field">
              <label for="benefit-approval">审批编号/依据 *</label>
              <input class="input" id="benefit-approval" name="approvalRef" value="${attr(initial.approvalRef || "")}" required />
            </div>
            <div class="field">
              <label for="benefit-paid-date">实际发放日期</label>
              <input class="input" id="benefit-paid-date" name="paidDate" type="date" value="${attr(initial.paidDate || initial.date || todayIso())}" />
            </div>
            <div class="field full">
              <span class="field-label">审批与签收</span>
              <div class="check-grid">
                <label class="check-item"><input type="checkbox" name="signed" ${initial.signed !== false ? "checked" : ""} /><span>已实名签收</span></label>
              </div>
            </div>
            <div class="field full">
              <label for="benefit-notes">备注</label>
              <textarea class="textarea" id="benefit-notes" name="notes">${escapeHtml(initial.notes || "")}</textarea>
            </div>
          </div>
          <div class="answer-box" data-benefit-validation>
            <h3>保存前自动校验</h3>
            <p class="muted">填写会员、类型和金额后，系统在提交时给出完整结论。</p>
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">保存发放记录</button>
        </div>
      </form>
    `, { wide: true });
  }

  function submitBenefitForm(form) {
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const existing = id ? state.benefits.find((entry) => entry.id === id) : null;
    const record = {
      id: id || uid("benefit"),
      memberId: String(formData.get("memberId") || ""),
      type: String(formData.get("type") || ""),
      amount: RULES.toNumber(formData.get("amount")),
      date: String(formData.get("date") || ""),
      paymentMethod: String(formData.get("paymentMethod") || ""),
      status: String(formData.get("status") || "paid"),
      condition: String(formData.get("condition") || "").trim(),
      eventReference: String(formData.get("eventReference") || "").trim(),
      approvalRef: String(formData.get("approvalRef") || "").trim(),
      paidDate: String(formData.get("paidDate") || ""),
      signed: formData.has("signed"),
      notes: String(formData.get("notes") || "").trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const member = getMember(record.memberId);
    const year = getYear(record.date);
    const lineId = benefitBudgetLine(record.type);
    const result = RULES.validateBenefit(record, {
      member,
      existing: state.benefits.filter((entry) => entry.id !== record.id),
      fiscalYear: year,
      budget: {
        annual: getBudget(year, lineId),
        used: getBudgetUsed(year, lineId) - (existing ? RULES.toNumber(existing.amount) : 0)
      }
    });
    renderResultInDialog(form.querySelector("[data-benefit-validation]"), result);
    if (result.decision === "block") {
      showToast(result.issues.find((issue) => issue.level === "block").message, "error");
      return;
    }
    if (!confirmWarnings(result.issues)) return;

    if (existing) {
      const index = state.benefits.findIndex((entry) => entry.id === id);
      state.benefits[index] = record;
      audit("编辑福利记录", `${member?.name || "未知会员"} ${getBenefitType(record.type).label}`);
    } else {
      state.benefits.push(record);
      audit("登记福利发放", `${member?.name || "未知会员"} ${getBenefitType(record.type).label} ${formatMoney(record.amount)}`);
    }
    saveState();
    closeDialog();
    render();
    showToast("福利记录已保存。", "success");
  }

  function renderResultInDialog(container, result) {
    if (!container) return;
    const issues = result.issues.length
      ? result.issues
      : [{ level: "pass", message: "未发现规则冲突，可继续履行审批和签收手续。", reference: null }];
    container.innerHTML = `
      <h3>规则结论：${RULES.buildDecisionLabel(result.decision)}</h3>
      <div class="issue-list">${issues.map(renderIssue).join("")}</div>
    `;
  }

  function confirmWarnings(issues) {
    const warnings = issues.filter((entry) => entry.level === "warn");
    if (!warnings.length) return true;
    return window.confirm(`存在${warnings.length}项复核提示：\n${warnings.map((entry) => `- ${entry.message}`).join("\n")}\n\n确认继续保存？`);
  }

  function openBenefitRules(id) {
    const record = state.benefits.find((entry) => entry.id === id);
    if (!record) return;
    const result = validateSavedBenefit(record);
    openDialog(`
      ${renderDialogHead("福利记录规则诊断", `${getMember(record.memberId)?.name || "未知会员"} · ${getBenefitType(record.type).label}`)}
      <div class="dialog-body">
        <div class="answer-box">
          <h3>${RULES.buildDecisionLabel(result.decision)}</h3>
          <div class="issue-list">
            ${(result.issues.length ? result.issues : [{ level: "pass", message: "未发现规则冲突。", reference: null }]).map(renderIssue).join("")}
          </div>
        </div>
      </div>
    `);
  }

  function deleteBenefit(id) {
    const record = state.benefits.find((entry) => entry.id === id);
    if (!record || !window.confirm("确认删除该福利记录？")) return;
    state.benefits = state.benefits.filter((entry) => entry.id !== id);
    audit("删除福利记录", `${getMember(record.memberId)?.name || "未知会员"} ${getBenefitType(record.type).label}`);
    saveState();
    render();
    showToast("福利记录已删除。", "success");
  }

  function generateBirthdayDrafts() {
    if (!state.members.length) {
      showToast("请先建立会员档案。", "error");
      return;
    }
    const month = TODAY.getMonth() + 1;
    const candidates = state.members.filter((member) => {
      if (member.status !== "active" || !member.birthDate) return false;
      if (Number(String(member.birthDate).slice(5, 7)) !== month) return false;
      const usage = RULES.calculateBenefitUsage(state.benefits, member.id, currentYear);
      return usage.birthday <= 0;
    });
    if (!candidates.length) {
      showToast("本月没有尚未登记的生日慰问对象。", "success");
      return;
    }
    openDialog(`
      ${renderDialogHead("生成生日慰问草稿", `按月生成${currentYear}年${month}月记录，默认300元，日期为今天。`)}
      <form data-form="benefit-form">
        <input type="hidden" name="type" value="birthday" />
        <input type="hidden" name="paymentMethod" value="cake_voucher" />
        <input type="hidden" name="status" value="pending" />
        <input type="hidden" name="date" value="${todayIso()}" />
        <input type="hidden" name="paidDate" value="" />
        <input type="hidden" name="approvalRef" value="待补生日审批" />
        <div class="dialog-body">
          <div class="field">
            <label for="birthday-member">生成对象</label>
            <select class="select" id="birthday-member" name="memberId">
              ${candidates.map((member) => `<option value="${attr(member.id)}">${escapeHtml(member.name)} · ${escapeHtml(String(member.birthDate).slice(5, 10))}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="margin-top:14px">
            <label for="birthday-amount">拟慰问金额</label>
            <input class="input" id="birthday-amount" name="amount" type="number" min="1" max="500" step="0.01" value="300" required />
          </div>
          <div class="inline-note" style="margin-top:14px">生成后记录为“待补资料”，需补齐审批和实名签收。可逐个生成，避免误发。</div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">生成记录</button>
        </div>
      </form>
    `);
  }

  function openRetreatForm(id, useLinhai) {
    const plan = id ? state.retreats.find((entry) => entry.id === id) : null;
    const draft = plan || (useLinhai ? {
      title: `${currentYear}年“诗城田园游”疗休养活动`,
      location: "林海生态园",
      startDate: todayIso(),
      endDate: todayIso(),
      perPersonPerDay: 390,
      selectedRoute: "wellness-1",
      insuranceConfirmed: false,
      procurementProcedure: "quotation",
      scope: "all",
      status: "planned"
    } : null);
    if (useLinhai) {
      const end = new Date(`${todayIso()}T00:00:00`);
      end.setDate(end.getDate() + 1);
      draft.endDate = end.toISOString().slice(0, 10);
    }
    openDialog(`
      ${renderDialogHead(plan ? `编辑疗休养计划：${plan.title}` : "新建疗休养计划", "系统自动校验2天时限、地点名录、400元日标准、保险和采购程序。")}
      <form data-form="retreat-form">
        <input type="hidden" name="id" value="${attr(plan?.id || "")}" />
        <div class="dialog-body">
          <div class="form-grid">
            <div class="field full">
              <label for="retreat-title">计划名称 *</label>
              <input class="input" id="retreat-title" name="title" value="${attr(draft?.title || `${currentYear}年职工“诗城田园游”疗休养`)}" required />
            </div>
            <div class="field">
              <label for="retreat-start">开始日期 *</label>
              <input class="input" id="retreat-start" name="startDate" type="date" value="${attr(draft?.startDate || todayIso())}" required />
            </div>
            <div class="field">
              <label for="retreat-end">结束日期 *</label>
              <input class="input" id="retreat-end" name="endDate" type="date" value="${attr(draft?.endDate || todayIso())}" required />
            </div>
            <div class="field full">
              <label for="retreat-location">地点 *</label>
              <select class="select" id="retreat-location" name="location" required>
                <option value="">请选择名录内地点</option>
                ${DATA.allowedRetreatLocations.map((location) => option(location, location, draft?.location)).join("")}
              </select>
              <div class="field-help">来源：马工发〔2026〕4号附件1、附件2。</div>
            </div>
            <div class="field">
              <label for="retreat-daily">每人每天费用 *</label>
              <input class="input" id="retreat-daily" name="perPersonPerDay" type="number" min="1" max="400" step="0.01" value="${attr(draft?.perPersonPerDay || 400)}" required />
            </div>
            <div class="field">
              <label for="retreat-status">计划状态</label>
              <select class="select" id="retreat-status" name="status">
                ${option("planned", "已计划", draft?.status || "planned")}
                ${option("approved", "已审批", draft?.status)}
                ${option("completed", "已完成", draft?.status)}
                ${option("paid", "已结算", draft?.status)}
              </select>
            </div>
            <div class="field">
              <label for="retreat-procurement">采购程序 *</label>
              <select class="select" id="retreat-procurement" name="procurementProcedure">
                <option value="none">未履行</option>
                ${option("quotation", "比选/询价", draft?.procurementProcedure)}
                ${option("government_procurement", "政府采购", draft?.procurementProcedure)}
                ${option("public_bidding", "公开招标", draft?.procurementProcedure)}
                ${option("administrative_approval", "按内部审批直接确定", draft?.procurementProcedure)}
              </select>
            </div>
            <div class="field">
              <label for="retreat-route">参考路线</label>
              <select class="select" id="retreat-route" name="selectedRoute">
                <option value="">未指定</option>
                ${DATA.linhaiRouteOptions.map((route) => option(route.id, route.name, draft?.selectedRoute)).join("")}
              </select>
            </div>
            <div class="field">
              <label for="retreat-lead">负责人</label>
              <input class="input" id="retreat-lead" name="leadPerson" value="${attr(draft?.leadPerson || "")}" />
            </div>
            <div class="field">
              <label for="retreat-scope">参加范围 *</label>
              <select class="select" id="retreat-scope" name="scope">
                ${option("all", "全部在职职工", draft?.scope || "all")}
                ${option("selected", "指定人员", draft?.scope)}
              </select>
            </div>
            <div class="field full ${draft?.scope === "selected" ? "" : "hidden"}" data-selected-members>
              <span class="field-label">选择参加人员</span>
              <div class="check-grid">${renderMemberCheckboxes(draft?.memberIds || [])}</div>
            </div>
            <div class="field full">
              <span class="field-label">专项保障</span>
              <div class="check-grid">
                <label class="check-item"><input type="checkbox" name="insuranceConfirmed" ${draft?.insuranceConfirmed ? "checked" : ""} /><span>已为参加职工购买人身意外保险</span></label>
                <label class="check-item"><input type="checkbox" name="allowFamily" ${draft?.allowFamily ? "checked" : ""} /><span>允许家属随行</span></label>
                <label class="check-item"><input type="checkbox" name="familyPaymentConfirmed" ${draft?.familyPaymentConfirmed ? "checked" : ""} /><span>家属费用自理并单独订立合同</span></label>
                <label class="check-item"><input type="checkbox" name="cashDistribution" ${draft?.cashDistribution ? "checked" : ""} /><span>存在以疗休养名义发放钱物（禁止）</span></label>
              </div>
            </div>
            <div class="field full">
              <label for="retreat-notes">备注</label>
              <textarea class="textarea" id="retreat-notes" name="notes">${escapeHtml(draft?.notes || "")}</textarea>
            </div>
          </div>
          <div class="answer-box">
            <h3>费用自动测算</h3>
            <p class="muted">按开始、结束日期和每人每天标准自动计算天数、单人和总额。</p>
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">保存计划</button>
        </div>
      </form>
    `, { wide: true });
  }

  function submitRetreatForm(form) {
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const existing = id ? state.retreats.find((entry) => entry.id === id) : null;
    const scope = String(formData.get("scope") || "all");
    const plan = {
      id: id || uid("retreat"),
      title: String(formData.get("title") || "").trim(),
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || ""),
      location: String(formData.get("location") || ""),
      perPersonPerDay: RULES.toNumber(formData.get("perPersonPerDay")),
      status: String(formData.get("status") || "planned"),
      procurementProcedure: String(formData.get("procurementProcedure") || "none"),
      selectedRoute: String(formData.get("selectedRoute") || ""),
      leadPerson: String(formData.get("leadPerson") || "").trim(),
      scope,
      memberIds: scope === "selected" ? formData.getAll("memberIds").map(String) : [],
      insuranceConfirmed: formData.has("insuranceConfirmed"),
      allowFamily: formData.has("allowFamily"),
      familyPaymentConfirmed: formData.has("familyPaymentConfirmed"),
      cashDistribution: formData.has("cashDistribution"),
      notes: String(formData.get("notes") || "").trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = RULES.validateRetreatPlan(plan, {
      members: state.members,
      allowedLocations: DATA.allowedRetreatLocations,
      budget: {
        annual: getBudget(getYear(plan.startDate), "retreat"),
        used: getBudgetUsed(getYear(plan.startDate), "retreat")
      }
    });
    if (result.decision === "block") {
      showToast(result.issues.find((issue) => issue.level === "block").message, "error");
      return;
    }
    if (!confirmWarnings(result.issues)) return;

    if (existing) {
      const index = state.retreats.findIndex((entry) => entry.id === id);
      state.retreats[index] = plan;
      audit("编辑疗休养计划", plan.title);
    } else {
      state.retreats.push(plan);
      audit("新建疗休养计划", plan.title);
    }
    saveState();
    closeDialog();
    render();
    showToast("疗休养计划已保存。", "success");
  }

  function openRetreatMembers(id) {
    const plan = state.retreats.find((entry) => entry.id === id);
    if (!plan) return;
    const participants = getPlanMembers(plan);
    const memberIds = new Set(participants.map((member) => member.id));
    openDialog(`
      ${renderDialogHead(`${plan.title} · 参加人员`, "取消勾选的人员将从该计划中移除。")}
      <form data-form="retreat-members-form">
        <input type="hidden" name="id" value="${attr(plan.id)}" />
        <div class="dialog-body">
          <div class="field">
            <label for="retreat-member-scope">参加范围</label>
            <select class="select" id="retreat-member-scope" name="scope">
              ${option("all", "全部在职职工", plan.scope)}
              ${option("selected", "指定人员", plan.scope)}
            </select>
          </div>
          <div class="field" style="margin-top:14px">
            <span class="field-label">指定人员</span>
            <div class="check-grid">
              ${state.members.filter((member) => member.status !== "retired").map((member) => `
                <label class="check-item">
                  <input type="checkbox" name="memberIds" value="${attr(member.id)}" ${memberIds.has(member.id) ? "checked" : ""} />
                  <span>${escapeHtml(member.name)} · ${escapeHtml(member.department || "未填部门")}</span>
                </label>
              `).join("")}
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">保存人员</button>
        </div>
      </form>
    `, { wide: true });
  }

  function submitRetreatMembers(form) {
    const formData = new FormData(form);
    const plan = state.retreats.find((entry) => entry.id === String(formData.get("id") || ""));
    if (!plan) return;
    plan.scope = String(formData.get("scope") || "all");
    plan.memberIds = plan.scope === "selected" ? formData.getAll("memberIds").map(String) : [];
    plan.updatedAt = new Date().toISOString();
    audit("调整疗休养人员", plan.title);
    saveState();
    closeDialog();
    render();
    showToast("参加人员已更新。", "success");
  }

  function openRetreatRules(id) {
    const plan = state.retreats.find((entry) => entry.id === id);
    if (!plan) return;
    const result = RULES.validateRetreatPlan(plan, {
      members: state.members,
      allowedLocations: DATA.allowedRetreatLocations,
      budget: {
        annual: getBudget(getYear(plan.startDate), "retreat"),
        used: getBudgetUsed(getYear(plan.startDate), "retreat")
          - (existing && ["approved", "completed", "paid"].includes(existing.status)
            ? RULES.validateRetreatPlan(existing, { members: state.members }).summary.projectedTotal
            : 0)
      }
    });
    openDialog(`
      ${renderDialogHead("疗休养计划规则诊断", `${plan.title} · ${result.summary.days}天 · ${formatMoney(result.summary.perPersonTotal)}/人`)}
      <div class="dialog-body">
        <div class="answer-box">
          <h3>${RULES.buildDecisionLabel(result.decision)}</h3>
          <div class="issue-list">
            ${(result.issues.length ? result.issues : [{ level: "pass", message: "未发现规则冲突。", reference: null }]).map(renderIssue).join("")}
          </div>
        </div>
      </div>
    `);
  }

  function deleteRetreat(id) {
    const plan = state.retreats.find((entry) => entry.id === id);
    if (!plan || !window.confirm(`确认删除疗休养计划“${plan.title}”？`)) return;
    state.retreats = state.retreats.filter((entry) => entry.id !== id);
    audit("删除疗休养计划", plan.title);
    saveState();
    render();
    showToast("疗休养计划已删除。", "success");
  }

  function openBudgetForm(lineId) {
    const yearBudget = getBudgetYear(currentYear);
    openDialog(`
      ${renderDialogHead(`设置${currentYear}年预算`, "预算为上限标准，业务金额超过余额时会自动拦截。")}
      <form data-form="budget-form">
        <div class="dialog-body">
          <div class="form-grid">
            ${DATA.budgetLines.map((line) => `
              <div class="field">
                <label for="budget-${attr(line.id)}">${escapeHtml(line.label)}</label>
                <input class="input" id="budget-${attr(line.id)}" name="${attr(line.id)}" type="number" min="0" step="0.01" value="${attr(yearBudget[line.id] || 0)}" ${lineId === line.id ? "data-focus=\"true\"" : ""} />
              </div>
            `).join("")}
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button primary" type="submit">保存预算</button>
        </div>
      </form>
    `, { wide: true });
    const focus = dialog.querySelector('[data-focus="true"]');
    if (focus) focus.focus();
  }

  function submitBudgetForm(form) {
    const formData = new FormData(form);
    const budget = {};
    DATA.budgetLines.forEach((line) => {
      budget[line.id] = RULES.toNumber(formData.get(line.id));
    });
    state.budgets[currentYear] = budget;
    audit("设置年度预算", `${currentYear}年`);
    saveState();
    closeDialog();
    render();
    showToast("年度预算已保存。", "success");
  }

  function submitSettingsForm(form) {
    const formData = new FormData(form);
    state.settings.organizationName = String(formData.get("organizationName") || "").trim() || DATA.organizationDefaults.name;
    state.settings.dataOwner = String(formData.get("dataOwner") || "").trim();
    state.settings.fiscalYear = Number(formData.get("fiscalYear") || currentYear);
    currentYear = state.settings.fiscalYear;
    getBudgetYear(currentYear);
    audit("更新系统设置", state.settings.organizationName);
    saveState();
    render();
    showToast("设置已保存。", "success");
  }

  function openDiagnostic() {
    openDialog(`
      ${renderDialogHead("智能规则诊断", "输入拟办事项，先看系统结论，再准备正式审批材料。")}
      <form data-form="diagnose-form">
        <div class="dialog-body">
          <div class="form-grid">
            <div class="field full">
              <label for="diagnose-scenario">业务场景 *</label>
              <select class="select" id="diagnose-scenario" name="scenario">
                <option value="benefit">福利发放额度与方式</option>
                <option value="exam">职工体检经费来源</option>
                <option value="retreat">疗休养计划</option>
              </select>
            </div>
            <div class="field full" data-scenario-group="benefit">
              <span class="field-label">福利参数</span>
              <div class="form-grid">
                <div class="field full">
                  <label for="diagnose-member">会员</label>
                  <select class="select" id="diagnose-member" name="memberId">
                    <option value="">请选择</option>
                    ${state.members.map((member) => `<option value="${attr(member.id)}">${escapeHtml(member.name)} · ${escapeHtml(member.department || "未填")}</option>`).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="diagnose-benefit-type">福利类型</label>
                  <select class="select" id="diagnose-benefit-type" name="benefitType">
                    ${DATA.benefitTypes.map((type) => option(type.id, `${type.label}${type.limit ? `（上限${type.limit}元）` : ""}`, "festival")).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="diagnose-amount">金额</label>
                  <input class="input" id="diagnose-amount" name="amount" type="number" min="0" step="0.01" value="300" />
                </div>
                <div class="field">
                  <label for="diagnose-date">日期</label>
                  <input class="input" id="diagnose-date" name="date" type="date" value="${todayIso()}" />
                </div>
                <div class="field">
                  <label for="diagnose-payment">发放方式</label>
                  <select class="select" id="diagnose-payment" name="paymentMethod">
                    ${DATA.benefitPaymentMethods.map((method) => option(method.id, method.label, "physical")).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="diagnose-condition">病种/条件</label>
                  <input class="input" id="diagnose-condition" name="condition" />
                </div>
                <div class="field">
                  <label for="diagnose-approval">审批编号</label>
                  <input class="input" id="diagnose-approval" name="approvalRef" value="拟办事项" />
                </div>
                <div class="field full">
                  <label class="check-item"><input type="checkbox" name="signed" checked /><span>已完成实名签收</span></label>
                </div>
              </div>
            </div>
            <div class="field full hidden" data-scenario-group="exam">
              <span class="field-label">体检参数</span>
              <div class="form-grid">
                <div class="field full">
                  <label for="diagnose-exam-source">经费来源</label>
                  <select class="select" id="diagnose-exam-source" name="examFundSource">
                    ${option("administration", "行政福利费/行政专项", "administration")}
                    ${option("administration_entrusted", "行政委托工会承办", "administration")}
                    ${option("union", "工会经费", "administration")}
                  </select>
                </div>
                <div class="field full">
                  <label for="diagnose-exam-auth">行政委托编号</label>
                  <input class="input" id="diagnose-exam-auth" name="examAuthorization" />
                </div>
              </div>
            </div>
            <div class="field full hidden" data-scenario-group="retreat">
              <span class="field-label">疗休养参数</span>
              <div class="form-grid">
                <div class="field">
                  <label for="diagnose-retreat-start">开始日期</label>
                  <input class="input" id="diagnose-retreat-start" name="retreatStart" type="date" value="${todayIso()}" />
                </div>
                <div class="field">
                  <label for="diagnose-retreat-end">结束日期</label>
                  <input class="input" id="diagnose-retreat-end" name="retreatEnd" type="date" value="${todayIso()}" />
                </div>
                <div class="field">
                  <label for="diagnose-retreat-location">地点</label>
                  <select class="select" id="diagnose-retreat-location" name="retreatLocation">
                    <option value="">请选择</option>
                    ${DATA.allowedRetreatLocations.map((location) => option(location, location)).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="diagnose-retreat-daily">每人每天</label>
                  <input class="input" id="diagnose-retreat-daily" name="retreatDaily" type="number" min="0" value="400" />
                </div>
                <div class="field full">
                  <span class="field-label">保障条件</span>
                  <div class="check-grid">
                    <label class="check-item"><input type="checkbox" name="retreatInsurance" /><span>已购人身意外保险</span></label>
                    <label class="check-item"><input type="checkbox" name="retreatProcurement" /><span>已履行采购程序</span></label>
                    <label class="check-item"><input type="checkbox" name="retreatFamily" /><span>有家属随行且费用自理</span></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="answer-box" data-diagnostic-result>
            <h3>等待诊断</h3>
            <p class="muted">填写参数后点击“执行诊断”。</p>
          </div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">关闭</button>
          <button class="button primary" type="submit">执行诊断</button>
        </div>
      </form>
    `, { wide: true });
  }

  function updateDiagnosticFields() {
    const form = dialog.querySelector('[data-form="diagnose-form"]');
    if (!form) return;
    const scenario = form.querySelector('[name="scenario"]').value;
    form.querySelectorAll("[data-scenario-group]").forEach((group) => {
      group.classList.toggle("hidden", group.dataset.scenarioGroup !== scenario);
    });
  }

  function submitDiagnostic(form) {
    const formData = new FormData(form);
    const scenario = String(formData.get("scenario") || "benefit");
    let result;

    if (scenario === "benefit") {
      const record = {
        id: "",
        memberId: String(formData.get("memberId") || ""),
        type: String(formData.get("benefitType") || ""),
        amount: RULES.toNumber(formData.get("amount")),
        date: String(formData.get("date") || todayIso()),
        paymentMethod: String(formData.get("paymentMethod") || ""),
        condition: String(formData.get("condition") || ""),
        eventReference: "",
        approvalRef: String(formData.get("approvalRef") || ""),
        signed: formData.has("signed"),
        status: "paid",
        paidDate: String(formData.get("date") || todayIso())
      };
      const lineId = benefitBudgetLine(record.type);
      result = RULES.validateBenefit(record, {
        member: getMember(record.memberId),
        existing: state.benefits,
        fiscalYear: getYear(record.date),
        budget: {
          annual: getBudget(getYear(record.date), lineId),
          used: getBudgetUsed(getYear(record.date), lineId)
        }
      });
    }

    if (scenario === "exam") {
      result = RULES.validateExamPlan({
        name: "拟办体检",
        startDate: todayIso(),
        endDate: todayIso(),
        provider: "待定",
        budget: 1,
        fundSource: String(formData.get("examFundSource") || ""),
        authorizationRef: String(formData.get("examAuthorization") || ""),
        scope: "all"
      });
    }

    if (scenario === "retreat") {
      result = RULES.validateRetreatPlan({
        title: "拟办疗休养",
        startDate: String(formData.get("retreatStart") || ""),
        endDate: String(formData.get("retreatEnd") || ""),
        location: String(formData.get("retreatLocation") || ""),
        perPersonPerDay: RULES.toNumber(formData.get("retreatDaily")),
        insuranceConfirmed: formData.has("retreatInsurance"),
        procurementProcedure: formData.has("retreatProcurement") ? "quotation" : "none",
        allowFamily: formData.has("retreatFamily"),
        familyPaymentConfirmed: formData.has("retreatFamily"),
        scope: "all",
        cashDistribution: false
      }, {
        members: state.members,
        allowedLocations: DATA.allowedRetreatLocations,
        budget: {
          annual: getBudget(currentYear, "retreat"),
          used: getBudgetUsed(currentYear, "retreat")
        }
      });
    }

    const resultBox = form.querySelector("[data-diagnostic-result]");
    resultBox.innerHTML = `
      <h3>诊断结论：${RULES.buildDecisionLabel(result.decision || "pass")}</h3>
      <div class="issue-list">
        ${(result.issues?.length ? result.issues : [{ level: "pass", message: "未发现硬性规则冲突，仍需履行本级审批。", reference: null }]).map(renderIssue).join("")}
      </div>
    `;
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `慈湖高新区机关工会数据备份-${todayIso()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    audit("导出数据备份", `${state.members.length}名会员`);
    saveState();
    showToast("备份文件已导出。", "success");
  }

  function openImportDialog() {
    openDialog(`
      ${renderDialogHead("导入数据备份", "导入会覆盖当前浏览器中的数据，请先确认已有最新备份。")}
      <form data-form="import-json-form">
        <div class="dialog-body">
          <div class="field">
            <label for="import-json-file">选择JSON备份文件</label>
            <input class="input" id="import-json-file" name="file" type="file" accept=".json,application/json" required />
          </div>
          <div class="inline-note" style="margin-top:14px">仅支持本系统导出的JSON格式。</div>
        </div>
        <div class="dialog-foot">
          <button class="button" type="button" data-action="close-dialog">取消</button>
          <button class="button danger" type="submit">覆盖导入</button>
        </div>
      </form>
    `);
  }

  async function submitImportJson(form) {
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!file || !file.size) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.members)) {
        throw new Error("文件结构不正确");
      }
      if (!window.confirm("确认覆盖当前数据？")) return;
      state = migrateState(parsed);
      currentYear = Number(state.settings.fiscalYear || TODAY.getFullYear());
      saveState();
      closeDialog();
      render();
      showToast("数据备份已导入。", "success");
    } catch (error) {
      showToast(`导入失败：${error.message}`, "error");
    }
  }

  function loadDemoData() {
    if (state.members.length && !window.confirm("载入演示数据将替换当前全部数据，确认继续？")) return;
    state = createDemoState();
    currentYear = state.settings.fiscalYear;
    saveState();
    closeDialog();
    render();
    showToast("演示数据已载入。", "success");
  }

  function createDemoState() {
    const base = createDefaultState();
    const year = currentYear;
    const members = [
      { name: "张晨", department: "综合办公室", status: "active", employmentType: "regular", birthDate: "1988-09-12", joinDate: "2015-03-01", isMember: true, duesPaid: true, salaryIncluded: true, benefitLocation: "current" },
      { name: "李岚", department: "党群工作部", status: "active", employmentType: "regular", birthDate: "1992-09-23", joinDate: "2018-05-10", isMember: true, duesPaid: true, salaryIncluded: true, benefitLocation: "current" },
      { name: "王宁", department: "经济发展局", status: "active", employmentType: "contract", birthDate: "1985-11-03", joinDate: "2020-08-15", isMember: true, duesPaid: true, salaryIncluded: true, benefitLocation: "current" },
      { name: "赵青", department: "科技创新局", status: "active", employmentType: "regular", birthDate: "1990-02-18", joinDate: "2019-01-02", isMember: true, duesPaid: true, salaryIncluded: true, benefitLocation: "current" },
      { name: "陈平", department: "规划建设局", status: "active", employmentType: "dispatched", birthDate: "1987-06-26", joinDate: "2022-04-01", isMember: true, duesPaid: true, salaryIncluded: true, benefitLocation: "current" },
      { name: "周敏", department: "财政金融局", status: "active", employmentType: "regular", birthDate: "1994-09-28", joinDate: "2021-09-01", isMember: true, duesPaid: false, salaryIncluded: true, benefitLocation: "current" },
      { name: "孙杰", department: "社会事业局", status: "active", employmentType: "regular", birthDate: "1983-12-09", joinDate: "2012-04-16", isMember: true, duesPaid: true, salaryIncluded: true, benefitLocation: "current" },
      { name: "退休示例", department: "原综合办公室", status: "retired", employmentType: "regular", birthDate: "1965-03-22", joinDate: "2000-01-01", isMember: true, duesPaid: false, salaryIncluded: false, benefitLocation: "none" }
    ].map((member) => ({
      ...member,
      id: uid("member"),
      notes: "演示数据",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    const byName = Object.fromEntries(members.map((member) => [member.name, member]));
    const benefits = [
      {
        memberId: byName["张晨"].id,
        type: "festival",
        amount: 600,
        date: `${year}-02-10`,
        paymentMethod: "merchant_voucher",
        status: "paid",
        approvalRef: "演示审批-春节",
        paidDate: `${year}-02-11`,
        signed: true
      },
      {
        memberId: byName["李岚"].id,
        type: "birthday",
        amount: 300,
        date: `${year}-09-20`,
        paymentMethod: "cake_voucher",
        status: "approved",
        approvalRef: "演示审批-生日",
        paidDate: "",
        signed: false
      },
      {
        memberId: byName["王宁"].id,
        type: "hospital",
        amount: 1000,
        date: `${year}-04-16`,
        paymentMethod: "cash",
        status: "paid",
        condition: "急性阑尾炎",
        approvalRef: "演示审批-住院",
        paidDate: `${year}-04-18`,
        signed: true
      }
    ].map((record) => ({
      ...record,
      id: uid("benefit"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    const examPlan = {
      id: uid("exam"),
      name: `${year}年度机关职工体检`,
      startDate: `${year}-09-01`,
      endDate: `${year}-10-31`,
      provider: "待确定承检机构",
      budget: 80000,
      fundSource: "administration",
      authorizationRef: "",
      scope: "all",
      memberIds: [],
      status: "planned",
      notes: "演示数据，体检结果不在系统保存",
      completedMemberIds: [byName["张晨"].id, byName["赵青"].id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const retreatPlan = {
      id: uid("retreat"),
      title: `${year}年“诗城田园游”疗休养活动`,
      startDate: `${year}-09-26`,
      endDate: `${year}-09-27`,
      location: "林海生态园",
      perPersonPerDay: 390,
      status: "planned",
      procurementProcedure: "quotation",
      selectedRoute: "wellness-1",
      leadPerson: "工会经办人员",
      scope: "all",
      memberIds: [],
      insuranceConfirmed: true,
      allowFamily: false,
      familyPaymentConfirmed: false,
      cashDistribution: false,
      notes: "演示数据，按林海参考报价测算",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return {
      ...base,
      settings: { ...base.settings, fiscalYear: year },
      members,
      benefits,
      examPlans: [examPlan],
      retreats: [retreatPlan],
      budgets: {
        [year]: {
          member_activity: 120000,
          retreat: 60000,
          service: 20000,
          rights: 30000,
          education: 20000,
          sports: 30000,
          publicity: 20000,
          business: 50000,
          capital: 20000,
          other: 10000
        }
      },
      audits: [{
        id: uid("audit"),
        action: "载入演示数据",
        detail: "系统内置虚构数据",
        at: new Date().toISOString()
      }]
    };
  }

  function clearAllData() {
    if (!window.confirm("确认清空所有会员、体检、福利、疗休养和预算数据？该操作不可撤销。")) return;
    state = createDefaultState();
    currentYear = state.settings.fiscalYear;
    localStorage.removeItem(STORAGE_KEY);
    saveState();
    closeDialog();
    render();
    showToast("全部数据已清空。", "success");
  }

  function filterMemberTable() {
    const query = String(document.getElementById("member-search")?.value || "").trim().toLowerCase();
    const status = String(document.getElementById("member-status-filter")?.value || "");
    document.querySelectorAll("[data-member-row]").forEach((row) => {
      const matchesQuery = !query || row.dataset.search.includes(query);
      const matchesStatus = !status || row.dataset.status === status;
      row.classList.toggle("hidden", !matchesQuery || !matchesStatus);
    });
  }

  function showToast(message, tone) {
    const toast = document.createElement("div");
    toast.className = `toast ${tone || ""}`;
    toast.textContent = message;
    toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3800);
  }
})();
