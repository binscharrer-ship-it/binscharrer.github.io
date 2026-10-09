const DATA = window.XG_DASHBOARD_DATA;

const state = {
  mode: "microfluidic",
  playing: false,
  position: 0,
  lastAlarm: false,
  audioReady: false,
  audioContext: null,
  animationFrame: null,
  startTimestamp: 0,
  startPosition: 0,
  playbackMs: 9000,
};

const ui = {
  statusDot: document.getElementById("status-dot"),
  runStateLabel: document.getElementById("run-state-label"),
  playButton: document.getElementById("play-button"),
  resetButton: document.getElementById("reset-button"),
  modeMicro: document.getElementById("mode-micro"),
  modeIce: document.getElementById("mode-ice"),
  modeNoise: document.getElementById("mode-noise"),
  dashboardGrid: document.querySelector(".dashboard-grid"),
  noisePanel: document.getElementById("noise-embed-panel"),
  flowTitle: document.getElementById("flow-title"),
  ratioBadge: document.getElementById("ratio-badge"),
  barA: document.getElementById("bar-a"),
  barB: document.getElementById("bar-b"),
  barALabel: document.getElementById("bar-a-label"),
  barBLabel: document.getElementById("bar-b-label"),
  barAValue: document.getElementById("bar-a-value"),
  barBValue: document.getElementById("bar-b-value"),
  ratioError: document.getElementById("ratio-error"),
  controlPeriod: document.getElementById("control-period"),
  channelSkew: document.getElementById("channel-skew"),
  timeReadout: document.getElementById("time-readout"),
  durationLabel: document.getElementById("duration-label"),
  scrubber: document.getElementById("scrubber"),
  safetyShield: document.getElementById("safety-shield"),
  shieldState: document.getElementById("shield-state"),
  shieldCaption: document.getElementById("shield-caption"),
  wnsValue: document.getElementById("wns-value"),
  drcValue: document.getElementById("drc-value"),
  fmaxValue: document.getElementById("fmax-value"),
  resourceValue: document.getElementById("resource-value"),
  eventList: document.getElementById("event-list"),
  eventStatus: document.getElementById("event-status"),
  alarmFlash: document.getElementById("alarm-flash"),
  canvas: document.getElementById("waveform-canvas"),
};

function currentData() {
  return DATA[state.mode];
}

function valueAt(stream, timeNs) {
  if (!stream || stream.length === 0) return 0;
  let value = stream[0][1];
  for (const [ts, candidate] of stream) {
    if (ts > timeNs) break;
    value = candidate;
  }
  return value;
}

function formatTimeNs(ns) {
  if (ns >= 1_000_000) return `${(ns / 1_000_000).toFixed(3)} ms`;
  if (ns >= 1000) return `${(ns / 1000).toFixed(2)} us`;
  return `${ns.toFixed(0)} ns`;
}

function signed16(value) {
  return value >= 32768 ? value - 65536 : value;
}

function setMode(mode) {
  state.mode = mode;
  state.position = 0;
  state.playing = false;
  state.lastAlarm = false;
  cancelAnimationFrame(state.animationFrame);
  ui.modeMicro.classList.toggle("active", mode === "microfluidic");
  ui.modeIce.classList.toggle("active", mode === "ice");
  ui.modeNoise.classList.toggle("active", mode === "noise");
  ui.dashboardGrid.classList.toggle("hidden", mode === "noise");
  ui.noisePanel.classList.toggle("hidden", mode !== "noise");
  ui.playButton.textContent = "运行演示";
  ui.statusDot.className = "status-dot";
  ui.runStateLabel.textContent = "READY / 数字样机待运行";

  if (mode === "noise") {
    ui.runStateLabel.textContent = "NOISE LAB / 数字噪声注入";
    ui.eventStatus.textContent = "噪声注入";
    return;
  }

  const meta = currentData().meta;
  ui.wnsValue.textContent = `+${meta.post_route_wns_ns} ns`;
  ui.drcValue.textContent = `${meta.drc_checks ?? meta.drc_errors ?? 0} Checks`;

  if (mode === "microfluidic") {
    ui.flowTitle.textContent = "MI:DCI 动态配比";
    ui.barALabel.textContent = "MI 主路";
    ui.barBLabel.textContent = "DCI 副路";
    ui.ratioBadge.textContent = "40:1";
    ui.ratioError.textContent = `${meta.ratio_error_percent}%`;
    ui.controlPeriod.textContent = `${meta.clock_mhz} MHz`;
    ui.channelSkew.textContent = `${meta.digital_channel_skew_clocks} clocks`;
    ui.fmaxValue.textContent = `${meta.clock_mhz} MHz`;
    ui.resourceValue.textContent = "LUT 2.28% / DSP 0";
  } else {
    ui.flowTitle.textContent = "点火/喷油动态命令";
    ui.barALabel.textContent = "点火提前角";
    ui.barBLabel.textContent = "喷油脉宽";
    ui.ratioBadge.textContent = "150 MHz";
    ui.ratioError.textContent = `${meta.digital_response_ns} ns`;
    ui.controlPeriod.textContent = `${meta.timing_period_ns} ns`;
    ui.channelSkew.textContent = `${meta.digital_response_cycles} cycles`;
    ui.fmaxValue.textContent = `${meta.estimated_fmax_mhz} MHz`;
    ui.resourceValue.textContent = `LUT ${meta.slice_lut_percent}% / DSP ${meta.dsp}`;
  }

  updateFrame(0);
}

