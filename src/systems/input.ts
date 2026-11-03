import type { Direction } from "../game/game";
export function commandForKey(
  key: string,
  repeat: boolean,
): Direction | "start" | undefined {
  if (repeat) return;
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case "Enter":
    case " ":
      return "start";
  }
}
