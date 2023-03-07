import { ws } from './ws.js'
import g from '../g.js'
import { isPlainObject, isDoor, pathGet } from '../utils.js'

// на get сохраняем результат в стор фронтенда

// где-то здесь приходит дата, и isPlainObject на ней выполняется как true
// а по факту это должна быть строка
// надо проверить тип этой штуки и определить, как избежать ошибки

// t type
// i eventId
// a args
// e err

export function get(name, id) {
  const eventId = Math.random()
  ws.send(
    JSON.stringify({
      t: 'get',
      a: [name, id],
      i: eventId,
    })
  )

  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  g.listner[eventId] = (data) => {
    if (data.i === eventId) {
      if (data.e) reject(data.e)
      else {
        resolve(getOne(name, data.v, id))
      }
    }
    delete g.listner[eventId]
  }

  return promise
}

function getOne(name, v, id, parent) {
  const desc = g.desc[name]

  const res = g.v[name][id] || {}
  const val = v[name]?.[id]
  if (!val) return val
  if (parent === res || !res) return res
  for (let k in val) {
    // if (SPEC_KEYS[k]) continue
    res[k] = getDeep([name, k], val[k], v, desc[k], parent || res)
  }
  g.v[id] = res

  return res
}

function getDeep(path, val, v, desc, parent) {
  if (isDoor(desc)) {
    return getOne(desc.name, v, val, parent)
  } else if (isPlainObject(desc)) {
    for (let k in val) {
      val[k] = getDeep([...path, k], val?.[k], v, desc[k], parent)
    }
    return val
  } else if (Array.isArray(desc)) {
    return []
  } else return val
}
