import g from './g.js'
import { setDoorCreationQueries } from './createTables.js'
import {
  isDoor,
  isPlainObject,
  isStrictArray,
  isSplice,
  isRmAdd,
  isPrimitive,
  quot,
  tn,
} from './utils.js'
import { db } from './db.js'

// const bookDo = door('book', () => ({
//   name: ['', 'required'],
//   img: '',
//   authors: [authorDo], // fk authors нет в book, потому что это много элементов
//   jimCreator: jimDo,
//   styles: [''],
//   i18n: {
//     ru: { description: '', team: [teamMemberDo] },
//     en: { description: '', team: [teamMemberDo] },
//   },
//   // в массивах ориентируемся по индексу
//   // массив живёт своей жизнью, его элементов не существует
//
//   // array_deep_author
//   // array_deep fk idx
//   // у элементов массивов fk - это i-parent
// }))
//
// bookDo.put({
//   name: 'oki',
//   authors: [1],
//   jimCreator: 2,
//   styles: ['doki', 'style'],
//   i18n: {
//     ru: { description: '', team: [2] },
//     en: { description: '', team: [3] },
//   },
//   // book_array book_array_deep
//   array: [{ deep: { author: 3 } }, { deep: { author: 4 } }],
// })
//
// bookDo.put({
//   // в таком обновлении задействован элемент book.styles
//   styles: ['doki', 'oki', 'style'],
// })

export function door(name, descFunc, api, options) {
  g.desc[name] = descFunc
  setDoorCreationQueries(name, descFunc())

  return {
    name,
    door: true,
    async put(diff) {
      return createInst(name, diff)
    },
    get: {},
    rm: {},
  }
}

export function createInst(name, diff) {
  const queries = []
  const diffs = {}

  const desc = g.desc[name]()

  const path = [name]

  setPutVars(name, path, diff, desc, queries)

  // подписчиков устанавливаем на get по сущностям
  return { queries, diffs } // [...queries], { norm-propName: { itemId: itemDiff } }
}

async function setPutVars(doorName, path, diff, desc, queries) {
  const sql = await db()
  // сначала создаём query
  // затем добавляем в них id
  // как определить, в какой query какой id подставить?
  // по desc, path и id родовой сущности

  // в случае, если id у door нет, то задаём изменения insert
  // если появился id door, то мы его запоминаем, и делаем с ним операции update
  // если на место внутренней сущности поставили null,
  // то делаем delete её и всех её потомков

  // insert into table set() values()
  // update (cols) in table
  console.log(doorName, path, diff, desc, queries)

  for (let key in diff) {
    const tableName = tn(...path, key)
    if (!desc.hasOwnProperty(key)) throw `unknown property ${desc}`

    if (isDoor(desc[key])) {
      const id = isPlainObject(diff[key]) ? diff[key].id : diff[key]
      const { name } = desc[key]

      let currentItem
      try {
        currentItem = await sql(`select * from "${name}" where id = ${id};`)
        console.log(currentItem)
      } catch (e) {
        console.log(e)
      }

      if (currentItem.rowCount === 0 && isPlainObject(diff[key])) {
        setPutVars(name, [name], diff[key], desc[key], queries)
      }

      if (id) {
        // проверить, что в бд door есть элемент
      } else {
      }
      continue
    }

    if (Array.isArray(desc[key])) {
      const innerType = desc[0]
      if (isSplice(diff[key])) {
        // const { start, deleteCount, x } = diff[key]
      } else if (isRmAdd(diff[key])) {
        // const { rm, add } = diff[key]
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
        const currentItems = getArrItems(tableName)
        // таблица может принадлежать сущности, в таком случае в ней есть её id
        // [{ author: id }]
        // [{ author: id, book: id }, { author: id, book: id }]
        const nextItems = diff[key].reduce(
          (acc, item) => {
            for (let key in item)
              if (!acc.fields.includes[key]) acc.fields.push(key)

            acc.values.push(acc.fields.map((key) => item[key]))
            return acc
          },
          { fields: [], values: [] }
        )
        const rmQuery = {
          type: removeItems,
          args: [tableName, currentItems],
        }
        const addQuery = {
          type: addItems,
          args: [tableName, nextItems],
        }

        queries.push(rmQuery, addQuery)
      } else if (isPrimitive(innerType)) {
        // у этих элементов нет id, мы тупо удаляем их все
        // и после записываем снова, они могут и дублироваться
        const currentItems = getArrItems(tableName)

        const nextItems = diff[key].reduce(
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
        queries.push(rmQuery, addQuery)
      } else if (isPlainObject(innerType)) {
        // если это объекты, внутри них могут быть doors
        // в таком случае следует добавить связь в граф
        const currentItems = getArrItems(tableName)
        // все элементы внутри объектов нужно перезаписывать
        // есть таблицы, в которых элементы ссылаются на пару door-i элементов из этой таблицы
        // их и перезаписываем

        const nextItems = diff[key].reduce(
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

        diff[key].forEach((item, i) => {
          setPutVars(doorName, path, item, innerType, queries)
        })
      } else if (Array.isArray(innerType)) {
      }
      continue
    }

    if (isPlainObject(diff[key])) {
      setPutVars(doorName, [...path, key], diff[key], desc[key], queries)
      continue
    }

    // currentTableDiff[key] = diff[key]
  }
  // const [fields, diffOfItem] = Object.entries(currentTableDiff).reduce(
  //   (acc, [field, value]) => {
  //     acc[0].push(field)
  //     acc[1].push(field)
  //     return acc
  //   },
  //   [[], []]
  // )
  // const addQuery = {
  //   type: addItems,
  //   args: [tableName, { fields, values: [diffOfItem] }],
  // }
  // queries.push(addQuery)
}

export const updateItem = (tableName, diff) => `
  update ${quot(tableName)}
  set ${Object.entries
    .filter(([key]) => key !== 'id')
    .map((item) => item.map(quot).join(' = '))
    .join(', ')}
  WHERE id === ${diff.id};
`

export const addItems = (tableName, { fields, values }) =>
  `insert into ${quot(tableName)} (${fields.map(quot)})
values ${values.map((x, i, v) => `(${x})${i === i.length - 1 ? '' : ',\n'}`)};`

// { pk: item }
export const getArrItems = (tableName, fields = '*') =>
  `select ${fields.join(', ')} from ${quot(tableName)};`

export const removeItems = (tableName, items) =>
  `delete from ${quot(tableName)} where ${items
    .map((item) =>
      Object.entries(item)
        .map((x) => x.map(quot).join(' = '))
        .join(' and ')
    )
    .join(' or ')};`
