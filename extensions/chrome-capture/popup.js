const els = {
  tabInfo: document.querySelector("#tabInfo"),
  platform: document.querySelector("#platform"),
  videoStartAt: document.querySelector("#videoStartAt"),
  captureVisible: document.querySelector("#captureVisible"),
  downloadJson: document.querySelector("#downloadJson"),
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
  if (!latestCapture) return;
  const blob = new Blob([`${JSON.stringify(latestCapture, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({
    url,
    filename: filenameFor(latestCapture),
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
    els.resultCount.textContent = `${count}件 / ${latestCapture.source?.type || "unknown"}`;
    els.downloadJson.disabled = count === 0;
    setStatus(count ? "取得しました。JSON保存できます。" : "見えているコメントDOMを検出できませんでした。");
  } catch (error) {
    latestCapture = null;
    els.resultCount.textContent = "取得失敗";
    setStatus(error.message);
  } finally {
    els.captureVisible.disabled = false;
  }
});

els.downloadJson.addEventListener("click", () => {
  downloadLatest().catch((error) => setStatus(`保存エラー: ${error.message}`));
});

getActiveTab().catch((error) => setStatus(error.message));
