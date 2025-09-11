import { randy } from "./main";

import { Align, Fielded, Pair, Real, Rime } from "./reckon";
import { origin, E } from "./reckon";

import { Path } from "./path";

import { Circle } from "./arc";

import { Pen, Pens } from "./pen";
import { defaultpen } from "./pen";
import Label from "./label";
import { Maybe, PT, Scaling, BBox, only, max, min, Functionlike, zip } from "./helper";
import { Keyword, Operator, Other, Token, Tokenboard } from "./tokens";
import { Bakename, cakeboard } from "./bake";
import { assert } from "./helper";
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
  wisdom!: Knowledge[];
  scaling!: Scaling;
  afterwork!: Functionlike<unknown>[];

  doTex: HTMLInputElement;

  constructor(svgblock: SVGGraphicsElement, doTex: HTMLInputElement) {
    this.svgblock = svgblock;
    this.doTex = doTex;
    ((lb) => {
      this.svgblock.setAttribute("width", `${lb.maxx-lb.minx}`);
      this.svgblock.setAttribute("height", `${lb.maxy-lb.miny}`);
    })(this.greatbox());

    this.forget();
    //loudly(window.devicePixelRatio);
  }

  size(x: number, y: number): Render {
    this.afterwork.push(() => { this.scaling = ((xs: number[][]) => ((lmost: number) => ({
      x: x/lmost,
      y: y/lmost*Render.UP,
    })) (max(max(...xs[3])-min(...xs[1]), max(...xs[2])-min(...xs[0])))
    ) (zip(...this.wisdom.filter((lw: Knowledge) => !(lw.sight instanceof Label))
        .map((lw: Knowledge) => ((lb: BBox) => [lb.minx, lb.miny, lb.maxx, lb.maxy])(lw.sight.bbox()))
      ) as number[][]);
    });
    return this;
  }

  // todo: if this comes before `size` then the labels are still sensitive thereto lol
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
    this.afterwork = [];
    this.scaling = Render.DEFSCALE;
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
        `<foreignObject x="${ls.x*(lx.position.x+lx.align.x)}" y="${ls.y*(lx.position.y+lx.align.y)}"`
        + `style="overflow: visible;">`
        + this.ink(knowledge) + `</foreignObject>`)(knowledge.sight)(this.scaling);
    } else {
      throw new Error("idk how to draw this");
    }
  }

  ink(knowledge: Knowledge): string {
    if (knowledge.sight instanceof Label) {
      return `\\(\\textcolor[RGB]{` + ((lc) => `${lc.r},${lc.g},${lc.b}`)(knowledge.pens.fill!.color) + `}`
      + `{${`${(`\\text{${knowledge.sight.text
        .replace(/\\\)/gm, '\\)\\text{')
        .replace(/\\\(/gm, '}\\(')}}}`)
        .replace(/\\text{}|\\\(|\\\)/gm, '')}\\)`}`;
    } else {
      return (({fill, stroke}) => `fill="${fill?.color ?? "none"}" stroke="${stroke?.color ?? "none"}"`
        + ` stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"`
        + ` stroke-width="${PT*(stroke ?? defaultpen).linewidth}"`)(knowledge.pens);
    }
  }

  // todo: should these promises resolve all at render time or eachwise at read time?
  // todo: afterwork needs to wait for `mete`s to fulfill
  async show(): Promise<void> {
    await (async (l): Promise<void> => {
      this.svgblock.innerHTML = `${
        this.doTex.checked
        ? (await Promise.all(this.wisdom.map(async (lk: Knowledge) => await this.mete(lk)))
          .then((outcome) => { this.afterwork.forEach(f => f()); return outcome; })
          .then((outcome) => outcome.flat().map((lk: Knowledge | string) => this.sketch(lk))))
        : (() => {
            this.afterwork.forEach(f => f());
            return this.wisdom.flat().map((lk: Knowledge | string) => this.sketch(lk));
          })()
      .join('')}`;
      this.svgblock.setAttribute("viewBox", `${l.minx} ${l.miny} ${l.maxx-l.minx} ${l.maxy-l.miny}`);
      this.svgblock.setAttribute("preserveAspectRatio", "xMidYMid meet");
    })(this.greatbox());
  }

  async mete(k: Knowledge): Promise<Knowledge | string> {
    return !(k.sight instanceof Label)
      ? k
      : (async (le: HTMLElement) => {
          document.getElementById("unseen")!.appendChild(le).innerHTML = this.sketch(k);
          await MathJax.typesetPromise([le]);

          // todo: the tex is ever so slightly lower than it should be????
          return ((lf: SVGForeignObjectElement) => (((lr: DOMRect): string => {
            lf.setAttribute("x", `${Number(lf.getAttribute("x"))-lr.width/2}`);
            lf.setAttribute("y", `${Number(lf.getAttribute("y"))-lr.height/2}`);
            lf.setAttribute("width", ''+lr.width);
            lf.setAttribute("height", ''+lr.height);
            document.getElementById("unseen")!.removeChild(le);
            // todo: check that this bbox doesnt get used for anything besides calculating the scaling when using `size`
//            (k.sight as Label).setBBox(lr);
            return lf.outerHTML;
          }) (lf.firstElementChild!.getBoundingClientRect())))
          (only([...le.getElementsByTagName("foreignObject")]));
        }) (document.createElement("svg"));
  }

  private greatbox(): BBox {
    return (l => ({
      minx: -l.width/2,
      miny: -l.height/2,
      maxx: l.width/2,
      maxy: l.height/2,
    })) (this.svgblock.getBoundingClientRect());
  }
}

