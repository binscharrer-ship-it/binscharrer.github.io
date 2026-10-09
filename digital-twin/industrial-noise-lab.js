const NOISE = window.XG_INDUSTRIAL_NOISE;

const state = {
  sourceId: "fc002",
  cursor: 0,
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
};

function currentSource() {
  return NOISE.sources[state.sourceId];
}

function renderTabs() {
  ui.tabs.replaceChildren(
    ...Object.entries(NOISE.sources).map(([id, source]) => {
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
  ui.sourceEvidence.textContent = source.evidence_level;
  ui.scenarioCount.textContent = String(metrics.scenarios ?? metrics.noise_scenarios ?? 256);
  ui.autoRecovery.textContent = String(metrics.auto_recovery ?? 0);
  ui.metricLimit.textContent = String(source.metric_limit);
  ui.metricLabel.textContent = source.metric_label;

  ui.metricList.replaceChildren(
    ...Object.entries(metrics).map(([key, value]) => {
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
  ctx.font = "17px Consolas, monospace";
  ctx.fillText(label, 16, laneTop + 28);
  ctx.strokeStyle = "#24374b";
  ctx.beginPath();
  ctx.moveTo(left, laneTop + laneHeight);
  ctx.lineTo(width - right, laneTop + laneHeight);
  ctx.stroke();

  const plotWidth = width - left - right;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = left + plotWidth * index / Math.max(1, values.length - 1);
    const y = laneTop + laneHeight - laneHeight * 0.78 * Math.min(1, value / maxValue);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawCanvas() {
  const source = currentSource();
  const canvas = ui.canvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const left = 170;
  const right = 28;
  const top = 28;
  const laneHeight = Math.max(70, Math.floor((height - top - 28) / 5));

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b1420";
  ctx.fillRect(0, 0, width, height);

  const plotWidth = width - left - right;
  ctx.strokeStyle = "#1f3042";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = left + plotWidth * i / 10;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, height - 24);
    ctx.stroke();
  }

  drawLane(
    ctx,
    "clock jitter ns",
    "#d97706",
    source.clock_jitter_ns,
    top,
    laneHeight,
    width,
    left,
    right,
    10,
  );
  drawLane(
    ctx,
    "power bounce",
    "#c2413b",
    source.power_bounce,
    top + laneHeight,
    laneHeight,
    width,
    left,
    right,
    1,
  );
  drawLane(
    ctx,
    "bit flip",
    "#7551b5",
    source.bit_flip,
    top + laneHeight * 2,
    laneHeight,
    width,
    left,
    right,
    1,
  );
  drawLane(
    ctx,
    "uart loss %",
    "#1f6feb",
    source.uart_loss_percent,
    top + laneHeight * 3,
    laneHeight,
    width,
    left,
    right,
    10,
  );
  drawLane(
    ctx,
    source.metric_label,
    "#177a55",
    source.metric_values,
    top + laneHeight * 4,
    laneHeight,
    width,
    left,
    right,
    source.metric_limit,
  );

  const cursorX = left + plotWidth * state.cursor / Math.max(1, source.time_ns.length - 1);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cursorX, top - 8);
  ctx.lineTo(cursorX, height - 18);
  ctx.stroke();
}

function render() {
  renderTabs();
  renderSummary();
  drawCanvas();
  const source = currentSource();
  ui.cursorLabel.textContent = `${source.time_ns[state.cursor]} ns`;
}

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

render();
