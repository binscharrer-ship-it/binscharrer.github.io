const STORAGE_KEY = "star-pda-field-terminal-v1";

const routeCatalog = {
  "T-01": [[0.13, 0.74], [0.29, 0.62], [0.43, 0.65], [0.58, 0.47], [0.76, 0.34]],
  "T-02": [[0.18, 0.68], [0.31, 0.48], [0.51, 0.43], [0.65, 0.26], [0.83, 0.2]],
  "T-03": [[0.2, 0.3], [0.38, 0.36], [0.55, 0.52], [0.72, 0.61], [0.85, 0.78]],
  "T-04": [[0.15, 0.46], [0.34, 0.4], [0.52, 0.46], [0.69, 0.65], [0.86, 0.69]]
};

const defaultState = {
  activeView: "dashboard",
  online: false,
  selectedTaskId: "T-02",
  syncQueue: 12,
  syncSizeMb: 86.4,
  lastSync: "09:12",
  mapLayer: 0,
  waypointMode: false,
  mapWaypoints: [],
  tasks: [
    {
      id: "T-01",
      title: "北口地质断面复核",
      description: "沿北口断面完成 5 个采样点记录，采集岩层照片和现场说明。",
      location: "N31.7131 / E118.4790",
      time: "09:30",
      distance: "2.4 km",
      capture: "照片 / 录音 / 点位",
      priority: "高优先级",
      priorityClass: "high",
      status: "complete",
      progress: 100
    },
    {
      id: "T-02",
      title: "东沟水源点取证",
      description: "抵达东沟水源点，完成定位、录音与近景照片记录，标记现场风险。",
      location: "N31.7124 / E118.4821",
      time: "10:30",
      distance: "1.8 km",
      capture: "照片 / 录音 / 航点",
      priority: "高优先级",
      priorityClass: "high",
      status: "active",
      progress: 55
    },
    {
      id: "T-03",
      title: "南坡设备巡检",
      description: "检查南坡数据采集箱、供电模块和天线固定状态。",
      location: "N31.7068 / E118.4916",
      time: "13:20",
      distance: "3.1 km",
      capture: "照片 / 文字记录",
      priority: "普通",
      priorityClass: "normal",
      status: "pending",
      progress: 0
    },
    {
      id: "T-04",
      title: "西侧撤离路线踏勘",
      description: "踏勘西侧备用撤离路线，记录道路宽度、坡度和通信盲区。",
      location: "N31.7082 / E118.4742",
      time: "15:40",
      distance: "4.6 km",
      capture: "航点 / 录音",
      priority: "普通",
      priorityClass: "normal",
      status: "pending",
      progress: 0
    }
  ],
  records: [
    {
      id: "E-104",
      type: "audio",
      title: "断层裂隙环境录音",
      time: "09:42:16",
      location: "N31.7128 E118.4806",
      hash: "a8c19f03d62b"
    },
    {
      id: "E-103",
      type: "photo",
      title: "北口岩层近景",
      time: "09:38:05",
      location: "N31.7126 E118.4802",
      hash: "62ba7e31fd90"
    },
    {
      id: "E-102",
      type: "point",
      title: "WP-02 作业点打卡",
      time: "09:31:48",
      location: "N31.7121 E118.4794",
      hash: "0fc4a8d923e8"
    },
    {
      id: "E-101",
      type: "note",
      title: "北口道路状态说明",
      time: "09:24:10",
      location: "N31.7118 E118.4779",
      hash: "91dd3e09ca74"
    }
  ],
  syncLogs: [
    { time: "09:12", title: "批根签名验证通过", detail: "服务器回执 #TX-9218" },
    { time: "09:08", title: "断点续传完成", detail: "64 KiB / 1,384 块" },
    { time: "08:52", title: "网络中断，切换本地队列", detail: "原始记录继续写入" }
  ]
};

