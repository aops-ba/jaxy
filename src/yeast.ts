import { Yoke, Typebakes, yoke as yoke } from "./bake";
import { assert, Functionlike, max, Maybe, isNull, same } from "./helper";
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
  return { name, corn, work: (...args: any) => (xs => xs === null ? f(null) : f(...xs))(underload(args, corn)) };
}

export function bakething(name: string, born: Yoke, worth: unknown): Bakething {
  return { name, born, worth };
}

// todo: ints and reals behave the same
function bless<T>(thing: T, type: Yoke): T {
//  console.log("bless time");
  assert(Typebakes[type].is(thing), ["Go,", thing, ", and be now of type", type, "."]);
  return thing;
}

// narrow the overloads
// todo: this calls `underload` twice, once explicitly and once when it calls `work`
function unload(loaves: Bakework[], args: unknown[]): unknown {
//  console.log("unload", loaves, args, underload(args, loaves[0].corn), BakedPath.is(args[0]));
  return loaves.find(loaf => !isNull(underload(args, loaf.corn)))!.work(...args);
}

// pad with `null` until signature matches
// a return of `null` means match impossible
export function underload(maybes: unknown[], goods: Maybe<Yoke[]>): Maybe<Maybe<Yoke>[]> {
//  console.log("underload", maybes, goods);
  return goods === null ? (maybes.length > 0 ? null : [])
  : maybes.length > goods.length ? null
  : maybes.length === 0 ? Array(max(0, goods.length-maybes.length)).fill(null)
  : canRaise(goods[0], maybes[0])
    ? (x => isNull(x) ? x
      : ([doRaise(goods[0], maybes[0])] as Maybe<Yoke>[]).concat(x))
      (underload(maybes.slice(1), goods.slice(1)))
    : (x => isNull(x) ? x : ([null] as Maybe<Yoke>[]).concat(x))
      (underload(maybes, goods.slice(1)));
}

function doRaise(y: Yoke, dough: unknown): unknown {
//  console.log("doRaise", y, dough, yoke(dough), yeast.get(yoke(dough)), yeast.get(yoke(dough))?.get(y));
  return yeast.get(yoke(dough))!.get(y)!(dough);
}

function canRaise(y: Yoke, dough: unknown): boolean {
  return yeast.get(yoke(dough))?.has(y) ?? false;
}

const yeast: Map<Yoke, Map<Yoke, Functionlike<unknown>>> = new Map<Yoke, Map<Yoke, Functionlike<unknown>>>([
  ["int", new Map<Yoke, Functionlike<unknown>>([["int", same], ["real", Number], ["pair", x => pair(x, 0)]])],
  ["real", new Map<Yoke, Functionlike<unknown>>([["real", same], ["pair", x => pair(x, 0)]])],
  ["pair", new Map<Yoke, Functionlike<unknown>>([["pair", same], ["path", x => new Path([x])]])],
  ["path", new Map<Yoke, Functionlike<unknown>>([["path", same]])],
  ["pen", new Map<Yoke, Functionlike<unknown>>([["pen", same]])],
  ["string", new Map<Yoke, Functionlike<unknown>>([["string", same]])],
]);

export { bless, unload, canRaise, doRaise };
export type { Bakework, Bakething, Bread };