//  ["NE", N.plus(E).unit()],
//  ["SE", S.plus(E).unit()],
//  ["SW", S.plus(W).unit()],
//  ["NW", N.plus(W).unit()],
//  ["cycle", "cycle"],

function HAS(name: string): boolean {
  return cakeboard.filter(f => f.namey === name).length > 0;
}

function GET(name: string): unknown {
  return cakeboard.filter(f => f.namey === name).map(x => x.inkinds === "not a function" ? x() : x);
}

//function GET(name: string, inkinds: Bakename[] =[]): unknown {
//  return (x => x.inkinds === "not a function" ? x() : x)
//    (only(cakeboard.filter(f => f.namey === name)));
//}

export type Memory = { name: string, memory: unknown };
export const variables: Map<string, unknown> = new Map();

function remember<T>(name: string, value: T): Memory {
  return { name, memory: variables.set(name, value).get(name) as T };
}

function recall(name: string): Memory {
  return { name, memory: variables.get(name) };
}

function lookup(thing: Token<Keyword | Operator | Other.Identifier>): any {
//  console.log(thing, thing.kind, Tokenboard[thing.kind], cakeboard);
  if (thing === null) return null;
  return (lname => {
    return HAS(lname)
      ? GET(lname)
      : variables.has(lname)
        ? variables.get(lname)
        : (() => { throw new Error(`${lname} not found`); })();
  }) ("value" in thing ? thing.value as string : Tokenboard[thing.kind]);
}

function draw([L, g, align, p]: [Maybe<string>, Seen, Maybe<Pair>, Maybe<Pen>]): void {
  assert(g !== null);
  randy.learn({ sight: g, pens: { fill: null, stroke: p ?? defaultpen } });//_.flatten ([g.show({ fill: null, stroke: p ?? defaultpen })]);
}

function fill([g, p]: [Seen, Maybe<Pen>]): void {
  assert(g !== null);
  randy.learn({ sight: g, pens: { fill: p ?? defaultpen, stroke: null } });
}

function filldraw([g, fillpen, strokepen]: [Seen, Maybe<Pen>, Maybe<Pen>]): void {
  assert(g !== null);
  randy.learn({ sight: g, pens: { fill: fillpen ?? defaultpen, stroke: null } });
  randy.learn({ sight: g, pens: { fill: null, stroke: strokepen ?? defaultpen } });
}

// todo: calibrate label appearance
// todo: lots of redundancy with type checking / guarding
function label([s, position, align, p]: [string, Maybe<Pair>, Maybe<Pair>, Maybe<Pen>]): void {
  assert(s !== null);
  randy.learn({
    sight: new Label(s, position ?? origin, align ?? origin),
    pens: { fill: p ?? defaultpen, stroke: null },
  });
}

// todo: calibrate dot size
// todo: L should be Label instead of string, cf. upcasting
function dot([L, z, align, p]: [Maybe<string>, Maybe<Pair>, Maybe<Align>, Maybe<Pen>]): void {
  randy.learn({ sight: new Circle(z ?? origin, descale(1/2*defaultpen.dotsize())), pens: { fill: p ?? defaultpen, stroke: null } });
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
export { draw, fill, filldraw, label, dot };