const layerNames = ["地形图 / MJ-07", "路网图 / RD-03", "坡度图 / SL-11"];
let state = loadState();
let toastTimer = null;
let audioTimer = null;
let audioSeconds = 0;
let sessionSeconds = 0;
let syncTimer = null;
let healthRunTimer = null;
let canvasMetrics = null;
let mapNeedsResize = true;

const elements = {
  clock: document.querySelector("#clock"),
  networkToggle: document.querySelector("#network-toggle"),
  networkLabel: document.querySelector("#network-label"),
  queueBadge: document.querySelector("#queue-badge"),
  taskList: document.querySelector("#task-list"),
  taskCode: document.querySelector("#task-code"),
  taskDetailTitle: document.querySelector("#task-detail-title"),
  taskPriority: document.querySelector("#task-priority"),
  detailTaskTitle: document.querySelector("#detail-task-title"),
  detailTaskDescription: document.querySelector("#detail-task-description"),
  detailLocation: document.querySelector("#detail-location"),
  detailTime: document.querySelector("#detail-time"),
  detailDistance: document.querySelector("#detail-distance"),
  detailCapture: document.querySelector("#detail-capture"),
  detailProgressLabel: document.querySelector("#detail-progress-label"),
  detailProgressBar: document.querySelector("#detail-progress-bar"),
  detailProgressTrack: document.querySelector(".task-detail-panel .progress-track"),
  metricPending: document.querySelector("#metric-pending"),
  metricActive: document.querySelector("#metric-active"),
  metricRecords: document.querySelector("#metric-records"),
  metricQueue: document.querySelector("#metric-queue"),
  openTaskMap: document.querySelector("#open-task-map"),
  taskMainAction: document.querySelector("#task-main-action"),
  newTask: document.querySelector("#new-task"),
  mapCanvas: document.querySelector("#map-canvas"),
  mapCoordinate: document.querySelector("#map-coordinate"),
  mapAccuracy: document.querySelector("#map-accuracy"),
  mapHeading: document.querySelector("#map-heading"),
  mapLayerLabel: document.querySelector("#map-layer-label"),
  mapLocate: document.querySelector("#map-locate"),
  mapWaypoint: document.querySelector("#map-waypoint"),
  mapLayer: document.querySelector("#map-layer"),
  mapClear: document.querySelector("#map-clear"),
  nextWaypoint: document.querySelector("#next-waypoint"),
  captureAudio: document.querySelector("#capture-audio"),
  capturePhoto: document.querySelector("#capture-photo"),
  captureNote: document.querySelector("#capture-note"),
  audioState: document.querySelector("#audio-state"),
  recordClock: document.querySelector("#record-clock"),
  recordTimer: document.querySelector("#record-timer"),
  recordList: document.querySelector("#record-list"),
  recordCountLabel: document.querySelector("#record-count-label"),
  chainRoot: document.querySelector("#chain-root"),
  chainTip: document.querySelector("#chain-tip"),
  chainTrack: document.querySelector("#chain-track"),
  exportEvidence: document.querySelector("#export-evidence"),
  startSync: document.querySelector("#start-sync"),
  syncConnection: document.querySelector("#sync-connection"),
  syncConnectionNote: document.querySelector("#sync-connection-note"),
  syncPending: document.querySelector("#sync-pending"),
  syncSize: document.querySelector("#sync-size"),
  lastSync: document.querySelector("#last-sync"),
  syncProgressLabel: document.querySelector("#sync-progress-label"),
  syncProgressBar: document.querySelector("#sync-progress-bar"),
  syncProgressTrack: document.querySelector(".sync-queue-panel .progress-track"),
  syncLog: document.querySelector("#sync-log"),
  deviceTest: document.querySelector("#device-test"),
  lastSelfTest: document.querySelector("#last-self-test"),
  noteDialog: document.querySelector("#note-dialog"),
  noteContent: document.querySelector("#note-content"),
  saveNote: document.querySelector("#save-note"),
  toast: document.querySelector("#toast")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      return structuredClone(defaultState);
    }
    return {
      ...structuredClone(defaultState),
      ...saved,
      tasks: Array.isArray(saved.tasks) ? saved.tasks : structuredClone(defaultState.tasks),
      records: Array.isArray(saved.records) ? saved.records : structuredClone(defaultState.records),
      syncLogs: Array.isArray(saved.syncLogs) ? saved.syncLogs : structuredClone(defaultState.syncLogs),
      mapWaypoints: Array.isArray(saved.mapWaypoints) ? saved.mapWaypoints : []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function selectedTask() {
  return state.tasks.find((task) => task.id === state.selectedTaskId) || state.tasks[0];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2300);
}

