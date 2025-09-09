import _ from "lodash/fp";

import { randy } from "./main";

import { Align, Fielded, Pair, Real, Rime } from "./number";
import { origin, N, S, E, W } from "./number";

import { Path } from "./path";

import { Circle } from "./arc";
import { unitcircle } from "./arc";

import type { Pen, Pens } from "./pen";
import { defaultpen, penboard } from "./pen";
import Label from "./label";
import { CM, INCH, Maybe, MM, PT, Scaling, shed, underload, loudly, BBox, LOUDNESS, hasTex as hasTex, only } from "./helper";
import { Keyword, Operator, Other, Token, Tokenboard } from "./tokens";
import { bakeboard, BakedPair, BakedString, isAlign, isPathlike, isPen } from "./bake";
import { assertively } from "./helper";
import { Seen } from "./seen";

const MathJax = window["MathJax" as keyof typeof window];

type Knowledge = {
  sight: Seen,
  pens: Pens,
}

export default class Render {
  static UP = -1; // asy up = svg down
  static DEFSCALE: Scaling = { x: 100, y: 100*Render.UP };

  svgblock: SVGGraphicsElement;
  wisdom: Knowledge[];
  scaling: Scaling;

  constructor(svgblock: SVGGraphicsElement) {
    this.svgblock = svgblock;
    ((lb) => {
      this.svgblock.setAttribute("width", `${lb.width}`);
      this.svgblock.setAttribute("height", `${lb.height}`);
    })(this.greatbox());

    this.wisdom = [];
    this.scaling = Render.DEFSCALE;
    //loudly(window.devicePixelRatio);
  }

  size(x: number, y: number =x): Render {
    //todo
    return this;
  }

  unitsize(x: number, y: number): Render {
    this.scaling = { x: x, y: y*Render.UP };
    return this;
  }

  learn(knowledge: Knowledge): Render {
    this.wisdom.push(knowledge);
    return this;
  }

  forget(): Render {
    this.wisdom = [];
    return this;
  }

  sketch(knowledge: Knowledge | string): string {
    if (typeof knowledge === "string") return knowledge;

    if (knowledge.sight instanceof Path) {
      return ((lx: Path) => (ls: Scaling) => `<path d="${lx.points.map((lpair: Pair, lindex: number): string =>
        `${lindex==0 ? 'M' : ' L'} ${ls.x*lpair.x} ${ls.y*lpair.y}`).join('')}`
      + `${lx.cyclic ? ' Z' : ''}" ` + this.ink(knowledge) + ` />`)(knowledge.sight)(this.scaling);
    } else if (knowledge.sight instanceof Circle) {
      return ((lx: Circle) => (ls: Scaling) =>
        `<circle cx="${ls.x*lx.center.x}" cy="${ls.y*lx.center.y}" r="${ls.x*lx.radius}"`
        + `${this.ink(knowledge)} />`)(knowledge.sight)(this.scaling);
    } else if (knowledge.sight instanceof Label) {
      return ((lx: Label) => (ls: Scaling) =>
        `<foreignObject x="${ls.x*(lx.position.x+Label.SF*lx.align.x)}" y="${ls.y*(lx.position.y+Label.SF*lx.align.y)}"`
        + `style="overflow: visible;">`
        + this.ink(knowledge) + `</foreignObject>`)(knowledge.sight)(this.scaling);
    } else {
      throw new Error("idk how to draw this");
    }
  }

