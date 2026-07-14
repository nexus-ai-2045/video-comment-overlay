const sampleData = {
  schema: "video_comment_overlay.v1",
  source: { type: "sample" },
  timeline: { videoStartAt: "2026-01-01T00:00:00+09:00", commentTimeMode: "absolute" },
  participants: {
    sample1: { name: "参加者A", color: "#2f80ed", avatarUrl: "" },
    sample2: { name: "参加者B", color: "#27ae60", avatarUrl: "" },
    sample3: { name: "参加者C", color: "#f2994a", avatarUrl: "" }
  },
  comments: [
    { id: "s1", authorId: "sample1", authorName: "参加者A", time: 1, text: "コメントを動画の上に重ねるテストです。" },
    { id: "s2", authorId: "sample2", authorName: "参加者B", time: 4, text: "吹き出し表示、けっこう見やすい。" },
    { id: "s3", authorId: "sample3", authorName: "参加者C", time: 8, text: "ニコ動風に流すのもありですね。" }
  ]
};

const els = {
  youtubeUrl: document.querySelector("#youtubeUrl"),
  loadYoutube: document.querySelector("#loadYoutube"),
  discordUrl: document.querySelector("#discordUrl"),
  videoStartAt: document.querySelector("#videoStartAt"),
  videoFile: document.querySelector("#videoFile"),
  commentFile: document.querySelector("#commentFile"),
  ndjsonFile: document.querySelector("#ndjsonFile"),
  mode: document.querySelector("#mode"),
  designPreset: document.querySelector("#designPreset"),
  listLayout: document.querySelector("#listLayout"),
  commentPosition: document.querySelector("#commentPosition"),
  theme: document.querySelector("#theme"),
  offset: document.querySelector("#offset"),
  duration: document.querySelector("#duration"),
  lanes: document.querySelector("#lanes"),
  fontSize: document.querySelector("#fontSize"),
  bubbleWidth: document.querySelector("#bubbleWidth"),
  maxVisible: document.querySelector("#maxVisible"),
  showAvatars: document.querySelector("#showAvatars"),
  presetSelect: document.querySelector("#presetSelect"),
  presetName: document.querySelector("#presetName"),
  savePreset: document.querySelector("#savePreset"),
  exportPreset: document.querySelector("#exportPreset"),
  presetImport: document.querySelector("#presetImport"),
  toggleSettings: document.querySelector("#toggleSettings"),
  closeSettings: document.querySelector("#closeSettings"),
  playPause: document.querySelector("#playPause"),
  restart: document.querySelector("#restart"),
  seekBar: document.querySelector("#seekBar"),
  clock: document.querySelector("#clock"),
  timeReadout: document.querySelector("#timeReadout"),
  status: document.querySelector("#status"),
  versionBadge: document.querySelector("#versionBadge"),
  videoHost: document.querySelector("#videoHost"),
  localVideo: document.querySelector("#localVideo"),
  youtubeFrame: document.querySelector("#youtubeFrame"),
  overlay: document.querySelector("#overlay"),
  timelineDrawer: document.querySelector("#timelineDrawer"),
  appShell: document.querySelector(".app-shell"),
  commentPanel: document.querySelector(".comment-panel"),
  commentCount: document.querySelector("#commentCount"),
  commentList: document.querySelector("#commentList"),
  commentEditor: document.querySelector("#commentEditor"),
  editorTitle: document.querySelector("#editorTitle"),
  editTime: document.querySelector("#editTime"),
  editAuthor: document.querySelector("#editAuthor"),
  editText: document.querySelector("#editText"),
  editHidden: document.querySelector("#editHidden"),
  clearCommentEdit: document.querySelector("#clearCommentEdit")
};

