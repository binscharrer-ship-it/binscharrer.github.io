(function (global) {
  "use strict";

  const VERSION = "1.0.0";

  const TYPE_META = {
    LFP: {
      label: "磷酸铁锂 LFP",
      chemistry: "LFP",
      unitValue: 430,
      safetyNote: "LFP 热稳定性相对较好，但老化、内短路和外部高温仍可能带来风险。"
    },
    NMC: {
      label: "三元锂 NMC",
      chemistry: "NMC",
      unitValue: 620,
      safetyNote: "NMC 能量密度高，热稳定性中等，老化后应重点关注异常温升。"
    },
    NCA: {
      label: "镍钴铝 NCA",
      chemistry: "NCA",
      unitValue: 880,
      safetyNote: "NCA 对高温和过充更敏感，异常鼓包或发热时应立即停止使用。"
    },
    Phone: {
      label: "二手手机锂电池",
      chemistry: "NMC",
      unitValue: 1650,
      safetyNote: "二手手机电池个体差异较大，拆机、鼓包和循环来源不明时风险更高。"
    },
    EV: {
      label: "新能源车动力电池包",
      chemistry: "NMC",
      unitValue: 360,
      safetyNote: "动力电池包需结合压差、绝缘、温控和整车诊断综合判断，本结果不能替代专业检测。"
    }
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function safeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function round(value, digits) {
    const factor = Math.pow(10, digits || 0);
    return Math.round(value * factor) / factor;
  }

  function formatDate(date) {
    const target = date instanceof Date ? date : new Date(date || Date.now());
    const pad = function (number) {
      return String(number).padStart(2, "0");
    };
    return [
      target.getFullYear(),
      "-",
      pad(target.getMonth() + 1),
      "-",
      pad(target.getDate()),
      " ",
      pad(target.getHours()),
      ":",
      pad(target.getMinutes()),
      ":",
      pad(target.getSeconds())
    ].join("");
  }

  function hashString(input) {
    const text = String(input || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
  }

  function buildReportId(params, timestamp) {
    const target = new Date(timestamp || Date.now());
    const dateCode = [
      String(target.getFullYear()).slice(2),
      String(target.getMonth() + 1).padStart(2, "0"),
      String(target.getDate()).padStart(2, "0")
    ].join("");
    const seed = [
      params && params.type,
      params && params.capacity,
      params && params.cycles,
      params && params.ambTemp,
      timestamp || Date.now()
    ].join("|");
    return "XG-BS-" + dateCode + "-" + hashString(seed).slice(0, 6);
  }

  function getTypeMeta(type) {
    return TYPE_META[type] || TYPE_META.NMC;
  }

  function estimateResidualValue(params, result) {
    const meta = getTypeMeta(params && params.type);
    const capacity = safeNumber(params && params.capacity, 1);
    const voltage = safeNumber(params && params.nomVoltage, 3.7);
    const soh = clamp(safeNumber(result && result.finalSoh, 100), 0, 120);
    const energyKWh = Math.max(0.001, capacity * voltage / 1000);
    const newValue = energyKWh * meta.unitValue;
    const conditionFactor = clamp(
      0.34 + 0.38 * Math.pow(soh / 100, 1.45),
      0.18,
      0.76
    );
    const raw = newValue * conditionFactor;
    if (raw >= 1000) {
      return Math.round(raw / 100) * 100;
    }
    if (raw >= 100) {
      return Math.round(raw / 10) * 10;
    }
    return Math.max(1, Math.round(raw));
  }

  function evaluateVerdict(params, result, trend) {
    const soh = safeNumber(result && result.finalSoh, 0);
    const maxTemp = safeNumber(result && result.maxTemp, 0);
    const resistanceGrowth = safeNumber(result && result.resGrowth, 0);
    const riskIndex = safeNumber(trend && trend.runawayRisk, 0);
    const ambient = safeNumber(params && params.ambTemp, 25);

    let score = 100;
    score -= Math.max(0, 100 - soh) * 1.2;
    score -= Math.max(0, maxTemp - 35) * 0.55;
    score -= Math.max(0, resistanceGrowth - 20) * 0.12;
    score -= Math.max(0, riskIndex - 20) * 0.32;
    score -= Math.max(0, ambient - 35) * 0.6;
    score = Math.round(clamp(score, 0, 100));

    if (soh < 70 || maxTemp >= 65 || riskIndex >= 70 || score < 42) {
      return {
        level: "danger",
        text: "建议停用 / 专业检测",
        sub: "电池健康度或安全指标超出保守阈值，不建议继续高负荷使用。",
        score: score,
        action: "停止充电和高负荷使用，远离可燃物，并交由专业机构检测。"
      };
    }

    if (soh < 82 || maxTemp >= 48 || resistanceGrowth >= 60 || riskIndex >= 42 || score < 68) {
      return {
        level: "warning",
        text: "谨慎使用 / 缩短检测周期",
        sub: "电池已出现明显老化或温升压力，建议降低倍率并定期复测。",
        score: score,
        action: "避免高温、快充和深度放电，每 4 至 8 周复测一次。"
      };
    }

    return {
      level: "safe",
      text: "状态良好 / 可继续使用",
      sub: "当前仿真工况下未见明显异常，请继续保持良好充放电习惯。",
      score: score,
      action: "保持通风散热，避免长期满电或亏电存放。"
    };
  }

  function formatTrendCopy(params, result, trend) {
    const meta = getTypeMeta(params && params.type);
    const riskIndex = safeNumber(trend && trend.runawayRisk, 0);
    const life = trend && trend.aiLife ? trend.aiLife : String(result && result.lifeCycles || 0);
    const soh = safeNumber(trend && trend.aiSoh, result && result.finalSoh || 0);
    let riskCopy = "风险指数较低，建议保持常规检查。";
    if (riskIndex >= 70) {
      riskCopy = "风险指数偏高，建议立即停止高负荷使用并安排专业检测。";
    } else if (riskIndex >= 42) {
      riskCopy = "风险指数处于关注区间，建议降低充放电倍率并缩短复测周期。";
    }
    return [
      meta.label,
      "的趋势修正 SOH 约为 " + round(soh, 1) + "%",
      "剩余循环参考区间为 " + life + " 次。",
      riskCopy
    ].join(" ");
  }

  function buildReportRows(result, limit) {
    const rows = result && Array.isArray(result.data) ? result.data : [];
    const maxRows = limit || 12;
    if (rows.length <= maxRows) {
      return rows.slice();
    }
    const stride = Math.max(1, Math.ceil((rows.length - 1) / (maxRows - 1)));
    const selected = [];
    for (let index = 0; index < rows.length; index += stride) {
      selected.push(rows[index]);
    }
    const last = rows[rows.length - 1];
    if (selected[selected.length - 1] !== last) {
      selected.push(last);
    }
    return selected.slice(-maxRows);
  }

  function buildSummaryText(context) {
    const params = context.params || {};
    const result = context.result || {};
    const trend = context.trend || {};
    const verdict = context.verdict || {};
    const meta = getTypeMeta(params.type);
    const lines = [
      "XG-BattSim 电池健康仿真报告",
      "报告编号：" + context.reportId,
      "生成时间：" + context.generatedAt,
      "电池类型：" + meta.label,
      "标称容量：" + params.capacity + " Ah",
      "循环次数：" + params.cycles + " 次",
      "综合结论：" + verdict.text,
      "综合评分：" + verdict.score + " / 100",
      "最终 SOH：" + result.finalSoh + "%",
      "容量保持率：" + result.capRetention + "%",
      "内阻增长：" + result.resGrowth + "%",
      "最高温度：" + result.maxTemp + " ℃",
      "剩余循环参考：" + result.lifeCycles + " 次",
      "趋势修正 SOH：" + (trend.aiSoh || "—") + "%",
      "风险指数：" + (trend.runawayRisk || "—") + " / 100",
      "参考残值：约 ¥" + (context.estimatedValue || 0),
      "",
      "建议：" + verdict.action,
      "说明：本结果由仿真模型生成，仅用于教学、记录和初步参考，不构成安全认证、质保或法律依据。"
    ];
    return lines.join("\n");
  }

  function buildHistoryRecord(context) {
    return {
      id: context.reportId,
      timestamp: context.timestamp,
      generatedAt: context.generatedAt,
      type: context.params.type,
      typeLabel: getTypeMeta(context.params.type).label,
      capacity: context.params.capacity,
      cycles: context.params.cycles,
      soh: context.result.finalSoh,
      maxTemp: context.result.maxTemp,
      lifeCycles: context.result.lifeCycles,
      riskIndex: context.trend.runawayRisk,
      verdict: context.verdict.level,
      verdictText: context.verdict.text,
      estimatedValue: context.estimatedValue,
      params: context.params
    };
  }

  const BatteryReport = {
    VERSION: VERSION,
    TYPE_META: TYPE_META,
    clamp: clamp,
    safeNumber: safeNumber,
    round: round,
    formatDate: formatDate,
    hashString: hashString,
    buildReportId: buildReportId,
    getTypeMeta: getTypeMeta,
    estimateResidualValue: estimateResidualValue,
    evaluateVerdict: evaluateVerdict,
    formatTrendCopy: formatTrendCopy,
    buildReportRows: buildReportRows,
    buildSummaryText: buildSummaryText,
    buildHistoryRecord: buildHistoryRecord
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BatteryReport;
  }
  global.BatteryReport = BatteryReport;
})(typeof window !== "undefined" ? window : globalThis);
