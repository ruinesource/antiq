// import { door } from './front/door.js'
// import { open } from './front/open.js'

// конфликт имён с таблицами внутренних свойств
// при table { deep: {} } не может существовать door table_deep

export default function hotel(door) {
  const teamMemberD = door('team_member', () => ({ name: '' }), {
    one: (id) => teamMemberD.get(id),
  })

  const authorD = door('author', () => ({
    name: '',
    books: [bookD],
  }))

  const bookD = door(
    'book',
    () => ({
      team_member: teamMemberD,
      authors: [authorD],
      deep: {
        ea: '',
        very: {
          ea: '',
        },
      },
    }),
    {
      // нужно записывать, из каких методов какие поля каких сущностей получаются
      // в зависимости от этого делать ререндеры
      // useApi(book.one, 17)

      x: async () => {
        const first = await bookD.get(17)
        const second = await bookD.get(18)
        return { first, second }
      },

      y: async () => {
        const first = await bookD.get(19)
        const second = await bookD.get(20)
        return { first, second }
      },

      one: async (id) => {
        const book = await bookD.get(id)
        const tm = await teamMemberD.one(book.team_member)
        book.team_member = tm

        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // все обращения к стороннему апи внутри ивентов делаются на стороне бэка
        // если нужны обращения к стороннему апи с фронта, делаем их в хуках
        // все нужные для обращения к стороннему апи данные фронта передаём в аргументы
        // всё хранится в не-рекурсивном состоянии
        // потому что на сервере не-одинаковые объекты
        // (либо можем хранить объекты сессий с точки старта на сервере в js)
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        return book
      },

      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // !!!!!!!! в какой форме сохраняем запросы !!!!!!!!
      // фронт
      // get-метод с аргументами - сохраняем для возвращения в useData
      // если метод калькулируем фильтрами и данными фронта (total "pre" = 8, can "prev" with limit 10)
      // то запрос не делаем

      // get-запросы по primary key не кэшируем отдельно, смотрим только наличие всех полей
      // у всех остальных get-запросов аргументы сохраняем и по ним ориентируемся
      // (todo) ужесточение фильтров фронтовыми силами, если есть все элементы

      // 1. методы из data с аргументами (methodName: { jsonArgs: result })
      // 2. get-запросы door (s/o-поля, аргументы) { door-method: { sortedQueryFields: { jsonArgs: result } } }
      // 3. если в get-аргументе primaryKey, то сущность с полями можем посмотреть в сторе
      // 4. во всех массивах только id
      // 5. граф normId: { methodName: { jsonArgs: true } }
      // 6. граф normId: { parentId: { pathsToChild: true } }
      // 7. граф normId: { childNormId: true }
      // 8. граф { normId: { door-method: { sortedQueryFields: true } } } - в каких методах закешированы сущности

      // если есть асинхронность (недостаток данных на фронте)
      // put, rm, первые get
      // она есть только один раз за метод
      // запоминаем get-запросы каждой сессии в методах для useData
      // то при изменении связанных get выполняем метод целиком на сервере
      // то есть по изменению условия get определяем, выполняем ли подключенный метод
      // отправляем результат на фронт
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

      // if arg func cookie and rest
      authorsOfFavoriteBooks: async (pag, userId) => {
        // здесь в первый раз отправляется запрос на сервер
        // в нём authorsOfFavoriteBooks(pag, userId)
        // считаются все величины
        /* const favoriteBooksIds = await favoriteBooksD.s('id').get({
          user: userId,
        }) */
        // если где-то уже получались favoriteBooks
        // то может получались и booksAuthors с ними
        // и это действие можем выполнить тоже синхронно
        // а может и асинхронно - если не получались
        // поэтому нужен await
        /* const favoriteBooksAuthorsIds = await booksAuthorsD.s('author').get({
          id: any(favoriteBooksD.s('id').out({
            user: userId
          })),
        }) */
        /*
        return authorD.get(
          {
            id: booksAuthorsD.s('author').out({
              id: favoriteBooksD.s('id').out({
                user: userId
              }),
            }),
          },
          { pag }
        ) */
      },
    },
    {
      // в методе может быть несколько put
      // фронт:
      // put не возвращает promise, потому что уже есть вся информация для вычислений
      // при сетевой ошибке изменения всех put внутри метода стираются
      // для этого нужно передавать id вызова текущего апи-метода в put и rm

      // загрузка есть только у ивентов, методы - её асинхронные крупицы
      // в интерфейсе нельзя увидеть прогресс отдельных методов
      // Promise.all всех методов ивента - единственный слой загрузки для пользователя
      // в то же время, интерфейсом можно пользоваться при загрузке
      // ивенты внутри ивентов в плане загрузки превращаются в методы

      // на фронте put синхронен
      // но всё равно ставит лоадер на ивент
      upd: async (diff) => {
        // await bookD.get(17)
        const book = await bookD.put(diff)
        return book
      },

      add: async () => {
        const book = await bookD.put({
          team_member: { name: 'yeah member' },
          authors: [],
          deep: { ea: 'valDeep', very: { ea: 'valVery' } },
        })
        return book
      },
    }
  )

  return { bookD, authorD, teamMemberD }
}
