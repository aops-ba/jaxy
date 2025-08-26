type Fieldable = number | Real | Pair;

class Real {
  x: number;

  constructor(x: number | Real) {
    this.x = x instanceof Real ? x.x : x;
  }

  toString(): string {
    return this.x.toString();
  }

  negate(): Real {
    return new Real(-this.x);
  }

  invert(): Real {
    return new Real(1/this.x);
  }

  plus(z: Fieldable): Fieldable {
    return z instanceof Pair
      ? z.plus(this)
      : z instanceof Real
        ? new Real(this.x+z.x)
        : new Real(this.x+z);
  }

  times(z: Fieldable): Fieldable {
    return z instanceof Pair
      ? z.times(this)
      : z instanceof Real
        ? new Real(this.x*z.x)
        : new Real(this.x*z);
  }

  power(z: Fieldable): Fieldable {
    return z instanceof Pair
      ? new Pair(this.x, 0).power(z)
      : z instanceof Real
        ? new Real(this.x**z.x)
        : new Real(this.x**z);
  }
}

class Pair extends Real {
  y: number;

  constructor(x: number | Real | Pair, y?: number | Real) {
    if (x instanceof Pair && !y) {
      super(x.x);
      this.y = x.y;
    } else {
      super(typeof x === 'number' ? x : x.x);
      this.y = typeof y === 'number' ? y : y?.x ?? 0;
    }
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  private _sqlength(): number {
    return this.x**2+this.y**2;
  }

  length(): number {
    return Math.sqrt(this._sqlength());
  }

  // in radians
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  unit(): Pair {
    return ((ll) => (ll === 0 ? origin : new Pair(this.x/ll, this.y/ll)))(this.length());
  }

  degrees(): number {
    return toDegrees(this.angle());
  }

  negate(): Pair {
    return new Pair(-this.x, -this.y);
  }

  invert(): Pair {
    return new Pair(this.x/(this.length()**2), -this.y/(this.length()**2));
  }

  plus(z: Fieldable): Pair {
    return z instanceof Pair
      ? new Pair(this.x+z.x, this.y+z.y)
      : z instanceof Real
        ? new Pair(this.x+z.x, this.y)
        : new Pair(this.x+z, this.y);
  }

  times(z: Fieldable): Fieldable {
    return z instanceof Pair
      ? new Pair(this.x*z.x-this.y*z.y, this.x*z.y+this.y*z.x)
      : z instanceof Real
        ? new Pair(this.x*z.x, this.y*z.x)
        : new Pair(this.x*z, this.y*z);
  }

  power(z: Fieldable): Fieldable {
    return ((lz) => this.length() === 0
      ? lz.length() === 0 ? E : origin
      : ((lw) => ((((la) => Pair.expi(la))(lz.dot(lw))).times(Math.E**lz.det(lw))))
        (new Pair(this.angle(), Math.log(this.length()))))
        (new Pair(z));
  }

  static expi(a: number): Pair {
    return new Pair(Math.cos(a), Math.sin(a));
  }

  conjugate(): Pair {
    return new Pair(this.x, -this.y);
  }

  dot(z: Pair): number {
    return this.x*z.x+this.y*z.y;
  }

  det(z: Pair): number {
    return this.x*z.y-this.y*z.x;
  }
}

const origin: Pair = new Pair(0,0);
const N: Pair = new Pair(0,1);
const S: Pair = new Pair(0,-1);
const E: Pair = new Pair(1,0);
const W: Pair = new Pair(-1,0);

function toDegrees(r: number): number {
  return r*180/Math.PI;
}

function toRadians(r: number): number {
  return r/180*Math.PI;
}

export { Fieldable, Real, Pair };
export { origin, N, S, E, W };
export { toDegrees, toRadians };