function updateBars() {
  const data = currentData();
  const meta = data.meta;
  const timeNs = state.position * data.duration_ns;
  const baseline = timeNs <= 20;

  if (state.mode === "microfluidic") {
    const mi = baseline ? meta.mi_pwm_high_cycles : valueAt(data.streams.mi_duty, timeNs);
    const dci = baseline ? meta.dci_pwm_high_cycles : valueAt(data.streams.dci_duty, timeNs);
    const miFlow = baseline
      ? meta.mi_target_ul_min
      : Math.round((mi / 65535) * 10000);
    const dciFlow = baseline
      ? meta.dci_target_ul_min
      : Math.round((dci / 65535) * 10000);
    const miPercent = Math.max(2, (mi / 65535) * 100);
    const dciPercent = Math.max(2, (dci / 65535) * 100);
    ui.barA.style.height = `${miPercent}%`;
    ui.barB.style.height = `${dciPercent}%`;
    ui.barAValue.textContent = `${miFlow}`;
    ui.barBValue.textContent = `${dciFlow}`;
    ui.ratioBadge.textContent = "40:1";
    return;
  }

  const spark = baseline
    ? meta.spark_command_before
    : Math.max(0, signed16(valueAt(data.streams.spark_advance_cmd, timeNs)));
  const injection = baseline
    ? meta.injection_command_before
    : Math.max(0, signed16(valueAt(data.streams.injection_pw_cmd, timeNs)));
  ui.barA.style.height = `${Math.max(2, Math.min(100, spark / 120 * 100))}%`;
  ui.barB.style.height = `${Math.max(2, Math.min(100, injection / 600 * 100))}%`;
  ui.barAValue.textContent = `${spark}`;
  ui.barBValue.textContent = `${injection}`;
  ui.ratioBadge.textContent = `${meta.timing_constraint_mhz} MHz`;
}

function updateEvents() {
  const data = currentData();
  const timeNs = state.position * data.duration_ns;
  const baseline = timeNs <= 20;
  const rows = [];

  if (state.mode === "microfluidic") {
    const alarm = baseline ? 0 : valueAt(data.streams.cusum_alarm, timeNs);
    const trip = baseline ? 0 : valueAt(data.streams.safety_trip, timeNs);
    const enable = baseline ? 0 : valueAt(data.streams.pwm_enable, timeNs);
    rows.push(["CUSUM", alarm ? "异常漂移已触发" : "监测中", alarm ? "active" : ""]);
    rows.push(["安全门", trip ? "安全门已切断输出" : "待机", trip ? "danger" : ""]);
    rows.push(["PWM 输出", enable ? "输出使能" : "输出关闭", enable ? "active" : ""]);
  } else {
    const alert = baseline ? 0 : valueAt(data.streams.knock_alert, timeNs);
    const correction = baseline ? 0 : valueAt(data.streams.correction_valid, timeNs);
    const predict = baseline ? 0 : valueAt(data.streams.predict_valid, timeNs);
    const adaptive = baseline ? 0 : valueAt(data.streams.adaptive_scale, timeNs);
    rows.push(["爆震前兆", alert ? "已锁定告警" : "监测中", alert ? "danger" : ""]);
    rows.push(["预测前馈", predict ? "导数触发修正" : "保持基线", predict ? "active" : ""]);
    rows.push(["自适应权重", `当前档位 ${adaptive}`, adaptive ? "active" : ""]);
    rows.push(["修正命令", correction ? "修正命令已更新" : "等待事件", correction ? "active" : ""]);
  }

  ui.eventList.replaceChildren(...rows.map(([label, text, cls]) => {
    const row = document.createElement("div");
    row.className = `event-row ${cls}`;
    const strong = document.createElement("strong");
    strong.textContent = label;
    const span = document.createElement("span");
    span.textContent = text;
    row.append(strong, span);
    return row;
  }));
}

