import { rules as r, difficulty } from "../config/rules";
import type { Actor, Direction, Frog } from "../entities/types";
import { hits, overlaps, supports } from "../systems/collision";
import { moveActor, spawnActors } from "../systems/spawning";
export type { Direction } from "../entities/types";
export type Phase = "ready" | "playing" | "dead" | "home" | "level" | "over";
export type DeathReason =
  "traffic" | "water" | "edge" | "home" | "time" | "creature";
export interface Hazard {
  x: number;
  row: number;
  width: number;
  kind: "snake" | "otter";
}
export class Game {
  phase: Phase = "ready";
  frog: Frog = { x: r.startX, row: r.startRow, direction: "up" };
  actors: Actor[] = spawnActors(1);
  homes: boolean[] = r.homeColumns.map(() => false);
  score = 0;
  lives: number = r.initialLives;
  level = 1;
  crossings = 0;
  remaining: number = r.crossingSeconds;
  elapsed = 0;
  deathReason: DeathReason = "traffic";
  carryingLady = false;
  lastAward = 0;
  hopRemaining = 0;
  previousFrog: Frog = { ...this.frog };
  private bestRow: number = r.startRow;
  private wait = 0;
  private extraLifeGiven = false;
  private collectedLady = false;

  start() {
    if (this.phase !== "ready" && this.phase !== "over") return;
    this.score = 0;
    this.lives = r.initialLives;
    this.level = 1;
    this.crossings = 0;
    this.extraLifeGiven = false;
    this.homes.fill(false);
    this.resetLevel();
    this.phase = "playing";
  }
  private resetLevel() {
    this.actors = spawnActors(this.level);
    this.elapsed = 0;
    this.collectedLady = false;
    this.resetFrog();
  }
  private resetFrog() {
    this.frog = { x: r.startX, row: r.startRow, direction: "up" };
    this.previousFrog = { ...this.frog };
    this.hopRemaining = 0;
    this.bestRow = r.startRow;
    this.remaining = r.crossingSeconds;
    this.carryingLady = false;
  }
  move(direction: Direction) {
    if (this.phase !== "playing" || this.hopRemaining > 1e-9) return;
    const x =
      this.frog.x +
      (direction === "left" ? -r.cell : direction === "right" ? r.cell : 0);
    const row =
      this.frog.row + (direction === "up" ? -1 : direction === "down" ? 1 : 0);
    if (x < 0 || x > r.width - r.cell || row < r.homeRow || row > r.startRow)
      return;
    this.previousFrog = { ...this.frog };
    this.frog = { x, row, direction };
    this.hopRemaining = r.hopSeconds;
    // Award forward progress only across the ten hazard rows, once per crossing.
    if (row < this.bestRow) {
      if (
        r.roadRows.some((candidate) => candidate === row) ||
        r.riverRows.some((candidate) => candidate === row)
      )
        this.award(r.forwardPoints);
      this.bestRow = row;
    }
    this.checkPosition();
  }
  private award(points: number) {
    this.score += points;
    if (!this.extraLifeGiven && this.score >= r.extraLifeScore) {
      this.lives++;
      this.extraLifeGiven = true;
    }
  }
  private die(reason: DeathReason) {
    if (this.phase !== "playing") return;
    this.deathReason = reason;
    this.lives--;
    this.phase = "dead";
    this.wait = r.deathSeconds;
  }
  get homeEvent(): { index: number; kind: "fly" | "crocodile" } | undefined {
    if (this.elapsed % r.hazardPeriod >= r.hazardDuration) return;
    const free = this.homes
      .map((filled, index) => (filled ? -1 : index))
      .filter((index) => index >= 0);
    if (!free.length) return;
    const cycle = Math.floor(this.elapsed / r.hazardPeriod);
    return {
      index: free[cycle % free.length],
      kind: this.level >= 2 && cycle % 2 === 1 ? "crocodile" : "fly",
    };
  }
  get lady(): { x: number; row: number } | undefined {
    if (this.collectedLady || this.elapsed % r.ladyPeriod > 10) return;
    const log = this.actors.find(
      (actor) => actor.row === 6 && actor.id.endsWith("-0"),
    );
    return log ? { x: log.x + log.width / 2, row: log.row } : undefined;
  }
  get hazards(): Hazard[] {
    const result: Hazard[] = [];
    if (this.level >= 3)
      result.push({
        kind: "snake",
        x: ((this.elapsed * 14) % (r.width + 32)) - 32,
        row: r.medianRow,
        width: 24,
      });
    if (this.level >= 4)
      result.push({
        kind: "otter",
        x: r.width - ((this.elapsed * 24) % (r.width + 24)),
        row: 5,
        width: 16,
      });
    return result;
  }
  private checkPosition() {
    if (this.frog.row === r.homeRow) {
      const index = r.homeColumns.findIndex(
        (col) => Math.abs(this.frog.x - col * r.cell) <= r.homeTolerance,
      );
      if (
        index < 0 ||
        this.homes[index] ||
        (this.homeEvent?.index === index && this.homeEvent.kind === "crocodile")
      ) {
        this.die("home");
        return;
      }
      const bonus = this.carryingLady ? r.bonusPoints : 0;
      const fly =
        this.homeEvent?.index === index && this.homeEvent.kind === "fly"
          ? r.bonusPoints
          : 0;
      this.lastAward =
        r.homePoints +
        Math.floor(this.remaining + 1e-9) * r.timePoints +
        bonus +
        fly;
      this.award(this.lastAward);
      this.homes[index] = true;
      this.crossings++;
      if (this.homes.every(Boolean)) {
        this.award(r.levelPoints);
        this.phase = "level";
        this.wait = r.levelSeconds;
      } else {
        this.phase = "home";
        this.wait = r.homeSeconds;
      }
      return;
    }
    if (
      this.actors.some(
        (actor) =>
          (actor.kind === "car" ||
            actor.kind === "truck" ||
            actor.kind === "racer") &&
          hits(this.frog, actor),
      )
    ) {
      this.die("traffic");
      return;
    }
    if (
      this.hazards.some(
        (h) =>
          h.row === this.frog.row &&
          overlaps(
            this.frog.x + r.frogInset,
            this.frog.x + r.cell - r.frogInset,
            h.x,
            h.x + h.width,
          ),
      )
    ) {
      this.die("creature");
      return;
    }
    if (r.riverRows.some((candidate) => candidate === this.frog.row)) {
      const platform = this.actors.find((actor) =>
        supports(this.frog, actor, this.elapsed),
      );
      if (!platform) {
        this.die("water");
        return;
      }
      // Crocodiles face right; only their closed mouth can be ridden.
      if (
        platform.kind === "crocodile" &&
        this.elapsed % 3 < 1.5 &&
        this.frog.x + r.cell - r.frogInset > platform.x + platform.width - 14
      ) {
        this.die("creature");
        return;
      }
      const lady = this.lady;
      if (
        lady &&
        lady.row === this.frog.row &&
        Math.abs(this.frog.x + r.cell / 2 - lady.x) < 12
      ) {
        this.carryingLady = true;
        this.collectedLady = true;
      }
    }
  }
  update(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = seconds;
    while (remaining > 1e-9) {
      const dt = Math.min(remaining, r.fixedStep);
      this.step(dt);
      remaining -= dt;
    }
  }
  private step(dt: number) {
    if (this.phase === "ready" || this.phase === "over") return;
    this.hopRemaining = Math.max(0, this.hopRemaining - dt);
    if (
      this.phase === "dead" ||
      this.phase === "home" ||
      this.phase === "level"
    ) {
      this.wait -= dt;
      if (this.wait <= 1e-9) {
        if (this.lives === 0) this.phase = "over";
        else {
          if (this.phase === "level") {
            this.level++;
            this.homes.fill(false);
            this.resetLevel();
          } else this.resetFrog();
          this.phase = "playing";
        }
      }
      return;
    }
    const platform = this.actors.find((actor) =>
      supports(this.frog, actor, this.elapsed),
    );
    const carry = platform ? platform.speed * dt : 0;
    for (const actor of this.actors) moveActor(actor, dt);
    if (platform) {
      this.frog.x += carry;
      this.previousFrog.x += carry;
      if (this.frog.x < 0 || this.frog.x > r.width - r.cell) {
        this.die("edge");
        return;
      }
    }
    this.elapsed += dt;
    this.remaining = Math.max(0, this.remaining - dt);
    this.checkPosition();
    if (this.phase === "playing" && this.remaining <= 1e-9) this.die("time");
  }
  get speedMultiplier() {
    return difficulty(this.level);
  }
}
