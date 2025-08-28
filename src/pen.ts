import { Pair, origin } from "./number";


export class Color {
  r: number;
  g: number;
  b: number;

  static names: Map<string, Color> = new Map([
    ['black', new Color({rgb: [0, 0, 0]})],
    ['red', new Color({rgb: [255, 0, 0]})],
    ['green', new Color({rgb: [0, 255, 0]})],
    ['blue', new Color({rgb: [0, 0, 255]})],
    ['white', new Color({rgb: [255, 255, 255]})],
    ['yellow', new Color({rgb: [255, 255, 0]})],
    ['magenta', new Color({rgb: [255, 0, 255]})],
    ['cyan', new Color({rgb: [0, 255, 255]})],
  ]);

  constructor(options: { color?: Color, name?: string, rgb?: [number, number, number] }) {
    if (options.color) {
      this.r = options.color.r;
      this.g = options.color.g;
      this.b = options.color.b;
    } else if (options.rgb) {
      this.r = options.rgb[0];
      this.g = options.rgb[1];
      this.b = options.rgb[2];
    } else {
      throw new Error(`${options} isn't a color.`);
    }
  }

  toString(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
}
export type Pens = { fill?: Pen, stroke?: Pen };

export class Pen {
  static dotfactor = 6;

  color: Color;
  width: number;

  static fromRgb(r: number, g: number, b: number) {
    return new Pen({r: r, g: g, b: b});
  };

  static fromColor(color: Color) {
    return new Pen({color: color});
  };

  static fromName(name: string) {
    return new Pen({name: name});
  };

  dotsize(): number {
    return this.width/Pen.dotfactor;
  }

  private constructor(options: {name?: string, color?: Color, r?: number, g?: number, b?: number}) {
    this.width = 0.5*2;
    if (options.name)
      this.color = Color.names.get(options.name)!;
    else if (options.color)
      this.color = options.color;
    else if (options.r && options.g && options.b)
      this.color = new Color({rgb: [options.r, options.g, options.b]});
    else throw new Error(`${options} bad!`);
  }

  linewidth(n: number): Pen {
    this.width = n;
    return this;
  }
}

export const defaultpen = Pen.fromName("black");
export const penboard: Map<string, Function> = new Map([...Color.names.entries()].map(([k,v]) => [k, () => Pen.fromColor(v)]));