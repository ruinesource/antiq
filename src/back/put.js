import {
  isDoor,
  isPlainObject,
  isSplice,
  isRmAdd,
  isPrimitive,
  quot,
  tn,
} from '../utils.js'
import { db } from './db.js'
import g from '../g.js'

// таблица с графом экземпляр-экземпляр

export async function put(name, diff) {
  const desc = g.desc[name]
  const path = [name]

  const { tableDiff, queries, delayedIds } = await setPutVars(
    name,
    path,
    diff,
    desc
  )
  await execQueries(queries, delayedIds)
  await delay(5000)

  return tableDiff
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function setPutVars(
  doorName,
  path,
  diff,
  desc,
  delayedIds = new Map(),
  queries = [],
  parentQuery,
  childsQueries = []
) {
  const sql = await db()
  const tableName = tn(...path)

  // дата updated_at устанавливается раньше, чем объект устанавливается в таблицу
  // перенести это в момент выполнения query
  const tableDiff =
    tableName === doorName ? { updated_at: new Date().toISOString() } : {}

  // query: { diff, key }
  // при выполнении этого квери следует подставить сгенеренный id в родительский diff
  const currentDelayedIds = []
  let currentItemQ
  if (diff.id && tableName === doorName) {
    currentItemQ = await sql(
      `select * from ${tableName} where id = ${diff.id};`
    )
    tableDiff.id = currentItemQ.rows[0]?.id
  }
  const query = {
    type: currentItemQ?.rowCount ? updateItem : addItem,
    args: [tableName, tableDiff, tableName === path.join() ? 'id' : doorName],
  }
  if (tableName === doorName) {
    parentQuery = query
    delayedIds.set(query, [])
    if (!diff.id) {
      delayedIds.get(query).push({
        diff: tableDiff,
        key: 'id',
      })
    }
  } else {
    childsQueries.push(query)
  }
  // сначала создаём query
  // затем добавляем в них id
  // потому что в детских сущностях есть id родителя
  // как определить, в какой query какой id подставить?
  // по desc, path и id родовой сущности

  // в случае, если id у door нет, то задаём изменения insert
  // если появился id door, то мы его запоминаем, и делаем с ним операции update
  // если на место внутренней сущности поставили null,
  // то делаем delete её и всех её потомков

  if (isPlainObject(desc)) {
    for (let key in diff) {
      if (!desc.hasOwnProperty(key) && key !== 'id')
        throw `unknown property ${key} in table ${tableName}`

      if (isDoor(desc[key])) {
        const childId = isPlainObject(diff[key]) ? diff[key].id : diff[key]
        const { name } = desc[key]

        let childCreationQuery
        if (isPlainObject(diff[key])) {
          const result = await setPutVars(
            name,
            [name],
            diff[key],
            g.desc[name],
            delayedIds,
            queries
          )
          childCreationQuery = result.query
        }

        if (!childId) {
          // на этапе выполнения квери
          // при создании ребёнка ищем его в delayedIds,
          // и добавляем этот id в diff родительского квери
          currentDelayedIds.push({ q: childCreationQuery, key })
        } else {
          tableDiff[key] = childId
        }
        continue
      }

      if (Array.isArray(desc[key])) {
        setPutArrayVars(
          doorName,
          [...path, key],
          diff[key],
          desc[key],
          queries,
          delayedIds
        )
        continue
      }

      if (isPlainObject(diff[key])) {
        const { tableDiff: childDiff } = await setPutVars(
          doorName,
          [...path, key],
          diff[key],
          desc[key],
          delayedIds,
          queries,
          parentQuery,
          childsQueries
        )
        // у plainObject id === door
        // если внутри массива, то door и i
        // id родителя следует добавлять в diff как ключ door
        // query нужно выполнять после query родительского door
        delayedIds.get(parentQuery).push({
          diff: childDiff,
          key: doorName,
        })
        continue
      }

      tableDiff[key] = diff[key]
    }
  }

  if (tableName === path.join()) {
    queries.push(query, ...childsQueries)
  }

  for (let { q, key } of currentDelayedIds) {
    if (!delayedIds.has(q)) {
      delayedIds.set(q, [])
    }
    delayedIds.get(q).push({
      diff: tableDiff,
      key: key,
    })
  }
  return { query, queries, tableDiff, delayedIds }
}

function setPutArrayVars(doorName, path, diff, desc, queries, delayedIds) {
  const tableName = tn(...path)
  const innerType = desc[0]
  if (isSplice(diff)) {
    // const { start, deleteCount, x } = diff
  } else if (isRmAdd(diff)) {
    // const { rm, add } = diff
  }
  // 2 типа массивов - Array и StrictList
  // массивы сортируются по дате создания элемента
  // у таких массивов сортировка не имеет значения
  // поэтому в put мы можем положить только полный массив
  // он сравнится с предыдущим по наличию элементов
  // нужны отдельные методы добавления/удаления элементов массива-гиганта
  // что-то вроде removedItems() и addedItems()
  // const prev = getPrevArray()
  // for (let item of diff) {
  //   if (wasInArray())
  // }
  if (isDoor(innerType)) {
    // !!! здесь в getArrItems нужно передать rm where book: book_id !!!
    const currentItems = getArrItems(tableName)
    // таблица может принадлежать сущности, в таком случае в ней есть её id
    // [{ author: id }]
    // [{ author: id, book: id }, { author: id, book: id }]
    const nextItems = diff.reduce(
      (acc, item) => {
        for (let key in item) if (!acc.fields.includes) acc.fields.push(key)

        acc.values.push(acc.fields.map((key) => item))
        return acc
      },
      { fields: [], values: [] }
    )
    const rmQuery = {
      type: removeItems,
      args: [tableName, [{ book: 1 }]],
    }
    queries.push(rmQuery)

    if (nextItems.values.length) {
      const addQuery = {
        type: addItems,
        args: [tableName, nextItems],
      }
      queries.push(addQuery)
    }
  } else if (isPrimitive(innerType)) {
    // у этих элементов нет id, мы тупо удаляем их все
    // и после записываем снова, они могут и дублироваться
    const currentItems = getArrItems(tableName)

    const nextItems = diff.reduce(
      (acc, item, i) => {
        acc.values.push([item, i])
        return acc
      },
      { fields: ['val', 'i', doorName], values: [] }
    )
    const rmQuery = {
      type: removeItems,
      args: [tableName, currentItems],
    }
    const addQuery = {
      type: addItems,
      args: [tableName, nextItems],
    }

    queries.push(rmQuery)
    if (nextItems.length) {
      queries.push(addQuery)
    }
  } else if (isPlainObject(innerType)) {
    // если это объекты, внутри них могут быть doors
    // в таком случае следует добавить связь в граф
    const currentItems = getArrItems(tableName)
    // все элементы внутри объектов нужно перезаписывать
    // есть таблицы, в которых элементы ссылаются на пару door-i элементов из этой таблицы
    // их и перезаписываем

    const nextItems = diff.reduce(
      (acc, item, i) => {
        acc.values.push([item, i])
        return acc
      },
      { fields: ['val', 'i', doorName], values: [] }
    )

    const rmQuery = {
      type: removeItems,
      args: [tableName, currentItems],
    }
    const addQuery = {
      type: addItems,
      args: [tableName, nextItems],
    }

    diff.forEach((item, i) => {
      setPutVars(doorName, path, item, innerType, delayedIds, queries)
    })
  } else if (Array.isArray(innerType)) {
  }
}

export const updateItem = (tableName, diff) => `
  update ${quot(tableName)}
  set ${Object.entries(diff || {})
    .filter(([key]) => key !== 'id')
    .map((item) => `${item[0]} = ${sqlQuotes(item[1])}`)
    .join(', ')}
  where id = ${diff.id} returning id;
`

export const addItems = (tableName, { fields, values }) =>
  `insert into ${quot(tableName)}
values ${values.map(
    (x, i) => `(${x.map(sqlQuotes)})${i === i.length - 1 ? '' : ',\n'}`
  )} returning id;`

export const addItem = (tableName, diff, pk) =>
  `insert into ${quot(tableName)} (${Object.keys(diff).sort()})
values (${Object.keys(diff)
    .sort()
    .map((k) => sqlQuotes(diff[k]))
    .join(', ')}) returning ${pk};`

// { pk: item }
export const getArrItems = (tableName, fields = ['*']) =>
  `select ${fields.join(', ')} from ${quot(tableName)};`

export const removeItems = (tableName, items = []) =>
  `delete from ${quot(tableName)} where ${items
    .map((item) =>
      Object.entries(item)
        .map((x) => [quot(x[0]), x[1]].join(' = '))
        .join(' and ')
    )
    .join(' or ')};`

const sqlQuotes = (x) => (typeof x === 'string' ? `'${x}'` : x)

async function execQueries(queries, delayedIds) {
  for (let q of queries) {
    await execQuery(q, delayedIds)
  }
}

async function execQuery(query, delayedIds) {
  const sql = await db()
  const qDelayed = delayedIds.get(query)
  const q = query.type(...query.args)
  const result = await sql(q)
  if (qDelayed)
    // выполнить qDelayed?
    qDelayed.forEach(({ diff, key }) => {
      diff[key] = result.rows[0].id
    })
}
