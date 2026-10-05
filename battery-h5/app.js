(function () {
  "use strict";

  const HISTORY_KEY = "xg_battsim_history_v1";
  const MAX_HISTORY = 20;
  const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

  const FIELD_MAP = {
    capacity: "capacity",
    nomVoltage: "nomVoltage",
    initResistance: "initResistance",
    initSOH: "initSoh",
    mass: "mass",
    surfArea: "surfaceArea",
    cp: "heatCapacity",
    hConv: "heatTransfer",
    cRate: "cRate",
    cycles: "cycles",
    soc: "soc",
    dod: "dod",
    ambTemp: "ambientTemperature"
  };

  const state = {
    running: false,
    toastTimer: null,
    photoDataUrl: "",
    lastContext: null,
    history: []
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", initialize);

  function initialize() {
    cacheElements();
    bindEvents();
    applyTemplate(elements.batteryType.value, { silent: true });
    state.history = readHistory();
    renderHistory();
    registerServiceWorker();
  }

  function cacheElements() {
    [
      "simple-mode",
      "battery-type",
      "capacity",
      "nom-voltage",
      "init-resistance",
      "init-soh",
      "cycles",
      "c-rate",
      "mass",
      "surface-area",
      "heat-capacity",
      "heat-transfer",
      "soc",
      "dod",
      "ambient-temperature",
      "photo-input",
      "photo-preview",
      "photo-image",
      "clear-photo",
      "run-button",
      "history-list",
      "clear-history",
      "result-panel",
      "result-title",
      "report-id",
      "verdict-card",
      "verdict-text",
      "verdict-sub",
      "estimated-value",
      "metric-soh",
      "metric-capacity",
      "metric-resistance",
      "metric-temperature",
      "metric-life",
      "metric-energy",
      "trend-title",
      "trend-copy",
      "runaway-note",
      "thermal-canvas",
      "report-table-body",
      "print-button",
      "share-button",
      "toast"
    ].forEach(function (id) {
      const key = id.replace(/-([a-z])/g, function (_, letter) {
        return letter.toUpperCase();
      });
      elements[key] = document.getElementById(id);
    });
    elements.inputPanel = document.querySelector(".input-panel");
    elements.resultPanel = elements.resultPanel || document.getElementById("result-panel");
  }

  function bindEvents() {
    elements.batteryType.addEventListener("change", function () {
      applyTemplate(elements.batteryType.value);
    });

    elements.simpleMode.addEventListener("change", function () {
      setSimpleMode(elements.simpleMode.checked);
    });

    elements.runButton.addEventListener("click", function () {
      runEvaluation({ save: true });
    });

    elements.clearHistory.addEventListener("click", clearHistory);
    elements.photoInput.addEventListener("change", handlePhotoChange);
    elements.clearPhoto.addEventListener("click", clearPhoto);
    elements.printButton.addEventListener("click", printReport);
    elements.shareButton.addEventListener("click", copySummary);

    window.addEventListener("afterprint", function () {
      document.body.classList.remove("print-ready");
    });

    window.addEventListener("storage", function (event) {
      if (event.key === HISTORY_KEY) {
        state.history = readHistory();
        renderHistory();
      }
    });
  }

  function setSimpleMode(enabled) {
    elements.inputPanel.classList.toggle("simple-mode", Boolean(enabled));
    showToast(enabled ? "极简模式：只保留常用参数" : "专业模式：已显示全部参数");
  }

  function applyTemplate(type, options) {
    const template = BatteryCalc.getTemplate(type);
    if (!template) {
      showToast("未找到该电池模板", "error");
      return;
    }

    Object.keys(FIELD_MAP).forEach(function (property) {
      const input = elements[FIELD_MAP[property]];
      if (input && template[property] !== undefined) {
        input.value = String(template[property]);
      }
    });

    if (!options || !options.silent) {
      showToast("已载入：" + template.label);
    }
  }

  function numberValue(element) {
    const value = Number(element.value);
    return Number.isFinite(value) ? value : NaN;
  }

  function readParams() {
    const type = elements.batteryType.value;
    const meta = BatteryReport.getTypeMeta(type);
    return {
      type: type,
      chemistry: meta.chemistry,
      capacity: numberValue(elements.capacity),
      nomVoltage: numberValue(elements.nomVoltage),
      initResistance: numberValue(elements.initResistance),
      initSOH: numberValue(elements.initSoh),
      mass: numberValue(elements.mass),
      surfArea: numberValue(elements.surfaceArea),
      cp: numberValue(elements.heatCapacity),
      hConv: numberValue(elements.heatTransfer),
      cRate: numberValue(elements.cRate),
      cycles: numberValue(elements.cycles),
      soc: numberValue(elements.soc),
      dod: numberValue(elements.dod),
      ambTemp: numberValue(elements.ambientTemperature)
    };
  }

  function validateParams(params) {
    const rules = [
      ["capacity", 0.01, 20000, "标称容量需大于 0 Ah"],
      ["nomVoltage", 0.1, 1500, "标称电压需在 0.1 至 1500 V 之间"],
      ["initResistance", 0.001, 100000, "初始内阻需大于 0 mΩ"],
      ["initSOH", 1, 120, "初始 SOH 需在 1% 至 120% 之间"],
      ["mass", 0.001, 100000, "电芯质量需大于 0 kg"],
      ["surfArea", 0.000001, 10000, "散热面积需大于 0 m²"],
      ["cp", 100, 10000, "比热容需在 100 至 10000 J/(kg·K) 之间"],
      ["hConv", 0.1, 10000, "换热系数需大于 0 W/(m²·K)"],
      ["cRate", 0.05, 20, "充放电倍率需在 0.05 至 20 C 之间"],
      ["cycles", 0, 50000, "循环次数需在 0 至 50000 次之间"],
      ["soc", 0, 100, "SOC 需在 0% 至 100% 之间"],
      ["dod", 1, 100, "放电深度需在 1% 至 100% 之间"],
      ["ambTemp", -40, 80, "环境温度需在 -40 至 80 ℃ 之间"]
    ];

    for (let index = 0; index < rules.length; index += 1) {
      const rule = rules[index];
      const value = params[rule[0]];
      if (!Number.isFinite(value) || value < rule[1] || value > rule[2]) {
        return rule[3];
      }
    }
    return "";
  }

  function setRunButtonState(running) {
    state.running = running;
    elements.runButton.disabled = running;
    elements.runButton.textContent = running ? "正在计算..." : "开始电池健康评估";
  }

  function runEvaluation(options) {
    if (state.running) {
      return;
    }

    const params = readParams();
    const validationError = validateParams(params);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setRunButtonState(true);
    window.setTimeout(function () {
      try {
        const result = BatteryCalc.compute(params);
        const trend = BatteryCalc.computeAIBmsPrediction(params, result);
        const verdict = BatteryReport.evaluateVerdict(params, result, trend);
        const estimatedValue = BatteryReport.estimateResidualValue(params, result);
        const timestamp = Date.now();
        const generatedAt = BatteryReport.formatDate(timestamp);
        const reportId = BatteryReport.buildReportId(params, timestamp);
        const context = {
          params: params,
          result: result,
          trend: trend,
          verdict: verdict,
          estimatedValue: estimatedValue,
          timestamp: timestamp,
          generatedAt: generatedAt,
          reportId: reportId
        };

        state.lastContext = context;
        renderResult(context);
        if (!options || options.save !== false) {
          saveHistory(BatteryReport.buildHistoryRecord(context));
        }
        showToast("评估完成，已生成仿真报告");
      } catch (error) {
        console.error(error);
        showToast("计算失败，请检查输入参数后重试", "error");
      } finally {
        setRunButtonState(false);
      }
    }, 60);
  }

  function renderResult(context) {
    const params = context.params;
    const result = context.result;
    const trend = context.trend;
    const verdict = context.verdict;
    const meta = BatteryReport.getTypeMeta(params.type);

    elements.resultPanel.hidden = false;
    elements.resultTitle.textContent = meta.label + "健康评估报告";
    elements.reportId.textContent = context.reportId;
    elements.verdictCard.dataset.level = verdict.level;
    elements.verdictText.textContent = verdict.text;
    elements.verdictSub.textContent = verdict.sub;
    elements.estimatedValue.textContent = "约 ¥" + formatInteger(context.estimatedValue);
    elements.metricSoh.textContent = formatNumber(result.finalSoh, 1) + "%";
    elements.metricCapacity.textContent = formatNumber(result.capRetention, 1) + "%";
    elements.metricResistance.textContent = "+" + formatNumber(result.resGrowth, 1) + "%";
    elements.metricTemperature.textContent = formatNumber(result.maxTemp, 1) + "℃";
    elements.metricLife.textContent = formatInteger(result.lifeCycles) + " 次";
    elements.metricEnergy.textContent = formatInteger(result.energy) + " kWh";
    elements.trendTitle.textContent = trend.warningLevel + " · " + trend.model;
    elements.trendCopy.textContent = BatteryReport.formatTrendCopy(params, result, trend);

    renderTable(result);
    const curve = drawThermalCurve(params, result);
    if (curve.runawayTime === null) {
      elements.runawayNote.textContent = "600 秒内未达到 150 ℃ 触发阈值";
    } else {
      elements.runawayNote.textContent = "约 " + curve.runawayTime + " 秒达到 150 ℃";
    }

    elements.resultPanel.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });
  }

  function renderTable(result) {
    const rows = BatteryReport.buildReportRows(result, 12);
    const fragment = document.createDocumentFragment();

    rows.forEach(function (row) {
      const tr = document.createElement("tr");
      [
        formatInteger(row.cycle),
        formatNumber(row.soh, 2) + "%",
        formatNumber(row.resistance, 3) + " mΩ",
        formatNumber(row.temp, 1) + "℃"
      ].forEach(function (value) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      fragment.appendChild(tr);
    });

    elements.reportTableBody.replaceChildren(fragment);
  }

  function drawThermalCurve(params, result) {
    const canvas = elements.thermalCanvas;
    const context = canvas.getContext("2d");
    const width = 720;
    const height = 360;
    const padding = {
      left: 66,
      right: 26,
      top: 34,
      bottom: 48
    };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxTime = 600;
    const curve = BatteryCalc.buildThermalCurve(
      params.type,
      {
        finalSoh: result.finalSoh,
        ambientTemp: params.ambTemp
      },
      maxTime,
      5
    );
    const temperatures = curve.points.map(function (point) {
      return point.temperature;
    });
    const highestTemperature = Math.max.apply(null, temperatures.concat([180]));
    const maxTemperature = Math.ceil(highestTemperature / 50) * 50;

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0a1119";
    context.fillRect(0, 0, width, height);

    drawChartGrid(context, {
      width: width,
      height: height,
      padding: padding,
      plotWidth: plotWidth,
      plotHeight: plotHeight,
      maxTime: maxTime,
      maxTemperature: maxTemperature
    });

    const thresholdY = temperatureToY(150, padding.top, plotHeight, maxTemperature);
    context.save();
    context.setLineDash([7, 6]);
    context.strokeStyle = "rgba(255, 107, 118, 0.82)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(padding.left, thresholdY);
    context.lineTo(width - padding.right, thresholdY);
    context.stroke();
    context.restore();

    context.fillStyle = "#ff8a93";
    context.font = "12px sans-serif";
    context.textAlign = "right";
    context.fillText("150℃ 触发阈值", width - padding.right, thresholdY - 7);

    const lineGradient = context.createLinearGradient(padding.left, 0, width - padding.right, 0);
    lineGradient.addColorStop(0, "#39d5e6");
    lineGradient.addColorStop(0.62, "#5ca9ff");
    lineGradient.addColorStop(1, "#ff6b76");

    context.save();
    context.beginPath();
    curve.points.forEach(function (point, index) {
      const x = timeToX(point.time, padding.left, plotWidth, maxTime);
      const y = temperatureToY(point.temperature, padding.top, plotHeight, maxTemperature);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.lineTo(width - padding.right, height - padding.bottom);
    context.lineTo(padding.left, height - padding.bottom);
    context.closePath();
    context.fillStyle = "rgba(57, 213, 230, 0.10)";
    context.fill();
    context.restore();

    context.save();
    context.beginPath();
    curve.points.forEach(function (point, index) {
      const x = timeToX(point.time, padding.left, plotWidth, maxTime);
      const y = temperatureToY(point.temperature, padding.top, plotHeight, maxTemperature);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.strokeStyle = lineGradient;
    context.lineWidth = 3;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
    context.restore();

    if (curve.runawayTime !== null) {
      const point = curve.points.find(function (item) {
        return item.time >= curve.runawayTime;
      });
      if (point) {
        const x = timeToX(point.time, padding.left, plotWidth, maxTime);
        const y = temperatureToY(point.temperature, padding.top, plotHeight, maxTemperature);
        context.fillStyle = "#ff6b76";
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = "rgba(255, 107, 118, 0.36)";
        context.lineWidth = 8;
        context.stroke();
      }
    }

    context.fillStyle = "#d5e2ed";
    context.font = "700 14px sans-serif";
    context.textAlign = "left";
    context.fillText("温升曲线", padding.left, 20);
    context.fillStyle = "#7f95aa";
    context.font = "11px sans-serif";
    context.textAlign = "right";
    context.fillText("终点约 " + formatNumber(temperatures[temperatures.length - 1], 1) + "℃", width - padding.right, 20);

    return curve;
  }

  function drawChartGrid(context, options) {
    const padding = options.padding;
    const width = options.width;
    const height = options.height;
    const plotWidth = options.plotWidth;
    const plotHeight = options.plotHeight;
    const horizontalLines = 5;
    const verticalLines = 6;

    context.save();
    context.strokeStyle = "rgba(139, 169, 199, 0.17)";
    context.lineWidth = 1;
    context.fillStyle = "#71879d";
    context.font = "11px sans-serif";
    context.textAlign = "right";
    context.textBaseline = "middle";

    for (let index = 0; index <= horizontalLines; index += 1) {
      const ratio = index / horizontalLines;
      const y = padding.top + plotHeight * ratio;
      const temperature = options.maxTemperature * (1 - ratio);
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
      context.fillText(Math.round(temperature) + "℃", padding.left - 9, y);
    }

    context.textAlign = "center";
    context.textBaseline = "top";
    for (let index = 0; index <= verticalLines; index += 1) {
      const ratio = index / verticalLines;
      const x = padding.left + plotWidth * ratio;
      const time = options.maxTime * ratio;
      context.beginPath();
      context.moveTo(x, padding.top);
      context.lineTo(x, height - padding.bottom);
      context.stroke();
      context.fillText(Math.round(time) + "s", x, height - padding.bottom + 9);
    }

    context.strokeStyle = "rgba(191, 213, 232, 0.62)";
    context.beginPath();
    context.moveTo(padding.left, padding.top);
    context.lineTo(padding.left, height - padding.bottom);
    context.lineTo(width - padding.right, height - padding.bottom);
    context.stroke();
    context.restore();
  }

  function timeToX(time, left, plotWidth, maxTime) {
    return left + Math.max(0, Math.min(1, time / maxTime)) * plotWidth;
  }

  function temperatureToY(temperature, top, plotHeight, maxTemperature) {
    const normalized = Math.max(0, Math.min(1, temperature / maxTemperature));
    return top + (1 - normalized) * plotHeight;
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
    } catch (error) {
      console.warn("无法读取历史记录", error);
      return [];
    }
  }

  function saveHistory(record) {
    state.history = [record].concat(
      state.history.filter(function (item) {
        return item && item.id !== record.id;
      })
    ).slice(0, MAX_HISTORY);

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    } catch (error) {
      console.warn("无法保存历史记录", error);
    }
    renderHistory();
  }

  function renderHistory() {
    const list = elements.historyList;
    list.replaceChildren();

    if (!state.history.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      empty.textContent = "暂无检测记录，完成一次评估后会自动保存在本机。";
      list.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    state.history.forEach(function (item) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-item";
      button.setAttribute("aria-label", "载入报告 " + item.id);

      const main = document.createElement("span");
      main.className = "history-main";
      const title = document.createElement("span");
      title.className = "history-title";
      title.textContent = item.typeLabel + " · " + formatNumber(item.capacity, 1) + " Ah · " + formatInteger(item.cycles) + " 次";
      const time = document.createElement("span");
      time.className = "history-time";
      time.textContent = item.generatedAt + " · " + item.id;
      main.appendChild(title);
      main.appendChild(time);

      const result = document.createElement("span");
      result.className = "history-result";
      const soh = document.createElement("strong");
      soh.className = "history-soh";
      soh.textContent = formatNumber(item.soh, 1) + "%";
      const verdict = document.createElement("span");
      verdict.className = "history-verdict";
      verdict.textContent = item.verdictText;
      result.appendChild(soh);
      result.appendChild(verdict);

      button.appendChild(main);
      button.appendChild(result);
      button.addEventListener("click", function () {
        restoreHistory(item);
      });
      fragment.appendChild(button);
    });
    list.appendChild(fragment);
  }

  function restoreHistory(item) {
    if (!item || !item.params) {
      showToast("历史记录缺少参数，无法载入", "error");
      return;
    }

    elements.batteryType.value = item.params.type;
    Object.keys(FIELD_MAP).forEach(function (property) {
      const input = elements[FIELD_MAP[property]];
      if (input && item.params[property] !== undefined) {
        input.value = String(item.params[property]);
      }
    });
    runEvaluation({ save: false });
  }

  function clearHistory() {
    if (!state.history.length) {
      showToast("当前没有历史记录");
      return;
    }
    if (!window.confirm("确定清空本机全部检测历史吗？")) {
      return;
    }
    state.history = [];
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.warn("无法清空历史记录", error);
    }
    renderHistory();
    showToast("历史记录已清空");
  }

  function handlePhotoChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type || !file.type.startsWith("image/")) {
      showToast("请选择图片文件", "error");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      showToast("图片请控制在 8 MB 以内", "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      state.photoDataUrl = String(reader.result || "");
      elements.photoImage.src = state.photoDataUrl;
      elements.photoPreview.hidden = false;
      showToast("外观照片已加入本次报告预览");
    };
    reader.onerror = function () {
      showToast("图片读取失败，请重新选择", "error");
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    state.photoDataUrl = "";
    elements.photoImage.removeAttribute("src");
    elements.photoPreview.hidden = true;
    elements.photoInput.value = "";
    showToast("已移除外观照片");
  }

  function printReport() {
    if (!state.lastContext) {
      showToast("请先完成一次电池评估", "error");
      return;
    }
    document.body.classList.add("print-ready");
    showToast("请在打印窗口中选择“另存为 PDF”", "info", 2600);
    window.setTimeout(function () {
      window.print();
    }, 120);
  }

  function copySummary() {
    if (!state.lastContext) {
      showToast("请先完成一次电池评估", "error");
      return;
    }

    const text = BatteryReport.buildSummaryText(state.lastContext);
    copyText(text).then(function () {
      showToast("报告摘要已复制");
    }).catch(function () {
      showToast("复制失败，请长按页面内容手动复制", "error");
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (successful) {
          resolve();
        } else {
          reject(new Error("copy command failed"));
        }
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  }

  function showToast(message, kind, duration) {
    if (!elements.toast) {
      return;
    }
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.toggle("error", kind === "error");
    elements.toast.classList.add("visible");
    state.toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("visible");
    }, duration || 1800);
  }

  function formatNumber(value, digits) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "—";
    }
    return number.toLocaleString("zh-CN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function formatInteger(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "—";
    }
    return Math.round(number).toLocaleString("zh-CN");
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      return;
    }
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").catch(function (error) {
        console.warn("离线缓存注册失败", error);
      });
    });
  }
})();
