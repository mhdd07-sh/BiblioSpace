const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');



// LIRE LA BASE JSON

function readDatabase() {
    try {

        if (!fs.existsSync(DB_PATH)) {
            console.error(`Fichier db.json introuvable : ${DB_PATH}`);

            return {
                books: []
            };
        }

        const content = fs.readFileSync(DB_PATH, 'utf8');

        const data = JSON.parse(content);

        if (!Array.isArray(data.books)) {
            data.books = [];
        }

        return data;

    } catch (error) {

        console.error(
            'Erreur lecture db.json :',
            error
        );

        return {
            books: []
        };
    }
}



// ÉCRIRE DANS LA BASE JSON


function writeDatabase(data) {

    try {

        fs.writeFileSync(
            DB_PATH,
            JSON.stringify(data, null, 2),
            'utf8'
        );

        return true;

    } catch (error) {

        console.error(
            'Erreur écriture db.json :',
            error
        );

        return false;
    }
}



// RÉCUPÉRER TOUS LES LIVRES


function getAllBooks() {

    const data = readDatabase();

    return data.books || [];
}



// RÉCUPÉRER UN LIVRE PAR SON ID


function getBookById(id) {

    const books = getAllBooks();

    return books.find(
        book => Number(book.id) === Number(id)
    );
}



// RECHERCHER DES LIVRES


function searchBooks(query) {

    const books = getAllBooks();

    if (!query || !query.trim()) {
        return books;
    }

    const search = query
        .toLowerCase()
        .trim();

    return books.filter(book => {

        const title = String(book.title || '').toLowerCase();
        const author = String(book.author || '').toLowerCase();
        const genre = String(book.genre || '').toLowerCase();
        const isbn = String(book.isbn || '').toLowerCase();
        const isbn13 = String(book.isbn13 || '').toLowerCase();

        return (
            title.includes(search) ||
            author.includes(search) ||
            genre.includes(search) ||
            isbn.includes(search) ||
            isbn13.includes(search)
        );
    });
}



// FILTRER LES LIVRES


function filterBooks(options = {}) {

    let books = getAllBooks();

    const {
        search,
        genre,
        available
    } = options;


    // -----------------------------
    // Recherche
    // -----------------------------

    if (search && search.trim()) {

        const query = search
            .toLowerCase()
            .trim();

        books = books.filter(book => {

            const title =
                String(book.title || '').toLowerCase();

            const author =
                String(book.author || '').toLowerCase();

            const bookGenre =
                String(book.genre || '').toLowerCase();

            const isbn =
                String(book.isbn || book.isbn13 || '')
                    .toLowerCase();

            return (
                title.includes(query) ||
                author.includes(query) ||
                bookGenre.includes(query) ||
                isbn.includes(query)
            );
        });
    }


    // -----------------------------
    // Genre
    // -----------------------------

    if (genre && genre.trim()) {

        books = books.filter(book =>

            String(book.genre || '').toLowerCase() ===
            genre.toLowerCase()
        );
    }


    // -----------------------------
    // Disponibilité
    // -----------------------------

    if (available !== undefined && available !== '') {

        const availability =
            available === true ||
            available === 'true';

        books = books.filter(
            book => Boolean(book.available) === availability
        );
    }


    return books;
}



// STATISTIQUES DU CATALOGUE


function getBookStats() {

    const books = getAllBooks();

    const total = books.length;

    const available = books.filter(
        book => book.available === true
    ).length;

    const unavailable = books.filter(
        book => book.available === false
    ).length;


    // -----------------------------
    // Catégories / genres
    // -----------------------------

    const categoryMap = {};

    books.forEach(book => {

        const category =
            book.genre ||
            book.category ||
            'Sans catégorie';

        categoryMap[category] =
            (categoryMap[category] || 0) + 1;
    });


    const byCategory = Object.entries(categoryMap)
        .map(([category, count]) => ({
            category,
            count
        }))
        .sort((a, b) => b.count - a.count);


    return {
        total,
        available,
        unavailable,
        byCategory
    };
}



