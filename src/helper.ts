import _ from "lodash/fp";

const loud = false;

function loudly(...speeches: any[]): any | any[] {
  return _proudly(loud, ...speeches);
}

function proudly(...speeches: any[]): any | any[] {
  return _proudly(true, ...speeches);
}
function _proudly(condition: boolean=true, ...speeches: any[]): any | any[] {
  return ((lx) => {
    if (condition) console.log(lx);
    return lx;
  })(molt(speeches));
}

function timely<T,U>(work: ($T: T) => U=_.identity, iterations: number=1): ($T: T) => U {
  const t = _.now();
  _.forEach (work) (Array(iterations));
  console.log(`${iterations} iterations took ${_.now()-t}ms.`);
  return work;
}

// identity on unsingletons
function molt(body: unknown[]): unknown {
  return ((l) => l.length > 1 ? l : l[0])(_.flattenDeep(body));
}

// identity on arrays
function shell(body: unknown): unknown[] {
  return _.flatten([body]);
}

export { loudly, proudly, timely, molt, shell };