import { sql } from './db.js'
import g from './g.js'
import { door } from './door.js'
init()

async function init() {
  const teamMemberDo = door('team_member', () => ({}))
  // const authorDo = door('author', () => ({}))
  // const jimDo = door('jim', () => ({}))
  const bookDo = door('book', () => ({
    team_member: teamMemberDo,
    // name: ['', 'required'],
    // img: '',
    // authors: [authorDo], // fk authors нет в book, потому что это много элементов
    // jimCreator: jimDo,
    // deep: {
    //   author: authorDo,
    // },
    // styles: [''],
    // i18n: {
    //   team: [teamMemberDo],
    //   ru: { description: '', team: [teamMemberDo] },
    //   en: { description: '', team: [teamMemberDo] },
    // },
    // book_array
    // book fk
    // i
    // deep fk
    // book_array_deep
    // fk book
    // fk book_array_i
    // array: [{ deep: { author: authorDo } }],
  }))
  await execQueries()

  bookDo.put({ team_member: 1 })

  console.log(g.queries)
}

async function execQueries() {
  g.queries.createTable.forEach(async (x) => {
    try {
      await sql(x)
    } catch (e) {
      console.log(e)
    }
  })
  g.queries.foreignKeys.forEach(async (x) => {
    try {
      await sql(x)
    } catch (e) {
      console.log(e)
    }
  })
}
