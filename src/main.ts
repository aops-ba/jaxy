// todo: learn when to explicitly use ! and ?
import "./global.d";

import type { Pair } from "./types";
import type { Path } from "./types";

import { Arc, Circle } from "./types";
import { unitcircle } from "./types";

import type { Pen } from "./types";
import { red, blue } from "./types";
import { unfill, unstroke } from "./types";
//import { Pen, defaultpen, unfill, unstroke } from "./types";

import type { Tree } from "./parser";
import { oldmill } from "./parser";
import { TokenEnum } from "./lexer";

import { id, chain, loudly, timely, assert } from "./helper";

import lex from "./lexer";
import parse from "./parser";

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

// todo: compute these based on bounding box (which also needs computed)
const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;

window.onload = function() {
  Array.from(document.getElementsByTagName("script"))
    .filter((e) => e.getAttribute("type") === "text/asy")
    .forEach((s) => s.outerHTML = transpile(s.innerHTML.trim()));
}

function transpile(s: string): string {
  console.log(oldmill(parse(lex(s))));
  return `<svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${mill(parse(lex(s)))}
  </svg>`;
}

// the mill that turns trees into drawings
function mill(tree: Tree): any {
  console.log(tree);
  switch (tree.token.name) {
    case TokenEnum.Identifier:
      switch (tree.token.value) {
        case 'draw': return draw(mill(tree.left!));
        case 'fill': return fill(mill(tree.left!));
        case 'filldraw': return filldraw(mill(tree.left!));
        case 'circle': return circle(mill(tree.left!), mill(tree.right!));
        case 'unitcircle': return unitcircle;
        case 'origin': return origin;
        case 'red': return red;
        case 'blue': return blue;
        default: throw Error;
      }
    case TokenEnum.Comma:
      return [mill(tree.left!)].concat(mill(tree.right!));
    case TokenEnum.Number:
      return tree.token.value;
    default:
      throw Error;
  }
}

function draw(args: any[]): string {
  return gyenh1(args[0], unfill(args[1]));
}

function fill(args: any[]): string {
  return gyenh1(args[0], unstroke(args[1]));
}

function filldraw(args: any[]): string {
  return fill([args[0], args[1]])+draw([args[0], args[2] ?? args[1]]);
}

function gyenh1(path: Path | Arc, pen: Pen): string {
  return `<ellipse rx="${SF*path.radius}" ry="${SF*path.radius}"
               cx="${SF*path.center.x}" cy="${SF*ORIENTATION*path.center.y}"
               fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? 'none'}" />`;
}

function circle(c: Pair, r: number): Arc {
  return { center: c, radius: r, from: 0, to: 360 };
}