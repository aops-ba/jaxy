const loud = false;

function loudly(...speeches: any[]): any | any[] {
  return ((lx) => {
    if (loud) console.log(lx);
    return lx;
  })(speeches.length > 1 ? speeches : shed(speeches));
}

function proudly(...speeches: any[]): any | any[] {
  return ((lx) => {
    console.log(lx);
    return lx;
  })(speeches.length > 1 ? speeches : shed(speeches));
}

function timely<T>(work: T, iterations: number=1): T {
  const t = new Date().getTime();
  Array(iterations).forEach(() => work);
  console.log(new Date().getTime()-t);
  return work;
}

function shed<T>(flesh: T[]): T {
  if (flesh.length > 1) throw new Error(`${flesh} is too meatful to shed.`);
  return flesh[0];
}

export { loudly, proudly, timely };