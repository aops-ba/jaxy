declare global {
  interface String {
    reverse(): string;
    treem(...edges: string[]): string;
    ltreem(...edges: string[]): string;
    rtreem(...edges: string[]): string;
    spleet(separator: string, limit?: number): Array<string>;
    rspleet(separator: string, limit?: number): Array<string>;
  }
}

String.prototype.reverse = function() {
  return [...this].reverse().join('');
}

String.prototype.treem = function(...edges) {
  return this.ltreem(...edges).rtreem(...edges);
}

String.prototype.ltreem = function(...edges) {
  return edges.includes(this.charAt(0)) ? this.slice(1).ltreem(...edges) : this.toString();
}

String.prototype.rtreem = function(...edges) {
  return edges.includes(this.charAt(this.length-1)) ? this.slice(0,-1).rtreem(...edges) : this.toString();
}

String.prototype.spleet = function(separator, limit=1) {
  return (!limit || limit < 1)
    ? [this.toString()]
    : [this.slice(0,this.indexOf(separator))]
      .concat(this.slice(this.indexOf(separator)+1)
      .spleet(separator, limit-1));
}

String.prototype.rspleet = function(separator, limit=1) {
  return (!limit || limit < 1)
    ? [this.toString()]
    : this.slice(0,this.lastIndexOf(separator))
      .rspleet(separator, limit-1)
      .concat([this.slice(this.lastIndexOf(separator)+1)]);
}

type pair = {
  x: number;
  y: number;
}

type path = {
  points: Array<pair>;
  cyclic: boolean;
}

type arc = {
  center: pair;
  radius: number;
  from: number;
  to: number;
}

function AsyNumber(value?: any) {
  return Number(SF*value);
}

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;

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
    ${parseLines(script.innerHTML).map((line: string): string => read(line)).join('')}
  </svg>
  `;
}

function parseLines(asyBlock: string): string[] {
  return asyBlock.trim().replace(/[\n\r\s]+/gm, '').split(';');
}
  
function read(asyLine: string): string {
  if (asyLine.length <= 0) {
    return '';
  }

  return transpile(pretranspile(asyLine));
}

function pretranspile(asy: string): string {
  return asy.replace('unitcircle', 'circle((0,0), 1)')
    .replace('unitsquare', 'box(origin, N+E)')
    .replace('origin', '(0,0)')
    .replace('N', '(0,1)')
    .replace('E', '(1,0)')
    .replace('S', '(0,-1)')
    .replace('W', '(-1,0)')
    ;
}

function transpile(asy: string): string {
  if (asy[0] === '(') {
    return brackets(asy.slice(1, asy.lastIndexOf(')')));
  } else if (asy.slice(0,5) === 'draw(' && asy.slice(-1) === ')') {
    return draw(asy.slice(5,-1));
  } else if (asy.slice(0,5) === 'fill(' && asy.slice(-1) === ')') {
    return fill(asy.slice(5,-1));
  } else if (asy.slice(0,9) === 'filldraw(' && asy.slice(-1) === ')') {
    return filldraw(asy.slice(9,-1));
  } else {
    console.log(asy);
    throw Error;
  }
}

function _dhregh(asy: string | undefined, options: { fill?: string | undefined, stroke?: string | undefined}): string {
  if (!asy) throw TypeError;
  if (asy.slice(0,7) === 'circle(' && asy.slice(-1) === ')') {
    return circle(asy.slice(7,-1), options);
  } else { // assume it to be a path lol
    return path(asy, options);
  }
}

// this one checks if there's also a color argument
function draw(asy: string): string {
  return ((ss: Array<string>): string => CSS.supports('color', ss[1] ?? ''.trim())
    ? _dhregh(ss[0], { stroke: ss[1] })
    : _dhregh(ss.join(','), { stroke: 'black' }))(asy.rspleet(',', 1));
}

function fill(asy: string): string {
  return ((ss: Array<string>): string => _dhregh(ss[0], { fill: ss[1] }))
    (asy.rspleet(',', 1));
}

function filldraw(asy: string): string {
  return ((ss: Array<string>): string => _dhregh(ss[0], { fill: ss[1], stroke: ss[2] }))
    (asy.rspleet(',', 2));
}

function brackets(asy: string): string {
  return transpile(asy);
}

function path(asy: string, options: { fill?: string | undefined, stroke?: string | undefined}): string {
  return ((pp: path): string => `<path d="${pp.points.map((p: pair, i: number): string => `${i==0 ? 'M' : 'L'} ${p.x} ${p.y} `).join('')}${pp.cyclic ? 'Z' : ''}" fill="${options.fill ?? 'none'}" stroke="${options.stroke ?? 'none'}" />`)
    (_path(asy));
}

function circle(asy: string, options: { fill?: string | undefined, stroke?: string | undefined}): string {
  return ((a: arc): string => (`<ellipse rx="${a.radius}" ry="${a.radius}" cx="${a.center.x}" cy="${a.center.y}" fill="${options.fill ?? 'none'}" stroke="${options.stroke ?? 'none'}" />`))
    (_circle(asy));
}

function _pair(asy: string | undefined): pair {
  if (!asy) throw TypeError;
  return ((ss: Array<string>): pair => ({ x: AsyNumber(ss[0]), y: ORIENTATION*AsyNumber(ss[1]) }))
    (asy.treem('(', ')').split(','));
}

function _path(asy: string): path {
  if (!asy) throw TypeError;
  return { points: asy.replace('--cyclic', '').split('--').map((s: string): pair => _pair(s)), cyclic: asy.endsWith('--cyclic') };
}

function _circle(asy: string | undefined): arc {
  if (!asy) throw TypeError;
  return ((ss: Array<string>): arc => ({ center: _pair(ss[0]), radius: AsyNumber(ss[1]), from: 0, to: 360 }))
    (asy.rspleet(',', 1));
}