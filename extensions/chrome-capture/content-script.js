(() => {
  if (window.__VCO_CAPTURE__) return;

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
      const key = `${row.authorName}\n${row.text}\n${row.timestamp}`;
      if (!row.text || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function captureDiscord() {
    const nodes = [
      ...document.querySelectorAll('[id^="chat-messages-"], [data-list-item-id*="chat-messages"], li[class*="messageListItem"]')
    ];
    return uniqueRows(nodes.map((node, index) => {
      const authorName = textOf(node, ['[class*="username"]', '[class*="headerText"] span', 'h3 span']);
      const text = textOf(node, ['[id^="message-content-"]', '[class*="messageContent"]']) || visibleText(node);
      const timestamp =
        attrOf(node, ["time"], "datetime") ||
        attrOf(node, ['[aria-label*=":"]'], "aria-label") ||
        "";
      const avatarUrl = attrOf(node, ["img"], "src");
      return { id: `visible-discord-${index + 1}`, authorName, text, timestamp, avatarUrl };
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
      return {
        id: row.id || `visible-comment-${index + 1}`,
        authorId,
        authorName,
        time: index * 2,
        timestamp: row.timestamp || "",
        text: row.text,
        kind: "message",
        emoji: [],
        stickers: [],
        attachments: []
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
        commentTimeMode: "relative-visible-order"
      },
      participants,
      comments,
      manifest: {
        coverage: "partial",
        messageCount: comments.length,
        participantCount: Object.keys(participants).length,
        blockers: comments.length ? [] : ["visible_comment_nodes_not_found"],
        note: "このMVPは表示中DOMから見えている範囲だけを取得します。完全履歴は保証しません。"
      }
    };
  }

  window.__VCO_CAPTURE__ = {
    capture(options = {}) {
      const platform = options.platform && options.platform !== "auto" ? options.platform : detectPlatform();
      const rows = rowsFor(platform);
      return normalizeRows(rows, platform, options.videoStartAt || "");
    }
  };
})();
