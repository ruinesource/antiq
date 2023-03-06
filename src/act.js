  act
  operations
  doors
  values
  space/line-break
  bracket

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

create table if not exists authors(
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(255) not null,
  img varchar(255)
)

create table if not exists books(
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(255),
  createdUser foregin key references users(id)
)

create table if not exists booksAuthors(
  author foregin key references authors(id),
  book foregin key references books(id),
  primary key(book, author)
)

create table if not exists favoriteBooks(
  book foregin key references books(id),
  user  foregin key references users(id),
  primary key(user)
)

const parseDoor

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