const builtinPresets = {
  "line-soft": {
    designPreset: "line",
    mode: "bubble",
    commentPosition: "left",
    theme: "soft",
    fontSize: 15,
    bubbleWidth: 520,
    duration: 7,
    lanes: 5,
    maxVisible: 8,
    showAvatars: true
  },
  "niconico-bold": {
    designPreset: "niconico",
    mode: "danmaku",
    commentPosition: "auto",
    theme: "dark",
    fontSize: 30,
    bubbleWidth: 900,
    duration: 8,
    lanes: 8,
    maxVisible: 18,
    showAvatars: false
  },
  "discord-compact": {
    designPreset: "discord",
    mode: "bubble",
    commentPosition: "left",
    theme: "dark",
    fontSize: 14,
    bubbleWidth: 580,
    duration: 6,
    lanes: 6,
    maxVisible: 10,
    showAvatars: true
  }
};

let commentData = normalizeData(sampleData);
let fired = new Set();
let timerStartedAt = 0;
let timerBase = 0;
let timerRunning = false;
let timerHandle = null;
let activeListId = "";
let seekingWithBar = false;
let selectedCommentId = "";
let youtubePlayer = null;
let youtubeReady = false;

function loadYoutubeApi() {
  if (window.YT?.Player) {
    initYoutubePlayer();
    return;
  }
  if (document.querySelector("script[data-youtube-api]")) return;
  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.dataset.youtubeApi = "true";
  document.head.appendChild(script);
}

window.onYouTubeIframeAPIReady = () => initYoutubePlayer();

function initYoutubePlayer() {
  if (!window.YT?.Player || youtubePlayer) return;
  youtubePlayer = new YT.Player("youtubeFrame", {
    events: {
      onReady: () => {
        youtubeReady = true;
        updateSeekUi(getCurrentTime());
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) setTimerRunning(true);
        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) setTimerRunning(false);
      }
    }
  });
}

function getFirstCommentTime() {
  return commentData.comments.length ? Number(commentData.comments[0].time || 0) : 0;
}

function getPreviewStartTime() {
  return Math.max(0, getFirstCommentTime() - 1);
}

function getTimelineEnd() {
  const localDuration = els.videoHost.classList.contains("has-local") ? Number(els.localVideo.duration) : Number.NaN;
  if (Number.isFinite(localDuration) && localDuration > 0) return localDuration;
  const ytDuration = youtubeReady && youtubePlayer?.getDuration ? Number(youtubePlayer.getDuration()) : Number.NaN;
  if (Number.isFinite(ytDuration) && ytDuration > 0) return ytDuration;
  const lastComment = commentData.comments.length ? commentData.comments[commentData.comments.length - 1].time : 0;
  return Math.max(1, lastComment + Number(els.duration.value || 7), getCurrentTime() + 1);
}

function getCurrentPresetSettings() {
  return {
    designPreset: els.designPreset.value,
    mode: els.mode.value,
    listLayout: els.listLayout.value,
    commentPosition: els.commentPosition.value,
    theme: els.theme.value,
    offset: Number(els.offset.value || 0),
    duration: Number(els.duration.value || 7),
    lanes: Number(els.lanes.value || 5),
    fontSize: Number(els.fontSize.value || 15),
    bubbleWidth: Number(els.bubbleWidth.value || 560),
    maxVisible: Number(els.maxVisible.value || 8),
    showAvatars: Boolean(els.showAvatars.checked)
  };
}

function applyPresetSettings(settings) {
  if (!settings) return;
  for (const [key, value] of Object.entries(settings)) {
    const control = els[key];
    if (!control) continue;
    if (control.type === "checkbox") control.checked = Boolean(value);
    else control.value = String(value);
  }
  setListLayout();
  applyDesignPreset(false);
  applyVisualSettings();
}

function applyVisualSettings() {
  els.appShell.dataset.theme = els.theme.value;
  els.appShell.dataset.showAvatars = els.showAvatars.checked ? "true" : "false";
  els.appShell.style.setProperty("--comment-font-size", `${Number(els.fontSize.value || 15)}px`);
  els.appShell.style.setProperty("--comment-max-width", `${Number(els.bubbleWidth.value || 560)}px`);
  updateSeekUi(getCurrentTime());
}