function updateSafety() {
  const data = currentData();
  const timeNs = state.position * data.duration_ns;
  const alarm = timeNs > 20 && (
    state.mode === "microfluidic"
      ? Boolean(valueAt(data.streams.safety_trip, timeNs))
      : Boolean(valueAt(data.streams.knock_alert, timeNs))
  );

  if (alarm && !state.lastAlarm) {
    triggerAlarm();
  }
  state.lastAlarm = alarm;

  ui.safetyShield.classList.toggle("alarm", alarm);
  ui.shieldState.textContent = alarm ? "ALARM" : "SAFE";
  ui.shieldCaption.textContent = alarm
    ? (state.mode === "microfluidic" ? "CUSUM 已触发安全门" : "预测/爆震告警已触发")
    : `WNS +${data.meta.post_route_wns_ns} ns，安全门待机`;
  ui.statusDot.className = `status-dot ${alarm ? "alarm" : state.playing ? "running" : ""}`;
  ui.eventStatus.textContent = alarm ? "安全事件" : state.playing ? "回放中" : "等待演示";
  ui.eventStatus.style.color = alarm ? "var(--red)" : "";
}

function triggerAlarm() {
  ui.alarmFlash.classList.remove("active");
  void ui.alarmFlash.offsetWidth;
  ui.alarmFlash.classList.add("active");
  if (state.audioReady) {
    const ctx = state.audioContext;
    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    gain.connect(ctx.destination);
    [880, 660].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(ctx.currentTime + index * 0.09);
      osc.stop(ctx.currentTime + index * 0.09 + 0.08);
    });
  }
}

function drawWaveform() {
  const canvas = ui.canvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const left = 170;
  const right = 24;
  const top = 28;
  const plotWidth = width - left - right;
  const data = currentData();
  const sampleStepNs = Math.max(1, data.duration_ns / 900);
  const lanes = state.mode === "microfluidic"
    ? [
        ["safety_trip", "safety_trip", "#ff5f57"],
        ["cusum_alarm", "cusum_alarm", "#f5c451"],
        ["cusum_score", "cusum_score", "#f78c6c"],
        ["pwm_enable", "pwm_enable", "#49e39a"],
      ]
    : [
        ["knock_alert", "knock_alert", "#ff5f57"],
        ["correction_valid", "correction_valid", "#49e39a"],
        ["predict_valid", "predict_valid", "#b89cff"],
        ["predictive_trim", "predictive_trim", "#f5c451"],
      ];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#08131e";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#1d3043";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = left + plotWidth * i / 10;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, height - top);
    ctx.stroke();
  }

  lanes.forEach(([key, label, color], laneIndex) => {
    const y = top + laneIndex * 96;
    const baseline = y + 54;
    ctx.fillStyle = "#c8d3f5";
    ctx.font = "18px Consolas, monospace";
    ctx.fillText(label, 18, y + 44);
    ctx.strokeStyle = "#3a5168";
    ctx.beginPath();
    ctx.moveTo(left, baseline);
    ctx.lineTo(width - right, baseline);
    ctx.stroke();

    const stream = data.streams[key];
    const maxValue = key === "cusum_score"
      ? Math.max(1, ...stream.map(([, value]) => value))
      : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let previousValue = stream[0]?.[1] ?? 0;
    let previousX = left;
    for (let sample = 0; sample <= 900; sample += 1) {
      const timeNs = sample * sampleStepNs;
      const value = valueAt(stream, timeNs);
      const x = left + plotWidth * sample / 900;
      const high = key === "cusum_score"
        ? y + 54 - 50 * (value / maxValue)
        : (value ? y + 16 : baseline);
      if (sample === 0) {
        ctx.moveTo(x, high);
      } else {
        const oldHigh = key === "cusum_score"
          ? y + 54 - 50 * (previousValue / maxValue)
          : (previousValue ? y + 16 : baseline);
        ctx.lineTo(x, oldHigh);
        ctx.lineTo(x, high);
      }
      previousValue = value;
      previousX = x;
    }
    ctx.stroke();
  });

  const playheadX = left + plotWidth * state.position;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, top - 8);
  ctx.lineTo(playheadX, height - top + 8);
  ctx.stroke();
}

