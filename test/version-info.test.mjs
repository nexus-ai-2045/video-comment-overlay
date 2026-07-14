import test from "node:test";
import assert from "node:assert/strict";
import { getVersionInfo, versionScript } from "../scripts/version-info.mjs";

test("version info has package and renderable runtime script", () => {
  const info = getVersionInfo();
  assert.equal(info.name, "video-comment-overlay");
  assert.equal(info.packageVersion, "0.1.0");
  assert.ok(info.label);
  assert.match(versionScript(info), /^window\.VCO_VERSION = /);
});
