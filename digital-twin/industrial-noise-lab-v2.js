const NOISE_BASE = window.XG_INDUSTRIAL_NOISE;
const NOISE_CORE = window.XGNoiseCore;

const state = {
  sourceId: "fc002",
  cursor: 0,
  series: null,
};

const ui = {
  tabs: document.getElementById("noise-source-tabs"),
  sourceName: document.getElementById("source-name"),
  sourceEvidence: document.getElementById("source-evidence"),
  scenarioCount: document.getElementById("scenario-count"),
  autoRecovery: document.getElementById("auto-recovery"),
  metricLimit: document.getElementById("metric-limit"),
  metricLabel: document.getElementById("metric-label"),
  metricList: document.getElementById("metric-list"),
  canvas: document.getElementById("noise-canvas"),
  scrubber: document.getElementById("noise-scrubber"),
  cursorLabel: document.getElementById("cursor-label"),
  shieldState: document.getElementById("noise-shield-state"),
  response: document.getElementById("noise-response"),
  eventCount: document.getElementById("noise-event-count"),
  responseStrip: document.querySelector(".response-strip"),
  jitterInput: document.getElementById("jitter-input"),
  jitterValue: document.getElementById("jitter-value"),
  jitterFrequencyInput: document.getElementById("jitter-frequency-input"),
  jitterFrequencyValue: document.getElementById("jitter-frequency-value"),
  bounceInput: document.getElementById("bounce-input"),
  bounceValue: document.getElementById("bounce-value"),
  bounceFrequencyInput: document.getElementById("bounce-frequency-input"),
  bounceFrequencyValue: document.getElementById("bounce-frequency-value"),
  bitFlipInput: document.getElementById("bit-flip-input"),
  bitFlipValue: document.getElementById("bit-flip-value"),
  uartLossInput: document.getElementById("uart-loss-input"),
  uartLossValue: document.getElementById("uart-loss-value"),
  seedInput: document.getElementById("seed-input"),
  apply: document.getElementById("apply-noise"),
  exportJson: document.getElementById("export-json"),
  exportCsv: document.getElementById("export-csv"),
};

function currentSource() {
  return NOISE_BASE.sources[state.sourceId];
}

function currentConfig() {
  return {
    seed: Number(ui.seedInput.value || 20261009),
    jitterPs: Number(ui.jitterInput.value),
    jitterFrequencyMhz: Number(ui.jitterFrequencyInput.value),
    powerBouncePercent: Number(ui.bounceInput.value),
    powerBounceFrequencyMhz: Number(ui.bounceFrequencyInput.value),
    bitFlipProbability: Number(ui.bitFlipInput.value),
    uartLossProbability: Number(ui.uartLossInput.value),
  };
}

function updateControlReadouts() {
  ui.jitterValue.textContent = `${ui.jitterInput.value} ps`;
  ui.jitterFrequencyValue.textContent = `${Number(ui.jitterFrequencyInput.value).toFixed(1)} MHz`;
  ui.bounceValue.textContent = `${ui.bounceInput.value}%`;
  ui.bounceFrequencyValue.textContent = `${Number(ui.bounceFrequencyInput.value).toFixed(1)} MHz`;
  ui.bitFlipValue.textContent = `${ui.bitFlipInput.value}%`;
  ui.uartLossValue.textContent = `${ui.uartLossInput.value}%`;
}

function regenerate() {
  state.series = NOISE_CORE.generate(currentConfig());
  state.cursor = Math.min(state.cursor, state.series.timeNs.length - 1);
  render();
}

function renderTabs() {
  ui.tabs.replaceChildren(
    ...Object.entries(NOISE_BASE.sources).map(([id, source]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `source-tab ${id === state.sourceId ? "active" : ""}`;
      button.textContent = source.name;
      button.addEventListener("click", () => {
        state.sourceId = id;
        state.cursor = 0;
        ui.scrubber.value = "0";
        render();
      });
      return button;
    }),
  );
}

