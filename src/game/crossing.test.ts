import { expect, it } from "vitest";
import { Game } from "./game";
import { rules } from "../config/rules";
import type { Direction } from "../entities/types";

type Action = Direction | "wait";
function copy(game: Game): Game {
  return Object.assign(Object.create(Game.prototype) as Game, game, {
    frog: { ...game.frog },
    previousFrog: { ...game.previousFrog },
    actors: game.actors.map((actor) => ({ ...actor })),
    homes: [...game.homes],
  });
}
// Search uses only public gameplay actions; it never changes positions, lanes,
// lives or timers. This guards against impossible tuning in the real board.
function findCrossing(initial: Game): { game: Game; route: Action[] } {
  let frontier = [{ game: copy(initial), route: [] as Action[] }];
  const target = initial.crossings + 1;
  for (let tick = 0; tick < 350; tick++) {
    const next = new Map<string, { game: Game; route: Action[] }>();
    for (const state of frontier)
      for (const action of ["up", "left", "right", "wait", "down"] as const) {
        const game = copy(state.game);
        if (action !== "wait") game.move(action);
        game.update(rules.hopSeconds);
        if (
          game.lives !== initial.lives ||
          game.phase === "dead" ||
          game.phase === "over"
        )
          continue;
        const candidate = { game, route: [...state.route, action] };
        if (game.crossings === target) return candidate;
        const key = game.frog.row + ":" + Math.round(game.frog.x / 2);
        if (!next.has(key)) next.set(key, candidate);
      }
    const distance = (game: Game) => {
      const xs = rules.homeColumns
        .filter((_, i) => !game.homes[i])
        .map((x) => Math.abs(x * rules.cell - game.frog.x));
      return game.frog.row * 3 + Math.min(...xs) * 0.04;
    };
    frontier = [...next.values()]
      .sort((a, b) => distance(a.game) - distance(b.game))
      .slice(0, 160);
    if (!frontier.length) break;
  }
  throw new Error("No safe crossing found with the configured real lanes.");
}
it("can complete five distinct homes and advance a round using only legal moves", () => {
  let game = new Game();
  game.start();
  for (let home = 0; home < 5; home++) {
    const result = findCrossing(game);
    expect(result.route.length).toBeLessThan(350);
    game = result.game;
    expect(game.homes.filter(Boolean)).toHaveLength(home + 1);
    if (home < 4) game.update(rules.homeSeconds);
  }
  expect(game.phase).toBe("level");
  expect(game.lives).toBe(3);
  game.update(rules.levelSeconds);
  expect(game.level).toBe(2);
  expect(game.phase).toBe("playing");
  expect(game.homes.some(Boolean)).toBe(false);
}, 30000);
