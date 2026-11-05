import type { LaneConfig } from "../config/rules";
export type Direction = "up" | "down" | "left" | "right";
export interface Frog {
  x: number;
  row: number;
  direction: Direction;
}
export interface Actor {
  id: string;
  x: number;
  row: number;
  width: number;
  speed: number;
  cycle: number;
  kind: LaneConfig["kind"] | "crocodile";
  diving: boolean;
  diveOffset: number;
}