function renderSummary() {
  const source = currentSource();
  const metrics = source.metrics;
  ui.sourceName.textContent = source.name;
  ui.sourceEvidence.textContent = `INTERACTIVE_MODEL / base=${source.evidence_level}`;
  ui.scenarioCount.textContent = String(metrics.scenarios ?? metrics.noise_scenarios ?? 256);
  ui.autoRecovery.textContent = String(metrics.auto_recovery ?? 0);
  ui.metricLimit.textContent = String(source.metric_limit);
  ui.metricLabel.textContent = source.metric_label;

  ui.metricList.replaceChildren(
    ...Object.entries({
      ...metrics,
      injected_events: state.series.eventTimestampsNs.length,
      response_ns: state.series.responseNs,
      seed: state.series.config.seed,
    }).map(([key, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = key.replaceAll("_", " ");
      const dd = document.createElement("dd");
      dd.textContent = typeof value === "number" ? String(value) : JSON.stringify(value);
      row.append(dt, dd);
      return row;
    }),
  );
}

function drawLane(ctx, label, color, values, laneTop, laneHeight, width, left, right, maxValue) {
  ctx.fillStyle = "#d8e2f2";
  ctx.font = "16px Consolas, monospace";
  ctx.fillText(label, 16, laneTop + Math.min(28, laneHeight / 2));
  ctx.strokeStyle = "#24374b";
  ctx.beginPath();
  ctx.moveTo(left, laneTop + laneHeight);
  ctx.lineTo(width - right, laneTop + laneHeight);
  ctx.stroke();

  const plotWidth = width - left - right;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = left + plotWidth * index / Math.max(1, values.length - 1);
    const y = laneTop + laneHeight - laneHeight * 0.78 * Math.min(1, value / maxValue);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function metricValues() {
  const source = currentSource();
  return state.series.timeNs.map((_, index) => {
    const disturbance = (
      state.series.clockJitterPs[index] / 500
      + state.series.powerBouncePercent[index] / 200
      + state.series.bitFlip[index]
      + state.series.uartLossPercent[index] / 10
    );
    if (source.metric_label === "latch success") {
      return 100;
    }
    if (source.metric_label === "ratio error (%)") {
      return Math.min(source.metric_limit, 0.037523 + disturbance * 0.006);
    }
    return Math.min(source.metric_limit, 6 + Math.round(disturbance));
  });
}

function drawCanvas() {
  const canvas = ui.canvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const left = 170;
  const right = 28;
  const top = 28;
  const laneHeight = Math.max(70, Math.floor((height - top - 28) / 5));
  const plotWidth = width - left - right;
  const series = state.series;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b1420";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#1f3042";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = left + plotWidth * i / 10;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, height - 24);
    ctx.stroke();
  }

  series.eventIndices.forEach((index) => {
    const x = left + plotWidth * index / Math.max(1, series.timeNs.length - 1);
    ctx.strokeStyle = "#ff4d4f";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, height - 24);
    ctx.stroke();
  });

  drawLane(ctx, "clock jitter ps", "#d97706", series.clockJitterPs, top, laneHeight, width, left, right, 500);
  drawLane(ctx, "power bounce %", "#c2413b", series.powerBouncePercent, top + laneHeight, laneHeight, width, left, right, 200);
  drawLane(ctx, "bit flip", "#7551b5", series.bitFlip, top + laneHeight * 2, laneHeight, width, left, right, 1);
  drawLane(ctx, "uart loss %", "#1f6feb", series.uartLossPercent, top + laneHeight * 3, laneHeight, width, left, right, 10);
  drawLane(ctx, currentSource().metric_label, "#177a55", metricValues(), top + laneHeight * 4, laneHeight, width, left, right, currentSource().metric_limit);

  const cursorX = left + plotWidth * state.cursor / Math.max(1, series.timeNs.length - 1);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cursorX, top - 8);
  ctx.lineTo(cursorX, height - 18);
  ctx.stroke();
}

function renderResponse() {
  const series = state.series;
  ui.responseStrip.classList.toggle("latched", series.latched);
  ui.shieldState.textContent = series.latched ? "LATCHED" : "SAFE";
  ui.response.textContent = `${series.responseNs.toFixed(1)} ns`;
  ui.eventCount.textContent = String(series.eventTimestampsNs.length);
}

function render() {
  renderTabs();
  renderSummary();
  drawCanvas();
  renderResponse();
  ui.cursorLabel.textContent = `${state.series.timeNs[state.cursor]} ns`;
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: "XG_NOISE_STATE",
        latched: state.series.latched,
        responseNs: state.series.responseNs,
        events: state.series.eventTimestampsNs,
        evidenceLevel: state.series.evidenceLevel,
      },
      "*",
    );
  }
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

[ui.jitterInput, ui.jitterFrequencyInput, ui.bounceInput, ui.bounceFrequencyInput, ui.bitFlipInput, ui.uartLossInput]
  .forEach((input) => input.addEventListener("input", updateControlReadouts));

ui.apply.addEventListener("click", regenerate);
ui.exportJson.addEventListener("click", () => {
  download(
    "industrial-noise-profile.json",
    JSON.stringify(state.series, null, 2),
    "application/json",
  );
});
ui.exportCsv.addEventListener("click", () => {
  download(
    "industrial-noise-profile.csv",
    NOISE_CORE.toCsv(state.series),
    "text/csv",
  );
});
ui.scrubber.addEventListener("input", (event) => {
  state.cursor = Number(event.target.value);
  render();
});

window.addEventListener("resize", () => {
  const bounds = ui.canvas.getBoundingClientRect();
  ui.canvas.width = Math.max(900, Math.round(bounds.width * window.devicePixelRatio));
  ui.canvas.height = Math.max(520, Math.round(bounds.height * window.devicePixelRatio));
  drawCanvas();
});

updateControlReadouts();
if (new URLSearchParams(window.location.search).get("embedded") === "1") {
  document.body.classList.add("embedded");
}
state.series = NOISE_CORE.generate(currentConfig());
render();
