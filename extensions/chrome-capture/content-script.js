(() => {
  if (window.__VCO_CAPTURE__) return;

  const DISCORD_MESSAGE_SELECTORS = [
    '[id^="chat-messages-"]',
    '[data-list-item-id*="chat-messages"]',
    'li[class*="messageListItem"]'
  ];
  const DISCORD_MESSAGE_SELECTOR = DISCORD_MESSAGE_SELECTORS.join(", ");

  const platformMatchers = {
    discord: /(^|\.)discord\.com$/i,
    youtube: /(^|\.)youtube\.com$/i,
    twitch: /(^|\.)twitch\.tv$/i
  };

  function detectPlatform() {
    const host = location.hostname;
    return Object.entries(platformMatchers).find(([, pattern]) => pattern.test(host))?.[0] || "generic";
  }

  function textOf(root, selectors) {
    for (const selector of selectors) {
      const node = root.querySelector(selector);
      const text = node?.textContent?.trim();
      if (text) return text.replace(/\s+/g, " ");
    }
    return "";
  }

  function attrOf(root, selectors, attr) {
    for (const selector of selectors) {
      const node = root.querySelector(selector);
      const value = node?.getAttribute?.(attr);
      if (value) return value;
    }
    return "";
  }

  function visibleText(root) {
    return (root.textContent || "").trim().replace(/\s+/g, " ");
  }

  function uniqueRows(rows) {
    const seen = new Set();
    return rows.filter((row) => {
      const key = row.platformMessageId || `${row.authorName}\n${row.text}\n${row.timestamp}`;
      if (!row.text || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function parseTimestampMs(timestamp) {
    if (!timestamp) return Number.NaN;
    const parsed = Date.parse(timestamp);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  function parseVideoStartMs(videoStartAt) {
    if (!videoStartAt) return Number.NaN;
    const parsed = Date.parse(videoStartAt);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  function extractDiscordMessageId(node) {
    const rawId = node.id || node.getAttribute("data-list-item-id") || "";
    const match = rawId.match(/chat-messages[-_][^-_]+[-_](\d+)/);
    return match?.[1] || rawId || "";
  }

  function findDiscordScroller() {
    const candidates = [...document.querySelectorAll("div")].map((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const scrollable = node.scrollHeight > node.clientHeight + 40 && ["auto", "scroll"].includes(style.overflowY);
      const messageLike = node.querySelector?.(DISCORD_MESSAGE_SELECTOR);
      const score = scrollable && messageLike ? rect.width * rect.height : 0;
      return { node, score };
    }).filter((entry) => entry.score > 0);
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.node || document.querySelector('[data-list-id="chat-messages"]') || null;
  }

  function discordTimestamp(node) {
    const datetime = attrOf(node, ["time"], "datetime");
    if (datetime) return datetime;
    const label = attrOf(node, ['[aria-label*="年"][aria-label*=":"]', '[aria-label*="/"][aria-label*=":"]'], "aria-label");
    const parsed = Date.parse(label);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : label;
  }

  function discordAttachments(node) {
    return [...node.querySelectorAll("a[href], img[src]")].map((part, index) => {
      const href = part.getAttribute("href") || part.getAttribute("src") || "";
      const label = part.getAttribute("aria-label") || part.getAttribute("alt") || "";
      if (!href) return null;
      return {
        id: `visible-attachment-${index + 1}`,
        kind: part.tagName.toLowerCase() === "img" ? "image" : "link",
        url: href,
        label
      };
    }).filter(Boolean);
  }

  function rowFromDiscordNode(node, index) {
    const authorName = textOf(node, ['[class*="username"]', '[class*="headerText"] span', 'h3 span']);
    const text = textOf(node, ['[id^="message-content-"]', '[class*="messageContent"]']) || visibleText(node);
    const timestamp = discordTimestamp(node);
    const avatarUrl = attrOf(node, ["img"], "src");
    const platformMessageId = extractDiscordMessageId(node);
    return {
      id: platformMessageId ? `discord-${platformMessageId}` : `visible-discord-${index + 1}`,
      platformMessageId,
      authorName,
      text,
      timestamp,
      avatarUrl,
      attachments: discordAttachments(node),
      rawText: visibleText(node)
    };
  }

  function captureDiscord() {
    let lastAuthorName = "";
    return uniqueRows([...document.querySelectorAll(DISCORD_MESSAGE_SELECTOR)].map((node, index) => {
      const row = rowFromDiscordNode(node, index);
      if (row.authorName) lastAuthorName = row.authorName;
      return row.authorName ? row : { ...row, authorName: lastAuthorName };
    }));
  }

  function captureYoutube() {
    const nodes = [
      ...document.querySelectorAll("yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer")
    ];
    return uniqueRows(nodes.map((node, index) => {
      const authorName = textOf(node, ["#author-name", "#author-name span"]);
      const text = textOf(node, ["#message", "#content #message"]) || visibleText(node);
      const timestamp = textOf(node, ["#timestamp"]);
      const avatarUrl = attrOf(node, ["#author-photo img", "img"], "src");
      return { id: `visible-youtube-${index + 1}`, authorName, text, timestamp, avatarUrl };
    }));
  }

  function captureTwitch() {
    const nodes = [
      ...document.querySelectorAll('[data-a-target="chat-line-message"], .chat-line__message')
    ];
    return uniqueRows(nodes.map((node, index) => {
      const authorName = textOf(node, ['[data-a-target="chat-message-username"], .chat-author__display-name']);
      const messageParts = [...node.querySelectorAll('[data-a-target="chat-message-text"], span')]
        .map((part) => part.textContent?.trim())
        .filter(Boolean);
      const text = messageParts.join(" ").replace(/\s+/g, " ") || visibleText(node);
      return { id: `visible-twitch-${index + 1}`, authorName, text, timestamp: "", avatarUrl: "" };
    }));
  }

  function rowsFor(platform) {
    if (platform === "discord") return captureDiscord();
    if (platform === "youtube") return captureYoutube();
    if (platform === "twitch") return captureTwitch();
    return uniqueRows([...document.querySelectorAll("article, li, [role='listitem']")].map((node, index) => ({
      id: `visible-generic-${index + 1}`,
      authorName: "",
      text: visibleText(node),
      timestamp: "",
      avatarUrl: ""
    })));
  }

  function colorFromString(value) {
    let hash = 0;
    for (const char of String(value || "unknown")) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return `hsl(${Math.abs(hash) % 360} 68% 52%)`;
  }

  function normalizeRows(rows, platform, videoStartAt) {
    const participants = {};
    const videoStartMs = parseVideoStartMs(videoStartAt);
    let timestampTimeCount = 0;
    const comments = rows.map((row, index) => {
      const authorName = row.authorName || "unknown";
      const authorId = `visible-user-${authorName.toLowerCase().replace(/\s+/g, "-") || index + 1}`;
      if (!participants[authorId]) {
        participants[authorId] = {
          name: authorName,
          color: colorFromString(authorId),
          avatarUrl: row.avatarUrl || ""
        };
      }
      const timestampMs = parseTimestampMs(row.timestamp);
      const time =
        Number.isFinite(timestampMs) && Number.isFinite(videoStartMs)
          ? Math.max(0, (timestampMs - videoStartMs) / 1000)
          : index * 2;
      if (Number.isFinite(timestampMs) && Number.isFinite(videoStartMs)) timestampTimeCount += 1;
      return {
        id: row.id || row.platformMessageId || `visible-comment-${index + 1}`,
        authorId,
        authorName,
        time,
        timestamp: row.timestamp || "",
        text: row.text,
        kind: "message",
        emoji: [],
        stickers: [],
        attachments: row.attachments || []
      };
    });
    return {
      schema: "video_comment_overlay.v1",
      source: {
        type: platform,
        coverage: "visible-partial",
        captureMethod: "chrome-extension-visible-dom",
        sourceUrlSafeLabel: `${location.hostname}${location.pathname}`,
        capturedAt: new Date().toISOString()
      },
      timeline: {
        videoStartAt: videoStartAt || new Date().toISOString(),
        commentTimeMode: timestampTimeCount ? "timestamp-diff" : "relative-visible-order"
      },
      participants,
      comments,
      manifest: {
        coverage: "partial",
        messageCount: comments.length,
        participantCount: Object.keys(participants).length,
        timestampTimeCount,
        sourceRawCount: rows.length,
        blockers: comments.length
          ? timestampTimeCount || !videoStartAt
            ? []
            : ["timestamp_not_parseable_from_visible_dom"]
          : ["visible_comment_nodes_not_found"],
        note: "このMVPは表示中DOMから見えている範囲だけを取得します。完全履歴は保証しません。"
      }
    };
  }

  function createDiscordEngine() {
    const rowsByKey = new Map();
    let observer = null;
    let mode = "idle";
    let lastScan = null;
    let lastError = "";

    function upsertRows(rows, reason) {
      let added = 0;
      for (const row of rows) {
        const key = row.platformMessageId || `${row.authorName}\n${row.text}\n${row.timestamp}`;
        if (!key || rowsByKey.has(key)) continue;
        rowsByKey.set(key, { ...row, observedAt: new Date().toISOString(), captureReason: reason });
        added += 1;
      }
      lastScan = {
        reason,
        added,
        visibleCount: rows.length,
        total: rowsByKey.size,
        scannedAt: new Date().toISOString()
      };
      return lastScan;
    }

    function scan(reason = "manual-visible-scan") {
      const rows = captureDiscord();
      return upsertRows(rows, reason);
    }

    function startLive() {
      if (observer) observer.disconnect();
      scan("live-start-visible-scan");
      const target = findDiscordScroller() || document.body;
      observer = new MutationObserver(() => scan("live-dom-mutation"));
      observer.observe(target, { childList: true, subtree: true });
      mode = "live";
      lastError = "";
      return getStatus();
    }

    function stop() {
      if (observer) observer.disconnect();
      observer = null;
      mode = "idle";
      return getStatus();
    }

    async function backfillStep() {
      const scroller = findDiscordScroller();
      if (!scroller) {
        lastError = "discord_scroller_not_found";
        return getStatus();
      }
      scan("backfill-before-scroll");
      const beforeTop = scroller.scrollTop;
      const delta = Math.max(240, Math.floor(scroller.clientHeight * 0.76));
      scroller.scrollBy({ top: -delta, behavior: "auto" });
      await new Promise((resolve) => setTimeout(resolve, 900));
      const afterTop = scroller.scrollTop;
      scan("backfill-after-scroll");
      mode = observer ? "live" : "backfill";
      lastError = beforeTop === afterTop && beforeTop > 0 ? "scroll_position_unchanged" : "";
      return {
        ...getStatus(),
        scroll: {
          beforeTop,
          afterTop,
          reachedTop: afterTop <= 2,
          scrollHeight: scroller.scrollHeight,
          clientHeight: scroller.clientHeight
        }
      };
    }

    function getRows() {
      return [...rowsByKey.values()].sort((a, b) => {
        const aTime = parseTimestampMs(a.timestamp);
        const bTime = parseTimestampMs(b.timestamp);
        if (Number.isFinite(aTime) && Number.isFinite(bTime)) return aTime - bTime;
        return 0;
      });
    }

    function getStatus() {
      const rows = getRows();
      return {
        ok: true,
        platform: "discord",
        mode,
        total: rows.length,
        firstTimestamp: rows.find((row) => row.timestamp)?.timestamp || "",
        lastTimestamp: [...rows].reverse().find((row) => row.timestamp)?.timestamp || "",
        lastScan,
        lastError,
        observing: Boolean(observer),
        url: location.href,
        title: document.title
      };
    }

    function exportCapture(options = {}) {
      const rows = getRows();
      const data = normalizeRows(rows, "discord", options.videoStartAt || "");
      return {
        ...data,
        source: {
          ...data.source,
          coverage: rows.length ? "chrome-extension-captured-partial" : "visible-partial",
          captureMethod: "chrome-extension-discord-session"
        },
        manifest: {
          ...data.manifest,
          coverage: rows.length ? "partial" : "blocked",
          captureMode: mode,
          lastScan,
          blockers: [
            ...(data.manifest?.blockers || []),
            ...(lastError ? [lastError] : [])
          ],
          note: "Discord Webの表示済みDOMと、ユーザー操作または拡張操作で到達した範囲を保存します。Bot/APIなしのため完全履歴は保証しません。"
        },
        sourceRaw: rows.map((row) => ({
          id: row.id,
          platformMessageId: row.platformMessageId,
          authorName: row.authorName,
          timestamp: row.timestamp,
          text: row.text,
          rawText: row.rawText,
          observedAt: row.observedAt,
          captureReason: row.captureReason
        }))
      };
    }

    return { scan, startLive, stop, backfillStep, getStatus, exportCapture };
  }

  const discordEngine = createDiscordEngine();

  window.__VCO_CAPTURE__ = {
    capture(options = {}) {
      const platform = options.platform && options.platform !== "auto" ? options.platform : detectPlatform();
      const rows = rowsFor(platform);
      return normalizeRows(rows, platform, options.videoStartAt || "");
    },
    discordEngine(command, options = {}) {
      if (detectPlatform() !== "discord") {
        return { ok: false, platform: detectPlatform(), error: "active_tab_is_not_discord" };
      }
      if (command === "scan") return discordEngine.scan(options.reason || "manual-visible-scan");
      if (command === "startLive") return discordEngine.startLive();
      if (command === "stop") return discordEngine.stop();
      if (command === "backfillStep") return discordEngine.backfillStep();
      if (command === "status") return discordEngine.getStatus();
      if (command === "export") return discordEngine.exportCapture(options);
      return { ok: false, error: "unknown_discord_engine_command" };
    }
  };
})();