function updateFrame(position) {
  if (state.mode === "noise") return;
  state.position = Math.max(0, Math.min(1, position));
  const data = currentData();
  const timeNs = state.position * data.duration_ns;
  ui.timeReadout.textContent = formatTimeNs(timeNs);
  ui.durationLabel.textContent = formatTimeNs(data.duration_ns);
  ui.scrubber.value = String(Math.round(state.position * 1000));
  updateBars();
  updateEvents();
  updateSafety();
  drawWaveform();
}

function animationLoop(timestamp) {
  if (!state.playing) return;
  const elapsed = timestamp - state.startTimestamp;
  const nextPosition = state.startPosition + elapsed / state.playbackMs;
  if (nextPosition >= 1) {
    updateFrame(1);
    state.playing = false;
    ui.playButton.textContent = "重播";
    ui.statusDot.className = "status-dot";
    ui.runStateLabel.textContent = "COMPLETE / 数字样机演示完成";
    return;
  }
  updateFrame(nextPosition);
  state.animationFrame = requestAnimationFrame(animationLoop);
}

function startOrPause() {
  if (state.mode === "noise") {
    ui.runStateLabel.textContent = "NOISE LAB / 参数在噪声模块内调整";
    return;
  }
  if (state.playing) {
    state.playing = false;
    cancelAnimationFrame(state.animationFrame);
    ui.playButton.textContent = "继续";
    ui.statusDot.className = "status-dot";
    ui.runStateLabel.textContent = "PAUSED / 已暂停";
    return;
  }

  if (!state.audioReady) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      state.audioContext = new AudioContextClass();
      state.audioReady = true;
    }
  }

  if (state.position >= 1) state.position = 0;
  state.playing = true;
  state.startTimestamp = performance.now();
  state.startPosition = state.position;
  ui.playButton.textContent = "暂停";
  ui.statusDot.className = "status-dot running";
  ui.runStateLabel.textContent = "RUNNING / 正在回放真实 VCD 证据";
  state.animationFrame = requestAnimationFrame(animationLoop);
}

ui.playButton.addEventListener("click", startOrPause);
ui.resetButton.addEventListener("click", () => {
  state.playing = false;
  cancelAnimationFrame(state.animationFrame);
  ui.playButton.textContent = "运行演示";
  ui.statusDot.className = "status-dot";
  ui.runStateLabel.textContent = "READY / 数字样机待运行";
  updateFrame(0);
});
ui.modeMicro.addEventListener("click", () => setMode("microfluidic"));
ui.modeIce.addEventListener("click", () => setMode("ice"));
ui.modeNoise.addEventListener("click", () => setMode("noise"));
ui.scrubber.addEventListener("input", (event) => {
  state.playing = false;
  cancelAnimationFrame(state.animationFrame);
  ui.playButton.textContent = "继续";
  updateFrame(Number(event.target.value) / 1000);
});

window.addEventListener("resize", () => {
  const ratio = ui.canvas.width / ui.canvas.height;
  const cssHeight = ui.canvas.clientHeight;
  const cssWidth = ui.canvas.clientWidth;
  ui.canvas.width = Math.max(900, Math.round(cssWidth * window.devicePixelRatio));
  ui.canvas.height = Math.max(300, Math.round(cssHeight * window.devicePixelRatio));
  drawWaveform();
});

setMode("microfluidic");