  ink(knowledge: Knowledge): string {
    if (knowledge.sight instanceof Label) {
      return `\\(\\textcolor[RGB]{` + ((lc) => `${lc.r},${lc.g},${lc.b}`)(knowledge.pens.fill!.color) + `}`
      + `{${`${_.replace (/\\text{}|\\\(|\\\)/gm) ('') (`\\text{${
              _.replace (/\\\(/gm) ('}\\(') (
              _.replace (/\\\)/gm) ('\\)\\text{') (knowledge.sight.text))}}}`)}\\)`}`;
    } else {
      return (({fill, stroke}) => `fill="${fill?.color ?? "none"}" stroke="${stroke?.color ?? "none"}"`
        + ` stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"`
        + ` stroke-width="${PT*(stroke ?? defaultpen).linewidth}"`)(knowledge.pens);
    }
  }

  // todo: should these promises resolve all at render time or eachwise at read time?
  async render(): Promise<void> {
    await (async (l): Promise<void> => {
      this.svgblock.innerHTML = `${
        (await Promise.all(this.wisdom.map(async (lk: Knowledge) => await this.mete(lk)))
          .then((outcome) => outcome.flat().map((lk: Knowledge | string) => this.sketch(lk))))
      .join('')}`;
      this.svgblock.setAttribute("viewBox", `${l.minx} ${l.miny} ${l.width} ${l.height}`);
      this.svgblock.setAttribute("preserveAspectRatio", "xMidYMid meet");
    })(this.greatbox());
  }

  async mete(k: Knowledge): Promise<Knowledge | string> {
    return !(k.sight instanceof Label)
      ? k
      : (async (le: HTMLElement) => {
          document.getElementById("unseen")!.appendChild(le).innerHTML = this.sketch(k);
          await MathJax.typesetPromise([le]);

          return ((lf: SVGForeignObjectElement) => (((lr: DOMRect): string => {
            lf.setAttribute("x", `${Number(lf.getAttribute("x"))-lr.width/2}`);
            lf.setAttribute("y", `${Number(lf.getAttribute("y"))-lr.height/2}`);
            lf.setAttribute("width", ''+lr.width);
            lf.setAttribute("height", ''+lr.height);
            document.getElementById("unseen")!.removeChild(le);
            return lf.outerHTML;
          }) (lf.firstElementChild!.getBoundingClientRect())))
             (only([...le.getElementsByTagName("foreignObject")]));
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
  ["unitsize", ([x, y=x]: [number, number]) => randy.unitsize(x, y)],
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

function draw([L, g, align, p]: [Maybe<Pair>, Seen, Maybe<Pair>, Maybe<Pen>]): void {
  assertively(g !== null);
  randy.learn({ sight: g, pens: { fill: null, stroke: p ?? defaultpen } });//_.flatten ([g.show({ fill: null, stroke: p ?? defaultpen })]);
}

function fill([g, p]: [Seen, Maybe<Pen>]): void {
  assertively(g !== null);
  randy.learn({ sight: g, pens: { fill: p ?? defaultpen, stroke: null } });
}

function filldraw([g, fillpen, strokepen]: [Seen, Maybe<Pen>, Maybe<Pen>]): void {
  assertively(g !== null);
  randy.learn({ sight: g, pens: { fill: fillpen ?? defaultpen, stroke: null } });
  randy.learn({ sight: g, pens: { fill: null, stroke: strokepen ?? defaultpen } });
}

// todo: calibrate label appearance
// todo: lots of redundancy with type checking / guarding
function label([s, position, align, p]: [string, Maybe<Pair>, Maybe<Pair>, Maybe<Pen>]): void {
  assertively(s !== null);
  randy.learn({
    sight: new Label(s, position ?? origin, align ?? origin),
    pens: { fill: p ?? defaultpen, stroke: null },
  });
}

// todo: calibrate dot size
// todo: L should be Label instead of string, cf. upcasting
function dot([L, z, align, p]: [Maybe<string>, Maybe<Pair>, Maybe<Align>, Maybe<Pen>]): void {
  console.log("wah");
  randy.learn({ sight: loudly(new Circle(z ?? origin, descale(1/2*defaultpen.dotsize()))), pens: { fill: p ?? defaultpen, stroke: null } });
  label([L ?? "", z, align ?? E, p]);
}

// carafes go here
function descale<T extends Rime<Fielded>>(z: T): T {
  return z instanceof Align
    ? new Align(z.x / randy.scaling.x, z.y / Render.UP / randy.scaling.y) as T
    : z instanceof Pair
      ? new Pair(z.x / randy.scaling.x, z.y / Render.UP / randy.scaling.y) as T
      : z instanceof Real
        ? new Real(z.x / randy.scaling.x) as T
        : (z as number) / randy.scaling.x as T;
}

export { lookup, descale, remember, recall };