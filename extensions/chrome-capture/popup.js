const els = {
  tabInfo: document.querySelector("#tabInfo"),
  platform: document.querySelector("#platform"),
  videoStartAt: document.querySelector("#videoStartAt"),
  captureVisible: document.querySelector("#captureVisible"),
  downloadJson: document.querySelector("#downloadJson"),
  rangePanel: document.querySelector("#rangePanel"),
  rangeStart: document.querySelector("#rangeStart"),
  rangeEnd: document.querySelector("#rangeEnd"),
  rangeSummary: document.querySelector("#rangeSummary"),
  previewList: document.querySelector("#previewList"),
  resultCount: document.querySelector("#resultCount"),
  status: document.querySelector("#status")
};

let activeTab = null;
let latestCapture = null;

function setStatus(message) {
  els.status.textContent = message;
}

function detectPlatformFromUrl(url = "") {
  if (/discord\.com/i.test(url)) return "discord";
  if (/youtube\.com/i.test(url)) return "youtube";
  if (/twitch\.tv/i.test(url)) return "twitch";
  return "auto";
}

function localDateTimeToIso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatCommentTime(comment) {
  if (comment.timestamp) return comment.timestamp;
  if (Number.isFinite(Number(comment.time))) return `${Math.round(Number(comment.time) * 10) / 10}s`;
  return "時刻なし";
}

function clampRange() {
  const count = latestCapture?.comments?.length || 0;
  const start = Math.max(1, Math.min(count, Number(els.rangeStart.value) || 1));
  const end = Math.max(start, Math.min(count, Number(els.rangeEnd.value) || count));
  els.rangeStart.value = String(start);
  els.rangeEnd.value = String(end);
  return { start, end, count };
}

function getSelectedCapture() {
  if (!latestCapture) return null;
  const { start, end, count } = clampRange();
  const selectedComments = latestCapture.comments.slice(start - 1, end);
  const participants = {};
  for (const comment of selectedComments) {
    if (latestCapture.participants?.[comment.authorId]) {
      participants[comment.authorId] = latestCapture.participants[comment.authorId];
    }
  }
  return {
    ...latestCapture,
    participants,
    comments: selectedComments,
    manifest: {
      ...latestCapture.manifest,
      messageCount: selectedComments.length,
      originalMessageCount: count,
      selectedRange: { start, end },
      omittedBeforeSelection: start - 1,
      omittedAfterSelection: count - end
    }
  };
}

function renderPreview() {
  const count = latestCapture?.comments?.length || 0;
  els.rangePanel.hidden = count === 0;
  if (!count) {
    els.previewList.replaceChildren();
    els.rangeSummary.textContent = "範囲未選択";
    return;
  }
  els.rangeStart.max = String(count);
  els.rangeEnd.max = String(count);
  const { start, end } = clampRange();
  const selectedCount = end - start + 1;
  const first = latestCapture.comments[start - 1];
  const last = latestCapture.comments[end - 1];
  els.rangeSummary.textContent = `${selectedCount}件を保存 / 先頭 ${formatCommentTime(first)} / 末尾 ${formatCommentTime(last)}`;
  const previewItems = latestCapture.comments.slice(Math.max(0, start - 1), Math.min(count, start + 5));
  els.previewList.replaceChildren(
    ...previewItems.map((comment, index) => {
      const item = document.createElement("li");
      const meta = document.createElement("strong");
      const text = document.createElement("span");
      meta.textContent = `#${start + index} ${comment.authorName || "unknown"} / ${formatCommentTime(comment)}`;
      text.textContent = comment.text || "";
      item.append(meta, text);
      return item;
    })
  );
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  const platform = detectPlatformFromUrl(tab?.url || "");
  if (platform !== "auto") els.platform.value = platform;
  els.tabInfo.textContent = tab?.title || tab?.url || "対象タブなし";
}

async function captureVisibleComments() {
  if (!activeTab?.id) await getActiveTab();
  if (!activeTab?.id) throw new Error("対象タブを取得できませんでした。");
  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    files: ["content-script.js"]
  });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: (options) => window.__VCO_CAPTURE__?.capture(options),
    args: [{
      platform: document.querySelector("#platform")?.value || "auto",
      videoStartAt: document.querySelector("#videoStartAt")?.value || ""
    }]
  });
  if (!result) throw new Error("このページでは取得スクリプトを実行できませんでした。");
  return {
    ...result,
    timeline: {
      ...result.timeline,
      videoStartAt: localDateTimeToIso(els.videoStartAt.value) || result.timeline.videoStartAt
    }
  };
}

function filenameFor(data) {
  const source = data.source?.type || "comments";
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `video-comment-overlay-${source}-${timestamp}.json`;
}

async function downloadLatest() {
  const selectedCapture = getSelectedCapture();
  if (!selectedCapture) return;
  const blob = new Blob([`${JSON.stringify(selectedCapture, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({
    url,
    filename: filenameFor(selectedCapture),
    saveAs: true
  });
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

els.captureVisible.addEventListener("click", async () => {
  els.captureVisible.disabled = true;
  els.downloadJson.disabled = true;
  setStatus("表示中コメントを取得中です。");
  try {
    latestCapture = await captureVisibleComments();
    const count = latestCapture.comments?.length || 0;
    els.rangeStart.value = "1";
    els.rangeEnd.value = String(Math.max(1, count));
    renderPreview();
    els.resultCount.textContent = `${count}件 / ${latestCapture.source?.type || "unknown"}`;
    els.downloadJson.disabled = count === 0;
    setStatus(count ? "取得しました。保存範囲を確認してからJSON保存してください。" : "見えているコメントDOMを検出できませんでした。");
  } catch (error) {
    latestCapture = null;
    renderPreview();
    els.resultCount.textContent = "取得失敗";
    setStatus(error.message);
  } finally {
    els.captureVisible.disabled = false;
  }
});

els.downloadJson.addEventListener("click", () => {
  downloadLatest().catch((error) => setStatus(`保存エラー: ${error.message}`));
});

els.rangeStart.addEventListener("input", renderPreview);
els.rangeEnd.addEventListener("input", renderPreview);

getActiveTab().catch((error) => setStatus(error.message));
