function loudly<T>(speech: T): T {
  console.log(speech);
  return speech;
}

function timely<T>(work: T, iterations: number=1): T {
  const t = new Date().getTime();
  Array(iterations).forEach(() => work);
  console.log(new Date().getTime()-t);
  return work;
}

const assertive: boolean = false;

function assert(condition: boolean, angry?: string, happy?: string): void {
  if (!assertive) return;
  if (!condition) {
    throw new Error(angry ?? `I do not assert.`);
  } else {
    console.log(happy ?? `I assert.`);
  }
}

export { loudly, timely, assert };