function localPresets() {
  try {
    return JSON.parse(localStorage.getItem("video-comment-overlay.presets") || "{}");
  } catch {
    return {};
  }
}

function writeLocalPresets(presets) {
  localStorage.setItem("video-comment-overlay.presets", JSON.stringify(presets));
}

function refreshPresetSelect() {
  const saved = localPresets();
  els.presetSelect.replaceChildren(
    ...Object.keys({ ...builtinPresets, ...saved }).map((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = saved[name] ? `${name}（保存済み）` : name;
      return option;
    })
  );
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function normalizeData(data) {
  const participants = data.participants || {};
  const videoStart = data.timeline?.videoStartAt ? Date.parse(data.timeline.videoStartAt) : null;
  const comments = (data.comments || []).map((comment, index) => {
    const participant = participants[comment.authorId] || {};
    const timestampTime =
      comment.timestamp && videoStart ? Math.max(0, (Date.parse(comment.timestamp) - videoStart) / 1000) : null;
    return {
      ...comment,
      id: String(comment.id || `comment-${index}`),
      authorName: comment.authorName || participant.name || "unknown",
      time: Number.isFinite(Number(comment.time)) ? Number(comment.time) : timestampTime || 0,
      color: comment.color || participant.color || colorFromString(comment.authorId || comment.authorName || `${index}`),
      avatarUrl: comment.avatarUrl || participant.avatarUrl || ""
    };
  });
  comments.sort((a, b) => a.time - b.time);
  return { ...data, comments };
}

function localDateTimeToIso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeDiscordMessage(message, index, videoStartMs) {
  const author = message.author || {};
  const timestamp = message.timestamp || "";
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;
  const stickerText = (message.sticker_items || []).map((item) => `［${item.name || "sticker"}］`).join(" ");
  const attachmentText = (message.attachments || []).map((item) => `［添付:${item.filename || item.content_type || "file"}］`).join(" ");
  return {
    id: String(message.id || `discord-${index}`),
    authorId: String(author.id || author.username || `author-${index}`),
    authorName: author.global_name || author.username || "unknown",
    avatarUrl: author.avatar && author.id ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.webp?size=64` : "",
    timestamp,
    time: Number.isFinite(timestampMs) && Number.isFinite(videoStartMs) ? Math.max(0, (timestampMs - videoStartMs) / 1000) : index,
    text: [message.content || "", stickerText, attachmentText].filter(Boolean).join(" "),
    kind: message.sticker_items?.length ? "sticker" : "message",
    emoji: [],
    stickers: message.sticker_items || [],
    attachments: message.attachments || []
  };
}

async function loadDiscordNdjson(file) {
  const text = await file.text();
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const videoStartIso = localDateTimeToIso(els.videoStartAt.value) || rows[0]?.timestamp || new Date().toISOString();
  const videoStartMs = Date.parse(videoStartIso);
  const comments = rows.map((row, index) => normalizeDiscordMessage(row, index, videoStartMs));
  const participants = {};
  for (const comment of comments) {
    if (!participants[comment.authorId]) {
      participants[comment.authorId] = {
        name: comment.authorName,
        avatarUrl: comment.avatarUrl,
        color: colorFromString(comment.authorId)
      };
    }
  }
  commentData = normalizeData({
    schema: "video_comment_overlay.v1",
    source: {
      type: "discord",
      url: els.discordUrl.value.trim(),
      importedFrom: file.name
    },
    timeline: {
      videoStartAt: videoStartIso,
      commentTimeMode: "absolute"
    },
    participants,
    comments
  });
  fired = new Set();
  els.overlay.replaceChildren();
  renderCommentList();
  renderTimelineDrawer();
  setStatus(`${file.name} をDiscord rawとして変換: ${commentData.comments.length}件`);
}

function colorFromString(value) {
  const palette = ["#2f80ed", "#27ae60", "#f2994a", "#9b51e0", "#eb5757", "#00a6a6", "#d946ef", "#6fcf97"];
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function extractYoutubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    if (parsed.pathname.includes("/embed/")) return parsed.pathname.split("/embed/")[1].split("/")[0];
    return parsed.searchParams.get("v");
  } catch {
    return "";
  }
}

function setStatus(message) {
  els.status.textContent = message;
}

function renderVersionBadge() {
  const version = window.VCO_VERSION;
  if (!version || !els.versionBadge) return;
  const suffix = version.dirty && !String(version.label).includes("dirty") ? " dirty" : "";
  els.versionBadge.textContent = `${version.label}${suffix}`;
  els.versionBadge.title = [
    `package: ${version.packageVersion}`,
    version.commit ? `commit: ${version.commit}` : "commit: none",
    `source: ${version.source}`
  ].join("\n");
}

function updateTransportLabel() {
  els.playPause.textContent = timerRunning ? "コメント停止" : "コメント再生";
}

function renderCommentList() {
  els.commentCount.textContent = `${commentData.comments.length}件`;
  els.commentList.replaceChildren(
    ...commentData.comments.map((comment) => {
      const row = document.createElement("article");
      row.className = "comment-row";
      row.dataset.commentId = comment.id;
      row.style.setProperty("--row-color", comment.color);
      row.classList.toggle("is-hidden", Boolean(comment.hidden));
      row.classList.toggle("is-selected", comment.id === selectedCommentId);

      const time = document.createElement("span");
      time.className = "comment-time";
      time.textContent = formatTime(comment.time);

      const meta = document.createElement("div");
      meta.className = "comment-meta";

      const author = document.createElement("span");
      author.className = "comment-author";
      author.textContent = comment.authorName || "unknown";

      const body = document.createElement("span");
      body.className = "comment-body";
      body.textContent = renderText(comment) || "［本文なし］";

      meta.append(author, body);
      row.append(time, meta);
      return row;
    })
  );
  activeListId = "";
  updateCommentListState(0);
  updateSeekUi(0);
  loadSelectedCommentEditor();
}

function loadSelectedCommentEditor() {
  const comment = commentData.comments.find((item) => item.id === selectedCommentId);
  els.commentEditor.dataset.hasSelection = comment ? "true" : "false";
  if (!comment) {
    els.editorTitle.textContent = "コメントを選択";
    els.editTime.value = "";
    els.editAuthor.value = "";
    els.editText.value = "";
    els.editHidden.checked = false;
    return;
  }
  els.editorTitle.textContent = `${formatTime(comment.time)} ${comment.authorName || "unknown"}`;
  els.editTime.value = String(comment.time);
  els.editAuthor.value = comment.authorName || "";
  els.editText.value = comment.text || "";
  els.editHidden.checked = Boolean(comment.hidden);
}

function applyCommentEdit() {
  const index = commentData.comments.findIndex((item) => item.id === selectedCommentId);
  if (index < 0) return;
  const comment = commentData.comments[index];
  comment.time = Math.max(0, Number(els.editTime.value || 0));
  comment.authorName = els.editAuthor.value.trim() || comment.authorName;
  comment.text = els.editText.value;
  comment.hidden = els.editHidden.checked;
  commentData.comments.sort((a, b) => a.time - b.time);
  fired = new Set([...fired].filter((id) => !commentData.comments.find((entry) => entry.id === id && entry.hidden)));
  renderCommentList();
  renderTimelineDrawer();
  updateSeekUi(getCurrentTime());
  setStatus("コメント編集を反映しました。");
}

function renderTimelineDrawer() {
  els.timelineDrawer.replaceChildren(
    ...commentData.comments.map((comment) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "timeline-item";
      item.dataset.commentId = comment.id;
      item.style.setProperty("--row-color", comment.color);
      item.classList.toggle("is-hidden", Boolean(comment.hidden));
      item.addEventListener("click", () => seekToComment(comment.time));

      const time = document.createElement("span");
      time.className = "timeline-time";
      time.textContent = formatTime(comment.time);

      const body = document.createElement("span");
      body.className = "timeline-text";
      body.textContent = renderText(comment) || "［本文なし］";

      item.append(time, body);
      return item;
    })
  );
}

function updateCommentListState(current) {
  let active = "";
  for (const comment of commentData.comments) {
    if (comment.time <= current) active = comment.id;
  }
  if (active === activeListId) return;
  activeListId = active;
  for (const row of els.commentList.querySelectorAll(".comment-row")) {
    const comment = commentData.comments.find((item) => item.id === row.dataset.commentId);
    row.classList.toggle("is-past", Boolean(comment && comment.time < current));
    row.classList.toggle("is-active", row.dataset.commentId === active);
  }
  for (const item of els.timelineDrawer.querySelectorAll(".timeline-item")) {
    const comment = commentData.comments.find((entry) => entry.id === item.dataset.commentId);
    item.classList.toggle("is-past", Boolean(comment && comment.time < current));
    item.classList.toggle("is-active", item.dataset.commentId === active);
  }
  const activeRow = active ? els.commentList.querySelector(`[data-comment-id="${CSS.escape(active)}"]`) : null;
  activeRow?.scrollIntoView({ block: "nearest" });
  const activeTimelineItem = active ? els.timelineDrawer.querySelector(`[data-comment-id="${CSS.escape(active)}"]`) : null;
  activeTimelineItem?.scrollIntoView({ inline: "center", block: "nearest" });
}

function setMode() {
  const design = els.designPreset.value;
  const position = els.commentPosition.value;
  els.overlay.className = `overlay ${els.mode.value} design-${design} position-${position}`;
  els.appShell.dataset.design = design;
}

function setListLayout() {
  const layout = els.listLayout.value;
  els.appShell.dataset.listLayout = layout;
  els.commentPanel.hidden = layout === "hidden" || layout === "drawer";
  els.timelineDrawer.hidden = layout !== "drawer";
}

function setSettingsOpen(open) {
  els.appShell.dataset.settingsOpen = open ? "true" : "false";
}

function applyDesignPreset(syncMode = false) {
  const designModeMap = {
    line: "bubble",
    niconico: "danmaku",
    discord: "bubble",
    subtitle: "popup"
  };
  if (syncMode && designModeMap[els.designPreset.value]) {
    els.mode.value = designModeMap[els.designPreset.value];
  }
  setMode();
  els.overlay.replaceChildren();
}

function getCurrentTime() {
  if (!els.localVideo.paused || els.videoHost.classList.contains("has-local")) {
    return els.localVideo.currentTime || 0;
  }
  if (els.videoHost.classList.contains("has-youtube") && youtubeReady && youtubePlayer?.getCurrentTime) {
    return youtubePlayer.getCurrentTime() || 0;
  }
  if (!timerRunning) return timerBase;
  return timerBase + (performance.now() - timerStartedAt) / 1000;
}

function setTimerRunning(nextRunning) {
  if (nextRunning === timerRunning) return;
  if (nextRunning) {
    timerStartedAt = performance.now();
    timerRunning = true;
    setStatus("コメント再生中。動画側は必要に応じて別途再生してください。");
  } else {
    timerBase = getCurrentTime();
    timerRunning = false;
    setStatus(`コメント停止中。現在位置: ${formatTime(timerBase)}`);
  }
  updateTransportLabel();
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${secs.toFixed(1).padStart(4, "0")}`;
}

function tick() {
  const current = getCurrentTime();
  const offset = Number(els.offset.value || 0);
  const displayTime = current + offset;
  els.clock.textContent = formatTime(displayTime);
  emitDueComments(displayTime);
  updateCommentListState(displayTime);
  updateSeekUi(displayTime);
  updateNextCommentHint(displayTime);
  timerHandle = requestAnimationFrame(tick);
}

function updateSeekUi(current) {
  const end = getTimelineEnd();
  const bounded = Math.max(0, Math.min(current, end));
  els.seekBar.max = String(Math.max(10, end * 10));
  if (!seekingWithBar) {
    els.seekBar.value = String(bounded * 10);
  }
  els.timeReadout.textContent = `${formatTime(bounded)} / ${formatTime(end)}`;
}

function emitDueComments(current) {
  const windowSeconds = 0.8;
  for (const comment of commentData.comments) {
    if (comment.hidden) continue;
    if (fired.has(comment.id)) continue;
    if (comment.time <= current && comment.time >= current - windowSeconds) {
      fired.add(comment.id);
      showComment(comment);
    }
  }
}

function updateNextCommentHint(current) {
  if (timerRunning) return;
  const next = commentData.comments.find((comment) => comment.time >= current);
  if (!next) return;
  if (current <= 0 && next.time > 2) {
    const coverage = commentData.source?.coverage === "partial-known" ? "部分取得データです。 " : "";
    setStatus(`${coverage}コメント再生を押すと ${formatTime(getPreviewStartTime())} からプレビューします。`);
  }
}

function showComment(comment) {
  const maxVisible = Math.max(1, Number(els.maxVisible.value || 8));
  while (els.overlay.querySelectorAll(".comment").length >= maxVisible) {
    els.overlay.querySelector(".comment")?.remove();
  }
  const node = document.createElement("article");
  node.className = "comment";
  node.style.setProperty("--author-color", comment.color);
  node.style.setProperty("--life", `${Number(els.duration.value || 7)}s`);

  const mode = els.mode.value;
  const lanes = Math.max(1, Number(els.lanes.value || 5));
  const lane = Math.abs(hashCode(comment.id)) % lanes;
  const laneHeight = mode === "ticker" ? 0 : Math.round(12 + lane * (74 / lanes));
  node.style.top = mode === "ticker" ? "auto" : `${laneHeight}%`;

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  if (comment.avatarUrl) {
    const img = document.createElement("img");
    img.src = comment.avatarUrl;
    img.alt = "";
    avatar.appendChild(img);
  } else {
    avatar.textContent = (comment.authorName || "?").slice(0, 1);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble-card";
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = comment.authorName || "unknown";
  const text = document.createElement("span");
  text.className = "text";
  text.textContent = renderText(comment);
  bubble.append(name, text);
  node.append(avatar, bubble);
  els.overlay.appendChild(node);

  window.setTimeout(() => node.remove(), Number(els.duration.value || 7) * 1000 + 800);
}

function renderText(comment) {
  const stickers = (comment.stickers || []).map((item) => `［${item.name || "sticker"}］`).join(" ");
  const attachments = (comment.attachments || []).map((item) => `［添付:${item.filename || item.type || "file"}］`).join(" ");
  return [comment.text || "", stickers, attachments].filter(Boolean).join(" ");
}

function hashCode(value) {
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return hash;
}

function resetPlayback() {
  fired = new Set();
  els.overlay.replaceChildren();
  timerBase = 0;
  timerStartedAt = performance.now();
  timerRunning = false;
  if (els.videoHost.classList.contains("has-local")) els.localVideo.currentTime = 0;
  updateCommentListState(0);
  updateSeekUi(0);
  updateTransportLabel();
}

function seekToComment(seconds) {
  seekToTime(Math.max(0, seconds - 0.2));
}

function seekToTime(seconds) {
  const seekTo = Math.max(0, Math.min(seconds, getTimelineEnd()));
  fired = new Set(commentData.comments.filter((comment) => comment.time < seekTo - 0.5).map((comment) => comment.id));
  els.overlay.replaceChildren();
  timerBase = seekTo;
  timerStartedAt = performance.now();
  if (els.videoHost.classList.contains("has-local")) {
    els.localVideo.currentTime = seekTo;
  }
  if (els.videoHost.classList.contains("has-youtube") && youtubeReady && youtubePlayer?.seekTo) {
    youtubePlayer.seekTo(seekTo, true);
  }
  updateCommentListState(seekTo);
  updateSeekUi(seekTo);
}

async function loadCommentsFromFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  commentData = normalizeData(data);
  fired = new Set();
  els.overlay.replaceChildren();
  renderCommentList();
  renderTimelineDrawer();
  setStatus(`${file.name} を読込済み: ${commentData.comments.length}件`);
  updateNextCommentHint(0);
}

async function loadDefaultThreadComments() {
  const applyDefaultData = (data, label = "このスレッド") => {
    commentData = normalizeData(data);
    fired = new Set();
    els.overlay.replaceChildren();
    els.discordUrl.value = data.source?.url || "";
    renderCommentList();
    renderTimelineDrawer();
    const coverage = data.source?.coverage === "partial-known" ? "部分取得" : "取得";
    setStatus(`${label}の${coverage}コメントを読込済み: ${commentData.comments.length}件`);
    updateNextCommentHint(0);
  };

  try {
    const response = await fetch("data/thread-comments.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    applyDefaultData(data);
  } catch {
    if (window.VCO_EMBEDDED_THREAD_COMMENTS) {
      applyDefaultData(window.VCO_EMBEDDED_THREAD_COMMENTS, "同梱デモ");
      return;
    }
    setStatus("サンプルコメントを読込済み");
  }
}

function loadYoutube() {
  const id = extractYoutubeId(els.youtubeUrl.value);
  if (!id) {
    setStatus("YouTube URLを確認してください。");
    return;
  }
  els.youtubeFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?enablejsapi=1&rel=0&origin=${encodeURIComponent(location.origin)}`;
  youtubeReady = false;
  youtubePlayer = null;
  loadYoutubeApi();
  els.localVideo.pause();
  els.localVideo.removeAttribute("src");
  els.videoHost.classList.add("has-youtube");
  els.videoHost.classList.remove("has-local");
  resetPlayback();
  setStatus("YouTubeを読込済み。ビューア側の再生ボタンでコメントタイマーを動かせます。");
  updateNextCommentHint(0);
}

function loadLocalVideo(file) {
  const url = URL.createObjectURL(file);
  els.youtubeFrame.removeAttribute("src");
  els.localVideo.src = url;
  els.videoHost.classList.add("has-local");
  els.videoHost.classList.remove("has-youtube");
  resetPlayback();
  setStatus(`${file.name} を読込済み。動画の再生時間にコメントが同期します。`);
}

function bindEvents() {
  els.loadYoutube.addEventListener("click", loadYoutube);
  els.toggleSettings.addEventListener("click", () => setSettingsOpen(els.appShell.dataset.settingsOpen !== "true"));
  els.closeSettings.addEventListener("click", () => setSettingsOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSettingsOpen(false);
  });
  els.videoFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) loadLocalVideo(file);
  });
  els.commentFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) loadCommentsFromFile(file).catch((error) => setStatus(`JSON読込エラー: ${error.message}`));
  });
  els.ndjsonFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) loadDiscordNdjson(file).catch((error) => setStatus(`NDJSON読込エラー: ${error.message}`));
  });
  els.mode.addEventListener("change", () => {
    applyDesignPreset(false);
  });
  els.designPreset.addEventListener("change", () => {
    applyDesignPreset(true);
    applyVisualSettings();
  });
  els.listLayout.addEventListener("change", setListLayout);
  for (const control of [els.commentPosition, els.theme, els.fontSize, els.bubbleWidth, els.maxVisible, els.showAvatars, els.duration, els.lanes]) {
    control.addEventListener("input", () => {
      applyDesignPreset(false);
      applyVisualSettings();
    });
    control.addEventListener("change", () => {
      applyDesignPreset(false);
      applyVisualSettings();
    });
  }
  els.presetSelect.addEventListener("change", () => {
    const saved = localPresets();
    applyPresetSettings(saved[els.presetSelect.value] || builtinPresets[els.presetSelect.value]);
  });
  els.savePreset.addEventListener("click", () => {
    const name = els.presetName.value.trim() || `preset-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
    const saved = localPresets();
    saved[name] = getCurrentPresetSettings();
    writeLocalPresets(saved);
    refreshPresetSelect();
    els.presetSelect.value = name;
    setStatus(`プリセット ${name} を保存しました。`);
  });
  els.exportPreset.addEventListener("click", () => {
    const name = els.presetName.value.trim() || els.presetSelect.value || "video-comment-overlay-preset";
    downloadJson(`${name}.json`, { schema: "video_comment_overlay_preset.v1", name, settings: getCurrentPresetSettings() });
  });
  els.presetImport.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = JSON.parse(await file.text());
    const name = data.name || file.name.replace(/\.json$/i, "");
    const settings = data.settings || data;
    const saved = localPresets();
    saved[name] = settings;
    writeLocalPresets(saved);
    refreshPresetSelect();
    els.presetSelect.value = name;
    applyPresetSettings(settings);
    setStatus(`${name} を読み込みました。`);
  });
  els.commentList.addEventListener("click", (event) => {
    const row = event.target.closest(".comment-row");
    if (!row) return;
    const comment = commentData.comments.find((entry) => entry.id === row.dataset.commentId);
    if (!comment) return;
    selectedCommentId = comment.id;
    renderCommentList();
    seekToComment(comment.time);
  });
  els.commentEditor.addEventListener("submit", (event) => {
    event.preventDefault();
    applyCommentEdit();
  });
  els.clearCommentEdit.addEventListener("click", () => {
    selectedCommentId = "";
    renderCommentList();
  });
  els.playPause.addEventListener("click", () => {
    if (els.videoHost.classList.contains("has-local")) {
      if (els.localVideo.paused) {
        els.localVideo.play();
        setTimerRunning(true);
      } else {
        els.localVideo.pause();
        setTimerRunning(false);
      }
      return;
    }
    if (els.videoHost.classList.contains("has-youtube") && youtubeReady && youtubePlayer) {
      if (timerRunning) {
        youtubePlayer.pauseVideo();
        setTimerRunning(false);
      } else {
        if (getCurrentTime() <= 0.5 && getFirstCommentTime() > 2) {
          seekToTime(getPreviewStartTime());
        }
        youtubePlayer.playVideo();
        setTimerRunning(true);
      }
      return;
    }
    if (!timerRunning && timerBase <= 0 && getFirstCommentTime() > 2) {
      timerBase = getPreviewStartTime();
      fired = new Set(commentData.comments.filter((comment) => comment.time < timerBase - 0.5).map((comment) => comment.id));
      els.overlay.replaceChildren();
      updateCommentListState(timerBase);
    }
    setTimerRunning(!timerRunning);
  });
  els.restart.addEventListener("click", resetPlayback);
  els.seekBar.addEventListener("input", () => {
    seekingWithBar = true;
    const nextTime = Number(els.seekBar.value || 0) / 10;
    els.clock.textContent = formatTime(nextTime);
    els.timeReadout.textContent = `${formatTime(nextTime)} / ${formatTime(getTimelineEnd())}`;
  });
  els.seekBar.addEventListener("change", () => {
    seekingWithBar = false;
    seekToTime(Number(els.seekBar.value || 0) / 10);
  });
  els.localVideo.addEventListener("play", () => setTimerRunning(true));
  els.localVideo.addEventListener("pause", () => setTimerRunning(false));
  els.localVideo.addEventListener("seeked", () => {
    fired = new Set(commentData.comments.filter((comment) => comment.time < els.localVideo.currentTime - 0.5).map((comment) => comment.id));
    els.overlay.replaceChildren();
    updateSeekUi(els.localVideo.currentTime || 0);
  });
  els.localVideo.addEventListener("loadedmetadata", () => updateSeekUi(getCurrentTime()));
}

bindEvents();
refreshPresetSelect();
applyDesignPreset(false);
setSettingsOpen(false);
setListLayout();
applyVisualSettings();
renderVersionBadge();
renderCommentList();
renderTimelineDrawer();
loadDefaultThreadComments();
timerHandle = requestAnimationFrame(tick);
