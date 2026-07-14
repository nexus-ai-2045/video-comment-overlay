import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const demo = JSON.parse(fs.readFileSync("data/comments.public-demo.json", "utf8"));

test("public demo data is sanitized and useful", () => {
  assert.equal(demo.schema, "video_comment_overlay.v1");
  assert.equal(demo.source.coverage, "public-demo");
  assert.equal(demo.integrity.sanitized, true);
  assert.ok(demo.comments.length >= 3);
  assert.equal(demo.integrity.messageCount, demo.comments.length);
  assert.equal(demo.integrity.attachmentCount, 0);
});

test("public demo comments do not contain source identifiers or timestamps", () => {
  for (const comment of demo.comments) {
    assert.match(comment.authorId, /^demo-user-\d+$/);
    assert.match(comment.authorName, /^参加者[A-ZＡ-ＺA-G]$|^参加者[A-G]$/);
    assert.equal(comment.avatarUrl || "", "");
    assert.deepEqual(comment.attachments, []);
    assert.equal(Object.hasOwn(comment, "timestamp"), false);
  }
});