function currentTime(includeSeconds = true) {
  const now = new Date();
  return now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined
  });
}

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function statusLabel(status) {
  return { pending: "待执行", active: "进行中", complete: "已完成" }[status] || status;
}

function statusAction(status) {
  return { pending: "开始", active: "完成", complete: "记录" }[status] || "查看";
}

function recordIcon(type) {
  const icons = {
    audio: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>',
    photo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l1.5-2h5L16 7h4v13H4V7Z"/><circle cx="12" cy="13" r="4"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    point: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="10" r="2"/></svg>'
  };
  return icons[type] || icons.note;
}

function renderClock() {
  elements.clock.textContent = currentTime();
}

function renderNetwork() {
  elements.networkToggle.setAttribute("aria-pressed", String(state.online));
  elements.networkLabel.textContent = state.online ? "联网模式" : "离线模式";
  elements.syncConnection.textContent = state.online ? "在线" : "离线";
  elements.syncConnectionNote.textContent = state.online ? "可执行断点续传" : "本地队列继续工作";
  elements.startSync.disabled = state.syncQueue === 0;
}

function renderMetrics() {
  const pending = state.tasks.filter((task) => task.status === "pending").length;
  const active = state.tasks.filter((task) => task.status === "active").length;
  elements.metricPending.textContent = pending;
  elements.metricActive.textContent = active;
  elements.metricRecords.textContent = state.records.length;
  elements.metricQueue.textContent = state.syncQueue;
  elements.queueBadge.textContent = state.syncQueue;
  elements.queueBadge.hidden = state.syncQueue === 0;
}

function renderTasks() {
  elements.taskList.innerHTML = state.tasks.map((task) => `
    <article class="task-row ${task.status} ${task.id === state.selectedTaskId ? "selected" : ""}">
      <button class="task-main" type="button" data-task-id="${escapeHtml(task.id)}">
        <span class="task-state" aria-hidden="true"></span>
        <span>
          <strong>${escapeHtml(task.title)}</strong>
          <small>${escapeHtml(task.location)} · ${escapeHtml(task.distance)} · ${statusLabel(task.status)}</small>
        </span>
        <time>${escapeHtml(task.time)}</time>
      </button>
      <button class="task-row-action" type="button" data-task-action="${escapeHtml(task.id)}">${statusAction(task.status)}</button>
    </article>
  `).join("");
}

function renderTaskDetail() {
  const task = selectedTask();
  elements.taskCode.textContent = task.id;
  elements.detailTaskTitle.textContent = task.title;
  elements.detailTaskDescription.textContent = task.description;
  elements.detailLocation.textContent = task.location;
  elements.detailTime.textContent = task.time;
  elements.detailDistance.textContent = task.distance;
  elements.detailCapture.textContent = task.capture;
  elements.taskPriority.textContent = task.priority;
  elements.taskPriority.style.background = task.priorityClass === "high" ? "var(--danger-soft)" : "var(--teal-soft)";
  elements.taskPriority.style.color = task.priorityClass === "high" ? "#f09289" : "#69c8c2";
  elements.detailProgressLabel.textContent = `${task.progress}%`;
  elements.detailProgressBar.style.width = `${task.progress}%`;
  elements.detailProgressTrack.setAttribute("aria-valuenow", String(task.progress));

  if (task.status === "complete") {
    elements.taskMainAction.textContent = "查看记录";
  } else if (task.status === "active") {
    elements.taskMainAction.textContent = "完成任务";
  } else {
    elements.taskMainAction.textContent = "开始任务";
  }
}

