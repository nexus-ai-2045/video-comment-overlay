import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Shared loader for private markers. Marker values are never stored in this repository.
// Sources (merged, de-duplicated):
//   1. PRIVATE_MARKERS env var: one marker per line.
//   2. PRIVATE_MARKERS_FILE env var: path to a marker file (relative paths resolve from the cwd).
//      Default: .private-markers.txt at the git work tree root (or the cwd outside a git work tree).
// Marker files hold one marker per line; blank lines and lines starting with "#" are ignored.
// A marker file inside a git work tree must be untracked and gitignored; otherwise loading fails.

export const DEFAULT_MARKERS_FILE = ".private-markers.txt";

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function gitSucceeds(cwd, args) {
  try {
    git(cwd, args);
    return true;
  } catch {
    return false;
  }
}

export function findWorkTreeRoot(dir) {
  try {
    return git(dir, ["rev-parse", "--show-toplevel"]) || null;
  } catch {
    return null;
  }
}

export function parseMarkers(text) {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

// Returns an error message if the marker file could leak through git, otherwise null.
function checkMarkerFileIsPrivate(markersFile, label) {
  const dir = path.dirname(markersFile);
  const workTree = findWorkTreeRoot(dir);
  if (!workTree) return null;
  const name = path.basename(markersFile);
  if (gitSucceeds(dir, ["ls-files", "--error-unmatch", "--", name])) {
    return `Private marker file (${label}) is tracked by git. Remove it from the index (git rm --cached) and keep it gitignored; marker values are not printed.`;
  }
  if (!gitSucceeds(dir, ["check-ignore", "-q", "--", name])) {
    return `Private marker file (${label}) is inside the git work tree but not gitignored. Add it to .gitignore or move it outside the repository; marker values are not printed.`;
  }
  return null;
}

export function loadPrivateMarkers({ cwd = process.cwd(), env = process.env } = {}) {
  const sources = [];
  const markers = [];
  if (env.PRIVATE_MARKERS && env.PRIVATE_MARKERS.trim()) {
    markers.push(...parseMarkers(env.PRIVATE_MARKERS));
    sources.push("env:PRIVATE_MARKERS");
  }

  const explicitFile = env.PRIVATE_MARKERS_FILE;
  const label = explicitFile ? "PRIVATE_MARKERS_FILE" : DEFAULT_MARKERS_FILE;
  const markersFile = explicitFile
    ? path.resolve(cwd, explicitFile)
    : path.join(findWorkTreeRoot(cwd) || path.resolve(cwd), DEFAULT_MARKERS_FILE);

  if (fs.existsSync(markersFile)) {
    const error = checkMarkerFileIsPrivate(markersFile, label);
    if (error) return { markers: [], sources, markersFile, error };
    markers.push(...parseMarkers(fs.readFileSync(markersFile, "utf8")));
    sources.push(explicitFile ? "env:PRIVATE_MARKERS_FILE" : DEFAULT_MARKERS_FILE);
  } else if (explicitFile) {
    return { markers: [], sources, markersFile, error: "PRIVATE_MARKERS_FILE is set but the file does not exist." };
  }

  return { markers: [...new Set(markers)], sources, markersFile, error: null };
}
