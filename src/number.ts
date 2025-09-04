import { asyAssert } from "./error";
import { loudly } from "./helper";
import Path from "./path";

type Rime<T> = T | number;
type Fielded = Real | Pair;

export class AsyMath {
  static lift(first: Rime<Fielded>, second: Rime<Fielded>): [Fielded, Fielded] {
    return (T => [new T(first), new T(second)])
      (first instanceof Pair || second instanceof Pair ? Pair : Real);
  }

  static negate(noughth: Rime<Fielded>): Fielded {
    return typeof noughth === "number" ? new Real(-noughth) : noughth.negate();
  }

  static invert(noughth: Rime<Fielded>): Fielded {
    return typeof noughth === "number" ? new Real(1/noughth) : noughth.invert();
  }

  static plus(first: Rime<Fielded>, second: Rime<Fielded> =0): Fielded {
    return (([lf, ls]) => lf.plus(ls))(AsyMath.lift(first, second));
  }

  static minus(first: Rime<Fielded>, second: Rime<Fielded>): Fielded {
    return (([lf, ls]) => (([llf, lls]) => llf.minus(lls))(AsyMath.lift(lf, ls)))
           (second ? [first, second] : [0, first]);
  }

  static times(first: Rime<Fielded>, second: Rime<Fielded>): Fielded {
    return (([lf, ls]) => lf.times(ls))(AsyMath.lift(first, second));
  }

  static divide(first: Rime<Fielded>, second: Rime<Fielded>): Fielded {
    return (([lf, ls]) => (([llf, lls]) => llf.divide(lls))(AsyMath.lift(lf, ls)))
           (second ? [first, second] : [1, first]);
  }

  static power(first: Rime<Fielded>, second: Rime<Fielded>): Fielded {
    return (([lf, ls]) => lf.power(ls))(AsyMath.lift(first, second));
  }
}

class Real {
  x: number;

  constructor(x: Rime<Real>) {
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

  plus(r: Real): Real {
    return new Real(this.x + r.x);
  }

  minus(r: Real): Real {
    return new Real(this.x - r.x);
  }

  times(r: Real): Real {
    return new Real(this.x * r.x);
  }

  divide(r: Real): Real {
    return new Real(this.x / r.x);
  }

  power(r: Real): Real {
    return new Real(this.x ** r.x);
  }
}

class Pair {
  x: number;
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

  // todo: use asserts instead
  constructor(x: Rime<Fielded>, y?: Rime<Real>) {
    if (x instanceof Pair) {
      asyAssert(!y);
      this.x = x.x;
      this.y = x.y;
    } else {
      this.x = new Real(x).x;
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

  plus(z: Fielded): Pair {
    return new Pair(this.x+(typeof z === "number" ? z : z.x),
                    this.y+(z instanceof Pair ? z.y : 0));
  }

  minus(z: Fielded): Pair {
    return new Pair(this.x+(typeof z === "number" ? z : z.negate().x),
                    this.y+(z instanceof Pair ? z.negate().y : 0));
  }

  times(z: Fielded): Fielded {
    return z instanceof Pair
      ? ((lz, lw) => new Pair(lz.dot(lw), lz.det(lw)))(this.conjugate(), z)
      : z instanceof Real
        ? new Pair(this.x*z.x, this.y*z.x)
        : new Pair(this.x*z, this.y*z);
  }

  divide(z: Fielded): Fielded {
    return z instanceof Pair
      ? ((lth, lz) => new Pair(lth.dot(lz), lth.det(lz))) (this.conjugate(), z.invert())
      : z instanceof Real
        ? ((lz) => new Pair(this.x*lz.x, this.y*lz.x)) (z.invert())
        : ((lz) => new Pair(this.x*lz, this.y*lz)) (1/z);
  }

  power(z: Fielded): Fielded {
    return ((lz, lw) => this.length() === 0
      ? lz.length() === 0 ? E : origin
      : AsyMath.times(((la) => Pair.expi(la))(lz.dot(lw)), Math.E**lz.det(lw)))
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

export { Real, Fielded, Pair, Fielded as Closed };
export { origin, N, S, E, W };
export { toDegrees, toRadians };