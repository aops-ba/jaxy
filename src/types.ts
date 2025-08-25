export class Pair {
  x: number;
  y: number;

  // todo: probably use a 🏭 instead lol
  // todo: omg this is so ugly
  constructor(first: [number, number]);
  constructor(first: number, second: number);
  constructor(first: number | [number, number], second?: number) {
    if (Array.isArray(first) && !second) {
      this.x = first[0];
      this.y = first[1];
    } else if (typeof first === "number" && typeof second === "number") {
      this.x = first;
      this.y = first;
    } else throw new Error(first.toString()+second?.toString());
  }
}
export const origin: Pair = new Pair(0,0);

export class Path {
  points: Pair[];
  cyclic: boolean;

  constructor(points?: Pair[], cyclic?: boolean) {
    this.points = points ?? [];
    this.cyclic = cyclic ?? false;
  }

  add(p: Pair): Path {
    this.points.push(p);
    return this;
  }
}

export interface Arc {
  center: Pair,
  radius: number,
  from: number,
  to: number,
}

export interface Circle extends Arc {
  center: Pair,
  radius: number,
  from: 0,
  to: 360,
}

export const unitcircle: Circle = { center: origin, radius: 1, from: 0, to: 360 };

export const defaultpen: Pen = { fill: 'black', stroke: 'black' };
export const blue: Pen = { fill: 'blue', stroke: 'blue' };
export const green: Pen = { fill: 'green', stroke: 'green' };
export const red: Pen = { fill: 'red', stroke: 'red' };

export type Pen = {
  fill?: string,
  stroke?: string,
}

export function unfill(pen: Pen): Pen {
  return { stroke: pen.stroke };
}

export function unstroke(pen: Pen): Pen {
  return { fill: pen.stroke };
}