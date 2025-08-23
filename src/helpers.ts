// [a, b, c, d, …] -> [[a, b], [b, c], [c, d], …]
export function chain<T>(list: Array<T>): Array<[T, T]> {
  return list.slice(0,-1).map((v,i) => [v, list[i+1] as T]);
}

// for debugging
export function loudly<T>(speech: T): T {
  console.log(speech);
  return speech;
}

// for debugging
export function assert(condition: boolean): void {
  if (!condition) {
    throw Error;
  }
}