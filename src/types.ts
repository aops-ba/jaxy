export class AsyNumber {
  value: number;
  constructor(value: number) {
    this.value = value;
  }

  valueOf(): number {
    return this.value;
  }

  plus(n: number | AsyNumber): AsyNumber {
    return new AsyNumber(this.value+n.valueOf());
  }

  minus(n: number | AsyNumber): AsyNumber {
    return new AsyNumber(this.value-n.valueOf());
  }

  times(n: number | AsyNumber): AsyNumber {
    return new AsyNumber(this.value*n.valueOf());
  }

  divide(n: number | AsyNumber): AsyNumber {
    return new AsyNumber(this.value/n.valueOf());
  }
}

export class Pair {
  x: number;
  y: number;

  constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  length(): number {
    return Math.sqrt(this.x**2+this.y**2);
  }

  plus(p: Pair): Pair {
    return new Pair(this.x+p.x, this.y+p.y);
  }
}
export const origin: Pair = new Pair(0,0);

export class Path {
  private _points: Pair[];
  cyclic: boolean;

  constructor(points?: Pair[], cyclic?: boolean) {
    this._points = points ?? [];
    this.cyclic = cyclic ?? false;
  }

  get points(): Pair[] {
    return this._points;
  }

  length(): number {
    return this._points.length+(+!!!this.cyclic);
  }

  add(p: Pair): Path {
    this._points.push(p);
    return this;
  }
}

export class Arc {
  center: Pair;
  radius: number;
  from: number;
  to: number;

  constructor(center: Pair, radius: number, from: number, to: number) {
    this.center = center;
    this.radius = radius;
    this.from = from;
    this.to = to;
  }
}

export class Circle extends Arc {
  constructor(center: Pair, radius: number) {
    super(center, radius, 0, 360);
  }
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