function renderRecords() {
  elements.recordList.innerHTML = state.records.map((record) => `
    <article class="record-item">
      <span class="record-type ${escapeHtml(record.type)}">${recordIcon(record.type)}</span>
      <span>
        <strong>${escapeHtml(record.title)}</strong>
        <small>${escapeHtml(record.time)} · ${escapeHtml(record.location)}</small>
      </span>
      <span class="record-meta">
        ${escapeHtml(record.id)}
        <code>${escapeHtml(record.hash)}</code>
      </span>
    </article>
  `).join("");
  elements.recordCountLabel.textContent = `${state.records.length} 条`;

  const recent = state.records.slice(0, 6).reverse();
  elements.chainTrack.innerHTML = recent.map((record, index) => `
    <span class="chain-block ${index === recent.length - 1 ? "current" : ""}">${escapeHtml(record.id)}</span>
  `).join("");
  elements.chainTip.textContent = `${state.records[0]?.hash || "000000000000"}...`;
  elements.chainRoot.textContent = `${state.records.at(-1)?.hash || "000000000000"}...`;
}

function renderSync() {
  elements.syncPending.textContent = state.syncQueue;
  elements.syncSize.textContent = `${state.syncSizeMb.toFixed(1)} MB`;
  elements.lastSync.textContent = state.lastSync;
  elements.syncLog.innerHTML = state.syncLogs.map((log) => `
    <div class="log-line">
      <time>${escapeHtml(log.time)}</time>
      <b>${escapeHtml(log.title)}</b>
      <span>${escapeHtml(log.detail)}</span>
    </div>
  `).join("");
  renderNetwork();
}

function renderMapLabels() {
  const task = selectedTask();
  elements.mapCoordinate.textContent = task.location.replace(" / ", " ");
  elements.mapAccuracy.textContent = task.status === "active" ? "2.1 m" : "2.7 m";
  elements.mapHeading.textContent = task.id === "T-02" ? "NE 042°" : "NW 318°";
  elements.mapLayerLabel.textContent = layerNames[state.mapLayer];
  elements.nextWaypoint.textContent = state.mapWaypoints.length
    ? `自定义 ${state.mapWaypoints.length} 个 / 点击地图继续添加`
    : "WP-03 / 1.1 km / 预计 18 分钟";
}

function renderAll() {
  renderClock();
  renderMetrics();
  renderTasks();
  renderTaskDetail();
  renderRecords();
  renderSync();
  renderMapLabels();
  saveState();
}

function showView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll(".view").forEach((view) => {
    const active = view.id === `view-${viewName}`;
    view.hidden = !active;
    view.classList.toggle("active", active);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("active", active);
    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  if (viewName === "map") {
    mapNeedsResize = true;
    requestAnimationFrame(resizeMapCanvas);
  }
  saveState();
}

function updateTask(taskId, action) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (action === "select") {
    state.selectedTaskId = taskId;
  } else if (task.status === "pending") {
    task.status = "active";
    task.progress = 15;
    pushLog("任务开始", `${task.id} / ${task.title}`);
    showToast(`${task.title} 已开始`);
  } else if (task.status === "active") {
    task.status = "complete";
    task.progress = 100;
    state.syncQueue += 1;
    state.syncSizeMb += 1.8;
    addRecord("point", `${task.id} 任务完成打卡`, task.location);
    pushLog("任务完成", `${task.id} / 已写入本地证据队列`);
    showToast(`${task.title} 已完成`);
  } else {
    showView("records");
    return;
  }

  renderAll();
}

function pushLog(title, detail) {
  state.syncLogs.unshift({ time: currentTime(false), title, detail });
  state.syncLogs = state.syncLogs.slice(0, 12);
}

