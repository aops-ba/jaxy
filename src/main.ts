// lets go
import "./global.d";

import type { pair } from "./types";
import type { label } from "./types";
import type { arc, path } from "./types";
import type { pen } from "./types";
import { Infix, Kind } from "./enums";

import { chain, loudly, assert } from "./helpers";

import { lex } from "./lexer";

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

// todo: compute these based on bounding box (which also needs computed)
const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;

// todo: why does vscode give me an error
let functions: Map<string, Function> = new Map([
  ['path', _path as Function],
  ['circle', _circle],
  ['draw', draw],
  ['fill', fill],
  ['filldraw', filldraw],
  ['', _pairOrId],
])

window.onload = function() {
  work();
}

function work(): void {
  Array.from(document.getElementsByTagName('script'))
    .filter((e) => e.getAttribute("type") === 'text/asy')
    .forEach((s) => asyToSvg(s));
}

function asyToSvg(script: HTMLScriptElement): void {
  script.outerHTML = `
  <svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${linearize(script.innerHTML).map((line: string): string => transpile(pretranspile(line))).join('')}
  </svg>
  `;
}

function linearize(asyBlock: string): string[] {
  return asyBlock.trim().replace(/[\n\r\s]+/gm, '').split(';');
}
  
function pretranspile(asy: string): string {
  return asy.replaceAll('unitcircle', 'circle((0,0), 1)')
    .replaceAll('unitsquare', 'box(origin, N+E)')
    .replaceAll('origin', '(0,0)')
    .replaceAll('N', '(0,1)')
    .replaceAll('E', '(1,0)')
    .replaceAll('S', '(0,-1)')
    .replaceAll('W', '(-1,0)')
    .replaceAll(' ', '')
    ;
}

function transpile(asy: string): string {
  log('transpile', asy);
  if (asy.length <= 0) return '';

  switch (kind(asy)) {
    case Kind.Comment:
      return '';
    case Kind.Apply:
      return _apply(asy);
    default:
      throw new TypeError(`${asy} is high and misshapen`);
  }
}

function _pairOrId(thing: string): pair | string {
  if (_delimited(thing).length === 2) {
    return _pair(thing);
  } else {
    return _parse(thing);
  }
}

// tfw apply is applicative
function _apply(asy: string): any {
  log('_apply', asy);
  return (_exterior(asy))(interior(asy));
}

function _exterior(asy: string): Function {
  log('_exterior', asy);
  return functions.get(asy.until('('))!;
}

function interior(asy: string): string {
  return asy.slice(asy.indexOf('(')+1,asy.lastIndexOf(')'));
}

function _parse(asy: string | undefined): any {
  log('_parse', asy);
  if (!asy) throw Error;

  switch(kind(asy)) {
    case Kind.Apply:
      return _apply(asy);
    case Kind.Tuple:
      return _delimited(asy);
    case Kind.Text:
      return __text(asy);
    case Kind.Value:
      return _evaluate(asy);
    default:
      throw new TypeError(`${asy} is low and misshapen`);
  }
}

function draw(asy: string): string {
  log('draw', asy);
  return (([path,stroke]) => (_dhregh(path))({ stroke: stroke }))
    (_parse(asy));
}

function fill(asy: string): string {
  log('fill', asy);
  return (([path,fill]) => (_dhregh(path))({ fill: fill }))
    (_parse(asy));
}

function filldraw(asy: string): string {
  log('filldraw', asy);
  return (([path,fill,stroke]) => (_dhregh(path))({ fill: fill, stroke: stroke }))
    (_parse(asy));
}

// sends `asy` to its svg representation with the fill and stroke missing
function _dhregh(asy: string | undefined): (pen: pen) => string {
  log('_dhregh', asy);
  if (!asy) throw Error;

  switch (kind(asy)) {
    case Kind.Apply:
      return _apply(asy);
    default:
      throw Error;
  }
}

