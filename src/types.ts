export type Pair = {
  x: number,
  y: number,
}

export const origin: Pair = { x: 0, y: 0 };

export type Path = {
  points: Pair[],
  cyclic: boolean,
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

//export class Pen {
//  fill?: string;
//  stroke?: string;
//
//  constructor(options?: { fill?: string, stroke?: string }) {
//    this.fill = options?.fill ?? 'black';
//    this.stroke = options?.stroke ?? 'black';
//  }
//
//  unfill(): Pen {
//    this.fill = undefined;
//    return this;
//  }
//
//  unstroke(): Pen {
//    this.stroke = undefined;
//    return this;
//  }
//}
//
//export const defaultpen: Pen = new Pen();
export const defaultpen: Pen = { fill: 'black', stroke: 'black' };
export const blue: Pen = { fill: 'blue', stroke: 'blue' };
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