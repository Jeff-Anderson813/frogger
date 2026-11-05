import { difficulty, roadLanes, riverLanes } from "../config/rules";
import type { Actor } from "../entities/types";
export function spawnActors(level: number): Actor[] {
  return [...roadLanes, ...riverLanes].flatMap((lane, index) =>
    Array.from({ length: lane.count }, (_, n) => ({
      id: index + "-" + n,
      row: lane.row,
      x: lane.offset + n * lane.spacing,
      width: lane.width,
      speed: lane.speed * difficulty(level),
      cycle: lane.count * lane.spacing,
      kind:
        level >= 2 && lane.row === 3 && n === 1
          ? ("crocodile" as const)
          : lane.kind,
      diving: lane.kind === "turtle" && n === 1,
      diveOffset: lane.row === 4 ? 3 : 0,
    })),
  );
}
export function moveActor(actor: Actor, dt: number) {
  actor.x += actor.speed * dt;
  while (actor.x < -actor.width) actor.x += actor.cycle;
  while (actor.x >= actor.cycle - actor.width) actor.x -= actor.cycle;
}
