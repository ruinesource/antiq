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
        teamMemberD.get(id)
        await teamMemberD.get(1)
        await bookD.one(49)
      },
    },
    {
      upd: (diff) => teamMemberD.put(diff),
    }
  )

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
        console.log(result)
        const second = await authorD.put({ name: 'doki' })
        console.log(second)
        return result
      },
      upd: (diff) => authorD.put(diff),
    }
  )

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
      upd = async (diff) => {
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
