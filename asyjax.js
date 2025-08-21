"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
String.prototype.reverse = function () {
    return [...this].reverse().join('');
};
String.prototype.treem = function (...edges) {
    return this.ltreem(...edges).rtreem(...edges);
};
String.prototype.ltreem = function (...edges) {
    return edges.includes(this.charAt(0)) ? this.slice(1).ltreem(...edges) : this.toString();
};
String.prototype.rtreem = function (...edges) {
    return edges.includes(this.charAt(this.length - 1)) ? this.slice(0, -1).rtreem(...edges) : this.toString();
};
String.prototype.spleet = function (separator, limit = 1) {
    return (!limit || limit < 1)
        ? [this.toString()]
        : [this.slice(0, this.indexOf(separator))]
            .concat(this.slice(this.indexOf(separator) + 1)
            .spleet(separator, limit - 1));
};
String.prototype.rspleet = function (separator, limit = 1) {
    return (!limit || limit < 1)
        ? [this.toString()]
        : this.slice(0, this.lastIndexOf(separator))
            .rspleet(separator, limit - 1)
            .concat([this.slice(this.lastIndexOf(separator) + 1)]);
};
function AsyNumber(value) {
    return Number(SF * value);
}
const PT = 72; // 72 pt = 1 in
const SF = 0.5 * PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg
const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;
window.onload = function () {
    work();
};
function work() {
    Array.from(document.getElementsByTagName('script'))
        .filter((e) => e.getAttribute("type") === 'text/asy')
        .forEach((s) => asyToSvg(s));
}
function asyToSvg(script) {
    script.outerHTML = `
  <svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${parseLines(script.innerHTML).map((line) => read(line)).join('')}
  </svg>
  `;
}
function parseLines(asyBlock) {
    return asyBlock.trim().replace(/[\n\r\s]+/gm, '').split(';');
}
function read(asyLine) {
    if (asyLine.length <= 0) {
        return '';
    }
    return transpile(pretranspile(asyLine));
}
function pretranspile(asy) {
    return asy.replace('unitcircle', 'circle((0,0), 1)')
        .replace('unitsquare', 'box(origin, N+E)')
        .replace('origin', '(0,0)')
        .replace('N', '(0,1)')
        .replace('E', '(1,0)')
        .replace('S', '(0,-1)')
        .replace('W', '(-1,0)');
}
function transpile(asy) {
    if (asy[0] === '(') {
        return brackets(asy.slice(1, asy.lastIndexOf(')')));
    }
    else if (asy.slice(0, 5) === 'draw(' && asy.slice(-1) === ')') {
        return draw(asy.slice(5, -1));
    }
    else if (asy.slice(0, 5) === 'fill(' && asy.slice(-1) === ')') {
        return fill(asy.slice(5, -1));
    }
    else if (asy.slice(0, 9) === 'filldraw(' && asy.slice(-1) === ')') {
        return filldraw(asy.slice(9, -1));
    }
    else {
        console.log(asy);
        throw Error;
    }
}
function _dhregh(asy, options) {
    if (!asy)
        throw TypeError;
    if (asy.slice(0, 7) === 'circle(' && asy.slice(-1) === ')') {
        return circle(asy.slice(7, -1), options);
    }
    else { // assume it to be a path lol
        return path(asy, options);
    }
}
// this one checks if there's also a color argument
function draw(asy) {
    return ((ss) => CSS.supports('color', ss[1] ?? ''.trim())
        ? _dhregh(ss[0], { stroke: ss[1] })
        : _dhregh(ss.join(','), { stroke: 'black' }))(asy.rspleet(',', 1));
}
function fill(asy) {
    return ((ss) => _dhregh(ss[0], { fill: ss[1] }))(asy.rspleet(',', 1));
}
function filldraw(asy) {
    return ((ss) => _dhregh(ss[0], { fill: ss[1], stroke: ss[2] }))(asy.rspleet(',', 2));
}
function brackets(asy) {
    return transpile(asy);
}
function path(asy, options) {
    return ((pp) => `<path d="${pp.points.map((p, i) => `${i == 0 ? 'M' : 'L'} ${p.x} ${p.y} `).join('')}${pp.cyclic ? 'Z' : ''}" fill="${options.fill ?? 'none'}" stroke="${options.stroke ?? 'none'}" />`)(_path(asy));
}
function circle(asy, options) {
    return ((a) => (`<ellipse rx="${a.radius}" ry="${a.radius}" cx="${a.center.x}" cy="${a.center.y}" fill="${options.fill ?? 'none'}" stroke="${options.stroke ?? 'none'}" />`))(_circle(asy));
}
function _pair(asy) {
    if (!asy)
        throw TypeError;
    return ((ss) => ({ x: AsyNumber(ss[0]), y: ORIENTATION * AsyNumber(ss[1]) }))(asy.treem('(', ')').split(','));
}
function _path(asy) {
    if (!asy)
        throw TypeError;
    return { points: asy.replace('--cyclic', '').split('--').map((s) => _pair(s)), cyclic: asy.endsWith('--cyclic') };
}
function _circle(asy) {
    if (!asy)
        throw TypeError;
    return ((ss) => ({ center: _pair(ss[0]), radius: AsyNumber(ss[1]), from: 0, to: 360 }))(asy.rspleet(',', 1));
}
//# sourceMappingURL=asyjax.js.map