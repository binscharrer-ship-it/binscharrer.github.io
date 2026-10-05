(function () {
  "use strict";

  const calc = window.BatteryCalc;
  const HISTORY_KEY = "xg_battsim_web_history_v1";
  const form = document.querySelector("#batteryForm");
  const simpleMode = document.querySelector("#simpleMode");
  const enhancedMode = document.querySelector("#enhancedMode");
  const resultSection = document.querySelector("#resultSection");
  const enhancedPanel = document.querySelector("#enhancedPanel");
  const historyPanel = document.querySelector("#historyPanel");
  const historyList = document.querySelector("#historyList");
  const formError = document.querySelector("#formError");
  const photoInput = document.querySelector("#photoInput");
  const photoPreview = document.querySelector("#photoPreview");
  const previewImage = document.querySelector("#previewImage");
  let photoUrl = "";
  let currentResult = null;

  const fields = [
    "capacity", "nomVoltage", "initResistance", "initSOH", "mass", "surfArea",
    "cp", "hConv", "cRate", "cycles", "soc", "dod", "ambTemp"
  ];

  function numberValue(name) {
    return Number(form.elements[name].value);
  }

  function readParameters() {
    const values = {};
    fields.forEach((name) => {
      values[name] = numberValue(name);
    });

    const invalid = fields.find((name) => !Number.isFinite(values[name]));
    if (invalid) {
      throw new Error("请检查所有数值字段是否填写完整。");
    }
    if (values.capacity <= 0 || values.cycles < 1) {
      throw new Error("容量和循环次数必须大于 0。");
    }
    if (values.initSOH <= 0 || values.initSOH > 100) {
      throw new Error("初始 SOH 必须在 0 到 100 之间。");
    }
    if (values.soc < 0 || values.soc > 100 || values.dod < 1 || values.dod > 100) {
      throw new Error("SOC 和放电深度必须在 0 到 100 之间。");
    }

    return {
      ...values,
      chemistry: form.elements.chemistry.value
    };
  }

  function setMetric(id, value, state) {
    const element = document.querySelector(`#${id}`);
    element.textContent = value;
    const card = element.closest(".metric");
    card.classList.remove("success", "warning", "danger");
    if (state) card.classList.add(state);
  }

  function classify(result, enhanced) {
    const risk = enhanced ? Number(enhanced.runawayRisk) : 0;
    if (result.finalSoh < 70 || Number(result.maxTemp) >= 55 || risk >= 70) {
      return {
        key: "danger",
        text: "不建议继续使用",
        sub: "电池已明显老化或存在较高热风险，建议停用并交由专业人员检测。"
      };
    }
    if (result.finalSoh < 80 || Number(result.maxTemp) >= 45 || risk >= 40) {
      return {
        key: "warning",
        text: "谨慎使用并检测",
        sub: "存在衰减或温升提示，建议降低倍率、改善散热并做容量校准。"
      };
    }
    return {
      key: "success",
      text: "当前状态较稳定",
      sub: "按现有工况外推，电池仍具备继续使用条件，请持续观察温度和容量变化。"
    };
  }

  function estimateResidualValue(parameters, result) {
    const unitPrice = parameters.chemistry === "LFP" ? 8 : parameters.chemistry === "NCA" ? 15 : 12;
    return Math.round(parameters.capacity * unitPrice * (result.finalSoh / 100) * 0.6);
  }

  function renderResult(parameters, result, enhanced) {
    const verdict = classify(result, enhanced);
    const verdictElement = document.querySelector("#verdict");
    verdictElement.className = `verdict ${verdict.key}`;
    document.querySelector("#verdictText").textContent = verdict.text;
    document.querySelector("#verdictSub").textContent = verdict.sub;
    document.querySelector("#verdictValue").textContent =
      `参考残值约 ¥${estimateResidualValue(parameters, result)}（仅用于资产盘点）`;

    setMetric("finalSoh", `${result.finalSoh}%`, verdict.key);
    setMetric("capacityRetention", `${result.capRetention}%`, verdict.key);
    setMetric("resistanceGrowth", `+${result.resGrowth}%`, Number(result.resGrowth) > 40 ? "warning" : "");
    setMetric("maxTemperature", `${result.maxTemp}℃`, Number(result.maxTemp) >= 45 ? "warning" : "success");
    setMetric("lifeCycles", String(result.lifeCycles), "");
    setMetric("energyTotal", `${result.energy} kWh`, "");
    document.querySelector("#modelTag").textContent = result.model;

    if (enhanced) {
      enhancedPanel.hidden = false;
      const riskState = enhanced.warningLevel === "高危" ? "danger" :
        enhanced.warningLevel === "中危" ? "warning" : "success";
      setMetric("estimatedSoh", `${enhanced.aiSoh}%`, "");
      setMetric("estimatedLife", enhanced.aiLife, "");
      setMetric("riskLevel", enhanced.warningLevel, riskState);
      setMetric("riskScore", `${enhanced.runawayRisk}%`, riskState);
      const note = document.querySelector("#enhancedNote");
      note.className = `callout ${riskState === "warning" ? "warning" : riskState === "danger" ? "danger" : ""}`;
      note.textContent =
        `增强估算仅对基础结果做小幅区间修正。当前温升提示：${enhanced.warningTime}。` +
        "该结果不是神经网络推理，也不能替代热失控实验或 BMS 实车诊断。";
    } else {
      enhancedPanel.hidden = true;
    }

    renderTable(result.data);
    drawChart(result.data);
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderTable(data) {
    const tbody = document.querySelector("#resultTable");
    const rows = data.filter((item, index) => index % 10 === 0 || index === data.length - 1);
    tbody.innerHTML = rows.map((item) => `
      <tr>
        <td>${item.cycle}</td>
        <td>${item.soh}</td>
        <td>${item.resistance}</td>
        <td>${item.temp}</td>
      </tr>
    `).join("");
  }

  function drawChart(data) {
    const canvas = document.querySelector("#sohChart");
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 840;
    const cssHeight = cssWidth / 2.8;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    context.scale(ratio, ratio);

    const width = cssWidth;
    const height = cssHeight;
    const padding = { top: 24, right: 18, bottom: 30, left: 42 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const values = data.map((item) => Number(item.soh));
    const minValue = Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10);
    const maxValue = Math.max(100, Math.ceil(Math.max(...values) / 10) * 10);
    const count = Math.max(data.length - 1, 1);

    context.clearRect(0, 0, width, height);
    context.font = "12px PingFang SC, Microsoft YaHei, sans-serif";
    context.lineWidth = 1;

    for (let i = 0; i <= 4; i += 1) {
      const ratioY = i / 4;
      const y = padding.top + chartHeight * ratioY;
      const labelValue = Math.round(maxValue - (maxValue - minValue) * ratioY);
      context.strokeStyle = "rgba(145,181,198,0.14)";
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
      context.fillStyle = "#758a90";
      context.fillText(String(labelValue), 8, y + 4);
    }

    const points = data.map((item, index) => ({
      x: padding.left + chartWidth * (index / count),
      y: padding.top + chartHeight * (1 - (Number(item.soh) - minValue) / (maxValue - minValue))
    }));

    const fillGradient = context.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    fillGradient.addColorStop(0, "rgba(79,209,181,0.26)");
    fillGradient.addColorStop(1, "rgba(79,209,181,0)");
    context.beginPath();
    context.moveTo(points[0].x, height - padding.bottom);
    points.forEach((point) => context.lineTo(point.x, point.y));
    context.lineTo(points[points.length - 1].x, height - padding.bottom);
    context.closePath();
    context.fillStyle = fillGradient;
    context.fill();

    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.strokeStyle = "#4fd1b5";
    context.lineWidth = 2.5;
    context.stroke();

    const first = data[0];
    const last = data[data.length - 1];
    context.fillStyle = "#91a4aa";
    context.fillText(`0 次`, padding.left, height - 9);
    const endLabel = `${last.cycle} 次`;
    context.fillText(endLabel, width - padding.right - context.measureText(endLabel).width, height - 9);
    document.querySelector("#chartRange").textContent =
      `${first.soh}% → ${last.soh}%，共 ${last.cycle} 次循环`;
  }

  function saveHistory(parameters, result, enhanced) {
    const selectedVerdict = classify(result, enhanced);
    const history = getHistory();
    history.unshift({
      id: Date.now(),
      time: new Date().toLocaleString("zh-CN", { hour12: false }),
      chemistry: parameters.chemistry,
      capacity: parameters.capacity,
      cycles: parameters.cycles,
      soh: result.finalSoh,
      maxTemp: result.maxTemp,
      verdict: selectedVerdict.key
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    renderHistory();
  }

  function getHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function renderHistory() {
    const history = getHistory();
    if (!history.length) {
      historyList.innerHTML = '<div class="history-empty">暂无历史记录。完成一次仿真后会自动保存。</div>';
      return;
    }
    historyList.innerHTML = history.map((item) => {
      const color = item.verdict === "success" ? "当前稳定" :
        item.verdict === "warning" ? "谨慎使用" : "建议停用";
      return `
        <article class="history-item">
          <div>
            <strong>${item.chemistry} · ${item.capacity} Ah · ${item.cycles} 次循环</strong>
            <small>${item.time} · 最高温度 ${item.maxTemp}℃</small>
          </div>
          <div class="history-score">
            <strong>${item.soh}%</strong>
            <small>${color}</small>
          </div>
        </article>
      `;
    }).join("");
  }

  function setPhoto(file) {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = file ? URL.createObjectURL(file) : "";
    previewImage.src = photoUrl;
    photoPreview.hidden = !file;
    document.querySelector("#photoEmpty").hidden = Boolean(file);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formError.hidden = true;

    try {
      const parameters = readParameters();
      const result = calc.compute(parameters);
      const enhanced = enhancedMode.checked
        ? calc.computeAIBmsPrediction(parameters, result)
        : null;
      currentResult = { parameters, result, enhanced };
      renderResult(parameters, result, enhanced);
      saveHistory(parameters, result, enhanced);
    } catch (error) {
      formError.textContent = error.message || "计算失败，请检查输入。";
      formError.hidden = false;
    }
  });

  simpleMode.addEventListener("change", () => {
    document.body.classList.toggle("simple-mode", simpleMode.checked);
  });

  document.querySelector("#choosePhoto").addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", () => setPhoto(photoInput.files[0]));
  document.querySelector("#removePhoto").addEventListener("click", () => {
    photoInput.value = "";
    setPhoto(null);
  });

  document.querySelector("#historyButton").addEventListener("click", () => {
    historyPanel.hidden = !historyPanel.hidden;
    if (!historyPanel.hidden) {
      renderHistory();
      historyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.querySelector("#clearHistory").addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  document.querySelector("#printButton").addEventListener("click", () => window.print());
  document.querySelector("#resetButton").addEventListener("click", () => {
    resultSection.hidden = true;
    form.reset();
    currentResult = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("resize", () => {
    if (currentResult) drawChart(currentResult.result.data);
  });

  renderHistory();
})();