function _circle(asy: string | undefined): (pen: pen) => string {
  log('_circle', asy);
  if (!asy) throw Error;

  return ((larc: arc): (($pen: pen) => string) =>
    ((lpen) => `<ellipse rx="${SF*larc.radius}" ry="${SF*larc.radius}"
                 cx="${SF*larc.center.x}" cy="${SF*ORIENTATION*larc.center.y}"
                 fill="${lpen.fill ?? 'none'}" stroke="${lpen.stroke ?? 'none'}" />`))
    ((([center,radius]: Array<string>): arc => ({ center: _parse(center), radius: _parse(radius), from: 0, to: 360 }))
    (_parse(asy)));
}

function _path(asy: string | undefined, pen: { fill?: string | undefined, stroke?: string | undefined}): string {
  log('_path', asy, pen);
  if (!asy) throw Error;

  return ((lpath: path): string => `<path d="${lpath.points.map((p: pair, i: number): string => `${i==0 ? 'M' : 'L'} ${SF*p.x} ${SF*ORIENTATION*p.y} `).join('')}${lpath.cyclic ? 'Z' : ''}" fill="${lpath.pen.fill ?? 'none'}" stroke="${lpath.pen.stroke ?? 'none'}" />`)
    ({ points: asy.replace('--cyclic', '').split('--').map((s: string): pair => _parse(s)), cyclic: asy.endsWith('--cyclic'), pen: pen });
}

function __number(asy: string): number {
  log('__number', asy);
  return Number(asy);
}

function __text(asy: string): string {
  log('__text', asy);
  return String(asy);
}

function _pair(asy: string | undefined): pair {
  log('_pair', asy);
  if (!asy) throw Error;

  return (([left,right]: Array<string>): pair => ({ x: _parse(left), y: _parse(right) }))
    (_delimited(asy))
}

function _evaluate(asy: string | undefined): any {
  log('_evaluate', asy);
  if (!asy) throw Error;

  if (_delimited(asy, '+').length > 1) {
    return _sum(..._delimited(asy, '+'));
  } else {
    return __number(asy);
  }
}

function _sum(...asys: (string | undefined)[]): any {
  log('_sum', ...asys);
  if (!asys.at(-1)) throw Error;

  if (asys.length === 1) {
    return _parse(asys[0]);
  } else {
    return ((left,right): any => {
      switch (type(left)) {
        case "pair":
          return { x: left.x+right.x, y: left.y+right.y };
        case "number":
          return left+right;
        default:
          return Error;
      }
    })(_sum(...asys.slice(0,-1)), _parse(asys.at(-1)));
  }
}

function type(thing: any): string {
  if (typeof thing !== "object") {
    return typeof thing;
  } else if ('x' in thing && 'y' in thing) {
    return "pair";
  } else {
    throw Error;
  }
}

function kind(asy: string | undefined): Kind {
  if (!asy) throw Error;

  if (asy.startsWith('//')) {
    return Kind.Comment;
  } else if (/^([a-zA-Z0-9]|_)*$/.test(asy.until('(')) && asy.last() === ')') {
    return Kind.Apply;
  } else if (_delimited(asy).length > 1) {
    return Kind.Tuple;
  } else {
    return Kind.Value;
  }
}

function log(name: string, ...args: any[]): void {
  console.log(`calling ${name} on ${args.join(',')}`);
}

// helpers.ts

function _delimited(s: string | undefined, delimiter=','): Array<string> {
  if (!s) throw Error;
  return chain([-1].concat(delimiters(s, delimiter))
                  .concat([s.length]))
         .map(([left,right]) => s.slice(left+delimiter.length,right));
}

function isBracketsMatched(asy: string): boolean {
  return [...asy].filter((c) => c === '(').length === [...asy].filter((c) => c === ')').length;
}

function delimiters(s: string, delimiter=','): Array<number> {
  return s.indicesOf(delimiter).filter((n) => s.forkAt(n).every(isBracketsMatched));
}