// AJOUTER UN LIVRE


function createBook(bookData) {

    const data = readDatabase();

    const books = data.books || [];

    const newId = books.length > 0
        ? Math.max(...books.map(book => Number(book.id))) + 1
        : 1;

    const stock = Math.max(
        0,
        Number(bookData.stock) || 1
    );

    const availableStock =
        bookData.availableStock !== undefined
            ? Math.min(
                stock,
                Math.max(
                    0,
                    Number(bookData.availableStock)
                )
            )
            : stock;

    const book = {

        id: newId,

        title: bookData.title || '',
        author: bookData.author || '',

        genre: bookData.genre || '',

        isbn: bookData.isbn || '',

        pages:
            Number(bookData.pages) || 0,

        publishedYear:
            Number(bookData.publishedYear) || null,

        publisher:
            bookData.publisher || '',

        description:
            bookData.description || '',

        cover:
            bookData.cover || '',

        stock: stock,

        availableStock: availableStock,

        available: availableStock > 0
    };

    books.push(book);

    data.books = books;

    writeDatabase(data);

    return book;
}

// MODIFIER UN LIVRE


function updateBook(id, bookData) {

    const data = readDatabase();

    const index = data.books.findIndex(
        book => Number(book.id) === Number(id)
    );

    if (index === -1) {
        return null;
    }

    const currentBook = data.books[index];

    const stock =
        bookData.stock !== undefined
            ? Math.max(
                0,
                Number(bookData.stock)
            )
            : Number(currentBook.stock) || 0;

    const availableStock =
        bookData.availableStock !== undefined
            ? Math.min(
                stock,
                Math.max(
                    0,
                    Number(bookData.availableStock)
                )
            )
            : Math.min(
                stock,
                Number(currentBook.availableStock) || 0
            );

    data.books[index] = {

        ...currentBook,

        ...bookData,

        id: Number(id),

        stock: stock,

        availableStock: availableStock,

        available: availableStock > 0
    };

    writeDatabase(data);

    return data.books[index];
}


// MODIFIER LA DISPONIBILITÉ


function updateBookAvailability(id, available) {

    const data = readDatabase();

    const index = data.books.findIndex(
        book => Number(book.id) === Number(id)
    );


    if (index === -1) {
        return null;
    }


    data.books[index].available =
        Boolean(available);


    const saved = writeDatabase(data);

    if (!saved) {
        return null;
    }


    return data.books[index];
}



// SUPPRIMER UN LIVRE


function deleteBook(id) {

    const data = readDatabase();

    const index = data.books.findIndex(
        book => Number(book.id) === Number(id)
    );


    if (index === -1) {
        return false;
    }


    data.books.splice(index, 1);


    return writeDatabase(data);
}



// MODIFIER LE STOCK


function updateBookStock(id, quantity) {

    const data = readDatabase();

    const index = data.books.findIndex(
        book => book.id === Number(id)
    );

    if (index === -1) {
        return null;
    }

    const book = data.books[index];

    const newStock =
        Math.max(
            0,
            Number(quantity)
        );

    const currentAvailable =
        Number(
            book.availableStock ??
            book.stock ??
            0
        );

    const borrowed =
        Math.max(
            0,
            Number(book.stock || 0) -
            currentAvailable
        );

    /*
     * On ne peut pas réduire le stock
     * en dessous du nombre d'exemplaires
     * actuellement empruntés.
     */
    if (newStock < borrowed) {
        throw new Error(
            'Le nouveau stock est inférieur au nombre d’exemplaires actuellement empruntés.'
        );
    }

    book.stock = newStock;

    book.availableStock =
        newStock - borrowed;

    book.available =
        book.availableStock > 0;

    writeDatabase(data);

    return book;
}


// EXPORTS


module.exports = {

    getAllBooks,

    getBookById,

    searchBooks,

    filterBooks,

    getBookStats,

    createBook,

    updateBook,

    updateBookStock,

    updateBookAvailability,

    deleteBook
};