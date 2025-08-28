import _ from "lodash/fp";

const loud = false;

function loudly(...speeches: any[]): any | any[] {
  return _proudly(loud, ...speeches);
}

function proudly(...speeches: any[]): any | any[] {
  return _proudly(true, ...speeches);
}

function _proudly(condition: boolean=true, ...speeches: any[]): any | any[] {
  return ((l) => {
    if (condition) {
      console.log(l);
    }
    return l;
  })(shed(speeches));
}

function timely<T,U>(work: ($T: T) => U=_.identity, iterations: number=1): ($T: T) => U {
  const t = _.now();
  _.forEach (work) (Array(iterations));
  console.log(`${iterations} iterations took ${_.now()-t}ms.`);
  return work;
}

// [a] -> a on singletons, else id
function shed(body: unknown[]): unknown {
  return ((l) => l.length > 1 ? l : l[0])(_.flatten([body]));
}

// inverse of `shed`
function shell(body: unknown): unknown[] {
  return _.flatten([body]);
}

export { loudly, proudly, timely, shed, shell };