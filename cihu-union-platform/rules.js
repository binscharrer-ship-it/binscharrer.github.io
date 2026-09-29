(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.UnionRules = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DATA = (typeof window !== "undefined" && window.UnionPolicyData) || null;

  const BENEFIT_LIMITS = {
    festival: 2200,
    birthday: 500,
    marriage: 2000,
    birth: 2000,
    hospital: 2000,
    death_member: 2000,
    death_family: 2000,
    retirement: 2000,
    difficulty: 2000,
    other_member: 2000
  };

  const BENEFIT_LABELS = {
    festival: "节日慰问",
    birthday: "生日慰问",
    marriage: "结婚慰问",
    birth: "生育慰问",
    hospital: "住院慰问",
    death_member: "会员去世慰问",
    death_family: "近亲属去世慰问",
    retirement: "退休离岗慰问",
    difficulty: "困难帮扶",
    other_member: "其他会员慰问"
  };

  const RULE_REFS = {
    memberEligibility: { ruleId: "member-eligibility", label: "皖工发〔2025〕18号第9-10页" },
    retiree: { ruleId: "retiree-benefits", label: "皖工发〔2025〕18号第10页" },
    festival: { ruleId: "festival-quota", label: "皖工发〔2025〕18号第9页" },
    birthday: { ruleId: "birthday-quota", label: "皖工发〔2025〕18号第9页" },
    majorBenefit: { ruleId: "major-benefit-quota", label: "皖工发〔2025〕18号第9-10页" },
    realName: { ruleId: "real-name-issue", label: "皖工发〔2025〕18号第16页" },
    exam: { ruleId: "exam-administrative-duty", label: "皖工发〔2025〕18号第17页" },
    retreatDays: { ruleId: "retreat-days", label: "马工发〔2026〕4号第2页" },
    retreatCost: { ruleId: "retreat-cost", label: "马工发〔2026〕4号第3页" },
    retreatLocation: { ruleId: "retreat-location", label: "马工发〔2026〕4号第2、5-7页" },
    retreatInsurance: { ruleId: "retreat-insurance", label: "马工发〔2026〕4号第3-4页" },
    retreatProcurement: { ruleId: "retreat-procurement", label: "马工发〔2026〕4号第2-4页" },
    retreatFamily: { ruleId: "retreat-family", label: "马工发〔2026〕4号第3页" },
    retreatTarget: { ruleId: "retreat-target", label: "马工发〔2026〕4号第2页" },
    retreatProhibited: { ruleId: "retreat-prohibited", label: "马工发〔2026〕4号第4页" }
  };

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function roundMoney(value) {
    return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
  }

  function getYear(dateValue) {
    if (!dateValue) return "";
    const match = String(dateValue).match(/^(\d{4})/);
    return match ? Number(match[1]) : "";
  }

  function dateToUtc(dateValue) {
    const match = String(dateValue || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function inclusiveDays(startDate, endDate) {
    const start = dateToUtc(startDate);
    const end = dateToUtc(endDate);
    if (start === null || end === null || end < start) return 0;
    return Math.floor((end - start) / 86400000) + 1;
  }

  function issue(level, code, message, reference) {
    return { level, code, message, reference };
  }

  function evaluateMemberEligibility(member) {
    const issues = [];
    if (!member) {
      issues.push(issue("block", "MEMBER_MISSING", "未选择会员。", RULE_REFS.memberEligibility));
      return { eligible: false, issues };
    }

    if (member.status === "retired") {
      issues.push(issue("block", "RETIRED", "离退休人员的工会福利应按单位行政规定列支，不进入工会经费福利发放。", RULE_REFS.retiree));
    } else if (member.status !== "active") {
      issues.push(issue("block", "NOT_ACTIVE", "仅在职职工可纳入本系统工会福利和疗休养资格判断。", RULE_REFS.memberEligibility));
    }

    if (!member.isMember) {
      issues.push(issue("block", "NOT_MEMBER", "不是工会会员，不得享受工会集体福利。", RULE_REFS.memberEligibility));
    }
    if (!member.duesPaid) {
      issues.push(issue("block", "DUES_UNPAID", "未缴纳会费的会员不得享受集体福利。", RULE_REFS.memberEligibility));
    }
    if (!member.salaryIncluded) {
      issues.push(issue("block", "SALARY_NOT_INCLUDED", "工资未纳入拨缴工会经费工资总额，不得享受集体福利。", RULE_REFS.memberEligibility));
    }
    if (member.employmentType === "dispatched" && member.benefitLocation !== "current") {
      issues.push(issue("block", "DUPLICATE_WELFARE_LOCATION", "借用、挂职、劳务派遣人员只能享受一处集体福利，应优先在工资关系所在单位享受。", RULE_REFS.memberEligibility));
    }

    return {
      eligible: !issues.some((entry) => entry.level === "block"),
      issues
    };
  }

  function validateBenefit(record, context) {
    const issues = [];
    const member = context.member;
    const existing = context.existing || [];
    const year = getYear(record.date) || context.fiscalYear;
    const type = record.type;
    const amount = roundMoney(record.amount);
    const memberEligibility = evaluateMemberEligibility(member);
    issues.push(...memberEligibility.issues);

    const limit = BENEFIT_LIMITS[type] ?? 0;
    if (!limit) {
      issues.push(issue("block", "UNKNOWN_BENEFIT_TYPE", "无法识别福利类型。", RULE_REFS.majorBenefit));
    }

    if (amount <= 0) {
      issues.push(issue("block", "INVALID_AMOUNT", "发放金额必须大于0。", RULE_REFS.realName));
    }

    if (type === "festival") {
      const issuedTotal = existing
        .filter((entry) => entry.memberId === record.memberId && entry.type === "festival" && getYear(entry.date) === year && entry.status !== "cancelled")
        .reduce((sum, entry) => sum + toNumber(entry.amount), 0);
      const projected = roundMoney(issuedTotal + amount);
      if (projected > limit) {
        issues.push(issue("block", "FESTIVAL_LIMIT", `本年度节日慰问累计将为${projected}元，超过每人每年${limit}元上限。`, RULE_REFS.festival));
      } else if (projected > limit * 0.8) {
        issues.push(issue("warn", "FESTIVAL_NEAR_LIMIT", `本年度节日慰问累计将达到${projected}元，已接近${limit}元上限。`, RULE_REFS.festival));
      }
    } else if (amount > limit) {
      issues.push(issue("block", `${String(type).toUpperCase()}_LIMIT`, `${BENEFIT_LABELS[type] || "本项慰问"}金额超过${limit}元上限。`, type === "birthday" ? RULE_REFS.birthday : RULE_REFS.majorBenefit));
    }

    if (type === "festival" && ["cash", "shopping_card"].includes(record.paymentMethod)) {
      issues.push(issue("block", "FESTIVAL_PAYMENT_METHOD", "节日慰问不得发放现金和购物卡，只能发放实物或指定商家提货券。", RULE_REFS.festival));
    }
    if (type === "birthday" && !["physical", "cake_voucher"].includes(record.paymentMethod)) {
      issues.push(issue("block", "BIRTHDAY_PAYMENT_METHOD", "生日慰问应发放实物或蛋糕券。", RULE_REFS.birthday));
    }
    if (record.paymentMethod === "shopping_card") {
      issues.push(issue("block", "SHOPPING_CARD", "工会经费福利不得以购物卡形式发放。", RULE_REFS.festival));
    }

    const sameYear = existing.filter((entry) => {
      if (entry.memberId !== record.memberId || entry.status === "cancelled") return false;
      if (getYear(entry.date) !== year) return false;
      if (entry.id && record.id && entry.id === record.id) return false;
      return true;
    });

    if (type === "birthday" && sameYear.some((entry) => entry.type === "birthday")) {
      issues.push(issue("block", "BIRTHDAY_DUPLICATE", "同一会员本年度已有生日慰问记录。", RULE_REFS.birthday));
    }
    if (type === "marriage" && sameYear.some((entry) => entry.type === "marriage")) {
      issues.push(issue("block", "MARRIAGE_DUPLICATE", "同一会员本年度已有结婚慰问记录。", RULE_REFS.majorBenefit));
    }
    if (type === "hospital") {
      const condition = String(record.condition || "").trim();
      if (!condition) {
        issues.push(issue("block", "HOSPITAL_CONDITION_MISSING", "住院慰问需填写病种，以判断同一病种一年一次的限制。", RULE_REFS.majorBenefit));
      } else if (sameYear.some((entry) => entry.type === "hospital" && String(entry.condition || "").trim() === condition)) {
        issues.push(issue("block", "HOSPITAL_DUPLICATE", `同一会员本年度已按“${condition}”发放过住院慰问。`, RULE_REFS.majorBenefit));
      }
    }
    if (type === "retirement" && existing.some((entry) => entry.memberId === record.memberId && entry.type === "retirement" && entry.status !== "cancelled")) {
      issues.push(issue("block", "RETIREMENT_DUPLICATE", "同一会员已有退休离岗慰问记录。", RULE_REFS.majorBenefit));
    }
    if (type === "difficulty" && sameYear.some((entry) => entry.type === "difficulty")) {
      issues.push(issue("warn", "DIFFICULTY_DUPLICATE", "本年度已有困难帮扶记录，请核对困难档案和审批依据。", RULE_REFS.majorBenefit));
    }
    if (type === "birth" && !String(record.eventReference || "").trim()) {
      issues.push(issue("block", "BIRTH_EVENT_MISSING", "生育慰问需填写本次生育事项标识，便于核验政策内生育。", RULE_REFS.majorBenefit));
    }

    if (!record.approvalRef) {
      issues.push(issue("block", "APPROVAL_MISSING", "缺少审批手续或审批编号，不能登记发放。", RULE_REFS.realName));
    }
    if (!record.signed) {
      issues.push(issue("block", "SIGNATURE_MISSING", "个人福利发放需实名签收，请完成签收后再登记。", RULE_REFS.realName));
    }
    if (record.status === "paid" && !record.paidDate) {
      issues.push(issue("block", "PAID_DATE_MISSING", "已发放记录需要填写实际发放日期。", RULE_REFS.realName));
    }

    const budget = context.budget || {};
    if (budget.annual > 0) {
      const used = toNumber(budget.used);
      if (used + amount > budget.annual) {
        issues.push(issue("block", "BUDGET_EXCEEDED", `本项预算剩余${roundMoney(budget.annual - used)}元，本次金额将造成超预算。`, RULE_REFS.majorBenefit));
      }
    } else {
      issues.push(issue("warn", "BUDGET_NOT_SET", "该支出类别尚未设置年度预算，请先履行预算程序。", RULE_REFS.majorBenefit));
    }

    return {
      decision: issues.some((entry) => entry.level === "block") ? "block" : issues.length ? "warn" : "pass",
      issues,
      summary: {
        memberName: member ? member.name : "",
        typeLabel: BENEFIT_LABELS[type] || type || "未知类型",
        amount,
        year
      }
    };
  }

  function validateExamPlan(plan) {
    const issues = [];
    if (!plan.name) issues.push(issue("block", "EXAM_NAME_MISSING", "体检计划需填写名称。", RULE_REFS.exam));
    if (!plan.startDate || !plan.endDate) issues.push(issue("block", "EXAM_DATE_MISSING", "体检计划需填写起止日期。", RULE_REFS.exam));
    if (!plan.provider) issues.push(issue("warn", "EXAM_PROVIDER_MISSING", "尚未填写体检承办机构。", RULE_REFS.exam));
    if (plan.fundSource === "union") {
      issues.push(issue("block", "EXAM_UNION_BUDGET", "职工体检经费应由单位行政负担，不得直接列入基层工会经费。", RULE_REFS.exam));
    } else if (!["administration", "administration_entrusted"].includes(plan.fundSource)) {
      issues.push(issue("block", "EXAM_SOURCE_INVALID", "体检经费来源必须为单位行政福利费或行政专项经费。", RULE_REFS.exam));
    }
    if (plan.fundSource === "administration_entrusted" && !plan.authorizationRef) {
      issues.push(issue("block", "EXAM_AUTHORIZATION_MISSING", "工会承办体检应由单位行政书面委托，需登记委托依据编号。", RULE_REFS.exam));
    }
    if (!plan.budget || toNumber(plan.budget) <= 0) {
      issues.push(issue("warn", "EXAM_BUDGET_MISSING", "尚未填写行政安排体检预算。", RULE_REFS.exam));
    }
    if (!plan.scope || (plan.scope === "selected" && !(plan.memberIds || []).length)) {
      issues.push(issue("block", "EXAM_SCOPE_EMPTY", "体检计划未指定参加人员。", RULE_REFS.exam));
    }
    return {
      decision: issues.some((entry) => entry.level === "block") ? "block" : issues.length ? "warn" : "pass",
      issues
    };
  }

  function validateRetreatPlan(plan, context) {
    const issues = [];
    const allowedLocations = (context && context.allowedLocations) || (DATA && DATA.allowedRetreatLocations) || [];
    const days = inclusiveDays(plan.startDate, plan.endDate);
    const perDay = roundMoney(plan.perPersonPerDay);

    if (!plan.title) issues.push(issue("block", "RETREAT_TITLE_MISSING", "疗休养计划需填写名称。", RULE_REFS.retreatDays));
    if (!days || days > 2) {
      issues.push(issue("block", "RETREAT_DAYS_INVALID", "活动时间应为1-2天，且结束日期不得早于开始日期。", RULE_REFS.retreatDays));
    }
    if (!plan.location) {
      issues.push(issue("block", "RETREAT_LOCATION_MISSING", "需选择疗休养基地或“皖美民宿”。", RULE_REFS.retreatLocation));
    } else if (allowedLocations.length && !allowedLocations.includes(plan.location)) {
      issues.push(issue("block", "RETREAT_LOCATION_INVALID", "所选地点不在本系统维护的职工疗休养基地、“皖美民宿”名录内。", RULE_REFS.retreatLocation));
    }
    if (perDay <= 0) {
      issues.push(issue("block", "RETREAT_COST_MISSING", "需填写每人每天费用。", RULE_REFS.retreatCost));
    } else if (perDay > 400) {
      issues.push(issue("block", "RETREAT_COST_EXCEEDED", `每人每天${perDay}元，超过党政机关、事业单位400元限额。`, RULE_REFS.retreatCost));
    } else if (perDay > 360) {
      issues.push(issue("warn", "RETREAT_COST_NEAR_LIMIT", `每人每天${perDay}元，已接近400元限额。`, RULE_REFS.retreatCost));
    }
    if (!plan.insuranceConfirmed) {
      issues.push(issue("block", "RETREAT_INSURANCE_MISSING", "未确认已为参加职工购买人身意外伤害保险。", RULE_REFS.retreatInsurance));
    }
    if (!plan.procurementProcedure || plan.procurementProcedure === "none") {
      issues.push(issue("block", "RETREAT_PROCUREMENT_MISSING", "未登记承办单位采购程序。", RULE_REFS.retreatProcurement));
    }
    if (plan.allowFamily && !plan.familyPaymentConfirmed) {
      issues.push(issue("block", "RETREAT_FAMILY_PAYMENT_MISSING", "允许家属随行时，需确认家属费用自理并与承办单位单独订立合同。", RULE_REFS.retreatFamily));
    }
    if (!plan.scope || (plan.scope === "selected" && !(plan.memberIds || []).length)) {
      issues.push(issue("block", "RETREAT_SCOPE_EMPTY", "疗休养计划未指定参加职工。", RULE_REFS.retreatTarget));
    }
    if (plan.cashDistribution) {
      issues.push(issue("block", "RETREAT_CASH_DISTRIBUTION", "严禁以疗休养名义发放钱物或组织变相旅游。", RULE_REFS.retreatProhibited));
    }

    const selectedMembers = plan.scope === "selected"
      ? (context.members || []).filter((member) => (plan.memberIds || []).includes(member.id))
      : (context.members || []).filter((member) => member.status === "active");
    const ineligible = selectedMembers.filter((member) => member.status !== "active");
    if (ineligible.length) {
      issues.push(issue("block", "RETREAT_MEMBER_INACTIVE", `参加人员中有${ineligible.length}人非在职职工。`, RULE_REFS.retreatProhibited));
    }
    const noDues = selectedMembers.filter((member) => !member.duesPaid || !member.salaryIncluded);
    if (noDues.length) {
      issues.push(issue("warn", "RETREAT_DUES_OR_SALARY", `参加人员中有${noDues.length}人未缴会费或工资未纳入工会经费工资总额，请先核验资格。`, RULE_REFS.memberEligibility));
    }
    const projectedTotal = roundMoney(days * perDay * selectedMembers.length);
    if (context && context.budget) {
      const budget = context.budget;
      if (budget.annual > 0 && toNumber(budget.used) + projectedTotal > budget.annual) {
        issues.push(issue("block", "RETREAT_BUDGET_EXCEEDED", `本项预算余额${roundMoney(budget.annual - toNumber(budget.used))}元，计划预计支出${projectedTotal}元。`, RULE_REFS.retreatCost));
      } else if (budget.annual <= 0) {
        issues.push(issue("warn", "RETREAT_BUDGET_NOT_SET", "疗休养支出尚未设置年度预算，请先履行预算程序。", RULE_REFS.retreatCost));
      }
    }

    return {
      decision: issues.some((entry) => entry.level === "block") ? "block" : issues.length ? "warn" : "pass",
      issues,
      summary: {
        days,
        perDay,
        perPersonTotal: roundMoney(days * perDay),
        participantCount: selectedMembers.length,
        projectedTotal
      }
    };
  }

  function calculateBenefitUsage(records, memberId, year) {
    const activeRecords = (records || []).filter(
      (entry) => entry.memberId === memberId && getYear(entry.date) === Number(year) && entry.status !== "cancelled"
    );
    const byType = {};
    activeRecords.forEach((entry) => {
      byType[entry.type] = roundMoney((byType[entry.type] || 0) + toNumber(entry.amount));
    });
    return {
      festival: byType.festival || 0,
      birthday: byType.birthday || 0,
      total: roundMoney(activeRecords.reduce((sum, entry) => sum + toNumber(entry.amount), 0)),
      byType
    };
  }

  function buildDecisionLabel(decision) {
    return {
      pass: "可通过",
      warn: "需复核",
      block: "已拦截"
    }[decision] || "待判断";
  }

  return {
    BENEFIT_LIMITS,
    BENEFIT_LABELS,
    RULE_REFS,
    toNumber,
    roundMoney,
    getYear,
    inclusiveDays,
    evaluateMemberEligibility,
    validateBenefit,
    validateExamPlan,
    validateRetreatPlan,
    calculateBenefitUsage,
    buildDecisionLabel
  };
});
