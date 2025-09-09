import _ from "lodash/fp";

import { randy } from "./main";

import { Align, Fielded, Pair, Real, Rime } from "./number";
import { origin, N, S, E, W } from "./number";

import { Path } from "./path";

import { Circle } from "./arc";
import { unitcircle } from "./arc";

import type { Pen } from "./pen";
import { defaultpen, penboard } from "./pen";
import Label from "./label";
import { CM, INCH, Maybe, MM, PT, Scaling, shed, underload, Knowledge, loudly, BBox, LOUDNESS, hasTex as hasTex } from "./helper";
import { Keyword, Operator, Other, Token, Tokenboard } from "./tokens";
import { bakeboard, BakedPair, BakedString, isAlign, isPathlike, isPen } from "./bake";
import { assertively } from "./helper";
import { Seen } from "./seen";

const MathJax = window["MathJax" as keyof typeof window];

export default class Render {
  static UP = -1; // asy up = svg down
  static DEFSCALE: Scaling = { x: 100, y: 100 };

  svgblock: SVGGraphicsElement;
  wisdom: (($s: Scaling) => string)[];
  scaling: Scaling;

  constructor(svgblock: SVGGraphicsElement) {
    this.svgblock = svgblock;
    ((lb) => {
      this.svgblock.setAttribute("width", `${lb.width}`);
      this.svgblock.setAttribute("height", `${lb.height}`);
    })(this.greatbox());

    this.wisdom = [];
    this.scaling = { x: 0, y: 0 };
    //loudly(window.devicePixelRatio);
  }

  // this wont work because the bbox reckoning is based on the sizes
  size(x: number, y: number =x): Knowledge {
    return ((lb) => (ls: Scaling) => {
      ls.x = x/lb.width;
      ls.y = y/lb.height*Render.UP;
      return "";
    })(this.svgblock.getBBox());
  }

  unitsize(x: number, y: number =x): Knowledge {
    return (ls: Scaling) => {
      ls.x = x;
      ls.y = y*Render.UP;
      return "";
    };
  }

  async update(knowledge: Knowledge[]): Promise<Render> {
    this.wisdom = [this.size(200, 200)]
//    this.wisdom = [this.unitsize(Render.DEFSCALE.x, Render.DEFSCALE.y)]
      .concat(_.compact (_.flattenDeep (knowledge)))
      .filter(x => typeof x === "function")
    return this;
  }

  // todo: should these promises resolve all at render time or eachwise at read time?
  async render(): Promise<void> {
    // this should really be outpulling all the size setters and applying only the last one
    await (async (l): Promise<void> => {
      this.svgblock.innerHTML = `${
        (await Promise.all(this.wisdom.map(async (lk: Knowledge) => await this.mete(lk)))
          .then((results) => _.flatten(results).map((lk: Knowledge) => lk(this.scaling))))
      .join('')}`;
      this.svgblock.setAttribute("viewBox", `${l.minx} ${l.miny} ${l.width} ${l.height}`);
      this.svgblock.setAttribute("preserveAspectRatio", "xMidYMid meet");
    })(this.greatbox());
  }

  async mete(k: Knowledge): Promise<Knowledge[]> {
//    loudly(k, LOUDNESS.Spanner);
    return !hasTex(k(this.scaling))
      ? [k]
      : (async (le: HTMLElement) => {
          document.getElementById("unseen")!.appendChild(le).innerHTML = k(this.scaling);
          await MathJax.typesetPromise([le]);

          return [...le.getElementsByTagName("foreignObject")].map((lf: SVGForeignObjectElement) => (((lr: DOMRect): Knowledge => {
            lf.setAttribute("x", `${Number(lf.getAttribute("x"))-lr.width/2}`);
            lf.setAttribute("y", `${Number(lf.getAttribute("y"))-lr.height/2}`);
            lf.setAttribute("width", ''+lr.width);
            lf.setAttribute("height", ''+lr.height);
            document.getElementById("unseen")!.removeChild(le);
            return () => lf.outerHTML;
          }) (lf.firstElementChild!.getBoundingClientRect())));
        }) (document.createElement("svg"));
  }

  private greatbox(): BBox {
    return ((l) => ({
      width: l.width,
      height: l.height,
      minx: -l.width/2,
      miny: -l.height/2
    }))(this.svgblock.getBoundingClientRect());
  }
}

