import { describe, expect, it } from "vitest";
import { Game } from "./game";
import { rules as r } from "../config/rules";

function playing() {
  const game = new Game();
  game.start();
  return game;
}
describe("traffic prototype rules", () => {
  it("waits for start and ignores movement before play", () => {
    const game = new Game();
    game.move("up");
    game.update(1);
    expect(game.frog.row).toBe(r.startRow);
    expect(game.phase).toBe("ready");
  });
  it("moves exactly one cell in all four directions", () => {
    const game = playing();
    game.move("up");
    expect(game.frog.row).toBe(11);
    game.move("left");
    expect(game.frog.column).toBe(5);
    game.move("right");
    expect(game.frog.column).toBe(6);
    game.move("down");
    expect(game.frog.row).toBe(12);
  });
  it("bounds movement and prevents backward/forward score farming", () => {
    const game = playing();
    game.move("down");
    expect(game.frog.row).toBe(12);
    for (let i = 0; i < 20; i++) game.move("left");
    expect(game.frog.column).toBe(0);
    game.move("up");
    game.move("down");
    game.move("up");
    expect(game.score).toBe(10);
    for (let i = 0; i < 20; i++) game.move("right");
    expect(game.frog.column).toBe(12);
  });
  it("kills on immediate vehicle overlap, once only, then resets", () => {
    const game = playing();
    game.vehicles = [{ x: 96 }];
    game.move("up");
    game.move("up");
    expect(game.phase).toBe("dead");
    expect(game.lives).toBe(2);
    game.move("left");
    game.update(0.4);
    expect(game.frog.column).toBe(6);
    expect(game.lives).toBe(2);
    game.update(0.4);
    expect(game.phase).toBe("playing");
    expect(game.frog.row).toBe(12);
    expect(game.score).toBe(20);
  });
  it("leaves a safely clear frog alive; touching edges do not overlap", () => {
    const game = playing();
    game.vehicles = [{ x: 72 }];
    game.move("up");
    game.move("up");
    expect(game.phase).toBe("playing");
    // Frog hitbox begins at 99; car right edge is exactly 99.
    game.vehicles = [{ x: 74 }];
    game.update(r.fixedStep);
    expect(game.phase).toBe("playing");
  });
  it("detects a moving vehicle hitting a stationary frog", () => {
    const game = playing();
    game.vehicles = [{ x: 130 }];
    game.move("up");
    game.move("up");
    game.update(0.6);
    expect(game.phase).toBe("dead");
  });
  it("wraps traffic with preserved spacing", () => {
    const game = playing();
    game.vehicles = [{ x: -24 }];
    game.update(0.1);
    expect(game.vehicles[0].x).toBeCloseTo(
      -24 - 3.6 + r.vehicleCount * r.vehicleSpacing,
    );
  });
  it("completes a crossing and resets without losing a life or score", () => {
    const game = playing();
    game.vehicles = [];
    for (let i = 0; i < 10; i++) game.move("up");
    expect(game.phase).toBe("crossed");
    expect(game.crossings).toBe(1);
    expect(game.score).toBe(100);
    game.update(r.crossingSeconds);
    expect(game.phase).toBe("playing");
    expect(game.frog.row).toBe(12);
    expect(game.lives).toBe(3);
    game.move("up");
    expect(game.score).toBe(110);
  });
  it("ends after the last life and starts a clean new game", () => {
    const game = playing();
    for (let life = 0; life < 3; life++) {
      game.vehicles = [{ x: 96 }];
      game.move("up");
      game.move("up");
      game.update(r.deathSeconds);
    }
    expect(game.phase).toBe("over");
    expect(game.lives).toBe(0);
    game.move("left");
    game.start();
    expect(game.phase).toBe("playing");
    expect(game.lives).toBe(3);
    expect(game.score).toBe(0);
  });
  it("does not restart an active game", () => {
    const game = playing();
    game.move("up");
    game.start();
    expect(game.score).toBe(10);
    expect(game.frog.row).toBe(11);
  });
});
