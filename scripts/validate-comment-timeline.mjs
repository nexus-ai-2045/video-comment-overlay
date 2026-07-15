import fs from "node:fs";
import path from "node:path";

function readArgs(argv) {
  const args = { file: "", videoStart: "" };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--video-start") {
      args.videoStart = argv[index + 1] || "";
      index += 1;
    } else if (!args.file) {
      args.file = value;
    }
  }
  return args;
}

function parseMs(value) {
  if (!value) return Number.NaN;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function getRows(data) {
  if (Array.isArray(data)) return data;
  return data.comments || data.items || data.messages || [];
}

function numericValues(rows, key) {
  return rows.map((row) => Number(row[key])).filter(Number.isFinite);
}

function range(values) {
  if (!values.length) return { min: null, max: null, spanSeconds: null };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    spanSeconds: Math.round((sorted[sorted.length - 1] - sorted[0]) * 100) / 100
  };
}

function countNonMonotonic(values) {
  let count = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] < values[index - 1]) count += 1;
  }
  return count;
}

const args = readArgs(process.argv);
if (!args.file) {
  console.error("Usage: node scripts/validate-comment-timeline.mjs <comments.json> [--video-start <iso-or-local-datetime>]");
  process.exit(2);
}

const filePath = path.resolve(args.file);
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
const rows = getRows(data);
const times = numericValues(rows, "time");
const timestampMsValues = rows.map((row) => parseMs(row.timestamp)).filter(Number.isFinite);
const videoStartValue = args.videoStart || data.timeline?.videoStartAt || "";
const videoStartMs = parseMs(videoStartValue);
const timestampSeconds = timestampMsValues
  .map((value) => (Number.isFinite(videoStartMs) ? Math.max(0, (value - videoStartMs) / 1000) : Number.NaN))
  .filter(Number.isFinite);
const beforeVideoStartCount = timestampMsValues.filter((value) => Number.isFinite(videoStartMs) && value < videoStartMs).length;
const blockers = [];
const warnings = [];

if (!rows.length) blockers.push("comments_empty");
if (timestampMsValues.length && !Number.isFinite(videoStartMs)) blockers.push("video_start_not_parseable");
if (timestampMsValues.length && Number.isFinite(videoStartMs) && timestampSeconds.every((value) => value === 0)) {
  blockers.push("video_start_after_all_timestamps");
}
if (timestampMsValues.length && times.length && range(timestampSeconds).spanSeconds > range(times).spanSeconds * 3) {
  warnings.push("saved_time_range_much_shorter_than_timestamp_range");
}

const report = {
  file: filePath,
  schema: data.schema || "",
  sourceType: data.source?.type || "",
  coverage: data.source?.coverage || data.manifest?.coverage || "",
  commentTimeMode: data.timeline?.commentTimeMode || "",
  count: rows.length,
  time: range(times),
  timestamp: {
    parsed: timestampMsValues.length,
    missingOrUnparseable: rows.length - timestampMsValues.length,
    spanSeconds: timestampMsValues.length ? Math.round(((Math.max(...timestampMsValues) - Math.min(...timestampMsValues)) / 1000) * 100) / 100 : null,
    nonMonotonicInFileOrder: countNonMonotonic(timestampMsValues)
  },
  recalculatedFromVideoStart: {
    videoStart: videoStartValue,
    parsed: Number.isFinite(videoStartMs),
    beforeVideoStartCount,
    range: range(timestampSeconds)
  },
  warnings,
  blockers
};

console.log(JSON.stringify(report, null, 2));
process.exit(blockers.length ? 1 : 0);
