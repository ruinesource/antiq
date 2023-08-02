import { sendEvent } from './ws.js'
import {
  normId,
  iterate,
  iteratePrimitivesOrEmpty,
  isPlainObject,
  set,
  getPath,
  copy,
  isDoor,
} from '../utils.js'
import g from '../g.js'

// сущности все мутируются из put и создаются только один раз
// но мутировать их самостоятельно бессмысленно
// к системе привязан сам метод put
// в массивах хранятся экземпляры
// а не айди

// корневая сущность и отображаемая
// у корневой есть дата последнего изменения на сервере, она всегда приходит и записывается для всех полей
// если дата пришла позже записанной для сущности, то ничего не меняем
// get изменяет корневую всегда, если дата поля в корневой сущности раньше updated_at из get
// изменение put корневую сущность не меняет
// подтверждение put изменяет корневую всегда, если дата поля в корневой сущности раньше updated_at с сервера
// если дата пришла позже записанной для сущности, то ничего в корневой не меняем

// у полей отображаемой сущности тоже свой updated_at
// подтверждение put меняет значение updated_at полей отображаемой сущности, если оно позже
// если на put пришла ошибка и updated_at поля отображаемой сущности позже той, что при совершении put, то его откат поле не меняет
// если updated_at позже, откат подставляет поле из корневой сущности
// get меняет все поля отображаемой сущности, у которых updated_at раньше того что пришел в get

// сущности формы - это свои отдельные сущности, которые могут быть подключены к обновлению полей дверей

// кроме того, есть сущности методов результата вызовов только get
// при всех изменениях сущностей внутри них
// их результаты вызовов поскольку запомнены, мы запоминаем и ререндерим их на фронте

// на put и get мы создаём поключение к каждому связанному полю сущности
// при изменении полей всегда приходит дата запоминания в дб

export function put(doorName, diff, opts) {
  ++g.currentEvent.count
  const { id: eventId, results, count } = g.currentEvent

  let id = diff.id || Math.random() // Symbol()?
  const nId = normId(doorName, id)

  if (!g.updated_at[nId]) g.updated_at[nId] = { val: new Date(0), value: {} }
  if (!g.val[nId]) g.val[nId] = {}
  const value = g.value[nId] || (g.value[nId] = {})

  if (results[count]) {
    putFromResults(doorName, results[count])

    rerenderBounded(doorName, nId)
    return value
  }

  // сохраняем diff во временное хранилище
  // ререндерим связанные get
  optimisticPut(doorName, nId, diff)
  rerenderBounded(doorName, nId)

  // отмена изменений на ошибке
  const wasNotSended = !g.listner[eventId]
  if (wasNotSended)
    sendEvent({
      event: g.currentEvent,
      onSuccess() {
        putFromResults(doorName, results[count])
        if (!diff.id) replaceMockId(doorName, diff.id)
      },
      // onError() { тоже applyPutUpdate, поэтому getData будет брать данные из updates }
      // нужно применять изменения сразу, сохраняя предыдущие значения
      // в случае ошибки даём возможность предыдущие значения вернуть
    })

  console.log(copy(g))

  return value
}

function rerenderBounded(doorName, nextValue) {}

function optimisticPut(doorName, nId, diff) {
  const desc = g.desc[doorName]
  const now = new Date()

  iteratePrimitivesOrEmpty(diff, (inst, path) => {
    const childDesc = getPath(desc, path)

    if (isDoor(childDesc)) addRelation(nId, normId(childDesc.name, inst))

    set(g.value[nId], path, inst)
    set(g.updated_at[nId].value, path, now)
  })
}

function putFromResults(doorName, diff) {
  const nId = normId(doorName, diff.id)
  const { desc } = g.door[doorName]
  const updated_at = g.updated_at[nId]

  updated_at.val = new Date(diff.updated_at)
  delete diff.updated_at

  iteratePrimitivesOrEmpty(diff, (x, path) => {
    set(g.val[nId], path, x)

    const upd_at = getPath(updated_at.value, path) || new Date(0)
    if (upd_at < updated_at.val) set(g.value[nId], path, x)

    // при различии prev и nId перенести всё из одного в другое
    const childDesc = getPath(desc, path)
    if (isDoor(childDesc)) addRelation(nId, normId(childDesc.name, x))

    set(updated_at.value, path, updated_at.val)
  })
}

function cancelOptimisticPut(doorName, id) {
  const desc = g.desc[doorName]
  const nId = normId(doorName, id)
  const value = g.value[nId]
  const val = g.val[nId]
  const updated_at = g.updated_at[nId]
  const now = new Date()

  if (!val) delete g.value[nId]
  else
    iteratePrimitivesOrEmpty(val, (inst, path) => {
      const childDesc = getPath(desc, path)

      if (isDoor(childDesc)) removeRelation(nId, normId(childDesc.name, inst))

      set(value, path, inst)
      set(updated_at.value, path, now)
    })
}

function replaceMockId(doorName, mockId, id) {
  const mockNId = normId(doorName, mockId)
  const nId = normId(doorName, id)
  g.values[nId].id = id

  const x = (k) => {
    g[k][nId] = g[k][mockNId]
    delete g[k][mockNId]
  }
  x('value')
  x('updated_at')
  x('parents')
  x('childs')

  const y = (k) => {
    for (let kNId in g[k]) {
      const val = g[k][kNId]
      if (val[mockNId]) {
        val[nId] = val[mockNId]
        delete val[mockNId]
      }
    }
  }
  y('parents')
  y('childs')
}

function addRelation(parentNId, path, childNId) {
  set(g.parents, [childNId, parentNId, ...path], true)
  set(g.childs, [parentNId, childNId, ...path], true)
}

function removeRelation(parentNId, childNId) {
  delete g.parents[childNId][parentNId]
  delete g.childs[parentNId][childNId]
  if (!Object.keys(g.childs[parentNId].length)) delete g.childs[parentNId]
  if (!Object.keys(g.parents[childNId].length)) delete g.parents[childNId]
}
