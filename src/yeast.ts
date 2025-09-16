import { Yoke, Typebakes, BakedPair, BakedReal, BakedInt, yoke as yoke } from "./bake";
import { assert, first, Functionlike, loudly, max, Maybe, left, right, isNull } from "./helper";
import { Path } from "./path";
import { pair } from "./rime";

type Bakework = {
  name: string,
  corn: Maybe<Yoke[]>,
  work: Functionlike<unknown>,
};

type Bakething = {
  name: string,
  born: Yoke,
  worth: unknown,
};

type Bread = Bakework | Bakething;

export function bakework<T>(name: string, corn: Maybe<Yoke[]>, out: Yoke, f: Functionlike<T>): Bakework {
//  console.log("sourdough", name, corn, out, f);
  return { name, corn, work: (...args: any) => f(underload(args, corn)) };
}

export function bakething(name: string, born: Yoke, worth: unknown): Bakething {
  return { name, born, worth };
}

// todo: ints and reals behave the same
function bless<T>(thing: T, type: Yoke): T {
  assert(Typebakes[type].is(thing), ["Go,", thing, ", and be now of type", type, "."]);
  return thing;
}

// narrow the overloads
// todo: this calls `underload` twice, once explicitly and once when it calls `work`
function unload(loaves: Bakework[], args: unknown[]): unknown {
//  console.log("unload", loaves, args);
  return loaves.find(loaf => !isNull(underload(args, loaf.corn)))!.work(...args);
}

// pad with `null` until signature matches
// a return of `null` means match impossible
export function underload(maybes: unknown[], goods: Maybe<Yoke[]>): Maybe<Maybe<Yoke>[]> {
//  console.log("underload", maybes, goods);
  return goods === null ? (maybes.length > 0 ? null : [])
  : maybes.length > goods.length ? null
  : maybes.length === 0 ? Array(max(0, goods.length-maybes.length)).fill(null)
  : raise(maybes[0]).map(left).includes(goods[0])
    ? (x => isNull(x) ? x
      : ([right(raise(maybes[0]).find(x => first(x) === goods[0])!)()] as Maybe<Yoke>[]).concat(x))
      (underload(maybes.slice(1), goods.slice(1)))
    : (x => isNull(x) ? x : ([null] as Maybe<Yoke>[]).concat(x))
      (underload(maybes, goods.slice(1)));
}

type Raise = [Yoke, Functionlike<unknown>];

function raise(dough: unknown): Raise[] {
  return ([[yoke(dough), () => dough]] as Raise[]).concat(
    BakedInt.is(dough) ? [["real", () => dough], ["pair", () => pair(dough, 0)]]
    : BakedReal.is(dough) ? [["pair", () => pair(dough, 0)]]
    : BakedPair.is(dough) ? [["path", () => new Path([dough])]]
    : []);
}

export { bless, unload };
export type { Bakework, Bakething, Bread };