async function hashText(value) {
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .slice(0, 6)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(16).padStart(12, "0").slice(0, 12);
}

async function addRecord(type, title, location = selectedTask().location.replace(" / ", " ")) {
  const sequence = Math.max(...state.records.map((record) => Number(record.id.replace(/\D/g, "")) || 0), 100) + 1;
  const id = `E-${sequence}`;
  const time = currentTime();
  const payload = `${id}|${type}|${title}|${time}|${location}|${state.records[0]?.hash || "genesis"}`;
  const hash = await hashText(payload);
  state.records.unshift({ id, type, title, time, location, hash });
  state.syncQueue += 1;
  state.syncSizeMb += type === "photo" ? 2.2 : type === "audio" ? 3.6 : 0.4;
  renderAll();
}

function buildRoutePoints() {
  const base = routeCatalog[state.selectedTaskId] || routeCatalog["T-02"];
  return [...base, ...state.mapWaypoints];
}

function resizeMapCanvas() {
  const canvas = elements.mapCanvas;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const nextWidth = Math.round(rect.width * dpr);
  const nextHeight = Math.round(rect.height * dpr);
  if (canvas.width !== nextWidth || canvas.height !== nextHeight || mapNeedsResize) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    canvasMetrics = { width: rect.width, height: rect.height, dpr };
    mapNeedsResize = false;
  }
  drawMap();
}

function canvasPoint(point, width, height) {
  return {
    x: 34 + point[0] * (width - 68),
    y: 28 + point[1] * (height - 70)
  };
}

