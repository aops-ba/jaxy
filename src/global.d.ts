export {};

declare global {
  // lets hope ts never implements these lol
  interface String {
    first(): string;
    last(): string;
    reverse(): string;
    from(char: string): string;
    until(char: string): string;
    forkAt(index: number): [string, string];
    indicesOf(char: string): number[];
    treem(...edges: string[]): string;
    ltreem(...edges: string[]): string;
    rtreem(...edges: string[]): string;
    spleet(separator: string, limit?: number): string[];
    rspleet(separator: string, limit?: number): string[];
  }
}

String.prototype.first = function(this: string) {
  return this.substring(0,1);
}

String.prototype.last = function(this: string) {
  return this.substring(this.length-1);
}

String.prototype.reverse = function(this: string) {
  return [...this].reverse().join('');
}

String.prototype.until = function(char) {
  return this.slice(0,this.indexOf(char));
}

String.prototype.from = function(char) {
  return this.slice(this.lastIndexOf(char)+1);
}

String.prototype.forkAt = function(index) {
  return [this.slice(0,index), this.slice(index+1)];
}

String.prototype.indicesOf = function(char) {
  return [...this].map((c: string, i: number) => c === char ? i : -1).filter((n: number) => n>=0);
}

// trim multiple characters at once
String.prototype.treem = function(...edges) {
  return this.ltreem(...edges).rtreem(...edges);
}

String.prototype.ltreem = function(...edges) {
  return edges.includes(this.first()) ? this.slice(1).ltreem(...edges) : this.toString();
}

String.prototype.rtreem = function(...edges) {
  return edges.includes(this.last()) ? this.slice(0,-1).rtreem(...edges) : this.toString();
}

// split but keep unsplits
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