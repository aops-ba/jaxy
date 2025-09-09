import { assertively, loudly } from "./helper";
import { isPair } from "./helper";

type Rime<T> = T | number;
type Fielded = Real | Pair;

export class AsyMath {
  static lift(left: Rime<Fielded>, right: Rime<Fielded>): [Fielded, Fielded] {
    return (lT => [new lT(left), new lT(right)])
      (left instanceof Pair || right instanceof Pair ? Pair : Real);
  }

  static gt(left: Rime<Real>, right: Rime<Real>): boolean {
    return new Real(left).x > new Real(right).x;
  }

  static lt(left: Rime<Real>, right: Rime<Real>): boolean {
    return loudly(new Real(left).x < new Real(right).x);
  }

  static eq(left: Rime<Fielded>, right: Rime<Fielded>): boolean {
    return (([ll, lr]) => ll.eq(lr))(AsyMath.lift(left, right));
  }

  static negate(noughth: Rime<Fielded>): Fielded {
    return (typeof noughth === "number" ? new Real(noughth) : noughth).negate();
  }

  static invert(noughth: Rime<Fielded>): Fielded {
    return (typeof noughth === "number" ? new Real(noughth) : noughth).invert();
  }

  static plus(left: Rime<Fielded>, right: Rime<Fielded>): Fielded {
    return (([ll, lr]) => ll.plus(lr))(AsyMath.lift(left, right));
  }

  static minus(left: Rime<Fielded>, right: Rime<Fielded>): Fielded {
    return (([ll, lr]) => (([lll, llr]) => lll.minus(llr))(AsyMath.lift(ll, lr)))
           (right ? [left, right] : [0, left]);
  }

  static times(left: Rime<Fielded>, right: Rime<Fielded>): Fielded {
    return (([ll, lr]) => ll.times(lr))(AsyMath.lift(left, right));
  }

  static divide(left: Rime<Fielded>, right: Rime<Fielded>): Fielded {
    return (([ll, lr]) => (([lll, llr]) => lll.divide(llr))(AsyMath.lift(ll, lr)))
           (right ? [left, right] : [1, left]);
  }

  static power(left: Rime<Fielded>, right: Rime<Fielded>): Fielded {
    return (([ll, lr]) => ll.power(lr))(AsyMath.lift(left, right));
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

  eq(r: Real): boolean {
    return this.x === r.x;
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

  // todo: use asserts instead
  constructor(x: Rime<Fielded>, y?: Rime<Real>) {
    if (x instanceof Pair) {
      assertively(!y);
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

  eq(z: Fielded): boolean {
    return this.x === z.x && (!isPair(z) || this.y === z.y);
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

class Align extends Pair {}

function toDegrees(r: number): number {
  return r*180/Math.PI;
}

function toRadians(r: number): number {
  return r/toDegrees(1);
}

export type { Rime };
export { Real, Fielded, Pair, Align };
export { origin, N, S, E, W };
export { toDegrees, toRadians };