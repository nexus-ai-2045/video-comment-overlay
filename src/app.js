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
  screenMode: document.querySelector("#screenMode"),
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
  quickPlatform: document.querySelector("#quickPlatform"),
  sourceUrl: document.querySelector("#sourceUrl"),
  fetchSource: document.querySelector("#fetchSource"),
  sourceCommentFile: document.querySelector("#sourceCommentFile"),
  playPause: document.querySelector("#playPause"),
  restart: document.querySelector("#restart"),
  seekBar: document.querySelector("#seekBar"),
  clock: document.querySelector("#clock"),
  timeReadout: document.querySelector("#timeReadout"),
  recordQuality: document.querySelector("#recordQuality"),
  recordFps: document.querySelector("#recordFps"),
  recordBitrate: document.querySelector("#recordBitrate"),
  recordCodec: document.querySelector("#recordCodec"),
  checkRecording: document.querySelector("#checkRecording"),
  startRecording: document.querySelector("#startRecording"),
  stopRecording: document.querySelector("#stopRecording"),
  downloadRecording: document.querySelector("#downloadRecording"),
  recordingStatus: document.querySelector("#recordingStatus"),
  status: document.querySelector("#status"),
  versionBadge: document.querySelector("#versionBadge"),
  checkUpdates: document.querySelector("#checkUpdates"),
  videoHost: document.querySelector("#videoHost"),
  localVideo: document.querySelector("#localVideo"),
  youtubeFrame: document.querySelector("#youtubeFrame"),
  overlay: document.querySelector("#overlay"),
  discordReplay: document.querySelector("#discordReplay"),
  discordReplayList: document.querySelector("#discordReplayList"),
  discordReplayClock: document.querySelector("#discordReplayClock"),
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

const updateConfig = {
  owner: "nexus-ai-2045",
  repo: "video-comment-overlay",
  latestReleaseUrl: "https://api.github.com/repos/nexus-ai-2045/video-comment-overlay/releases/latest"
};

