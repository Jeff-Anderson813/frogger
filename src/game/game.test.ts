import { describe, expect, it } from "vitest";
import { Game } from "./game";
import { rules as r, roadLanes, riverLanes } from "../config/rules";
import { spawnActors } from "../systems/spawning";
import { turtleState } from "../systems/collision";
import type { Actor, Direction } from "../entities/types";

function playing() {
  const game = new Game();
  game.start();
  return game;
}
function empty() {
  const game = playing();
  game.actors = [];
  return game;
}
function actor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "test-0",
    x: 70,
    row: 7,
    width: 64,
    speed: 20,
    cycle: 320,
    kind: "log",
    diving: false,
    diveOffset: 0,
    ...overrides,
  };
}
function hop(game: Game, direction: Direction) {
  game.move(direction);
  game.update(r.hopSeconds);
}
function enterHome(game: Game, index: number) {
  game.frog = { x: r.homeColumns[index] * r.cell, row: 3, direction: "up" };
  game.hopRemaining = 0;
  game.move("up");
}
describe("game structure and controls", () => {
  it("has five traffic and five river lanes with correct structural order", () => {
    expect(roadLanes.map((l) => l.row)).toEqual([13, 12, 11, 10, 9]);
    expect(roadLanes.map((l) => Math.sign(l.speed))).toEqual([
      -1, 1, -1, 1, -1,
    ]);
    expect(riverLanes.map((l) => l.row)).toEqual([7, 6, 5, 4, 3]);
    expect(r.homeColumns).toHaveLength(5);
  });
  it("waits for start, then hops discretely in four directions", () => {
    const game = new Game();
    game.move("up");
    game.update(1);
    expect(game.phase).toBe("ready");
    expect(game.frog.row).toBe(14);
    game.start();
    game.actors = [];
    hop(game, "up");
    expect(game.frog.row).toBe(13);
    hop(game, "left");
    expect(game.frog.x).toBe(80);
    hop(game, "right");
    expect(game.frog.x).toBe(96);
    hop(game, "down");
    expect(game.frog.row).toBe(14);
  });
  it("bounds movement and ignores input during a hop", () => {
    const game = empty();
    game.move("down");
    expect(game.frog.row).toBe(14);
    game.move("up");
    game.move("up");
    expect(game.frog.row).toBe(13);
    game.update(r.hopSeconds);
    for (let i = 0; i < 20; i++) hop(game, "left");
    expect(game.frog.x).toBe(0);
    for (let i = 0; i < 20; i++) hop(game, "right");
    expect(game.frog.x).toBe(192);
  });
  it("does not farm forward score by repeating the same row or score safe strips", () => {
    const game = empty();
    hop(game, "up");
    hop(game, "down");
    hop(game, "up");
    expect(game.score).toBe(10);
    for (let i = 0; i < 5; i++) hop(game, "up");
    expect(game.frog.row).toBe(8);
    expect(game.score).toBe(50);
  });
  it("does not restart active play", () => {
    const game = empty();
    hop(game, "up");
    game.start();
    expect(game.score).toBe(10);
  });
});
describe("road collision and lifecycle", () => {
  it.each(roadLanes)("collides with traffic on row $row", (lane) => {
    const game = empty();
    game.actors = [
      actor({
        row: lane.row,
        kind: lane.kind,
        speed: lane.speed,
        x: 96,
        width: lane.width,
      }),
    ];
    game.frog = { x: 96, row: lane.row + 1, direction: "up" };
    game.move("up");
    expect(game.phase).toBe("dead");
    expect(game.deathReason).toBe("traffic");
    expect(game.lives).toBe(2);
  });
  it("leaves a safely clear frog alive and treats touching edges as clear", () => {
    const game = empty();
    game.actors = [actor({ row: 13, kind: "car", x: 74, width: 25, speed: 0 })];
    hop(game, "up");
    expect(game.phase).toBe("playing");
  });
  it("detects moving vehicle collision without tunnelling at a long update", () => {
    const game = empty();
    game.actors = [
      actor({ row: 13, kind: "car", x: 130, width: 25, speed: -120 }),
    ];
    game.move("up");
    game.update(0.3);
    expect(game.phase).toBe("dead");
  });
  it("loses only one life, blocks dead-state moves and resets with score preserved", () => {
    const game = empty();
    game.actors = [actor({ row: 13, kind: "car", x: 96 })];
    game.move("up");
    game.move("left");
    game.update(0.4);
    expect(game.lives).toBe(2);
    expect(game.frog.x).toBe(96);
    game.update(0.4);
    expect(game.phase).toBe("playing");
    expect(game.frog.row).toBe(14);
    expect(game.score).toBe(10);
    expect(game.remaining).toBe(r.crossingSeconds);
  });
  it("wraps actors in both directions and keeps lane spacing", () => {
    const game = empty();
    game.actors = [
      actor({ x: -63, width: 64, speed: -20 }),
      actor({ x: 255, width: 64, speed: 20 }),
    ];
    game.update(0.1);
    expect(game.actors[0].x).toBeCloseTo(255);
    expect(game.actors[1].x).toBeCloseTo(-63);
  });
  it("runs down the crossing timer, then resets it on respawn", () => {
    const game = empty();
    game.remaining = 0.02;
    game.update(0.03);
    expect(game.phase).toBe("dead");
    expect(game.deathReason).toBe("time");
    game.update(r.deathSeconds);
    expect(game.remaining).toBeCloseTo(r.crossingSeconds);
  });
  it("ends on the final life and restarts with a clean board", () => {
    const game = empty();
    game.lives = 1;
    game.remaining = 0.001;
    game.update(r.fixedStep);
    expect(game.phase).toBe("dead");
    expect(game.lives).toBe(0);
    game.update(r.deathSeconds);
    expect(game.phase).toBe("over");
    game.start();
    expect(game.phase).toBe("playing");
    expect(game.lives).toBe(3);
    expect(game.level).toBe(1);
    expect(game.score).toBe(0);
    expect(game.homes.some(Boolean)).toBe(false);
  });
});
describe("river physics", () => {
  it("drowns immediately on unsupported water", () => {
    const game = empty();
    game.frog.row = 8;
    game.move("up");
    expect(game.phase).toBe("dead");
    expect(game.deathReason).toBe("water");
  });
  it("rides a platform continuously while keeping row and hop size", () => {
    const game = empty();
    game.actors = [actor()];
    game.frog.row = 8;
    game.move("up");
    game.update(0.5);
    expect(game.phase).toBe("playing");
    expect(game.frog.x).toBeCloseTo(106);
    expect(game.frog.row).toBe(7);
    game.move("left");
    expect(game.frog.x).toBeCloseTo(90);
  });
  it("requires the entire inset frog hitbox to be supported", () => {
    const game = empty();
    game.actors = [actor({ x: 106 })];
    game.frog.row = 8;
    game.move("up");
    expect(game.phase).toBe("dead");
  });
  it.each([-20, 20])(
    "dies when carried beyond a river boundary at speed %i",
    (speed) => {
      const game = empty();
      const x = speed < 0 ? 0 : 192;
      game.frog = { x, row: 7, direction: "up" };
      game.actors = [actor({ x: x - 8, speed })];
      game.update(r.fixedStep);
      expect(game.phase).toBe("dead");
      expect(game.deathReason).toBe("edge");
    },
  );
  it("can safely hop from a platform to the median", () => {
    const game = empty();
    game.frog.row = 7;
    game.actors = [actor()];
    game.move("down");
    expect(game.phase).toBe("playing");
    expect(game.frog.row).toBe(8);
  });
  it("warns before a diving turtle submerges, then resurfaces", () => {
    const turtle = actor({ kind: "turtle", diving: true });
    expect(turtleState(turtle, 0)).toBe("surface");
    expect(turtleState(turtle, 6)).toBe("warning");
    expect(turtleState(turtle, 7)).toBe("submerged");
    expect(turtleState(turtle, 8)).toBe("surface");
  });
  it("drowns a rider when its turtle submerges", () => {
    const game = empty();
    game.elapsed = r.diveStart - 0.01;
    game.actors = [actor({ kind: "turtle", diving: true, speed: 0 })];
    game.frog.row = 7;
    game.update(0.02);
    expect(game.phase).toBe("dead");
    expect(game.deathReason).toBe("water");
  });
  it("rejects a hop onto already submerged turtles", () => {
    const game = empty();
    game.elapsed = 7;
    game.actors = [actor({ kind: "turtle", diving: true })];
    game.frog.row = 8;
    game.move("up");
    expect(game.phase).toBe("dead");
  });
});
describe("homes, scoring and progression", () => {
  it.each([0, 1, 2, 3, 4])("accepts unoccupied home %i", (index) => {
    const game = empty();
    enterHome(game, index);
    expect(game.phase).toBe("home");
    expect(game.homes[index]).toBe(true);
    expect(game.crossings).toBe(1);
    expect(game.lives).toBe(3);
  });
  it("awards home, remaining-time and fly points, then resets the crossing", () => {
    const game = empty();
    game.elapsed = 0;
    game.remaining = 25;
    enterHome(game, 0);
    expect(game.score).toBe(r.homePoints + 25 * r.timePoints + r.bonusPoints);
    game.update(r.homeSeconds);
    expect(game.frog.row).toBe(14);
    expect(game.phase).toBe("playing");
    expect(game.remaining).toBe(60);
    expect(game.homes[0]).toBe(true);
  });
  it("kills entry into an occupied home", () => {
    const game = empty();
    game.homes[2] = true;
    enterHome(game, 2);
    expect(game.phase).toBe("dead");
    expect(game.deathReason).toBe("home");
    expect(game.score).toBe(0);
  });
  it("kills entry between homes", () => {
    const game = empty();
    game.frog = { x: 16, row: 3, direction: "up" };
    game.move("up");
    expect(game.phase).toBe("dead");
    expect(game.homes.some(Boolean)).toBe(false);
  });
  it("uses a strict alignment tolerance for platform-carried frogs", () => {
    const game = empty();
    game.frog = { x: 96 + r.homeTolerance + 1, row: 3, direction: "up" };
    game.move("up");
    expect(game.phase).toBe("dead");
  });
  it("advances only after the fifth distinct home, awards 1000, clears homes and increases speeds", () => {
    const game = empty();
    game.homes = [true, true, true, true, false];
    game.elapsed = 5;
    enterHome(game, 4);
    expect(game.phase).toBe("level");
    expect(game.score).toBe(r.homePoints + 60 * r.timePoints + r.levelPoints);
    game.move("up");
    expect(game.crossings).toBe(1);
    game.update(r.levelSeconds);
    expect(game.level).toBe(2);
    expect(game.phase).toBe("playing");
    expect(game.homes.some(Boolean)).toBe(false);
    expect(game.speedMultiplier).toBeGreaterThan(1);
    expect(Math.abs(game.actors[0].speed)).toBeGreaterThan(
      Math.abs(spawnActors(1)[0].speed),
    );
  });
  it("awards one extra life at 20000 points, only once per game", () => {
    const game = empty();
    game.score = 19995;
    hop(game, "up");
    expect(game.lives).toBe(4);
    game.score = 39995;
    hop(game, "up");
    expect(game.lives).toBe(4);
  });
  it("preserves occupied homes and resets carried bonuses after death", () => {
    const game = empty();
    game.homes[1] = true;
    game.carryingLady = true;
    game.remaining = 0.001;
    game.update(r.fixedStep);
    game.update(r.deathSeconds);
    expect(game.homes[1]).toBe(true);
    expect(game.carryingLady).toBe(false);
  });
});
describe("bonus and creature rules", () => {
  it("collects a lady frog on a log and awards the escort bonus at home", () => {
    const game = empty();
    game.actors = [actor({ id: "6-0", row: 6, x: 72, width: 64, speed: 0 })];
    game.frog = { x: 96, row: 7, direction: "up" };
    game.move("up");
    expect(game.carryingLady).toBe(true);
    expect(game.lady).toBeUndefined();
    game.elapsed = 5;
    game.hopRemaining = 0;
    enterHome(game, 2);
    expect(game.lastAward).toBe(50 + 600 + 200);
  });
  it("kills entry into a crocodile-occupied home in later rounds", () => {
    const game = empty();
    game.level = 2;
    game.elapsed = 12;
    const index = game.homeEvent!.index;
    expect(game.homeEvent!.kind).toBe("crocodile");
    enterHome(game, index);
    expect(game.phase).toBe("dead");
    expect(game.homes[index]).toBe(false);
  });
  it("allows crocodile backs but kills a frog in its open mouth", () => {
    const game = empty();
    game.actors = [
      actor({ kind: "crocodile", row: 3, x: 70, width: 64, speed: 0 }),
    ];
    game.frog = { x: 96, row: 4, direction: "up" };
    game.move("up");
    expect(game.phase).toBe("playing");
    game.hopRemaining = 0;
    game.move("right");
    expect(game.phase).toBe("dead");
    expect(game.deathReason).toBe("creature");
  });
  it("spawns and checks the later-round median snake and river otter", () => {
    const game = empty();
    game.level = 4;
    game.elapsed = 8;
    expect(game.hazards.map((h) => h.kind)).toEqual(["snake", "otter"]);
    const snake = game.hazards[0];
    game.frog = { x: snake.x, row: 9, direction: "up" };
    game.move("up");
    expect(game.phase).toBe("dead");
    expect(game.deathReason).toBe("creature");
  });
});
