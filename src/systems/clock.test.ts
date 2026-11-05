import { expect, it } from "vitest";
import { FixedClock } from "./clock";
import { commandForKey } from "./input";
import { Game } from "../game/game";
it.each([30, 60, 120, 144])("runs equal simulation time at %i Hz", (hz) => {
  const clock = new FixedClock();
  const game = new Game();
  game.start();
  for (let i = 0; i < hz; i++) clock.advance(1 / hz, (dt) => game.update(dt));
  expect(game.actors[0].x).toBeCloseTo(-2);
});
it("caps resume delays rather than fast-forwarding traffic", () => {
  const clock = new FixedClock();
  let time = 0;
  clock.advance(20, (dt) => (time += dt));
  expect(time).toBeCloseTo(0.1);
});
it("discards accumulated time on reset", () => {
  const clock = new FixedClock();
  let count = 0;
  clock.advance(0.004, () => count++);
  clock.reset();
  clock.advance(0.005, () => count++);
  expect(count).toBe(0);
});
it("maps arrows/start and suppresses held-key repeat", () => {
  expect(commandForKey("ArrowUp", false)).toBe("up");
  expect(commandForKey("ArrowDown", false)).toBe("down");
  expect(commandForKey("ArrowLeft", false)).toBe("left");
  expect(commandForKey("ArrowRight", false)).toBe("right");
  expect(commandForKey("Enter", false)).toBe("start");
  expect(commandForKey(" ", false)).toBe("start");
  expect(commandForKey("ArrowUp", true)).toBeUndefined();
  expect(commandForKey("x", false)).toBeUndefined();
});
