// import { door } from './front/door.js'
// import { open } from './front/open.js'

// конфликт имён с таблицами внутренних свойств
// при table { deep: {} } не может существовать door table_deep
import g from './g.js'
export default function hotel(door) {
  const teamMemberD = door(
    'team_member',
    () => ({ name: '' }),
    {
      one: async (id) => {
        const tm = await teamMemberD.get(1)
        const book = await bookD.one(49)
        return tm
      },
    },
    {
      upd: (diff) => teamMemberD.put(diff),
    }
  )

  // источник - валидаторы сервера
  // их должно быть можно расширить на фронте
  // для валидации могут требоваться сущности, а не id
  class Book {
    @field(required)
    name: ''

    @field(oki)
    books: [bookD]
  }

  const authorD = door(
    'author',
    () => ({
      name: '',
      books: [bookD],
    }),
    {
      one: (id) => authorD.get(id),
    },
    {
      oki: async () => {
        const result = await authorD.put({ name: 'oki' })
        return result
      },
      upd: (diff) => authorD.put(diff),
    }
  )

  // form(door, id)

  // создаём/меняем сущности в формах
  // в запрос может приходить информация для валидации, которая не записывается сама
  // если А, сущность/поле валидно, если Б - невалидно

  // на оптимистичный put на бэке может потребоваться асинхронщина для недостающих полей
  // на бэке может подставляться недостающая информация
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
      x: async () => {
        const book = await bookD.get(7)
        return { book }
      },

      y: async () => {
        const first = await bookD.get(19)
        const second = await bookD.get(20)
        return { first, second }
      },

      one: async (id) => {
        const book = await bookD.get(id)
        return book
      },

      authorsOfFavoriteBooks: async (pag, userId) => {
        // return authorD.get(
        //   {
        //     id: booksAuthorsD.s('author').out({
        //       id: favoriteBooksD.s('id').out({
        //         user: userId
        //       }),
        //     }),
        //   },
        //   { pag }
        // )
        // authorD.get(
        //   `favoriteBook.get(
        //     favoriteBook.authors.includes(authors.id)
        //   ).length > 0`,
        //   { pag }
        // )
      },
    },
    class X {
      // валидаторы применяются для форм, связанных с этим экшном
      upd = async (diff) => {
        // для upd должны быть одни валидаторы
        // для create другие
        const book = await bookD.put(diff)
        return book
      }

      add = async () => {
        const book = await bookD.put({
          team_member: { name: 'yeah member' },
          authors: [],
          deep: { ea: 'valDeep', very: { ea: 'valVery' } },
        })
        return book
      }
    }
  )

  return { bookD, authorD, teamMemberD }
}
