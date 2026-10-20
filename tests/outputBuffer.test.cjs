const test = require("node:test");
const assert = require("node:assert/strict");
const { OutputBuffer } = require("../dist/outputBuffer.js");

test("combines chunks into one batch after inactivity", async () => {
  const ready = [];
  const buffer = new OutputBuffer(30, (batch) => ready.push(batch));

  buffer.append("first\n");
  buffer.append("second\n");

  await new Promise((resolve) => setTimeout(resolve, 60));

  assert.deepEqual(ready, ["first\nsecond\n"]);
  assert.equal(buffer.latestBatch, "first\nsecond\n");
  buffer.dispose();
});

test("new output resets the inactivity timer", async () => {
  const ready = [];
  const buffer = new OutputBuffer(50, (batch) => ready.push(batch));

  buffer.append("one");
  await new Promise((resolve) => setTimeout(resolve, 30));
  buffer.append("two");
  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.deepEqual(ready, []);
  await new Promise((resolve) => setTimeout(resolve, 35));

  assert.deepEqual(ready, ["onetwo"]);
  buffer.dispose();
});

test("flush makes pending output available immediately", () => {
  const buffer = new OutputBuffer(10_000);

  buffer.append("captured output");
  buffer.flush();

  assert.equal(buffer.latestBatch, "captured output");
  assert.equal(buffer.hasPendingOutput, false);
  buffer.dispose();
});

test("clear removes pending and completed output", () => {
  const buffer = new OutputBuffer(10_000);

  buffer.append("pending");
  buffer.flush();
  buffer.append("next pending");
  buffer.clear();

  assert.equal(buffer.latestBatch, "");
  assert.equal(buffer.hasPendingOutput, false);
  buffer.dispose();
});
