export type pair = {
  x: number,
  y: number,
}

export type path = {
  points: Array<pair>,
  cyclic: boolean,
}

export type arc = {
  center: pair,
  radius: number,
  from: number,
  to: number,
}

export type pen = {
  fill?: string | undefined,
  stroke?: string | undefined,
}

export type label = {
  s: string,
  position: pair,
}