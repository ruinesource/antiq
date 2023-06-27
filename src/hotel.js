// import { door } from './front/door.js'
// import { open } from './front/open.js'

// конфликт имён с таблицами внутренних свойств
// при table { deep: {} } не может существовать door table_deep

import g from './g.js'

export default function hotel({ door, onOpen }) {
  const teamMemberD = door('team_member', () => ({ name: '' }))

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

      one: async ({ req, res, api }) => {
        const book = await api.get(req.a)
        // можем ли мы в асинхронный поток перед конкретным событием задать переменную?
        return book
      },

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
      upd: async ({ req, res, api }) => {
        const book = await api.put(req.a)

        return book
      },

      authorsOfFavoriteBooks: async (pag, userId) => {
        // return authorD.get({
        //   id: await oneOf(
        //     await bookD.s('id').get({
        //       id: await oneOf(
        //         await favoriteBooksD.s('id').get({
        //           user: userId,
        //         })
        //       ),
        //     })
        //   ),
        // },
        // { pag })
      },
    }
  )

  return onOpen()
}
