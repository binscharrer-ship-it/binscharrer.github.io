(function () {
  const DEMO_KEY = "cihu-union-static-demo-v1";
  const USER = {
    id: "demo-super",
    username: "github-demo",
    display_name: "GitHub 演示管理员",
    role: "super_admin",
    department_id: null,
    department_name: "区总工会"
  };

  const departmentNames = [
    "综合办公室",
    "党群工作部",
    "经济发展局",
    "科技创新局",
    "规划建设局",
    "财政金融局",
    "社会事业局",
    "应急管理局",
    "市场监督管理局",
    "综合行政执法局",
    "投资促进局",
    "数据资源局",
    "政务服务局",
    "生态环境分局",
    "自然资源和规划分局"
  ];

  const departments = departmentNames.map((name, index) => ({
    id: `dept-${String(index + 1).padStart(2, "0")}`,
    code: `dept-${String(index + 1).padStart(2, "0")}`,
    name,
    active: true
  }));

  function buildDemoState() {
    const members = [];
    const benefits = [];
    const payments = [];
    const exams = [];
    const retreats = [];
    departments.forEach((department, departmentIndex) => {
      for (let memberIndex = 1; memberIndex <= 2; memberIndex += 1) {
        const memberId = `${department.id}-member-${memberIndex}`;
        const name = `示例员工${departmentIndex + 1}-${memberIndex}`;
        members.push({
          id: memberId,
          department_id: department.id,
          user_id: null,
          employee_no: `${String(departmentIndex + 1).padStart(2, "0")}-${String(memberIndex).padStart(3, "0")}`,
          name,
          status: "active",
          employment_type: "regular",
          is_member: true,
          dues_paid: true,
          salary_included: true,
          benefit_location: "current",
          id_card_last4: "1234",
          bank_card_last4: memberIndex === 1 ? "0001" : "0002",
          bank_name: "中国工商银行",
          created_at: "2026-01-01T08:00:00",
          updated_at: "2026-01-01T08:00:00"
        });
        const benefitId = `${memberId}-benefit`;
        benefits.push({
          id: benefitId,
          department_id: department.id,
          member_id: memberId,
          benefit_type: "节日慰问",
          amount: 600,
          issue_date: "2026-05-01",
          payment_method: "bank_transfer",
          status: "approved",
          approval_ref: `DEMO-${departmentIndex + 1}-${memberIndex}`,
          signed: true,
          condition: null,
          event_reference: null,
          notes: "GitHub Pages 演示数据",
          created_at: "2026-05-01T08:00:00",
          updated_at: "2026-05-01T08:00:00"
        });
        const paymentId = `${benefitId}-payment`;
        payments.push({
          id: paymentId,
          department_id: department.id,
          benefit_id: benefitId,
          member_id: memberId,
          amount: 600,
          bank_card_last4: memberIndex === 1 ? "0001" : "0002",
          bank_name: "中国工商银行",
          state: memberIndex === 1 ? "pending" : "failed_card",
          bank_file_batch_no: null,
          bank_reference: null,
          failure_reason: memberIndex === 2 ? "卡号错误" : null,
          transferred_at: null,
          failed_at: memberIndex === 2 ? "2026-05-02T09:00:00" : null,
          created_at: "2026-05-01T08:00:00",
          updated_at: "2026-05-02T09:00:00"
        });
      }
      exams.push({
        id: `${department.id}-exam`,
        department_id: department.id,
        year: 2026,
        name: "2026年度职工体检",
        provider: "示例体检中心",
        start_date: "2026-09-01",
        end_date: "2026-10-31",
        budget: 50000,
        fund_source: "administration",
        authorization_ref: null,
        status: "planned"
      });
      retreats.push({
        id: `${department.id}-retreat`,
        department_id: department.id,
        title: "2026年诗城田园游疗休养",
        location: "林海生态园",
        start_date: "2026-09-26",
        end_date: "2026-09-27",
        per_person_per_day: 390,
        insurance_confirmed: true,
        procurement_procedure: "quotation",
        status: "planned"
      });
    });
    return {
      departments,
      members,
      benefits,
      payments,
      exams,
      retreats,
      snapshots: []
    };
  }

  function loadState() {
    try {
      const raw = sessionStorage.getItem(DEMO_KEY);
      return raw ? JSON.parse(raw) : buildDemoState();
    } catch (error) {
      return buildDemoState();
    }
  }

  function saveState(state) {
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(state));
  }

  function dashboard(state) {
    const completedExam = 15;
    const registeredRetreat = 15;
    const failed = state.payments.filter((item) => item.state.startsWith("failed"));
    return {
      year: 2026,
      scope: "department",
      member_count: state.members.length,
      benefit_count: state.benefits.length,
      benefit_total: state.benefits.reduce((sum, item) => sum + Number(item.amount), 0),
      exam_covered: completedExam,
      exam_rate: Math.round((completedExam / state.members.length) * 1000) / 10,
      retreat_covered: registeredRetreat,
      retreat_rate: Math.round((registeredRetreat / state.members.length) * 1000) / 10,
      payment_pending: state.payments.filter((item) => ["pending", "bank_file_generated", "bank_processing"].includes(item.state)).length,
      payment_failed: failed.length,
      open_alerts: failed.slice(0, 5).map((item) => ({
        id: `alert-${item.id}`,
        priority: "high",
        title: `工资卡汇款失败，尾号${item.bank_card_last4}`,
        detail: "演示数据：请经办人联系员工核对工资卡。",
        member_id: item.member_id,
        payment_id: item.id
      }))
    };
  }

  function snapshotData(state, body) {
    const failedPayments = state.payments.filter((item) => item.state.startsWith("failed"));
    const pendingPayments = state.payments.filter((item) => item.state !== "credited");
    const missingExam = state.members.filter((_, index) => index % 2 === 1);
    const missingRetreat = state.members.filter((_, index) => index % 2 === 1);
    const summary = {
      labels: body.labels || [],
      node_start: body.start_date,
      node_end: body.end_date,
      active_member_count: state.members.length,
      activity_count: state.exams.length + state.retreats.length,
      exam_plan_count: state.exams.length,
      exam_covered_count: state.members.length - missingExam.length,
      exam_pending_count: missingExam.length,
      exam_coverage_percent: Math.round(((state.members.length - missingExam.length) / state.members.length) * 1000) / 10,
      retreat_batch_count: state.retreats.length,
      retreat_completed_batch_count: 0,
      retreat_participant_count: state.members.length - missingRetreat.length,
      benefit_count: state.benefits.length,
      benefit_amount: state.benefits.reduce((sum, item) => sum + Number(item.amount), 0),
      payment_count: state.payments.length,
      payment_credited_count: state.payments.filter((item) => item.state === "credited").length,
      payment_failed_count: failedPayments.length,
      open_alert_count: failedPayments.length,
      missing_exam_members: missingExam.map((item) => item.name),
      missing_retreat_members: missingRetreat.map((item) => item.name),
      tasks: [
        { key: "exam", title: "职工体检组织", state: "in_progress", detail: `覆盖${state.members.length - missingExam.length}/${state.members.length}人`, blockers: missingExam.map((item) => item.name) },
        { key: "retreat", title: "疗休养专项", state: "in_progress", detail: "计划已建立，尚未结算", blockers: missingRetreat.map((item) => item.name) },
        { key: "payment", title: "福利资金流转", state: pendingPayments.length ? "in_progress" : "completed", detail: `待处理${pendingPayments.length}笔`, blockers: failedPayments.map((item) => `尾号${item.bank_card_last4}`) },
        { key: "benefit", title: "福利发放与资料归档", state: "completed", detail: `发放${state.benefits.length}笔，审批签收完整`, blockers: [] }
      ]
    };
    const report_text = [
      `节点范围：${body.start_date} 至 ${body.end_date}`,
      `节点标签：${(body.labels || []).join("、") || "自定义节点"}`,
      "",
      "一、总体情况",
      `节点内共组织实施${summary.activity_count}场活动/专项；体检覆盖${summary.exam_covered_count}人，覆盖率${summary.exam_coverage_percent}%；疗休养完成0个批次。`,
      `福利登记${summary.benefit_count}笔，金额${summary.benefit_amount}元；银行汇款任务${summary.payment_count}笔，已到账${summary.payment_credited_count}笔，失败${summary.payment_failed_count}笔。`,
      "",
      "二、任务进度矩阵",
      "已闭环完成：福利发放与资料归档",
      "进行中：职工体检组织、疗休养专项、福利资金流转",
      "未启动：无",
      "",
      "三、应做未做人员",
      `未完成体检：${missingExam.map((item) => item.name).join("、")}`,
      `未纳入疗休养：${missingRetreat.map((item) => item.name).join("、")}`,
      "",
      "四、处置建议",
      "- 联系失败汇款人员核对工资卡并重新生成银行盘。",
      "- 对未完成体检和未报名疗休养人员逐部门催办。"
    ].join("\n");
    return { summary, report_text };
  }

  function findMember(state, memberId) {
    return state.members.find((item) => item.id === memberId);
  }

  async function handle(path, options = {}) {
    const url = new URL(path, "https://demo.local");
    const pathname = url.pathname.replace(/^\/api/, "");
    const method = String(options.method || "GET").toUpperCase();
    const state = loadState();
    const body = options.body || {};

    if (pathname === "/auth/login" || pathname === "/auth/register") {
      return { access_token: "github-pages-demo-token", token_type: "bearer", user: USER };
    }
    if (pathname === "/auth/me") return { user: USER };
    if (pathname === "/departments" && method === "GET") return state.departments;
    if (pathname === "/departments" && method === "POST") {
      const department = { id: `dept-${Date.now()}`, code: body.code, name: body.name, active: true };
      state.departments.push(department);
      saveState(state);
      return department;
    }
    if (pathname === "/members" && method === "GET") return state.members;
    if (pathname === "/members" && method === "POST") {
      const member = {
        id: `member-${Date.now()}`,
        ...body,
        id_card_last4: body.id_card ? body.id_card.slice(-4) : null,
        bank_card_last4: body.bank_card ? body.bank_card.slice(-4) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      state.members.push(member);
      saveState(state);
      return member;
    }
    if (pathname.startsWith("/members/") && method === "PUT") {
      const id = pathname.split("/")[2];
      const member = findMember(state, id);
      if (!member) throw new Error("会员不存在");
      Object.assign(member, body);
      if (body.id_card) member.id_card_last4 = body.id_card.slice(-4);
      if (body.bank_card) member.bank_card_last4 = body.bank_card.slice(-4);
      member.updated_at = new Date().toISOString();
      saveState(state);
      return member;
    }
    if (pathname === "/benefits" && method === "GET") return state.benefits;
    if (pathname === "/benefits" && method === "POST") {
      const benefit = {
        id: `benefit-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment: null
      };
      if (body.payment_method === "bank_transfer") {
        const member = findMember(state, body.member_id);
        benefit.payment = {
          id: `payment-${Date.now()}`,
          department_id: body.department_id,
          benefit_id: benefit.id,
          member_id: body.member_id,
          amount: Number(body.amount),
          bank_card_last4: body.bank_card ? body.bank_card.slice(-4) : member?.bank_card_last4 || "0000",
          bank_name: body.bank_name || member?.bank_name || "中国工商银行",
          state: "pending",
          failure_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        state.payments.unshift(benefit.payment);
      }
      state.benefits.unshift(benefit);
      saveState(state);
      return benefit;
    }
    if (pathname === "/payments" && method === "GET") return state.payments;
    if (pathname === "/payments/states") {
      return Object.entries({
        pending: "待汇款",
        bank_file_generated: "已生成银行盘",
        bank_processing: "银行处理中",
        credited: "已到账",
        failed_card: "卡号错误",
        failed_frozen: "账户冻结"
      }).map(([value, label]) => ({ value, label }));
    }
    if (pathname.startsWith("/payments/") && pathname.endsWith("/transition")) {
      const id = pathname.split("/")[2];
      const payment = state.payments.find((item) => item.id === id);
      if (!payment) throw new Error("汇款记录不存在");
      payment.state = body.target_state;
      payment.failure_reason = body.failure_reason || null;
      payment.updated_at = new Date().toISOString();
      saveState(state);
      return payment;
    }
    if (pathname === "/exams") return state.exams;
    if (pathname === "/retreats") return state.retreats;
    if (pathname === "/dashboard") return dashboard(state);
    if (pathname === "/snapshots" && method === "GET") return state.snapshots;
    if (pathname === "/snapshots/preview") return snapshotData(state, body);
    if (pathname === "/snapshots" && method === "POST") {
      const snapshot = {
        id: `snapshot-${Date.now()}`,
        ...body,
        labels: (body.labels || []).join("、"),
        summary_json: JSON.stringify(snapshotData(state, body).summary),
        report_text: snapshotData(state, body).report_text,
        generated_by: USER.id,
        created_at: new Date().toISOString()
      };
      state.snapshots.unshift(snapshot);
      saveState(state);
      return snapshot;
    }
    if (pathname === "/people/gaps") {
      return state.members
        .filter((_, index) => index % 2 === 1)
        .slice(0, 12)
        .map((member) => ({
          department_name: state.departments.find((item) => item.id === member.department_id)?.name || "",
          name: member.name,
          employee_no: member.employee_no,
          gap: "未完成体检、未报名疗休养"
        }));
    }
    if (pathname.startsWith("/people/") && pathname.endsWith("/panorama")) {
      const id = pathname.split("/")[2];
      const member = findMember(state, id);
      if (!member) throw new Error("人员不存在");
      const memberBenefits = state.benefits.filter((item) => item.member_id === id);
      const memberPayments = state.payments.filter((item) => item.member_id === id);
      return {
        member,
        year: 2026,
        benefits: memberBenefits,
        payment_ledger: memberPayments,
        exam: { status: member.employee_no?.endsWith("001") ? "completed" : "pending", records: [] },
        retreat: { registered: member.employee_no?.endsWith("001"), records: [] },
        gaps: member.employee_no?.endsWith("001") ? [] : ["未完成体检", "未报名疗休养"]
      };
    }
    if (pathname === "/auth/invites") {
      return {
        id: `invite-${Date.now()}`,
        code: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        department_id: body.department_id,
        role: body.role,
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString()
      };
    }
    if (pathname.startsWith("/retreats/") && pathname.endsWith("/register")) {
      return { ok: true, status: "registered" };
    }
    if (method === "POST" || method === "PUT") {
      return { ok: true };
    }
    throw new Error(`GitHub Pages 演示模式暂不支持：${pathname}`);
  }

  async function blob(path, options = {}) {
    const url = new URL(path, "https://demo.local");
    const pathname = url.pathname;
    if (pathname === "/people/gaps/export") {
      return new Blob(["部门,姓名,缺失事项\n综合办公室,示例员工1-2,未完成体检"], {
        type: "text/csv;charset=utf-8"
      });
    }
    if (pathname.includes("/snapshots/")) {
      return new Blob(["GitHub Pages 静态演示版不生成正式国家公文，请在正式云平台导出。"], {
        type: "text/plain;charset=utf-8"
      });
    }
    if (pathname.includes("/departments/")) {
      return new Blob(
        ['<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="white"/><rect x="20" y="20" width="280" height="280" fill="#17312d"/><text x="160" y="150" fill="white" font-size="22" text-anchor="middle">部门入口</text><text x="160" y="185" fill="white" font-size="16" text-anchor="middle">GitHub Pages 演示</text></svg>'],
        { type: "image/svg+xml" }
      );
    }
    return new Blob(["演示模式：银行盘仅展示界面，不包含真实卡号。"], {
      type: "text/csv;charset=utf-8"
    });
  }

  window.CihuStaticDemo = { handle, blob };
  sessionStorage.setItem("cihu-union-token", "github-pages-demo-token");

  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.createElement("div");
    banner.textContent = "GitHub Pages 静态演示版：不连接后端，不保存真实数据";
    banner.style.cssText = [
      "position:fixed",
      "right:14px",
      "bottom:14px",
      "z-index:9999",
      "padding:9px 12px",
      "background:#a15c0a",
      "color:#fff",
      "border-radius:6px",
      "font:12px Microsoft YaHei,sans-serif",
      "box-shadow:0 8px 24px rgba(0,0,0,.18)"
    ].join(";");
    document.body.appendChild(banner);
  });
})();
