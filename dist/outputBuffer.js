"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputBuffer = void 0;
/**
 * Collects text until no new output arrives for delayMs.
 * The latest completed batch remains available until cleared or replaced.
 */
class OutputBuffer {
    delayMs;
    onBatchReady;
    pending = "";
    latest = "";
    timer;
    constructor(delayMs = 10_000, onBatchReady = () => undefined) {
        this.delayMs = delayMs;
        this.onBatchReady = onBatchReady;
    }
    append(chunk) {
        if (!chunk) {
            return;
        }
        this.pending += chunk;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.flush(), this.delayMs);
    }
    flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        if (!this.pending) {
            return;
        }
        this.latest = this.pending;
        this.pending = "";
        this.onBatchReady(this.latest);
    }
    get latestBatch() {
        return this.latest;
    }
    get hasPendingOutput() {
        return this.pending.length > 0;
    }
    clear() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        this.pending = "";
        this.latest = "";
    }
    dispose() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }
}
exports.OutputBuffer = OutputBuffer;
//# sourceMappingURL=outputBuffer.js.map