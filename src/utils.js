import g from './g.js'

export const isDoor = (x) => x && x.name && g.desc.hasOwnProperty(x.name)

export const isPlainObject = (x) => x && {}.__proto__ === x.__proto__

export const isPrimitive = (x) => ['string', 'number'].includes(typeof x)

export const tn = (...path) => path.join('_')

export function isStrictArray() {}

export function isSplice() {
  // return { start, deleteCount, items }
  return
}

export function isRmAdd(diff) {
  // {
  //   rm: [...idx],
  //   add: [...] as push,
  //   { idx: item } if obj
  // }
  return diff
}

export const quot = (x) => `"${x}"`

export const pathGet = (x, path) => {
  for (let key in path) {
    if (!x) return void 0
    x = x[key]
  }
}
