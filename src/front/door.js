import g from '../g.js'
import { valToKey, set, getParentOrEvent } from '../utils.js'
import { get } from './get.js'
import { put } from './put.js'

// ивент и экшн

export function door(name, descFunc, getters = {}, setters = {}, opts) {
  const door = (g.door[name] = {
    name,
  })
  g.desc[name] = descFunc
  g.promise[name] = {}

  for (let k in getters) {
    door[k] = event(door, getters[k], k)
    g.promise[name][k] = {}
  }

  for (let k in setters) {
    door[k] = event(door, setters[k], k, true)
  }

  return door
}

// очередь выполнения методов внутри ивентов и их количество
// на фронте и сервере одинаковы
// и мы можем использовать индекс массива
// напару с apiFnName он даёт полное представление о том, что за действие выполнено
// ведь все аргументы отправляются с первым запросом фронта

// в базу данных изменения коммитим

// door.event().method
// если ивент вызвался внутри не через event, то создастся новый ивент
// и руками отменять придётся два действия в случае ошибки одного из них

function event(door, apiFn, apiName, isSetter) {
  // если event внутри event'a
  // то запрос отправляем один раз
  // в results отправляем результат для currentEvent
  // и выполняем его синхронно
  // а родительский евент

  return async function event(...args) {
    let event = {
      id: /* g.currentEvent?.id || */ Math.random(),
      doorName: door.name,
      apiName: apiName,
      results: [],
      count: -1,
      // название getParentOrEvent некорректное, и функционал здесь тоже
      // нужно записывать каждый раз в теле вызывания экшна и ивента внутри ивента
      // в parentEvent отец выполняемого ивента
      // в currentEvent вызываемый в его теле ребёнок
      // и его запихивать в результаты отца
      // сам он может стать отцом, и его results изменятся
      parent: !g.currentEvent?.id ? null : getParentOrEvent(g.currentEvent),
      args,
    }
    if (!g.opened) await g.openingPromise

    if (g.currentEvent.id) {
      const { count, results } = g.currentEvent

      if (count > results.length) results.push(event)
      else {
        g.currentEvent.count++
        return processEvent(results[count + 1])
      }
    }

    // 1. делаем массив операций ивента
    // 2. при первой нехватке данных или изменении бд отправляем запрос
    // 3. в ответе получаем либо ошибку, либо результат всех операций ивента
    // 4. продолжаем выполнять ивент, по очереди забирая из ответа данные
    // 5. массив экшнов удаляем в конце ивента, неважно делали запрос или нет

    // внутри экшнов смотрим, нужно ли отправлять запрос
    // самим экшнам не нужны id, они выполняются по порядку
    // нужен флаг, пришли ли
    return processEvent(event)
  }

  // ----------------------------------------------------------------------------- //

  async function processEvent(event) {
    const argsKey = valToKey(event.args)

    if (!isSetter && g.promise[door.name][apiName][argsKey])
      return g.promise[door.name][apiName][argsKey]

    // get(id) === getOne
    // get({ ...equalityFilters }, { sort: ['name.asc'], pag: [from, to] }) === get[]
    // get(ast) -> get[]

    // back front get put rm sql

    // лоадинг каждого экшна

    let result
    try {
      g.currentEvent = event
      setEventToDoorActions(event)
      const promise = apiFn(...event.args)

      if (!isSetter) set(g.promise, [door.name, apiName, argsKey], promise)

      // g.currentEvent = null

      result = await promise
    } catch (e) {
      console.error(e)
    } finally {
      if (!isSetter) delete g.promise[door.name][apiName][argsKey]
    }

    return result
  }

  function setEventToDoorActions(event) {
    door.get = withSettedEvent(event, (id) => get(door.name, id))
    door.put = withSettedEvent(event, (diff) => put(door.name, diff))
  }

  function withSettedEvent(event, action) {
    return async (...args) => {
      g.currentEvent = event
      const result = await action(...args)

      // по какой-то причине
      // синхронная установка переменных не даёт нужного результата
      // queueMicrotask делает её сразу после await при вызове
      queueMicrotask(() => setEventToDoorActions(event))
      g.currentEvent = event
      return result
    }
  }
}
