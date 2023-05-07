import g from '../g.js'
import { tn, isDoor, isPlainObject } from '../utils.js'

// todo: убрать fk door_prop_inArray(id)->book у случая { prop: [{ inArray: {} }] }
// todo: для элементов массивов внутри массивов указывать x,y,z вместо i

export function setDoorCreationQueries(name) {
  const desc = g.desc[name]

  createTableFromObj([name], desc)

  function createTableFromObj(path, desc, isArrayChild) {
    const tableName = tn(...path)
    let query = `create table if not exists "${tableName}"(\n`

    for (let key in desc) {
      path.push(key)
      query += parseDescProp(desc[key], key, path, isArrayChild)
      path.pop()
    }

    const hasPrimaryKey = query.includes('primary key')
    if (!hasPrimaryKey) {
      if (tableName !== name) {
        if (isArrayChild) {
          query += `${name} int,\n`
          query += `i int,\n`
          query += `primary key(${name}, i),\n`
          // объектам внутри детей массивов ([{ deep: {} }])
          // присваивается 2 fk: (parent, i) - fk на бд массива
          // и здесь ещё дополнительно родитель массива: parent
          // TODO: убрать вторую связь, ибо она уже есть как parent-array-deep
        } else {
          query += `${name} int primary key,\n`
        }
      } else {
        query += '"id" serial primary key,\n'
      }
    }

    query += 'created_at timestamp default current_timestamp,\n'
    query += 'updated_at timestamp,\n'

    query = query.slice(0, query.lastIndexOf(',')) + ');'

    g.queries.createTable.push(query)

    return `references ${desc.name}(${
      'id' /* desc[g.foreignKeys[desc.name]] */
    })`
  }

  function parseDescProp(descProp, key, path, isParentArrayChild) {
    if (Array.isArray(descProp)) {
      const arrItem = descProp[0]
      if (descProp.length === 1) {
        // у массивов всегда есть индекс
        // дело в том, что есть варик сделать put({ arr: [] })
        // и перезапишутся все элементы
        // а rmAdd и splice - опция
        if (isPrimitive(arrItem)) {
          const arrayTableName = tn(...path)

          g.queries.createTable.push(
            getPrimitiveArrTable(
              arrayTableName,
              name,
              getType(arrItem).slice(0, -1)
            )
          )
          return ''
        } else if (isDoor(arrItem)) {
          const tableName = tn(...path)

          const relationsTable = getRelationsArrayTable(
            name,
            arrItem.name,
            tableName
          )
          g.queries.createTable.push(relationsTable)
          return ''
        } else if (isPlainObject(arrItem)) {
          createTableFromObj(path, arrItem, true)
          return ''
        }
      }
      let query = ''
      query += `"${key}" ${getType(descProp[0])}`
      query += getConstraints(descProp)
      query += ',\n'
      return query
    } else if (isDoor(descProp)) {
      return `"${key}" int,\n`
    } else if (isPlainObject(descProp)) {
      createTableFromObj(path, descProp, isParentArrayChild)

      return ''
    } else return `"${key}" ${getType(descProp)},\n`
  }
}

export function isPrimitive(type) {
  return type === 1 || type === '' || type === true
}

function getConstraints(descProp) {
  let query = ''
  for (let i = 1; i < descProp.length; i++) query += getConstraint(descProp[i])
  if (!descProp.includes('required')) query += `default ${descProp[0]}`
  return query
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

function getRelationsArrayTable(parentName, childName, pathName) {
  return `create table if not exists "${pathName}" (
"${parentName}" ${'int'},
"${childName}" ${'int'},
i int,
created_at timestamp default current_timestamp,
primary key ("${parentName}", i));`
}

function getPrimitiveArrTable(name, parentName, type) {
  return `create table if not exists "${name}" (
"${parentName}" ${'int'},
val ${type},
i int,
created_at timestamp default current_timestamp,
primary key("${parentName}", i));`
}
