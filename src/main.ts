import { Parser } from "./parser";
import { Render } from "./render";
import { Functionlike, loudly, zip } from "./helper";
import { emptyCake } from "./corned";
import fandtest from "./fand";

const asyblock = document.getElementById("asy") as HTMLTextAreaElement;
const svgblock = document.getElementById("svg") as unknown as SVGGraphicsElement;
const eyes = document.getElementById("eyes") as HTMLSpanElement;
const ears = document.getElementById("ears") as HTMLSpanElement;
const doMathJax = document.getElementById("doMathJax") as HTMLInputElement;
const doNightJax = document.getElementById("doNightJax") as HTMLInputElement;

const randy: Render = new Render(svgblock, doMathJax);

window.onload = function() {
  asyblock.innerHTML = orsong;
  asyblock.addEventListener("input", () => ordeal());
  doMathJax.addEventListener("click", () => ordeal());
  doNightJax.addEventListener("click", () => tonight());

  window.addEventListener("resize", () => randy.show());
  eyes.addEventListener("click", () => twilight());
  ears.addEventListener("click", () => truesight());

  tonight();
  twilight();
  truesight();

  ordeal();
}

function tonight(): void {
  svgblock.setAttribute("class", doNightJax.checked ? "tonight" : "");
}

function twilight(): void {
  ((lday: Date) => ((lsun: string, lmoon: string) => 
    ((ltoken: boolean) =>
      ((leyes: string) =>
        ((lhues: string[]) => {
          eyes.innerHTML = leyes;
          (zip(["--bg", "--mg", "--fg", "--shadow"], lhues) as [string, string][])
            .forEach((lxs: [string, string]) => document.body.style.setProperty(lxs[0], lxs[1]));
        }) (ltoken ? ["dimgrey", "black", "white", "blue"] : ["lightgrey", "white", "black", "red"])
      ) (ltoken ? lmoon : lsun)
    ) (eyes.innerHTML === lsun || (eyes.innerHTML === "" && Math.abs(lday.getHours()-12) > 6))
  ) ('☉', lday.getDate()<15 ? '☽' : '☾')) (new Date());
}

function truesight(): void {
  ((lezh, lesh) => ((lasleep: boolean) =>
    ([["open", (le: HTMLElement) => le.tagName === "div" ? "block" : "inline", () => "none"],
      ["closed", () => "none", (le: HTMLElement) => le.tagName === "div" ? "block" : "inline"]
     ] as [string, Functionlike<string>, Functionlike<string>][])
      .map(([lmouth, lyes, lno]: [string, Functionlike<string>, Functionlike<string>]) => {
        ([...document.getElementsByClassName(lmouth)] as HTMLElement[])
          .forEach((le: HTMLElement) => le.style.setProperty("display", lasleep ? lyes(le) : lno(le)));
        ears.innerHTML = lasleep ? lezh : lesh;
      })
    ) (ears.innerHTML === lesh)
  ) ('ɮ', 'ɬ');
}

// Lexy (she/they) the lexer,
// Percy (he/they) the parser,
// Randy (they/them) the renderer,
// Mindy (he/she) the minder/piler/understander.
// the merx
// we all live together in a happy world

async function ordeal(): Promise<void> {
  console.clear();
  randy.forget();
  emptyCake();
//  fandtest();
//  return;
  asyblock.style.setProperty("border", "2px solid var(--mg)");
  try {
    new Parser(asyblock.value.trim()).parse().understandAll();
    await randy.show();
    loudly("we did it");
  } catch (e) {
    asyblock.style.setProperty("border", "2px solid red");
    throw new Error(`we didn't do it: ${e}`);
  }
}

const orsong: string = String.raw
`import goods;

size(400);

draw(circle(origin, 8*r));

filldraw(circle(origin, 3), cyan, black);
fill(circle(origin, 2), blue);
draw(unitcircle, red);
filldraw(circle(N, 1/2), blue);
filldraw(circle(2*S, 3/4), green);
filldraw(circle(E/3, 0.5), yellow);

int s = 4;

dot("one");
dot(s*W);
dot(s*W, W);
dot(red);

dot("two", s*NW);
dot("two", s*N, N);
dot("two", green);
dot(s*NE, green);
dot(s*E, E, green);

dot("three", s*SE, blue);
dot("three", s*SW, SW, blue);

label(beowulf, 2*S);
label("\( \phi, \psi \vDash \int_0^\infty (f')_i^2\langle \vec x_1, x|_2\rangle\ d\mathbf s \)", 2*E);
label("\( \frac1{1+\frac1{1+\frac1{1+\frac1{1+\frac1{1+\frac1{1+\frac1{1+\frac1\dots}}}}}}} \)", 2*W, magenta);

if (1+1 == 2) {
  label("we did it", 4*N);
} else {
  label("we didn't do it", 4*S);
}

draw(2.5*dir(60)--3*dir(150)--2.5*dir(210)--3*dir(300)
   --2.5*dir(0)--3*dir(90)--2.5*dir(150)--3*dir(240)
   --2.5*dir(300)--3*dir(30)--2.5*dir(90)--3*dir(180)
   --2.5*dir(240)--3*dir(330)--2.5*dir(30)--3*dir(120)
   --2.5*dir(180)--3*dir(270)--2.5*dir(330)--3*dir(60)
   --2.5*dir(120)--3*dir(210)--2.5*dir(270)--3*dir(0)--cycle);

for (int i=0; i<16; i++) {
  draw(origin--8*dir(i*360/16));
}`;

export { randy };