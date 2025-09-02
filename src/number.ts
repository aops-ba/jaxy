import Path from "./path";

type Fielded = number | Real;
type Closed = Fielded | Pair;

class Real {
  x: number;

  constructor(x: Fielded) {
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

  plus(z: Closed): Closed {
    return z instanceof Pair
      ? z.plus(this)
      : z instanceof Real
        ? new Real(this.x+z.x)
        : new Real(this.x+z);
  }

  minus(z: Closed): Closed {
    return z instanceof Pair
      ? z.minus(this)
      : z instanceof Real
        ? new Real(this.x-z.x)
        : new Real(this.x-z);
  }

  times(z: Closed): Closed {
    return z instanceof Pair
      ? z.times(this)
      : z instanceof Real
        ? new Real(this.x*z.x)
        : new Real(this.x*z);
  }

  divide(z: Closed): Closed {
    return z instanceof Pair
      ? z.divide(this)
      : z instanceof Real
        ? new Real(this.x/z.x)
        : new Real(this.x/z);
  }

  power(z: Closed): Closed {
    return z instanceof Pair
      ? new Pair(this.x, 0).power(z)
      : z instanceof Real
        ? new Real(this.x**z.x)
        : new Real(this.x**z);
  }
}

class Pair extends Real {
  y: number;

  static fromArray([x,y]: number[]): Pair {
    return new Pair(x,y);
  }

  static dir(p: Path | number, q?: Path): Pair {
    if (p instanceof Path) {
      if (q instanceof Path) {
        return Pair.dir(p).plus(Pair.dir(q)).unit();
      } else {
        return Pair.dir(p, new Path([new Pair(p.length(), 0)]));
      }
    } else {
      return ((lr) => new Pair(Math.cos(lr), Math.sin(lr)))(toRadians(p));
    }
  }

  constructor(x: Fielded | Pair, y?: Fielded) {
    if (x instanceof Pair && !y) {
      super(x.x);
      this.y = x.y;
    } else {
      super(new Real(x).x);
      this.y = new Real(y ?? 0).x;
    }
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  private _length2(): number {
    return this.x**2+this.y**2;
  }

  length(): number {
    return Math.sqrt(this._length2());
  }

  // in radians
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  unit(): Pair {
    return ((lr) => (lr === 0 ? origin : new Pair(this.x/lr, this.y/lr)))(this.length());
  }

  degrees(): number {
    return toDegrees(this.angle());
  }

  negate(): Pair {
    return new Pair(-this.x, -this.y);
  }

  invert(): Pair {
    if (this.length() === 0) throw new RangeError();
    return ((lr) => new Pair(this.x/lr, -this.y/lr))(this._length2());
  }

  plus(z: Closed): Pair {
    return new Pair(this.x+(typeof z === "number" ? z : z.x),
                    this.y+(z instanceof Pair ? z.y : 0));
  }

  minus(z: Closed): Pair {
    return new Pair(this.x+(typeof z === "number" ? z : z.negate().x),
                    this.y+(z instanceof Pair ? z.negate().y : 0));
  }

  times(z: Closed): Closed {
    return z instanceof Pair
      ? ((lz, lw) => new Pair(lz.dot(lw), lz.det(lw)))(this.conjugate(), z)
      : z instanceof Real
        ? new Pair(this.x*z.x, this.y*z.x)
        : new Pair(this.x*z, this.y*z);
  }

  divide(z: Closed): Closed {
    return z instanceof Pair
      ? ((lth, lz) => new Pair(lth.dot(lz), lth.det(lz))) (this.conjugate(), z.invert())
      : z instanceof Real
        ? ((lz) => new Pair(this.x*lz.x, this.y*lz.x)) (z.invert())
        : ((lz) => new Pair(this.x*lz, this.y*lz)) (1/z);
  }

  power(z: Closed): Closed {
    return ((lz, lw) => this.length() === 0
      ? lz.length() === 0 ? E : origin
      : (((la) => Pair.expi(la))(lz.dot(lw))).times(Math.E**lz.det(lw)))
        (new Pair(z), new Pair(this.angle(), Math.log(this.length())));
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

export { Real, Fielded, Pair, Closed };
export { origin, N, S, E, W };
export { toDegrees, toRadians };