import g from '../g.js'
import { valToKey, set, getParentOrAction, copy } from '../utils.js'
import { get } from './get.js'
import { put } from './put.js'

// экшн и метод

export function door(name, descFunc, getters = {}, setters = {}, opts) {
  const door = (g.door[name] = {
    name,
  })
  g.desc[name] = descFunc
  g.promise[name] = {}

  for (let k in getters) {
    door[k] = action(door, getters[k], k)
    g.promise[name][k] = {}
  }

  for (let k in setters) {
    door[k] = action(door, setters[k], k, true)
  }

  return door
}

// уже посчитанные изменения методов записываются в results экшнов

// в базу данных изменения коммитим

// door.action().method
// если экшн вызвался внутри не через action, то создастся новый экшн
// и руками отменять придётся два действия в случае ошибки одного из них

function action(door, apiFn, apiName, isSetter) {
  // если action внутри action'a
  // то запрос отправляем один раз
  // случай await Promise.all([xMethod, yMethod]) - оптимизация сервера напотом

  return async function action(...args) {
    const actionParent = g.currentAction?.id ? g.currentAction : null

    let action = {
      id: /* g.currentAction?.id || */ Math.random(),
      doorName: door.name,
      apiName: apiName,
      results: [],
      count: -1,
      parent: actionParent,
      args,
    }

    if (!g.opened) await g.openingPromise

    if (g.currentAction?.id) {
      const { count, results } = g.currentAction

      if (count >= results.length) results.push(action)
      else {
        g.currentAction.count++
        return processMethod(results[count + 1])
      }
    }

    // 1. делаем массив операций экшна
    // 2. при первой нехватке данных или изменении бд отправляем запрос
    // 3. в ответе получаем либо ошибку, либо результат всех операций экшна
    // 4. продолжаем выполнять экшн, по очереди забирая из ответа данные
    // 5. массив методов удаляем в конце экшна, неважно делали запрос или нет

    return processMethod(action)
  }

  // ----------------------------------------------------------------------------- //

  async function processMethod(action) {
    const argsKey = valToKey(action.args)

    if (!isSetter && g.promise[door.name][apiName][argsKey])
      return g.promise[door.name][apiName][argsKey]

    // get(id) === getOne
    // get({ ...equalityFilters }, { sort: ['name.asc'], pag: [from, to] }) === get[]
    // get(ast) -> get[]

    // back front get put rm sql

    // лоадинг каждого метода

    let result
    try {
      g.currentAction = action
      setMethodsToDoor(action)
      const promise = apiFn(...action.args)

      if (!isSetter) set(g.promise, [door.name, apiName, argsKey], promise)

      result = await promise
    } catch (e) {
      console.error(e)
    } finally {
      g.currentAction = null

      if (result && !isSetter) {
        g.promise[door.name][apiName][argsKey] = result
      }
    }

    if (action.parent) g.currentAction = action.parent

    return result
  }

  function setMethodsToDoor(action) {
    door.get = withAction(action, (id) => get(door.name, id))
    door.put = withAction(action, (diff) => put(door.name, diff))
  }

  function withAction(action, method) {
    return async (...args) => {
      g.currentAction = action
      g.currentAction.count++

      const result = await method(...args)
      g.currentAction = action

      // по какой-то причине
      // синхронная установка переменных не давала нужного результата
      // queueMicrotask делал её после await выше
      // ! не воспроизводится !
      // queueMicrotask(() => {
      setMethodsToDoor(action)
      // })
      return result
    }
  }
}