const builtinPresets = {
  "line-soft": {
    designPreset: "line",
    screenMode: "overlay",
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
    screenMode: "overlay",
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
    screenMode: "discordReplay",
    mode: "bubble",
    commentPosition: "left",
    theme: "dark",
    fontSize: 14,
    bubbleWidth: 580,
    duration: 6,
    lanes: 6,
    maxVisible: 10,
    showAvatars: true
  },
  "youtube-live": {
    designPreset: "subtitle",
    screenMode: "youtubeReplay",
    mode: "popup",
    commentPosition: "bottom",
    theme: "dark",
    fontSize: 15,
    bubbleWidth: 620,
    duration: 6,
    lanes: 5,
    maxVisible: 10,
    showAvatars: true
  },
  "twitch-chat": {
    designPreset: "discord",
    screenMode: "twitchReplay",
    mode: "bubble",
    commentPosition: "right",
    theme: "dark",
    fontSize: 15,
    bubbleWidth: 560,
    duration: 6,
    lanes: 6,
    maxVisible: 12,
    showAvatars: false
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
let activeDiscordReplayId = "";
let mediaRecorder = null;
let recordingStream = null;
let recordedChunks = [];
let recordedBlob = null;
let statusHoldUntil = 0;

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
    screenMode: els.screenMode.value,
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
  setScreenMode();
  applyDesignPreset(false);
  applyVisualSettings();
}

function applyVisualSettings() {
  els.appShell.dataset.theme = els.theme.value;
  els.appShell.dataset.showAvatars = els.showAvatars.checked ? "true" : "false";
  els.appShell.style.setProperty("--comment-font-size", `${Number(els.fontSize.value || 15)}px`);
  els.appShell.style.setProperty("--comment-max-width", `${Number(els.bubbleWidth.value || 560)}px`);
  els.discordReplay?.style.setProperty("--replay-font-size", `${Number(els.fontSize.value || 15)}px`);
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

function parseTimestampMs(timestamp) {
  if (!timestamp) return Number.NaN;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function resolveVideoStartIso(data) {
  return localDateTimeToIso(els.videoStartAt.value) || data.timeline?.videoStartAt || "";
}

function isBeforeVideoStart(timestampMs, videoStartMs) {
  return Number.isFinite(timestampMs) && Number.isFinite(videoStartMs) && timestampMs < videoStartMs;
}

function normalizeData(data) {
  const participants = data.participants || {};
  const videoStartIso = resolveVideoStartIso(data);
  const videoStart = videoStartIso ? Date.parse(videoStartIso) : null;
  const shouldPreferTimestamp =
    data.timeline?.commentTimeMode && data.timeline.commentTimeMode !== "absolute";
  let skippedBeforeVideoStart = 0;
  const comments = (data.comments || []).flatMap((comment, index) => {
    const participant = participants[comment.authorId] || {};
    const timestampMs = parseTimestampMs(comment.timestamp);
    if (shouldPreferTimestamp && isBeforeVideoStart(timestampMs, videoStart)) {
      skippedBeforeVideoStart += 1;
      return [];
    }
    const timestampTime =
      Number.isFinite(timestampMs) && Number.isFinite(videoStart)
        ? Math.max(0, (timestampMs - videoStart) / 1000)
        : null;
    const existingTime = Number(comment.time);
    const normalizedTime =
      shouldPreferTimestamp && timestampTime !== null
        ? timestampTime
        : Number.isFinite(existingTime)
          ? existingTime
          : timestampTime || 0;
    return {
      ...comment,
      id: String(comment.id || `comment-${index}`),
      authorName: comment.authorName || participant.name || "unknown",
      time: normalizedTime,
      color: comment.color || participant.color || colorFromString(comment.authorId || comment.authorName || `${index}`),
      avatarUrl: comment.avatarUrl || participant.avatarUrl || ""
    };
  });
  comments.sort((a, b) => a.time - b.time);
  return {
    ...data,
    timeline: {
      ...data.timeline,
      videoStartAt: videoStartIso || data.timeline?.videoStartAt,
      normalizedAt: new Date().toISOString()
    },
    manifest: {
      ...data.manifest,
      originalMessageCount: data.manifest?.originalMessageCount || data.comments?.length || comments.length,
      messageCount: comments.length,
      skippedBeforeVideoStart
    },
    comments
  };
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
  const comments = rows
    .filter((row) => !isBeforeVideoStart(parseTimestampMs(row.timestamp), videoStartMs))
    .map((row, index) => normalizeDiscordMessage(row, index, videoStartMs));
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
  renderDiscordReplay();
  setStatus(`${file.name} をDiscord rawとして変換: ${commentData.comments.length}件`);
}

async function loadSourceCommentFile(file) {
  const text = await file.text();
  const platform = els.quickPlatform.value;
  const data = parseCommentSourceText(text);
  commentData = normalizeImportedSourceData(data, platform, file.name);
  fired = new Set();
  els.overlay.replaceChildren();
  renderCommentList();
  renderTimelineDrawer();
  renderDiscordReplay();
  setStatus(`${file.name} を${platformLabel(platform)}コメントとして読込済み: ${commentData.comments.length}件`);
  updateNextCommentHint(0);
}

function parseCommentSourceText(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function normalizeImportedSourceData(data, platform, importedFrom = "") {
  if (data?.schema === "video_comment_overlay.v1") return normalizeData(data);
  const rows = Array.isArray(data) ? data : data.comments || data.items || data.messages || [];
  const videoStartIso = localDateTimeToIso(els.videoStartAt.value) || inferFirstTimestamp(rows) || new Date().toISOString();
  const videoStartMs = Date.parse(videoStartIso);
  const comments = rows
    .filter((row) => !isBeforeVideoStart(parseTimestampMs(inferRowTimestamp(row)), videoStartMs))
    .map((row, index) => normalizeSourceMessage(row, index, platform, videoStartMs));
  const participants = {};
  for (const comment of comments) {
    if (!participants[comment.authorId]) {
      participants[comment.authorId] = {
        name: comment.authorName,
        avatarUrl: comment.avatarUrl,
        color: comment.color || colorFromString(comment.authorId)
      };
    }
  }
  return normalizeData({
    schema: "video_comment_overlay.v1",
    source: {
      type: platform,
      url: els.sourceUrl.value.trim(),
      importedFrom
    },
    timeline: {
      videoStartAt: videoStartIso,
      commentTimeMode: "absolute"
    },
    participants,
    comments
  });
}

function normalizeSourceMessage(row, index, platform, videoStartMs) {
  if (platform === "discord") return normalizeDiscordMessage(row, index, videoStartMs);
  if (platform === "youtube") return normalizeYoutubeMessage(row, index, videoStartMs);
  if (platform === "twitch") return normalizeTwitchMessage(row, index, videoStartMs);
  return normalizeGenericMessage(row, index, platform, videoStartMs);
}

function normalizeYoutubeMessage(row, index, videoStartMs) {
  const snippet = row.snippet || row;
  const author = row.authorDetails || row.author || {};
  const timestamp = snippet.publishedAt || snippet.timestamp || row.timestamp || "";
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;
  const authorName = author.displayName || author.name || snippet.authorName || row.authorName || "unknown";
  const authorId = String(author.channelId || author.id || authorName || `youtube-author-${index}`);
  return {
    id: String(row.id || snippet.id || `youtube-${index}`),
    authorId,
    authorName,
    avatarUrl: author.profileImageUrl || author.avatarUrl || "",
    timestamp,
    time: Number.isFinite(Number(row.time)) ? Number(row.time) : Number.isFinite(timestampMs) ? Math.max(0, (timestampMs - videoStartMs) / 1000) : index,
    text: snippet.displayMessage || snippet.textMessageDetails?.messageText || row.text || row.message || "",
    kind: "message",
    emoji: [],
    stickers: [],
    attachments: []
  };
}

function normalizeTwitchMessage(row, index, videoStartMs) {
  const message = row.message || row;
  const commenter = row.commenter || row.author || row.user || {};
  const timestamp = row.created_at || row.timestamp || row.publishedAt || "";
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;
  const authorName = commenter.display_name || commenter.name || row.authorName || row.username || "unknown";
  const authorId = String(commenter._id || commenter.id || row.authorId || authorName || `twitch-author-${index}`);
  const seconds = row.content_offset_seconds ?? row.time ?? row.offsetSeconds;
  return {
    id: String(row._id || row.id || `twitch-${index}`),
    authorId,
    authorName,
    avatarUrl: commenter.profile_image_url || commenter.avatarUrl || "",
    timestamp,
    time: Number.isFinite(Number(seconds)) ? Number(seconds) : Number.isFinite(timestampMs) ? Math.max(0, (timestampMs - videoStartMs) / 1000) : index,
    text: message.body || message.text || row.text || row.message || "",
    kind: "message",
    emoji: row.emotes || [],
    stickers: [],
    attachments: []
  };
}

function normalizeGenericMessage(row, index, platform, videoStartMs) {
  const timestamp = row.timestamp || row.createdAt || row.created_at || "";
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;
  const authorName = row.authorName || row.author?.name || row.user?.name || row.username || "unknown";
  const authorId = String(row.authorId || row.author?.id || row.user?.id || authorName || `${platform}-author-${index}`);
  return {
    id: String(row.id || `${platform}-${index}`),
    authorId,
    authorName,
    avatarUrl: row.avatarUrl || row.author?.avatarUrl || row.user?.avatarUrl || "",
    timestamp,
    time: Number.isFinite(Number(row.time)) ? Number(row.time) : Number.isFinite(timestampMs) ? Math.max(0, (timestampMs - videoStartMs) / 1000) : index,
    text: row.text || row.content || row.message || "",
    kind: row.kind || "message",
    emoji: row.emoji || [],
    stickers: row.stickers || [],
    attachments: row.attachments || []
  };
}

function inferFirstTimestamp(rows) {
  for (const row of rows || []) {
    const timestamp = inferRowTimestamp(row);
    if (timestamp && Number.isFinite(Date.parse(timestamp))) return new Date(Date.parse(timestamp)).toISOString();
  }
  return "";
}

function inferRowTimestamp(row) {
  return (
    row?.timestamp ||
    row?.createdAt ||
    row?.created_at ||
    row?.publishedAt ||
    row?.snippet?.publishedAt ||
    row?.snippet?.timestamp ||
    ""
  );
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

function setStatus(message, holdMs = 0) {
  els.status.textContent = message;
  statusHoldUntil = holdMs > 0 ? Date.now() + holdMs : 0;
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

function versionParts(value) {
  return String(value || "0.0.0")
    .replace(/^v/i, "")
    .split(/[.-]/)
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return 1;
    if (a[index] < b[index]) return -1;
  }
  return 0;
}

function currentPackageVersion() {
  return window.VCO_VERSION?.packageVersion || "0.0.0";
}

async function checkForUpdates() {
  if (!els.checkUpdates) return;
  els.checkUpdates.disabled = true;
  setStatus("GitHub Releasesで更新を確認しています。", 3000);
  try {
    const response = await fetch(updateConfig.latestReleaseUrl, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store"
    });
    if (response.status === 404) {
      setStatus("更新情報はまだ公開されていません。GitHub Releases作成後に検知できます。", 7000);
      return;
    }
    if (!response.ok) throw new Error(`GitHub Releases HTTP ${response.status}`);
    const release = await response.json();
    const latest = String(release.tag_name || release.name || "").replace(/^v/i, "");
    if (!latest) throw new Error("最新バージョンを読み取れませんでした。");
    const current = currentPackageVersion();
    if (compareVersions(latest, current) > 0) {
      setStatus(`新しい版 ${latest} があります。リリースページを開きます。`, 7000);
      if (release.html_url) window.open(release.html_url, "_blank", "noopener,noreferrer");
    } else {
      setStatus(`最新版です: ${current}`, 5000);
    }
  } catch (error) {
    setStatus(`更新確認に失敗しました: ${error.message}`, 7000);
  } finally {
    els.checkUpdates.disabled = false;
  }
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
  renderDiscordReplay();
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
  renderDiscordReplay();
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

const replayTemplates = {
  discordReplay: {
    platform: "discord",
    serverTitle: "Nexus AI",
    channelTitle: "# meeting-chat",
    railLabels: ["N", "D", "+"],
    sideItems: ["# meeting-chat", "# materials", "# archive"],
    sideFooter: "LIVE / replay",
    composer: "Message #meeting-chat",
    metaLabel: "Discord live replay",
    headerActions: ["検索", "ピン", "メンバー"]
  },
  youtubeReplay: {
    platform: "youtube",
    serverTitle: "YouTube Live",
    channelTitle: "ライブチャット",
    railLabels: ["▶", "L", "＋"],
    sideItems: ["トップチャット", "メンバー", "固定表示"],
    sideFooter: "LIVE CHAT",
    composer: "チャットに参加...",
    metaLabel: "YouTube Live replay",
    previewTitle: "ライブ配信プレビュー",
    previewMeta: "再生画面 / コメント同期 / 録画用",
    headerActions: ["上位チャット", "最新", "設定"]
  },
  twitchReplay: {
    platform: "twitch",
    serverTitle: "Twitch",
    channelTitle: "Stream Chat",
    railLabels: ["T", "★", "＋"],
    sideItems: ["Following", "Chat", "Clips"],
    sideFooter: "STREAM CHAT",
    composer: "Send a message",
    metaLabel: "Twitch replay",
    previewTitle: "Stream Preview",
    previewMeta: "LIVE / 1080p / Low latency",
    headerActions: ["Chat", "Users", "Mod"]
  }
};

function isReplayMode(mode = els.screenMode.value) {
  return mode !== "overlay";
}

function currentReplayTemplate() {
  return replayTemplates[els.screenMode.value] || replayTemplates.discordReplay;
}

function renderReplayShell() {
  const template = currentReplayTemplate();
  if (!els.discordReplay) return;
  els.discordReplay.dataset.platform = template.platform;
  els.discordReplay.setAttribute("aria-label", `${template.metaLabel} screen`);

  const serverRail = document.createElement("div");
  serverRail.className = "discord-server-rail";
  serverRail.setAttribute("aria-hidden", "true");
  for (const [index, label] of template.railLabels.entries()) {
    const dot = document.createElement("span");
    dot.className = `server-dot${index === 0 ? " active" : ""}`;
    dot.textContent = label;
    serverRail.appendChild(dot);
  }

  const channelRail = document.createElement("div");
  channelRail.className = "discord-channel-rail";
  const title = document.createElement("div");
  title.className = "discord-channel-title";
  title.textContent = template.serverTitle;
  channelRail.appendChild(title);
  if (template.previewTitle) {
    const preview = document.createElement("section");
    preview.className = "replay-preview";
    const live = document.createElement("span");
    live.className = "replay-live-badge";
    live.textContent = "LIVE";
    const previewTitle = document.createElement("strong");
    previewTitle.textContent = template.previewTitle;
    const previewMeta = document.createElement("span");
    previewMeta.textContent = template.previewMeta || "";
    const controls = document.createElement("div");
    controls.className = "replay-preview-controls";
    controls.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
    preview.append(live, previewTitle, previewMeta, controls);
    channelRail.appendChild(preview);
  }
  for (const [index, label] of template.sideItems.entries()) {
    const item = document.createElement("button");
    item.className = `discord-channel${index === 0 ? " active" : ""}`;
    item.type = "button";
    item.textContent = label;
    channelRail.appendChild(item);
  }
  const footer = document.createElement("div");
  footer.className = "discord-voice-box";
  footer.textContent = template.sideFooter;
  channelRail.appendChild(footer);

  const chat = document.createElement("div");
  chat.className = "discord-chat";
  const header = document.createElement("header");
  header.className = "discord-chat-header";
  const heading = document.createElement("strong");
  heading.textContent = template.channelTitle;
  const headerActions = document.createElement("div");
  headerActions.className = "replay-header-actions";
  for (const label of template.headerActions || []) {
    const action = document.createElement("span");
    action.textContent = label;
    headerActions.appendChild(action);
  }
  const clock = document.createElement("span");
  clock.id = "discordReplayClock";
  clock.textContent = "00:00.0";
  header.append(heading, headerActions, clock);

  const list = document.createElement("div");
  list.id = "discordReplayList";
  list.className = "discord-message-list";
  const composer = document.createElement("div");
  composer.className = "discord-composer";
  composer.textContent = template.composer;
  chat.append(header, list, composer);

  els.discordReplay.replaceChildren(serverRail, channelRail, chat);
  els.discordReplayList = list;
  els.discordReplayClock = clock;
}

function renderDiscordReplay() {
  if (!isReplayMode()) return;
  renderReplayShell();
  if (!els.discordReplayList) return;
  els.discordReplayList.replaceChildren(
    ...commentData.comments.map((comment) => {
      const row = document.createElement("article");
      row.className = "discord-message";
      row.dataset.commentId = comment.id;
      row.style.setProperty("--author-color", comment.color);
      row.classList.toggle("is-hidden", Boolean(comment.hidden));

      const avatar = document.createElement("span");
      avatar.className = "discord-avatar";
      if (comment.avatarUrl) {
        const img = document.createElement("img");
        img.src = comment.avatarUrl;
        img.alt = "";
        avatar.appendChild(img);
      } else {
        avatar.textContent = (comment.authorName || "?").slice(0, 1);
      }

      const body = document.createElement("div");
      body.className = "discord-message-body";

      const meta = document.createElement("div");
      meta.className = "discord-message-meta";

      const author = document.createElement("strong");
      author.textContent = comment.authorName || "unknown";

      const time = document.createElement("span");
      time.textContent = formatTime(comment.time);

      const text = document.createElement("p");
      text.textContent = renderText(comment) || "［本文なし］";

      meta.append(author, time);
      body.append(meta, text);
      row.append(avatar, body);
      return row;
    })
  );
  activeDiscordReplayId = "";
  updateDiscordReplayState(getCurrentTime());
}

function updateDiscordReplayState(current) {
  if (!els.discordReplayList) return;
  let active = "";
  for (const comment of commentData.comments) {
    if (!comment.hidden && comment.time <= current) active = comment.id;
  }
  els.discordReplayClock.textContent = formatTime(current);
  if (active === activeDiscordReplayId) return;
  activeDiscordReplayId = active;
  for (const row of els.discordReplayList.querySelectorAll(".discord-message")) {
    const comment = commentData.comments.find((item) => item.id === row.dataset.commentId);
    row.classList.toggle("is-past", Boolean(comment && comment.time < current));
    row.classList.toggle("is-active", row.dataset.commentId === active);
  }
  const activeRow = active ? els.discordReplayList.querySelector(`[data-comment-id="${CSS.escape(active)}"]`) : null;
  activeRow?.scrollIntoView({ block: "center" });
}

function setMode() {
  const design = els.designPreset.value;
  const position = els.commentPosition.value;
  els.overlay.className = `overlay ${els.mode.value} design-${design} position-${position}`;
  els.appShell.dataset.design = design;
}

function setScreenMode() {
  const mode = els.screenMode.value;
  els.appShell.dataset.screenMode = mode;
  syncQuickPlatformFromScreenMode(mode);
  renderDiscordReplay();
  updateSeekUi(getCurrentTime());
}

function setPlatform(platform) {
  const screenModeMap = {
    discord: "discordReplay",
    youtube: "youtubeReplay",
    twitch: "twitchReplay"
  };
  els.quickPlatform.value = platform;
  els.screenMode.value = screenModeMap[platform] || "discordReplay";
  setScreenMode();
  setStatus(`${platformLabel(platform)}モードに切り替えました。コメントはローカルJSONまたはJSON URLから取り込めます。`, 3500);
}

function syncQuickPlatformFromScreenMode(mode) {
  const platformMap = {
    discordReplay: "discord",
    youtubeReplay: "youtube",
    twitchReplay: "twitch"
  };
  const platform = platformMap[mode];
  if (platform && els.quickPlatform.value !== platform) els.quickPlatform.value = platform;
}

function platformLabel(platform) {
  return {
    discord: "Discord",
    youtube: "YouTube Live",
    twitch: "Twitch"
  }[platform] || platform;
}

async function fetchSourceComments() {
  const url = els.sourceUrl.value.trim() || guessSourceUrlForPlatform();
  const platform = els.quickPlatform.value;
  if (!url) {
    setStatus("コメントURLまたはJSON URLを入力してください。保存済みファイルがある場合は「ファイル取込」を使えます。", 7000);
    return;
  }
  els.sourceUrl.value = url;
  if (!looksLikeDirectCommentFile(url)) {
    setStatus(`${platformLabel(platform)}の配信ページからの自動取得はアダプタ準備中です。現時点ではエクスポート済みJSON/NDJSON、または直接読めるJSON URLを取り込めます。`, 9000);
    return;
  }
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const data = parseCommentSourceText(text);
    commentData = normalizeImportedSourceData(data, platform, url.split("/").pop() || "remote-comments");
    fired = new Set();
    els.overlay.replaceChildren();
    renderCommentList();
    renderTimelineDrawer();
    renderDiscordReplay();
    setStatus(`${url} を${platformLabel(platform)}コメントとして取込済み: ${commentData.comments.length}件`, 7000);
  } catch (error) {
    setStatus(`URL取込エラー: ${error.message}。CORSや認証が必要な場合は、保存済みJSONをファイル取込してください。`, 9000);
  }
}

function looksLikeDirectCommentFile(url) {
  return /\.(json|jsonl|ndjson)(\?|#|$)/i.test(url) || url.startsWith(location.origin) || url.startsWith("/");
}

function guessSourceUrlForPlatform() {
  const platform = els.quickPlatform.value;
  if (platform === "discord") return els.discordUrl.value.trim();
  if (platform === "youtube") return els.youtubeUrl.value.trim();
  return "";
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
  updateDiscordReplayState(displayTime);
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
  if (Date.now() < statusHoldUntil) return;
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
  updateDiscordReplayState(0);
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
  updateDiscordReplayState(seekTo);
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
  renderDiscordReplay();
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
    renderDiscordReplay();
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
  const objectUrl = URL.createObjectURL(file);
  const parsedUrl = new URL(objectUrl);
  if (parsedUrl.protocol !== "blob:") {
    URL.revokeObjectURL(objectUrl);
    throw new Error("ローカル動画URLの形式が不正です。");
  }
  els.youtubeFrame.removeAttribute("src");
  els.localVideo.setAttribute("src", parsedUrl.href);
  els.videoHost.classList.add("has-local");
  els.videoHost.classList.remove("has-youtube");
  resetPlayback();
  setStatus(`${file.name} を読込済み。動画の再生時間にコメントが同期します。`);
}

function bindEvents() {
  els.loadYoutube.addEventListener("click", loadYoutube);
  els.checkUpdates?.addEventListener("click", () => checkForUpdates());
  els.toggleSettings.addEventListener("click", () => setSettingsOpen(els.appShell.dataset.settingsOpen !== "true"));
  els.closeSettings.addEventListener("click", () => setSettingsOpen(false));
  els.quickPlatform.addEventListener("change", () => setPlatform(els.quickPlatform.value));
  els.fetchSource.addEventListener("click", () => fetchSourceComments());
  els.sourceCommentFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) loadSourceCommentFile(file).catch((error) => setStatus(`配信コメント読込エラー: ${error.message}`));
  });
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
  els.screenMode.addEventListener("change", setScreenMode);
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
  els.checkRecording.addEventListener("click", checkRecordingEngine);
  els.startRecording.addEventListener("click", startScreenRecording);
  els.stopRecording.addEventListener("click", stopScreenRecording);
  els.downloadRecording.addEventListener("click", downloadRecording);
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

async function startScreenRecording() {
  const support = getRecordingSupport();
  if (!support.ok) {
    setRecordingStatus(`録画不可: ${support.blockers.join(" / ")}`);
    return;
  }
  try {
    const settings = getRecordingSettings();
    recordedChunks = [];
    recordedBlob = null;
    recordingStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: settings.width ? { ideal: settings.width } : undefined,
        height: settings.height ? { ideal: settings.height } : undefined,
        frameRate: { ideal: settings.frameRate, max: settings.frameRate }
      },
      audio: false
    });
    const actual = getActualRecordingSettings(recordingStream);
    const mimeType = getSupportedMimeType(settings.codec);
    const options = {
      videoBitsPerSecond: settings.videoBitsPerSecond
    };
    if (mimeType) options.mimeType = mimeType;
    mediaRecorder = new MediaRecorder(recordingStream, options);
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "video/webm" });
      recordingStream?.getTracks().forEach((track) => track.stop());
      recordingStream = null;
      els.startRecording.disabled = false;
      els.stopRecording.disabled = true;
      els.downloadRecording.disabled = !recordedBlob;
      setRecordingStatus(recordedBlob ? "録画完了。WebM保存できます。" : "録画データがありません。");
    });
    mediaRecorder.start();
    els.startRecording.disabled = true;
    els.stopRecording.disabled = false;
    els.downloadRecording.disabled = true;
    setRecordingStatus(`録画中: ${actual.label} / ${settings.bitrateMbps}Mbps / ${mediaRecorder.mimeType || "browser default"}`);
  } catch (error) {
    setRecordingStatus(`録画開始を中止しました: ${error.message}`);
  }
}

function stopScreenRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

function downloadRecording() {
  if (!recordedBlob) return;
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.href = URL.createObjectURL(recordedBlob);
  link.download = `video-comment-overlay-replay-${timestamp}.webm`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function setRecordingStatus(message) {
  els.recordingStatus.textContent = message;
}

function checkRecordingEngine() {
  const support = getRecordingSupport();
  const settings = getRecordingSettings();
  if (!support.ok) {
    setRecordingStatus(`録画不可: ${support.blockers.join(" / ")}`);
    return;
  }
  setRecordingStatus(
    `録画対応OK: ${settings.label} / ${settings.frameRate}fps / ${settings.bitrateMbps}Mbps / ${support.supportedMimeTypes.join(", ")}`
  );
}

function getRecordingSupport() {
  const blockers = [];
  if (!window.isSecureContext && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") {
    blockers.push("HTTPSまたはlocalhostが必要");
  }
  if (!navigator.mediaDevices?.getDisplayMedia) blockers.push("getDisplayMedia未対応");
  if (typeof MediaRecorder === "undefined") blockers.push("MediaRecorder未対応");
  const supportedMimeTypes = typeof MediaRecorder === "undefined" ? [] : [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ].filter((type) => MediaRecorder.isTypeSupported(type));
  if (typeof MediaRecorder !== "undefined" && supportedMimeTypes.length === 0) blockers.push("WebM録画codec未対応");
  return {
    ok: blockers.length === 0,
    blockers,
    supportedMimeTypes
  };
}

function getRecordingSettings() {
  const quality = els.recordQuality.value;
  const qualityMap = {
    "720p": { width: 1280, height: 720, label: "HD 1280x720" },
    "1080p": { width: 1920, height: 1080, label: "Full HD 1920x1080" },
    "1440p": { width: 2560, height: 1440, label: "QHD 2560x1440" },
    source: { width: 0, height: 0, label: "画面に合わせる" }
  };
  const selected = qualityMap[quality] || qualityMap["1080p"];
  const frameRate = Number(els.recordFps.value || 30);
  const bitrateMbps = Math.max(2, Math.min(80, Number(els.recordBitrate.value || 12)));
  return {
    ...selected,
    frameRate,
    bitrateMbps,
    codec: els.recordCodec.value,
    videoBitsPerSecond: bitrateMbps * 1000 * 1000
  };
}

function getActualRecordingSettings(stream) {
  const track = stream.getVideoTracks()[0];
  const settings = track?.getSettings?.() || {};
  const width = settings.width ? `${settings.width}` : "?";
  const height = settings.height ? `${settings.height}` : "?";
  const frameRate = settings.frameRate ? `${Math.round(settings.frameRate)}fps` : "fps不明";
  return {
    width: settings.width || 0,
    height: settings.height || 0,
    frameRate: settings.frameRate || 0,
    label: `${width}x${height} ${frameRate}`
  };
}

function getSupportedMimeType(preferredCodec = "auto") {
  const orderedTypes = {
    vp9: ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"],
    vp8: ["video/webm;codecs=vp8", "video/webm;codecs=vp9", "video/webm"],
    webm: ["video/webm", "video/webm;codecs=vp9", "video/webm;codecs=vp8"],
    auto: ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
  };
  const types = orderedTypes[preferredCodec] || orderedTypes.auto;
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

bindEvents();
refreshPresetSelect();
applyDesignPreset(false);
setScreenMode();
setSettingsOpen(false);
setListLayout();
applyVisualSettings();
renderVersionBadge();
renderCommentList();
renderTimelineDrawer();
loadDefaultThreadComments();
timerHandle = requestAnimationFrame(tick);