function drawMap() {
  const canvas = elements.mapCanvas;
  const context = canvas.getContext("2d");
  if (!canvasMetrics) return;
  const { width, height, dpr } = canvasMetrics;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const baseColor = ["#242b22", "#202722", "#292a21"][state.mapLayer];
  const lineColor = ["#3b4639", "#475146", "#514c38"][state.mapLayer];
  context.fillStyle = baseColor;
  context.fillRect(0, 0, width, height);

  context.save();
  context.strokeStyle = lineColor;
  context.lineWidth = 1;
  for (let row = 0; row < 10; row += 1) {
    context.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const y = 35 + row * ((height - 70) / 9) + Math.sin(x / 70 + row * 0.75) * (8 + row % 3);
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
  context.restore();

  context.save();
  context.strokeStyle = state.mapLayer === 1 ? "#756b4c" : "#465347";
  context.lineWidth = state.mapLayer === 1 ? 7 : 4;
  context.globalAlpha = 0.72;
  context.beginPath();
  context.moveTo(-20, height * 0.78);
  context.bezierCurveTo(width * 0.2, height * 0.68, width * 0.35, height * 0.82, width * 0.58, height * 0.63);
  context.bezierCurveTo(width * 0.75, height * 0.49, width * 0.82, height * 0.54, width + 20, height * 0.31);
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = "#378b8a";
  context.lineWidth = 5;
  context.globalAlpha = 0.72;
  context.beginPath();
  context.moveTo(width * 0.03, height * 0.22);
  context.bezierCurveTo(width * 0.22, height * 0.3, width * 0.1, height * 0.51, width * 0.3, height * 0.59);
  context.bezierCurveTo(width * 0.42, height * 0.64, width * 0.45, height * 0.43, width * 0.62, height * 0.52);
  context.stroke();
  context.restore();

  const route = buildRoutePoints();
  if (route.length > 1) {
    context.save();
    context.strokeStyle = "#e1a13b";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    route.forEach((point, index) => {
      const mapped = canvasPoint(point, width, height);
      if (index === 0) context.moveTo(mapped.x, mapped.y);
      else context.lineTo(mapped.x, mapped.y);
    });
    context.stroke();
    context.restore();
  }

  const history = routeCatalog["T-01"];
  context.save();
  context.strokeStyle = "#48aaa4";
  context.lineWidth = 3;
  context.setLineDash([7, 7]);
  context.lineCap = "round";
  context.beginPath();
  history.forEach((point, index) => {
    const mapped = canvasPoint([point[0], point[1] + 0.1], width, height);
    if (index === 0) context.moveTo(mapped.x, mapped.y);
    else context.lineTo(mapped.x, mapped.y);
  });
  context.stroke();
  context.restore();

  route.slice(0, 4).forEach((point, index) => {
    const mapped = canvasPoint(point, width, height);
    context.fillStyle = index === 3 ? "#d96960" : "#f2f5ef";
    context.beginPath();
    context.arc(mapped.x, mapped.y, index === 3 ? 8 : 6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#141814";
    context.font = "700 10px Segoe UI";
    context.textAlign = "center";
    context.fillText(index === 3 ? "!" : String(index + 1), mapped.x, mapped.y + 3);
  });

  state.mapWaypoints.forEach((point, index) => {
    const mapped = canvasPoint(point, width, height);
    context.fillStyle = "#e1a13b";
    context.beginPath();
    context.arc(mapped.x, mapped.y, 7, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#141814";
    context.font = "700 9px Segoe UI";
    context.textAlign = "center";
    context.fillText(`W${index + 1}`, mapped.x, mapped.y + 3);
  });

  const current = canvasPoint(route[Math.min(2, route.length - 1)], width, height);
  context.save();
  context.fillStyle = "rgba(72, 170, 164, 0.18)";
  context.beginPath();
  context.arc(current.x, current.y, 22, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#48aaa4";
  context.beginPath();
  context.arc(current.x, current.y, 9, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.stroke();
  context.restore();

  context.fillStyle = "rgba(242, 245, 239, 0.72)";
  context.font = "600 11px Segoe UI";
  context.textAlign = "left";
  context.fillText("MJ-07 / 22.4 km²", 18, height - 18);
  context.textAlign = "right";
  context.fillText("离线图层", width - 18, height - 18);
}

function toggleWaypointMode() {
  state.waypointMode = !state.waypointMode;
  elements.mapWaypoint.setAttribute("aria-pressed", String(state.waypointMode));
  elements.mapCanvas.style.cursor = state.waypointMode ? "crosshair" : "default";
  showToast(state.waypointMode ? "点击地图添加自定义航点" : "已退出航点模式");
}

function addWaypointFromEvent(event) {
  if (!state.waypointMode) return;
  const rect = elements.mapCanvas.getBoundingClientRect();
  const normalizedX = Math.min(0.96, Math.max(0.04, (event.clientX - rect.left - 34) / (rect.width - 68)));
  const normalizedY = Math.min(0.93, Math.max(0.07, (event.clientY - rect.top - 28) / (rect.height - 70)));
  state.mapWaypoints.push([normalizedX, normalizedY]);
  renderMapLabels();
  drawMap();
  saveState();

  const location = `N31.${Math.round(6900 + normalizedY * 280)} E118.${Math.round(4600 + normalizedX * 420)}`;
  addRecord("point", `自定义航点 W${state.mapWaypoints.length}`, location);
  showToast(`航点 W${state.mapWaypoints.length} 已保存`);
}

function startAudioRecording() {
  if (audioSeconds > 0) {
    stopAudioRecording();
    return;
  }

  audioSeconds = 1;
  elements.captureAudio.classList.add("recording");
  elements.audioState.textContent = "正在录音";
  elements.recordClock.classList.add("recording");
  elements.recordTimer.textContent = formatTimer(audioSeconds);
  showToast("现场录音已开始");

  audioTimer = setInterval(() => {
    audioSeconds += 1;
    elements.recordTimer.textContent = formatTimer(audioSeconds);
  }, 1000);
}

function stopAudioRecording() {
  clearInterval(audioTimer);
  audioTimer = null;
  const duration = formatTimer(audioSeconds);
  audioSeconds = 0;
  elements.captureAudio.classList.remove("recording");
  elements.audioState.textContent = "16 kHz / 单声道";
  elements.recordClock.classList.remove("recording");
  elements.recordTimer.textContent = formatTimer(sessionSeconds);
  addRecord("audio", `现场录音 ${duration}`, selectedTask().location.replace(" / ", " "));
  pushLog("录音写盘完成", `AES-GCM 分块写入 / ${duration}`);
  showToast("录音已写入证据链");
}

function openNoteDialog() {
  elements.noteContent.value = "";
  if (typeof elements.noteDialog.showModal === "function") {
    elements.noteDialog.showModal();
  } else {
    elements.noteDialog.setAttribute("open", "");
  }
  setTimeout(() => elements.noteContent.focus(), 50);
}

function saveNote() {
  const text = elements.noteContent.value.trim();
  if (!text) {
    showToast("请输入现场说明");
    return;
  }
  addRecord("note", text.slice(0, 34), selectedTask().location.replace(" / ", " "));
  pushLog("文字记录已保存", `本地记录 / ${text.length} 字`);
  showToast("文字记录已保存");
}

function exportEvidence() {
  const payload = {
    packageId: `EV-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    device: "Star PDA / PDA-OS 1.0.0-rc3",
    task: selectedTask(),
    records: state.records,
    queue: {
      pending: state.syncQueue,
      sizeMb: Number(state.syncSizeMb.toFixed(1))
    },
    chainRoot: state.records.at(-1)?.hash || null,
    chainTip: state.records[0]?.hash || null
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `star-pda-evidence-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("证据包已导出");
}

function startSync() {
  if (!state.online) {
    showToast("当前为离线模式，先切换联网");
    return;
  }
  if (state.syncQueue === 0 || syncTimer) return;

  const initialCount = state.syncQueue;
  const initialSize = state.syncSizeMb;
  let progress = 0;
  elements.startSync.disabled = true;
  elements.syncProgressLabel.textContent = "正在上传";
  pushLog("同步任务启动", `${initialCount} 条 / ${initialSize.toFixed(1)} MB`);
  renderSync();

  syncTimer = setInterval(() => {
    progress = Math.min(100, progress + 8 + Math.random() * 8);
    const pending = Math.max(0, Math.round(initialCount * (1 - progress / 100)));
    state.syncQueue = pending;
    state.syncSizeMb = Math.max(0, Number((initialSize * (1 - progress / 100)).toFixed(1)));
    elements.syncProgressBar.style.width = `${progress}%`;
    elements.syncProgressTrack.setAttribute("aria-valuenow", String(Math.round(progress)));
    elements.syncProgressLabel.textContent = `${Math.round(progress)}% / ${pending} 条`;
    elements.syncPending.textContent = pending;
    elements.syncSize.textContent = `${state.syncSizeMb.toFixed(1)} MB`;
    elements.queueBadge.textContent = pending;
    elements.metricQueue.textContent = pending;

    if (progress >= 100) {
      clearInterval(syncTimer);
      syncTimer = null;
      state.syncQueue = 0;
      state.syncSizeMb = 0;
      state.lastSync = currentTime(false);
      elements.syncProgressLabel.textContent = "同步完成";
      elements.lastSync.textContent = state.lastSync;
      elements.startSync.disabled = true;
      pushLog("服务器回执验签通过", `${initialCount} 条记录已确认`);
      renderAll();
      showToast("队列同步完成，服务器回执已验签");
    }
  }, 180);
}

function toggleNetwork() {
  state.online = !state.online;
  pushLog(state.online ? "已连接专网" : "网络中断", state.online ? "启用断点续传" : "切换本地证据队列");
  renderSync();
  saveState();
  showToast(state.online ? "已切换联网模式" : "已切换离线模式");
}

function runDeviceTest() {
  if (healthRunTimer) return;
  elements.deviceTest.disabled = true;
  elements.deviceTest.textContent = "自检中 0%";
  let progress = 0;

  healthRunTimer = setInterval(() => {
    progress += 12;
    elements.deviceTest.textContent = `自检中 ${Math.min(progress, 100)}%`;
    if (progress >= 100) {
      clearInterval(healthRunTimer);
      healthRunTimer = null;
      elements.deviceTest.disabled = false;
      elements.deviceTest.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="5"/><path d="m9.5 12 1.7 1.7 3.5-3.7"/></svg>
        运行自检
      `;
      elements.lastSelfTest.textContent = `今天 ${currentTime(false)}`;
      pushLog("设备自检通过", "GNSS / PPS / IMU / SD / 安全元件");
      renderSync();
      showToast("设备自检完成，模块状态正常");
    }
  }, 110);
}

function initEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  elements.taskList.addEventListener("click", (event) => {
    const main = event.target.closest("[data-task-id]");
    const action = event.target.closest("[data-task-action]");
    if (main) updateTask(main.dataset.taskId, "select");
    if (action) updateTask(action.dataset.taskAction, "action");
  });

  elements.openTaskMap.addEventListener("click", () => showView("map"));
  elements.taskMainAction.addEventListener("click", () => updateTask(selectedTask().id, "action"));
  elements.newTask.addEventListener("click", () => {
    const sequence = state.tasks.length + 1;
    const task = {
      id: `T-${String(sequence).padStart(2, "0")}`,
      title: `新增现场任务 ${sequence}`,
      description: "离线创建的任务，可在地图中分配航点并记录现场证据。",
      location: "N31.7096 / E118.4812",
      time: currentTime(false),
      distance: "1.0 km",
      capture: "照片 / 录音 / 点位",
      priority: "普通",
      priorityClass: "normal",
      status: "pending",
      progress: 0
    };
    state.tasks.push(task);
    state.selectedTaskId = task.id;
    renderAll();
    showToast("已创建本地任务");
  });

  elements.mapLocate.addEventListener("click", () => {
    mapNeedsResize = true;
    resizeMapCanvas();
    showToast("定位已更新，路线保持在屏幕范围内");
  });
  elements.mapWaypoint.addEventListener("click", toggleWaypointMode);
  elements.mapLayer.addEventListener("click", () => {
    state.mapLayer = (state.mapLayer + 1) % layerNames.length;
    renderMapLabels();
    drawMap();
    saveState();
    showToast(`已切换 ${layerNames[state.mapLayer]}`);
  });
  elements.mapClear.addEventListener("click", () => {
    state.mapWaypoints = [];
    renderMapLabels();
    drawMap();
    saveState();
    showToast("自定义航点已清除");
  });
  elements.mapCanvas.addEventListener("click", addWaypointFromEvent);
  new ResizeObserver(resizeMapCanvas).observe(elements.mapCanvas);

  elements.captureAudio.addEventListener("click", startAudioRecording);
  elements.capturePhoto.addEventListener("click", () => {
    addRecord("photo", `现场照片 P-${state.records.length + 1}`, selectedTask().location.replace(" / ", " "));
    pushLog("照片已写入", "JPEG / 2.2 MB / 地理位置已绑定");
    showToast("照片已写入证据链");
  });
  elements.captureNote.addEventListener("click", openNoteDialog);
  elements.saveNote.addEventListener("click", (event) => {
    event.preventDefault();
    saveNote();
    elements.noteDialog.close();
  });
  elements.exportEvidence.addEventListener("click", exportEvidence);
  elements.startSync.addEventListener("click", startSync);
  elements.networkToggle.addEventListener("click", toggleNetwork);
  elements.deviceTest.addEventListener("click", runDeviceTest);
}

function init() {
  initEvents();
  showView(state.activeView);
  renderAll();
  renderClock();
  setInterval(() => {
    renderClock();
    sessionSeconds += 1;
    if (!audioSeconds) {
      elements.recordTimer.textContent = formatTimer(sessionSeconds);
    }
  }, 1000);
  requestAnimationFrame(resizeMapCanvas);
}

init();
