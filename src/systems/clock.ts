import { rules } from "../config/rules";
export class FixedClock {
  private accumulator = 0;
  advance(elapsed: number, update: (dt: number) => void) {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return;
    // Pause rather than fast-forward after a suspended browser frame.
    this.accumulator += Math.min(elapsed, 0.1);
    while (this.accumulator + 1e-9 >= rules.fixedStep) {
      update(rules.fixedStep);
      this.accumulator -= rules.fixedStep;
    }
  }
  reset() {
    this.accumulator = 0;
  }
}
