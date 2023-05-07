все операторы: (=, >, <, !=, )
содержится ли элемент, удовлетворяющий операциям, в списке (список - всегда дб)
найти все элементы, удовлетворяющие операциям

найти пересечения двух таблиц: авторы книги и любимые книги
все авторы всех книг из favoriteBook


все книги, у которых просмотров больше, чем просмотров самой просматриваемой любимой книги

книги, у которых есть общие авторы



{
  book: a,
  author: 'e'
}


select ba_1.book id_1, ba_2.book id_2
from book_authors ba_1
where id_1 = any(
  select ba_2.book id_2
  from book_authors ba_2
)


select * from author
where author.id = any(

  select author from book_authors
  where book_authors.book in (

    select book from favorite_book 
    where favorite_book.user = *user*
  )
)

