import { rules as r } from "../config/rules";
export type Direction = "up" | "down" | "left" | "right";
export type Phase = "ready" | "playing" | "dead" | "crossed" | "over";
export interface Vehicle {
  x: number;
}
export class Game {
  phase: Phase = "ready";
  frog = {
    column: r.startColumn as number,
    row: r.startRow as number,
    direction: "up" as Direction,
  };
  vehicles: Vehicle[] = [];
  score = 0;
  lives: number = r.initialLives;
  crossings = 0;
  private bestRow: number = r.startRow;
  private wait = 0;
  constructor() {
    this.resetTraffic();
  }
  start() {
    if (this.phase !== "ready" && this.phase !== "over") return;
    this.score = 0;
    this.lives = r.initialLives;
    this.crossings = 0;
    this.resetTraffic();
    this.resetFrog();
    this.phase = "playing";
  }
  private resetTraffic() {
    this.vehicles = Array.from({ length: r.vehicleCount }, (_, i) => ({
      x: r.vehicleOffset + i * r.vehicleSpacing,
    }));
  }
  private resetFrog() {
    this.frog = { column: r.startColumn, row: r.startRow, direction: "up" };
    this.bestRow = r.startRow;
  }
  move(direction: Direction) {
    if (this.phase !== "playing") return;
    const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    const dy = direction === "up" ? -1 : direction === "down" ? 1 : 0;
    const column = this.frog.column + dx,
      row = this.frog.row + dy;
    if (
      column < 0 ||
      column >= r.columns ||
      row < r.firstRow ||
      row > r.startRow
    )
      return;
    this.frog = { column, row, direction };
    if (row < this.bestRow) {
      this.score += r.forwardPoints;
      this.bestRow = row;
    }
    this.checkCollision();
    if (this.phase === "playing" && row === r.firstRow) {
      this.crossings++;
      this.phase = "crossed";
      this.wait = r.crossingSeconds;
    }
  }
  update(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    // Small substeps also protect direct callers against traffic tunnelling.
    let remaining = seconds;
    while (remaining > 1e-9) {
      const dt = Math.min(remaining, r.fixedStep);
      this.step(dt);
      remaining -= dt;
    }
  }
  private step(dt: number) {
    if (this.phase === "ready" || this.phase === "over") return;
    if (this.phase === "dead" || this.phase === "crossed") {
      this.wait -= dt;
      if (this.wait <= 1e-9) {
        if (this.lives === 0) this.phase = "over";
        else {
          this.resetFrog();
          this.phase = "playing";
        }
      }
      return;
    }
    const cycle = r.vehicleCount * r.vehicleSpacing;
    for (const car of this.vehicles) {
      car.x += r.trafficSpeed * dt;
      while (car.x < -r.vehicleWidth) car.x += cycle;
    }
    this.checkCollision();
  }
  private checkCollision() {
    if (this.frog.row !== r.trafficRow) return;
    const left = this.frog.column * r.cell + r.frogInset;
    const right = (this.frog.column + 1) * r.cell - r.frogInset;
    if (
      this.vehicles.some(
        (car) => left < car.x + r.vehicleWidth && right > car.x,
      )
    ) {
      this.lives--;
      this.phase = "dead";
      this.wait = r.deathSeconds;
    }
  }
}
