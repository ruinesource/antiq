// import { door } from './front/door.js'
// import { open } from './front/open.js'

// конфликт имён с таблицами внутренних свойств
// при table { deep: {} } не может существовать door table_deep

import g from './g.js'

export default function hotel({ door, open }) {
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
      one: async (req) => {
        const book = await bookD.get(req.a)
        return book
      },
      upd: async (req) => {
        const book = await bookD.put(req.a)
        return book
      },
    }
  )

  return open()
}
