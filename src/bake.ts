import { Pen } from "./pen";
import { Pair } from "./rime";
import { Seen } from "./seen";

// todo: righten
type Yoke = "void" | "bool" | "int" | "real" | "pair" | "path" | "string" | "pen" | "transform";

type Bake<T> = {
  name: Yoke,
  dimensions: number;
  is: (thing: unknown) => thing is T;
}

// todo
type Transform = {};

function isTypelike(thing: unknown, ...fields: string[]): thing is object {
  return !!thing && typeof thing === "object" && fields.every(s => s in thing);
}

function isSeen(thing: unknown): thing is Seen {
  return thing instanceof Seen;
}

const Typebakes: { [s: string]: Bake<any> } = {
  "void": {
    name: "void",
    dimensions: 0,
    is: (thing: unknown): thing is undefined => typeof thing === "undefined",
  } as Bake<undefined>,
  "bool": {
    name: "bool",
    dimensions: 0,
    is: (thing: unknown): thing is boolean => typeof thing === "boolean",
  } as Bake<boolean>,
  "int": {
    name: "int",
    dimensions: 0,
    is: (thing: unknown): thing is number => typeof thing === "number",
  } as Bake<number>,
  "real": {
    name: "real",
    dimensions: 0,
    is: (thing: unknown): thing is number => typeof thing === "number",
  } as Bake<number>,
  "pair": {
    name: "pair",
    dimensions: 0,
    is: (thing: unknown): thing is Pair => isTypelike(thing, "x", "y"),
  } as Bake<Pair>,
  "path": {
    name: "path",
    dimensions: 0,
    is: (thing: unknown): thing is Seen => thing instanceof Seen,
  } as Bake<Seen>,
  "string": {
    name: "string",
    dimensions: 0,
    is: (thing: unknown): thing is string => typeof thing === "string",
  } as Bake<string>,
  "pen": {
    name: "pen",
    dimensions: 0,
    is: (thing: unknown): thing is Pen => thing instanceof Pen,
  } as Bake<Pen>,
  "transform": {
    name: "transform",
    dimensions: 0,
    is: (thing: unknown): thing is string => !!thing && false,
  } as Bake<Transform>,
} as const;

const BakedVoid: Bake<undefined> = Typebakes["void"];
const BakedBool: Bake<boolean> = Typebakes["bool"];
const BakedInt: Bake<number> = Typebakes["int"];
const BakedReal: Bake<number> = Typebakes["real"];
const BakedPair: Bake<Pair> = Typebakes["pair"];
const BakedPath: Bake<Seen> = Typebakes["path"];
const BakedString: Bake<string> = Typebakes["string"];
const BakedPen: Bake<Pen> = Typebakes["pen"];
const BakedTransform: Bake<Transform> = Typebakes["transform"];

function yoke(thing: unknown): Yoke {
//  console.log("bakename", thing);
  if (isSeen(thing)) return "path";
  else if (BakedPen.is(thing)) return "pen";
  else if (BakedTransform.is(thing)) return "transform";
  else if (BakedString.is(thing)) return "string";
  else if (BakedPath.is(thing)) return "path";
  else if (BakedPair.is(thing)) return "pair";
  else if (BakedReal.is(thing)) return "real";
  else if (BakedInt.is(thing)) return "int";
  else if (BakedBool.is(thing)) return "bool";
  else if (BakedVoid.is(thing)) return "void";
  else throw new Error(`idk what type ${thing} is`);
}

export type { Bake, Yoke };
export { Typebakes, BakedVoid, BakedBool, BakedInt, BakedReal, BakedPair, BakedString, BakedPen, BakedPath, BakedTransform };
export { isSeen, yoke };