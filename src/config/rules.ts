export const rules = {
  width: 208,
  height: 272,
  cell: 16,
  columns: 13,
  homeRow: 2,
  riverRows: [7, 6, 5, 4, 3],
  medianRow: 8,
  roadRows: [13, 12, 11, 10, 9],
  startRow: 14,
  startX: 96,
  homeColumns: [0, 3, 6, 9, 12],
  frogInset: 3,
  homeTolerance: 5,
  initialLives: 3,
  forwardPoints: 10,
  homePoints: 50,
  levelPoints: 1000,
  bonusPoints: 200,
  timePoints: 10,
  extraLifeScore: 20000,
  crossingSeconds: 60,
  deathSeconds: 0.8,
  homeSeconds: 0.7,
  levelSeconds: 1.8,
  hopSeconds: 0.12,
  fixedStep: 1 / 120,
  divePeriod: 8,
  diveWarning: 5.5,
  diveStart: 6.5,
  hazardPeriod: 12,
  hazardDuration: 4,
  ladyPeriod: 16,
} as const;

export interface LaneConfig {
  row: number;
  speed: number;
  width: number;
  spacing: number;
  count: number;
  offset: number;
  kind: "car" | "truck" | "racer" | "log" | "turtle";
}
export const roadLanes: readonly LaneConfig[] = [
  {
    row: 13,
    speed: -24,
    width: 22,
    spacing: 80,
    count: 3,
    offset: 22,
    kind: "car",
  },
  {
    row: 12,
    speed: 20,
    width: 25,
    spacing: 92,
    count: 3,
    offset: 46,
    kind: "car",
  },
  {
    row: 11,
    speed: -32,
    width: 20,
    spacing: 88,
    count: 3,
    offset: 12,
    kind: "car",
  },
  {
    row: 10,
    speed: 44,
    width: 20,
    spacing: 112,
    count: 3,
    offset: 70,
    kind: "racer",
  },
  {
    row: 9,
    speed: -22,
    width: 40,
    spacing: 112,
    count: 3,
    offset: 32,
    kind: "truck",
  },
];
export const riverLanes: readonly LaneConfig[] = [
  {
    row: 7,
    speed: -20,
    width: 44,
    spacing: 76,
    count: 4,
    offset: 8,
    kind: "turtle",
  },
  {
    row: 6,
    speed: 18,
    width: 64,
    spacing: 96,
    count: 3,
    offset: 24,
    kind: "log",
  },
  {
    row: 5,
    speed: 30,
    width: 96,
    spacing: 136,
    count: 3,
    offset: 0,
    kind: "log",
  },
  {
    row: 4,
    speed: -26,
    width: 44,
    spacing: 80,
    count: 4,
    offset: 32,
    kind: "turtle",
  },
  {
    row: 3,
    speed: 22,
    width: 64,
    spacing: 104,
    count: 3,
    offset: 8,
    kind: "log",
  },
];
export function difficulty(level: number) {
  return Math.min(2.4, 1 + (level - 1) * 0.12);
}
