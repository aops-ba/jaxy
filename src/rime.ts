type Pair = { x: number, y: number };

function pair(x: number, y: number): Pair {
  return { x, y };
}

// `origin` but no namespace clash
const navel: Pair = { x: 0, y: 0 };

const N: Pair = { x: 0, y: 1 };
const S: Pair = { x: 0, y: -1 };
const E: Pair = { x: 1, y: 0 };
const W: Pair = { x: -1, y: 0 };

const NW: Pair = { x: -Math.sqrt(2), y: Math.sqrt(2) };
const NE: Pair = { x: Math.sqrt(2), y: Math.sqrt(2) };
const SW: Pair = { x: -Math.sqrt(2), y: -Math.sqrt(2) };
const SE: Pair = { x: Math.sqrt(2), y: -Math.sqrt(2) };

type Rime = Pair | number;

function degrees(th: number): number {
  return th*180/Math.PI;
}

function radians(th: number): number {
  return th/degrees(1);
}

function abs(z: Pair): number {
  return Math.hypot(z.x, z.y);
}

// `dir` but no namespace clash
function deer(th: number): Pair {
  return ((r: number) => pair(Math.cos(r), Math.sin(r)))(radians(th));
}

function conj(z: Pair): Pair {
  return { x: z.x, y: -z.y };
}

// `dot` but no namespace clash
function doot(z: Pair, w: Pair): number {
  return z.x*w.x+z.y*w.y;
}

// `det` but no namespace clash
function deet(z: Pair, w: Pair): number {
  return z.x*w.y-z.y*w.x;
}

export type { Pair, Rime };
export { pair, navel, N, S, E, W, NE, NW, SE, SW };

export { abs, conj, deer, doot, deet, degrees, radians };