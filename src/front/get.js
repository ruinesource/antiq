import { ws } from './ws.js'
import g from '../g.js'
import { isPlainObject, isDoor, normId } from '../utils.js'

// t type
// i eventId
// a args
// e err
// c cookies

// на одно свойство может потребоваться несколько сравнений (и/или)

// структура запроса
// { t: type, i: eventId, a: args, e: err }

// структура ответа
// {
//   v: { door: { id: deepValuesWithoutDoors } },
//   i: eventId
// }

export async function get(name, id, opts) {
  const { eventId } = opts
  g.currentEventId = null
  //   const method = g.methods[eventId][g.methods[eventId].length - 1]
  //
  //   const currentItem = g.v[name][id]
  //   if (currentItem) {
  //     method.result = currentItem
  //     return currentItem
  //   }

  // здесь если сущность уже есть на фронте со всеми полями
  // возвращаем её Promise.resolve т.к. коннект через сокеты
  // изменённые поля определяем на сервере
  // при рассчётах внутри апи могут потребоваться поля, не возвращающиеся в компоненты
  // такие поля влияют на ререндер
  // поэтому для оптимизации рендера используем omit и select апи, а не хуки

  // 1. Получаем

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
        setValuesFromResponse(data.v)

        const item = getOne(name, id)

        resolve(item)
      }
    }
    delete g.listner[eventId]
  }

  let result
  try {
    result = await promise
  } catch (e) {
    delete g.currentEventId
  }

  g.currentEventId = result

  return result
}

// храним всё в нормализованном состоянии, с рекурсиями?
// да, для ===
// но это создаёт лишние ререндеры в случае изменений неиспользуемых детей
// новое сообщение чата вызовет ререндер хедера
// может имеет смысл разделить массивы и объекты?

// холостой нормализации можно избежать, смотря на дату последнего изменения родителя и детей
// если хоть один ребёнок изменился, выполняем нормализацию
// на изменения всех сущностей записываем даты

function setValuesFromResponse(v) {
  for (let name in v) {
    for (let id in v[name]) {
      const diff = v[name][id]
      const itemCopy = (g.v[name][id] = { ...g.v[name][id] })

      for (let key in diff) {
        if (isPlainObject(diff[key])) {
          itemCopy[key] = setSliceFromResponse(itemCopy[key], diff[key])
        } else if (Array.isArray(diff[key])) {
        } else {
          itemCopy[key] = diff[key]
        }
      }
    }
  }
}

function setSliceFromResponse(currentSlice, diff) {
  const copy = { ...currentSlice }

  for (let key in diff) {
    if (isPlainObject(diff[key])) {
      copy[key] = setSliceFromResponse(copy[key], diff[key])
    } else if (Array.isArray(diff[key])) {
    } else {
      copy[key] = diff[key]
    }
  }

  return copy
}

function getOne(name, id, parent) {
  if (parent === g.v[name][id]) return parent

  const result = (g.v[name][id] = { ...g.v[name][id] })

  const desc = g.desc[name]

  // if (!val) return val
  // for (let k in val) {
  //   result[k] = getDeep([name, k], val[k], v, desc[k], parent || result)
  // }

  return result
}

// function getDeep(name, id) {}

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
