import { randy } from "./main";

import { Path } from "./path";

import { Circle } from "./arc";

import { Pen, Pens } from "./pen";
import { defaultpen } from "./pen";
import Label from "./label";
import { Maybe, PT, Scaling, BBox, only, max, min, Functionlike, zip, loudly } from "./helper";
import { Keyword, Operator, Other, Token, Tokenboard } from "./tokens";
import { BakedPair } from "./bake";

import { assert } from "./helper";
import { Seen } from "./seen";
import { bakeworks, bakethings, getBakething, getBakeworks, isBakething, isBakework } from "./corned";
import { Pair, E, Rime, navel } from "./rime";
import { Bakework, Bakething } from "./yeast";

const MathJax = window["MathJax" as keyof typeof window];

type Knowledge = {
  sight: Seen,
  pens: Pens,
}

class Render {
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
      y: (y ?? x)/lmost*Render.UP,
    })) (max(max(...xs[3])-min(...xs[1]), max(...xs[2])-min(...xs[0])))
    ) (zip(...this.wisdom.filter((lw: Knowledge) => !(lw.sight instanceof Label))
        .map((lw: Knowledge) => Object.values(lw.sight.bbox()))) as number[][]);
    });
    return this;
  }

  // todo: if this comes before `size` then the labels are still sensitive thereto lol
  unitsize(x: number, y: number): Render {
    this.scaling = { x: x, y: (y ?? x)*Render.UP };
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

type Cakething = { name: string, memory: unknown };
const cakeboard: Map<string, unknown> = new Map();

function remember<T>(name: string, value: T): Cakething {
  return { name, memory: cakeboard.set(name, value).get(name) as T };
}

function recall(name: string): Cakething {
  return { name, memory: cakeboard.get(name) };
}

function lookup(thing: Token<Keyword | Operator | Other.Identifier>): unknown | Bakework[] {
  console.log("lookup", thing);
  return (lname => {
    return isBakework(lname) ? getBakeworks(lname)
    : isBakething(lname) ? getBakething(lname)
      : cakeboard.has(lname)
        ? [cakeboard.get(lname)]
        : (() => { throw new Error(`${lname} not found`); })();
  }) ("value" in thing ? thing.value as string : Tokenboard[thing.kind]);
}

function size([x, y]: [number, number]): void {
  randy.size(x, y);
}

function unitsize([x, y]: [number, number]): void {
  randy.unitsize(x, y);
}

function draw([L="", g, align=navel, p=defaultpen]: [Maybe<string>, Seen, Maybe<Pair>, Maybe<Pen>]): void {
  console.log("draw", L, g, align, p);
  assert(g !== null);
  randy.learn({ sight: g, pens: { fill: null, stroke: p ?? defaultpen } });
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
    sight: new Label(s, position ?? navel, align ?? navel),
    pens: { fill: p ?? defaultpen, stroke: null },
  });
}

// todo: calibrate dot size
// todo: L should be Label instead of string, cf. upcasting
function dot([L, z, align, p]: [Maybe<string>, Maybe<Pair>, Maybe<Pair>, Maybe<Pen>]): void {
  randy.learn({ sight: new Circle(z ?? navel, descale(1/2*defaultpen.dotsize())), pens: { fill: p ?? defaultpen, stroke: null } });
  label([L ?? "", z, align ?? E, p]);
}

// carafes go here
function descale<T extends Rime>(thing: T): T {
  return BakedPair.is(thing)
    ? { x: thing.x / randy.scaling.x, y: thing.y / randy.scaling.y / Render.UP } as T
    : thing as number / randy.scaling.x as T;
}

export type { Cakething };
export { Render, cakeboard };
export { lookup, descale, remember, recall };
export { draw, fill, filldraw, label, dot, size, unitsize };