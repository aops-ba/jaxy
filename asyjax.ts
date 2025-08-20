window.onload = function() {
  f();
}

function f(): void {
  const scripts = Array.from(document.getElementsByTagName("script"))
    .filter((e) => e.getAttribute("type") === "text/asy")
    .forEach((s) => toSvg(s));
}

function toSvg(script: HTMLScriptElement): void {
    script.outerHTML = `
    <svg height="200" width="200" viewbox="-144 -144 288 288" xmlns="http://www.w3.org/2000/svg">
    ${script.innerHTML.trim().split(/\r?\n/).map((l) => read(l.trim())).join('\n')}
    </svg>
    `;
}
  
function read(asy: string): string {
  if (!asy) {
    return "";
  }

  if (asy.includes("draw(circle")) {
    return ((circle) => `<ellipse rx="${circle[2]}" ry="${circle[2]}" cx="${circle[0]}" cy="${circle[1]}" fill="none" stroke="black" />`)
    (asy.replace("draw(circle((", "").replace("), ", ",").replace("));", "").split(',').map((x: string) => 144*Number(x)));
  }

  switch (asy) {
    case "draw(unitsquare);":
      return `<rect width="144" height="144" x="0" y="0" fill="none" stroke="black" />`;
    case "draw(unitcircle);":
      return `<ellipse rx="144" ry="144" cx="0" cy="0" fill="none" stroke="black" />`;
    default:
      console.log("uh oh");
      return "";
  }
}