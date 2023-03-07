// import { door } from './front/door.js'
// import { open } from './front/open.js'

// конфликт имён с таблицами внутренних свойств
// при table { deep: {} } не может существовать door table_deep

export default function hotel({ door, open }) {
  const teamMemberD = door('team_member', () => ({ name: '' }))

  const bookD = door(
    'book',
    () => ({
      team_member: teamMemberD,
      deep: {
        ea: '',
        very: {
          ea: '',
        },
      },
    }),
    {
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
