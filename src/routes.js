import Page from './ui/Page'
import FavoriteBooks from './ui/FavoriteBooks'
import Authors from './ui/Authors'
import Author from './ui/Author'
import Book from './ui/Book'

export const routes = [
  {
    path: '/',
    element: (
      <Page>
        <Authors />
        <br />
        <FavoriteBooks />
      </Page>
    ),
  },
  {
    path: 'author/:authorId',
    element: (
      <Page>
        <Author />
      </Page>
    ),
  },
  {
    path: 'book/:bookId',
    element: (
      <Page>
        <Book />
      </Page>
    ),
  },
]
