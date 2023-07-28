import g from './g.js'

export const isDoor = (x) => x && x.name && g.door[x.name] === x

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

export const normId = (door, x) => {
  // ?oneOf
  return `${door}-${x}`
}

export const pathGet = (x, path) => {
  for (let k in path) {
    if (!x) return void 0
    x = x[k]
  }
}

export function valToKey(val) {
  if (Array.isArray(val)) return JSON.stringify(val.map(valToKey))

  if (isPlainObject(val)) {
    let result = {}
    Object.keys(val)
      .sort()
      .forEach((k) => {
        result[k] = valToKey(val[k])
      })
    return JSON.stringify(result)
  }

  return val
}

export function set(to, path, value) {
  const lght = path.length
  for (let i = 0; i < lght; i++) {
    const k = path[i]
    if (lght === i + 1) to[k] = value
    else to = to[k] || (to[k] = {})
  }
}

export function iterate(inst, cb, path = []) {
  cb(inst, path)

  if (Array.isArray(inst))
    for (let i = 0; i < inst.length; i++) {
      path.push(i)
      iterate(inst[i], cb, path)
      path.pop()
    }
  if (isPlainObject(inst))
    for (let k in inst) {
      path.push(k)
      iterate(inst[k], cb, path)
      path.pop()
    }
}
