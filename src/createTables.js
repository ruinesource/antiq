import g from './g.js'
import { tn, isDoor, isPlainObject } from './utils.js'

// todo: убрать fk door_prop_inArray(id)->book у случая { prop: [{ inArray: {} }] }
// todo: для элементов массивов внутри массивов указывать x,y,z вместо i

export function setDoorCreationQueries(name, desc) {
  // const desc = g.desc[name] = descFunc()

  createTableFromObj([name], desc)

  function createTableFromObj(path, desc, isArrayChild) {
    const tableName = tn(...path)
    let sql = `create table if not exists "${tableName}"(\n`

    for (let key in desc) {
      path.push(key)
      sql += parseDescProp(desc[key], key, path, isArrayChild)
      path.pop()
    }

    const hasPrimaryKey = sql.includes('primary key')
    if (!hasPrimaryKey) {
      if (tableName !== name) {
        if (isArrayChild) {
          sql += `${name} int,\n`
          sql += `i int,\n`
          sql += `primary key(${name}, i),\n`
          // объектам внутри детей массивов ([{ deep: {} }])
          // присваивается 2 fk: (parent, i) - fk на бд массива
          // и здесь ещё дополнительно родитель массива: parent
          // TODO: убрать вторую связь, ибо она уже есть как parent-array-deep
          addForeignKey(tn(...path), name, name, 'id')
        } else {
          sql += `${name} int primary key,\n`
        }
      } else {
        sql += '"id" serial primary key,\n'
      }
    }

    sql += 'created_at timestamp default current_timestamp,\n'

    sql = sql.slice(0, sql.lastIndexOf(',')) + ');'

    g.queries.createTable.push(sql)

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
          addForeignKey(arrayTableName, name, name, 'id')
          return ''
        } else if (isDoor(arrItem)) {
          const tableName = tn(...path)

          const relationsTable = getRelationsArrayTable(
            name,
            arrItem.name,
            tableName
          )
          addForeignKey(tableName, arrItem.name, arrItem.name, 'id')
          addForeignKey(tableName, name, name, 'id')
          g.queries.createTable.push(relationsTable)
          return ''
        } else if (isPlainObject(arrItem)) {
          createTableFromObj(path, arrItem, true)
          return ''
        }
      }
      let sql = ''
      sql += `"${key}" ${getType(descProp[0])}`
      sql += getConstraints(descProp)
      sql += ',\n'
      return sql
    } else if (isDoor(descProp)) {
      const parentTableName = tn(...path.slice(0, -1))
      addForeignKey(parentTableName, key, descProp.name, 'id')
      return `"${key}" int,\n`
    } else if (isPlainObject(descProp)) {
      const parentTableName = tn(...path.slice(0, -1))
      if (isParentArrayChild) {
        addForeignKey(tn(...path), [name, 'i'], parentTableName, [name, 'i'])
      } else {
        if (parentTableName === name)
          addForeignKey(tn(...path), name, parentTableName, 'id')
        else addForeignKey(tn(...path), name, parentTableName, name)
      }

      createTableFromObj(path, descProp, isParentArrayChild)

      return ''
    } else return `"${key}" ${getType(descProp)},\n`
  }
}

export function isPrimitive(type) {
  return type === 1 || type === '' || type === true
}

function addForeignKey(tableName, key, parentTable, parentKey) {
  const fk = `alter table "${tableName}" add foreign key("${key}") references "${parentTable}"("${parentKey}");`
  if (!g.queries.foreignKeys[tableName]) g.queries.foreignKeys[tableName] = []
  g.queries.foreignKeys[tableName].push(fk)
  return fk
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
