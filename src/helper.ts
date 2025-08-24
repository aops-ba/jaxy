export function id<T>(thing: T): T {
  return thing;
}

// [a, b, c, d, …] -> [[a, b], [b, c], [c, d], …]
export function chain<T>(list: Array<T>): Array<[T, T]> {
  return list.slice(0,-1).map((v,i) => [v, list[i+1] as T]);
}

// [a, b, c, d, …] -> a+b+c+d
export function sum(list: number[]): number {
  return list.reduce((x,y) => x+y, 0);
}

export function unempty(s: string): boolean {
  return s !== '';
}

// for debugging
export function loudly<T>(speech: T): T {
  console.log(speech);
  return speech;
}

export function timely<T>(work: T, iterations: number=1): T {
  const t = new Date().getTime();
  Array(iterations).forEach((x) => work);
  console.log(new Date().getTime()-t);
  return work;
}

// for debugging
export function assert(condition: boolean): void {
  if (!condition) {
    throw new Error(`I do not assert.`);
  } else {
    console.log(`I assert.`);
  }
}