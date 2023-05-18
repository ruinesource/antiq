import g from '../g.js'
import { get } from './get.js'
import { put } from './put.js'

export function door(name, descFunc, api = {}, opts) {
  const door = {
    name,
  }

  g.door[name] = door
  g.v[name] = {}
  g.desc[name] = descFunc

  for (let k in api) {
    door[k] = event(door, name, api[k])
    door[k].name = `jim morrison`
  }

  return door
}

// очередь выполнения методов внутри ивентов и их количество
// на фронте и сервере одинаковы
// и мы можем использовать индекс массива
// напару с apiFnName он даёт полное представление о том, что за действие выполнено
// ведь все аргументы отправляются с первым запросом фронта

// !!! ИВЕНТ В ИВЕНТЕ В ИВЕНТЕ ЧТО С ИВЕНТ ИД !!!

function event(door, name, apiFn) {
  return async function event(args) {
    const eventId = Math.random()
    g.methods[eventId] = []
    g.loaders[eventId] = true

    if (!g.opened) await g.openingPromise

    // get(id) === getOne
    // get({ ...equalityFilters }, { sort: ['name.asc'], pag: [from, to] }) === get[]
    // get(ast) -> get[]

    // весь случай, когда с сервера не отправляется ответ на метод
    // это если результат метода ивента можно записать
    // опираясь исключительно на фронтовый стор

    function withEventId(name, method) {
      return (...args) => {
        g.currentEventId = eventId
        return method(...args)
      }
    }

    // метод может не отправлять запрос на сервер
    // doorApi отправляет запрос всегда
    // функция back тоже отправляет запрос, потому что может потребоваться её результат на фронте
    // бэку нужно знать, о каком ивенте речь
    // апи внутри ивента выполняется в строго определённом порядке
    // в зависимости от аргументов
    // но всегда одинаково на фронтенде и сервере

    door.get = withEventId('get', (id) => get(name, id))
    door.put = withEventId('put', (diff) => put(name, diff))

    let result
    try {
      g.currentEventId = eventId
      result = await apiFn({ a: args })
    } catch (e) {
      console.log(e)
    }

    g.loaders[eventId] = false
    delete door.get
    delete door.put
    delete g.methods[eventId]

    return result
  }
}
