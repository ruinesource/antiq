// любую запись можно однозначно идентифицировать
// hasRemoteData превращаем в promise

door
door.prop
bracket

sql

authorDo.get(id)
`select * from authors where authors.id = ${id}`

// door.toString() { return primaryKey }
favoriteBooksDo.get(`favoriteBooks.author = ${author}`, [0, 7])

`select * as favoriteBookItem from (
   select id from favoriteBooks
   where favoriteBooks.user = user.id
   offset ${offset}
   limit ${limit}
 ) join (
   select * as books
   from books
   where books.id = books.id
 )
`

// const parseDoor

function actToSql(str) {
  let operations = []
  let mode = null
  let operatorName = 
  for (let i in str) {
    if (currentOperator) = {}
    if (i === ['>', '<', '<=', '>='].includes(str[i])) {
      currentOperation.operator = str[i]
    }
  }
}
