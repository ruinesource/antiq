import g from './g.js'

export const isDoor = (x) => x && x.name && g.door[x.name] === x

export const isPlainObject = (x) => x && {}.__proto__ === x.__proto__

export const isPrimitive = (x) => ['string', 'number'].includes(typeof x)

export const tn = (...path) => path.join('_')

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
    else {
      to = to[k] || (to[k] = typeof k === 'number' ? [] : {})
    }
  }
  return value
}

export function isPromise(x) {
  return x && typeof x.then === 'function'
}

export function getPath(from, path) {
  if (!from) return void 4
  for (let k of path) {
    if (!from[k]) return void 4
    from = from[k]
  }
  return from
}

export function iterate(x, cb, path = []) {
  cb(x, path)

  if (Array.isArray(x))
    for (let i = 0; i < x.length; i++) {
      path.push(i)
      iterate(x[i], cb, path)
      path.pop()
    }
  if (isPlainObject(x))
    for (let k in x) {
      path.push(k)
      iterate(x[k], cb, path)
      path.pop()
    }
}

export function iteratePrimitivesOrEmpty(x, cb, path = []) {
  if (Array.isArray(x)) {
    if (!x.length) cb(x, path)
    else
      for (let i = 0; i < x.length; i++) {
        path.push(i)
        iteratePrimitivesOrEmpty(x[i], cb, path)
        path.pop()
      }
  } else if (isPlainObject(x)) {
    if (!Object.keys(x).length) cb(x, path)
    else
      for (let k in x) {
        path.push(k)
        iteratePrimitivesOrEmpty(x[k], cb, path)
        path.pop()
      }
  } else cb(x, path)
}

export function copy(x) {
  if (Array.isArray(x)) return x.map(copy)
  if (isPlainObject(x)) {
    const y = {}
    for (let k in x) y[k] = copy(x[k])
    return y
  }
  return x
}

export function getParentOrEvent(event) {
  if (!event?.parent?.id || event.parent === event) return event
  return getParentOrEvent(event.parent)
}

export const delay = (ms) => new Promise((k) => setTimeout(k, ms))