export const nameboard = new Map<string, any>([
  //todo: get rid of randy
  ["write", (s: string[]) => console.log(shed(s))],

  ["draw", (largs: unknown[]) => underload(draw, [BakedString.is, isPathlike, isAlign, isPen], largs)],
  ["fill", (largs: unknown[]) => underload(fill, [isPathlike, isPen], largs)],
  ["filldraw", (largs: unknown[]) => underload(filldraw, [isPathlike, isPen, isPen], largs)],
  ["label", (largs: unknown[]) => underload(label, [BakedString.is, BakedPair.is, isAlign, isPen], largs)],

  ["dot", (largs: unknown[]) => underload(dot, [BakedString.is, BakedPair.is, isAlign, isPen], largs)],
  ["circle", ([c,r]: [Pair, number]) => new Circle(c, Number(r))],
  ["dir", (p: Path | number, q?: Path) => Path.dir(p, q)],
  ["degrees", (lz: Pair) => new Real(lz.degrees())],
  ["conjugate", (lz: Pair) => lz.conjugate()],
  ["unitcircle", unitcircle],
  ["origin", origin],
  ["N", N],
  ["S", S],
  ["E", E],
  ["W", W],
  ["NE", N.plus(E).unit()],
  ["SE", S.plus(E).unit()],
  ["SW", S.plus(W).unit()],
  ["NW", N.plus(W).unit()],
  ["cycle", "cycle"],
  ["inches", INCH],
  ["cm", CM],
  ["mm", MM],
  ["pt", PT],
//  ["size", ([x,y=x]: number[]) => randy.size(x, y)],
  ["unitsize", ([x,y=x]: number[]) => randy.unitsize(x, y)],
  ...penboard,
  ...bakeboard,
] as [string, any][]);

export type Memory = { name: string, memory: unknown };
export const variables: Map<string, unknown> = new Map();

function remember<T>(name: string, value: T): Memory {
  return { name, memory: variables.set(name, value).get(name) as T };
}

function recall(name: string): Memory {
  return { name, memory: variables.get(name) };
}

function lookup(thing: Maybe<Token<Keyword | Operator | Other.Identifier>>): any {
  if (thing === null) return null;
  return (lname => {
    return nameboard.has(lname)
      ? nameboard.get(lname)
      : variables.has(lname)
        ? variables.get(lname)
        : () => thing;
  }) ("value" in thing ? thing.value as string : Tokenboard[thing.kind]);
}

function draw([L, g, align, p]: [Maybe<Pair>, Seen, Maybe<Pair>, Maybe<Pen>]): Knowledge[] {
  assertively(g !== null);
  return _.flatten ([g.show({ fill: null, stroke: p ?? defaultpen })]);
}

function fill([g, p]: [Seen, Maybe<Pen>]): Knowledge[] {
  assertively(g !== null);
  return _.flatten ([g.show({ fill: p ?? defaultpen, stroke: null })]);
}

function filldraw([g, fillpen, drawpen]: [Seen, Maybe<Pen>, Maybe<Pen>]): Knowledge[] {
  return _.flatten ([nameboard.get("draw")([g, drawpen ?? defaultpen]),
                     nameboard.get("fill")([g, fillpen ?? defaultpen])]);
}

// todo: calibrate label appearance
// todo: lots of redundancy with type checking / guarding
function label([s, position, align, p]: [string, Maybe<Pair>, Maybe<Pair>, Maybe<Pen>]): Knowledge[] {
  assertively(s !== null);
  return _.flatten ([(lscaling: Scaling) => new Label(s, position ?? origin, descale(new Align(align ?? origin), lscaling)).show({ fill: p ?? defaultpen, stroke: null })(lscaling)]);
}

// todo: calibrate dot size
// todo: L should be Label instead of string, cf. upcasting
function dot([L, z, align, p]: [Maybe<string>, Maybe<Pair>, Maybe<Align>, Maybe<Pen>]): Knowledge[] {
  return _.flatten ([(lscaling: Scaling) => (shed(fill([new Circle(z ?? origin, descale(1/2*defaultpen.dotsize(), lscaling)), p ?? defaultpen])) as Knowledge)(lscaling),
                     label([L ?? "", z, align ?? E, p])]);
}

// carafes go here
function descale<T extends Rime<Fielded>>(z: T, scaling: Scaling): T {
  return z instanceof Align
    ? new Align(z.x / scaling.x, z.y / Render.UP / scaling.y) as T
    : z instanceof Pair
      ? new Pair(z.x / scaling.x, z.y / Render.UP / scaling.y) as T
      : z instanceof Real
        ? new Real(z.x / scaling.x) as T
        : (z as number) / scaling.x as T;
}

export { lookup, descale, remember, recall };