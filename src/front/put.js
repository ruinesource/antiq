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
// при изменении полей всегда приходит дата запоминания в бд

// !!!!!!!!! при изменении child_db в door нужно менять updated_at у бд самой door !!!!!!!!!

// копить обновления до получения id

export function put(doorName, diff, opts) {
  ++g.currentEvent.count
  const { id: eventId, count, results } = g.currentEvent

  if (results[count]) {
    diff = putFromResults(doorName, count)
    const nId = normId(doorName, diff.id)

    rerenderBounded(doorName, nId)
    return g.value[nId]
  }

  let id = diff.id || Math.random() // Symbol()?
  const nId = normId(doorName, id)

  if (!g.updated_at[nId]) g.updated_at[nId] = { val: new Date(0), value: {} }
  const value = g.value[nId] || (g.value[nId] = {})

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
        putFromResults(doorName, count, nId)
        if (!diff.id) removeMock(doorName, nId)
      },
      // onError() { тоже applyPutUpdate, поэтому getData будет брать данные из updates }
      // нужно применять изменения сразу, сохраняя предыдущие значения
      // в случае ошибки даём возможность предыдущие значения вернуть
    })

  return value
}

function rerenderBounded(doorName, nextValue) {}

function optimisticPut(doorName, nId, diff) {
  const desc = g.desc[doorName]
  const now = new Date()

  iteratePrimitivesOrEmpty(diff, (x, path) => {
    const childDesc = getPath(desc, path)

    if (isDoor(childDesc)) addRelation(nId, path, normId(childDesc.name, x))

    set(g.value[nId], path, x)
    set(g.updated_at[nId].value, path, now)
  })
}

function putFromResults(doorName, actionCount, prevNId) {
  const diff = g.currentEvent.results[actionCount]
  // console.log(g, g.currentEvent.results[actionCount], g.currentEvent)
  const nId = normId(doorName, diff.id)
  const desc = g.desc[doorName]

  if (!g.updated_at[nId]) g.updated_at[nId] = { val: new Date(0), value: {} }
  if (!g.val[nId]) g.val[nId] = g.val[prevNId] ? g.val[prevNId] : {}
  if (!g.value[nId]) g.value[nId] = g.value[prevNId] ? g.value[prevNId] : {}
  const updated_at = g.updated_at[nId]

  updated_at.val = new Date(diff.updated_at)
  delete diff.updated_at

  iteratePrimitivesOrEmpty(diff, (x, path) => {
    set(g.val[nId], path, x)

    const upd_at = getPath(updated_at.value, path) || new Date(0)
    if (upd_at < updated_at.val) set(g.value[nId], path, x)

    const childDesc = getPath(desc, path)
    console.log(childDesc, desc, path)
    if (isDoor(childDesc)) {
      console.log('relation', nId, path, normId(childDesc.name, x))
      addRelation(nId, path, normId(childDesc.name, x))
    }

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

function removeMock(doorName, mockNId) {
  delete g.val[mockNId]
  delete g.value[mockNId]
  delete g.updated_at[mockNId]

  delete g.parents[mockNId]
  delete g.childs[mockNId]

  deleteSecondLevel('parents')
  deleteSecondLevel('childs')

  function deleteSecondLevel(k) {
    for (const id in g[k]) {
      delete g[k][id][mockNId]
    }
  }
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
