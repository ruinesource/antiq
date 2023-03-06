const g = require('../g')

export async function door(name, descFunc, api, options) {
  setCreationQueries(name, descFunc())

  return {
    name,
    door: true,
    rm: {},
    put: {},
    get: {},
  }
}

function create(diff, desc) {
  const queries = []

  const desc = g.desc['name']

  const path = ['name']

  // здесь нужно получить изменения таблиц всех дорз
  // сохранить их ключи
  // и оповестить подписанных клиентов
  for (let key in diff) {
    const currentTableDiffs = {}

    if (!key in desc) throw `unknown property ${desc}`

    if (isDoor(desc[key])) throw 'inner door changes detected'

    if (isPrimitive(desc[key])) currentTableDiffs[key] = diff[key]

    if (Array.isArray(diff)) {
      // 2 типа массивов - Array и SortedList
      // массивы сортируются по дате создания элемента
      // у таких массивов сортировка не имеет значения
      // поэтому в put мы можем положить только полный массив
      // он сравнится с предыдущим по наличию элементов
      // нужны отдельные методы добавления/удаления элементов массива-гиганта
      // что-то вроде removedItems() и addedItems()
    }

    if (isPlainObject(diff)) {
    }
  }
}

function setCreationQueries(name, desc) {
  // const desc = g.desc[name] = descFunc()

  createTableFromObj(desc, [name])

  function createTableFromObj(desc, path) {
    const tableName = path.join('_')
    let sql = `create table if not exists "${tableName}"(\n`

    for (let key in desc) {
      path.push(key)
      sql += parseDescProp(desc[key], key, path)
      path.pop()
    }

    const hasPrimaryKey = sql.includes('primary key')
    if (!hasPrimaryKey) {
      if (tableName !== name) {
        sql += `"${name}" int primary key,\n`
        addForeignKey(path.join('_'), name, name, 'id')
      } else {
        sql += '"id" serial primary key,\n'
      }
    }

    sql += 'created_at timestamp default current_timestamp,\n'

    sql = sql.slice(0, sql.lastIndexOf(',')) + ');'

    g.queries.createTable.unshift(sql)

    return `references ${desc.name}(${
      'id' /* desc[g.foreginKeys[desc.name]] */
    })`
  }

  function parseDescProp(descProp, key, path) {
    if (Array.isArray(descProp)) {
      const arrItem = descProp[0]
      if (descProp.length === 1) {
        if (arrItem === 1 || arrItem === '' || arrItem === true) {
          const arrayTableName = path.join('_')

          g.queries.createTable.unshift(
            getArrayTable(arrayTableName, name, getType(arrItem).slice(0, -1))
          )
          addForeignKey(arrayTableName, name, name, 'id')
          return `"${arrayTableName}" int,\n`
        } else if (isDoor(arrItem)) {
          const parentTableName = path.join('_')

          const relationsTable = getRelationsTable(
            name,
            arrItem.name,
            path.join('_')
          )
          addForeignKey(parentTableName, arrItem.name, arrItem.name, 'id')
          addForeignKey(parentTableName, name, name, 'id')
          g.queries.createTable.unshift(relationsTable)
          return ''
        } else if (isPlainObject(arrItem)) {
          createTableFromObj(arrItem, path)
          return ''
        }
      }
      let sql = ''
      sql += `"${key}" ${getType(descProp[0])}`
      sql += getConstraints(descProp)
      sql += ',\n'
      return sql
    } else if (isDoor(descProp)) {
      addForeignKey(path.slice(0, -1).join('_'), key, descProp.name, 'id')
      return `"${key}" int,\n`
    } else if (isPlainObject(descProp)) {
      const parentTableName = path.slice(0, -1).join('_')

      createTableFromObj(descProp, path)
      addForeignKey(parentTableName, key, path.join('_'), name)
      return `"${path[path.length - 1]}" int,\n`
    } else return `"${key}" ${getType(descProp)},\n`
  }
}

function addForeignKey(tableName, key, parentTable, parentKey) {
  if (!g.queries.foreginKey[tableName]) g.queries.foreginKey[tableName] = []
  g.queries.foreginKey[tableName].push(
    `alter table "${tableName}" add foreign key("${key}") references "${parentTable}"("${parentKey}");`
  )
}

function getConstraints(descProp) {
  let sql = ''
  for (let i = 1; i < descProp.length; i++) sql += getConstraint(descProp[i])
  if (!descProp.includes('required')) sql += `default ${descProp[0]}`
  return sql
}

function getType(type) {
  if (type === '') return 'text '
  else if (typeof type === 'number') return 'int '
  else if (typeof type === 'boolean') return 'boolean '
}

function getConstraint(constraint) {
  if (constraint === 'primary') return 'primary key '
  else if (constraint === 'foreign') return 'foreign key '
  else if (constraint === 'unique') return 'unique '
  else if (constraint === 'required') return 'not null '
}

function getRelationsTable(parentName, childName, pathName) {
  return `create table if not exists "${pathName}" (
"${parentName}" ${'int'},
"${childName}" ${'int'},
created_at timestamp default current_timestamp,
primary key (${parentName}));`
}

function getArrayTable(name, parentName, type) {
  return `create table if not exists "${name}" (
"${parentName}" ${'int'},
value ${type},
created_at timestamp default current_timestamp,
primary key (${parentName}));`
}

function isDoor(x) {
  return x && x.door === true
}

function isPlainObject(x) {
  return x && {}.__proto__ === x.__proto__
}
