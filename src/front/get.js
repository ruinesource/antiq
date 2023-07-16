import { sendEvent } from './ws.js'
import g from '../g.js'
import { isPlainObject, isDoor, normId } from '../utils.js'

// i eventId
// d door
// e eventName
// a eventArgs
// err err
// c cookies...

// на одно свойство может потребоваться несколько сравнений (и/или)

// структура экшна
// { t: type, i: eventId, a: args }

// структура ответа
// {
//   v: { door: { id: deepValuesWithoutDoors } },
//   i: eventId
// }

// на сервере мы выполняем метод
// запускаем выполнение и чё
// смотрим, какие ивенты задействованы (может быть асинхронное)
// результаты записываем в eventId: [updates]

export async function get(name, id, opts) {
  const { currentEvent } = g
  //   const method = g.methods[eventId][g.methods[eventId].length - 1]
  //
  //   const currentItem = g.values[name][id]
  //   if (currentItem) {
  //     method.result = currentItem
  //     return currentItem
  //   }

  // здесь если сущность уже есть на фронте со всеми полями
  // возвращаем её даже без промиса, синхронным кодом
  // изменённые поля определяем на сервере
  // при рассчётах внутри апи могут потребоваться поля, не возвращающиеся в компоненты
  // такие поля влияют на ререндер
  // поэтому для оптимизации рендера используем omit и select апи, а не хуки

  const nId = normId({ name }, id)
  if (g.values[nId]) return g.values[nId]

  return sendEvent({
    event: {
      eventId: g.currentEvent.id,
      doorName: g.currentEvent.doorName,
      method: g.currentEvent.method,
      args: g.currentEvent.args,
    },
    onSuccess: (data) => {
      setValuesFromResponse(data.v)

      return getOne(name, id)
    },
  })
}

// храним всё в нормализованном состоянии, с рекурсиями?
// нет, иначе лишние ререндеры

function setValuesFromResponse(values) {
  for (let name in values) {
    for (let id in values[name]) {
      const diff = values[name][id]
      const itemCopy = (g.values[name][id] = { ...g.values[name][id] })

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
  if (parent === g.values[name][id]) return parent

  const result = (g.values[name][id] = { ...g.values[name][id] })

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
