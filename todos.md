# todos

- calibrations
  * line width, dot size, label margin
  * the four primal commands
- consolidate all the scatteredness in `render`
- reify aligns
- async first load
- everything in `understand` is a return, and then `Render.update` filters them out.
  maybe `understand` should just be more ramified instead.
- whatever is going on here:
```
Welcome to Asymptote version 3.05 (to view the manual, type help)
> pair f(pair p, real r) { return p+r; };
> pair f(real r, pair p) { return p-r; };
> f((1,2), (3,4))
-: 1.2: no matching function 'f(pair, pair)'
> f(2, 3);
-: 1.2: call of function 'f(int, int)' is ambiguous:

pair(real r, pair p)
pair(pair p, real r)

> f(2, 3.0);
(5,0)
> f(2.0, 3.0);
-: 1.2: call of function 'f(real, real)' is ambiguous:

pair(pair p, real r)
pair(real r, pair p)

> f(2.0, 3);
(1,0)
> f(1,2)
-: 1.2: call of function 'f(int, int)' is ambiguous:

pair(real r, pair p)
pair(pair p, real r)

> f(1.0,2)
(1,0)
> f(1,2.0)
(3,0)
> f(1.0,2.0)
-: 1.2: call of function 'f(real, real)' is ambiguous:

pair(pair p, real r)
pair(real r, pair p)

> pair f(int i=5, real x, real y) { return i; }
> f
-: 1.1: use of variable 'f' is ambiguous
<pair f(pair p, real r)>
<pair f(real r, pair p)>
<pair f(int i=<default>, real x, real y)>
> f(1.0, 2.0)
(5,0)
> f(1.0, 2);
-: 1.2: call of function 'f(real, int)' is ambiguous:

pair(real r, pair p)
pair(int i=<default>, real x, real y)

> 
```

1. fix cakeboard, sourdough, asf. so that it's a map from [name, signature] to the baked function
2. get rid of this namey nonsense
3. test underload to make sure it's working because i don't think it is
4. get everything working again