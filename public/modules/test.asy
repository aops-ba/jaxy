unitsize(1cm);

filldraw(circle((0,0), 2), white, black);
fill(unitcircle, red);
draw(circle(N, 1), blue);
draw(circle(S, 1), blue);
draw(circle(E, 3/2), green);
draw(circle(W, 3/2), green);

dot((0,0));
dot(3*E+N, magenta);
dot(-E-E-E-S, cyan);

label("hello friends", (0, 1+1+1), white);
label("\( \int_0^\infty f^2(x_1, x_2)\ dx \)", 4*E);
label("goodbye foes", (-N)+S-1+2*E+S-1-N, red);

draw(dir(60)--2*dir(150)--3*dir(240)--4*dir(330)--cycle, yellow);
