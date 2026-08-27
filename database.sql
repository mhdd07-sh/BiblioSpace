CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

/*CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn13 VARCHAR(20) UNIQUE,
    genre VARCHAR(100),
    pages INTEGER CHECK (pages IS NULL OR pages > 0),
    published_year INTEGER CHECK (published_year IS NULL OR published_year BETWEEN 0 AND EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
    publisher VARCHAR(255),
    description TEXT,
    cover_url TEXT,
    stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
    available INTEGER NOT NULL DEFAULT 1 CHECK (available >= 0 AND available <= stock),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
*/
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL,
    borrow_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'EN_COURS' CHECK (status IN ('EN_COURS', 'RETOURNE', 'EN_RETARD')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_id);

INSERT INTO categories (name, description) VALUES
('Informatique', 'Programmation, réseaux, systèmes et technologies'),
('Roman', 'Romans et littérature générale'),
('Sciences', 'Sciences naturelles et sciences exactes'),
('Histoire', 'Histoire, géopolitique et civilisations'),
('Économie', 'Économie, finance et gestion'),
('Droit', 'Droit et sciences juridiques'),
('Mathématiques', 'Mathématiques et statistiques')
ON CONFLICT (name) DO NOTHING;

/*INSERT INTO books (title, author, isbn13, genre, pages, published_year, publisher, description, cover_url, stock, available, category_id)
SELECT * FROM (VALUES
('Clean Code', 'Robert C. Martin', '9780132350884', 'Informatique', 464, 2008, 'Prentice Hall', 'Guide pratique pour écrire du code propre et maintenable.', 'https://covers.openlibrary.org/isbn/9780132350884-L.jpg', 4, 4, (SELECT id FROM categories WHERE name = 'Informatique')),
('The Pragmatic Programmer', 'Andrew Hunt', '9780135957059', 'Informatique', 352, 2019, 'Addison-Wesley', 'Principes et pratiques pour améliorer sa manière de développer.', 'https://covers.openlibrary.org/isbn/9780135957059-L.jpg', 3, 3, (SELECT id FROM categories WHERE name = 'Informatique')),
('Introduction to Algorithms', 'Thomas H. Cormen', '9780262046305', 'Informatique', 1312, 2022, 'MIT Press', 'Référence complète sur les algorithmes.', 'https://covers.openlibrary.org/isbn/9780262046305-L.jpg', 2, 2, (SELECT id FROM categories WHERE name = 'Informatique')),
('Le Petit Prince', 'Antoine de Saint-Exupéry', '9782070612758', 'Roman', 96, 1943, 'Gallimard', 'Conte poétique et philosophique.', 'https://covers.openlibrary.org/isbn/9782070612758-L.jpg', 5, 5, (SELECT id FROM categories WHERE name = 'Roman')),
('L’Étranger', 'Albert Camus', '9782070360024', 'Roman', 186, 1942, 'Gallimard', 'Roman majeur de la littérature française.', 'https://covers.openlibrary.org/isbn/9782070360024-L.jpg', 3, 3, (SELECT id FROM categories WHERE name = 'Roman')),
('Sapiens', 'Yuval Noah Harari', '9780062316097', 'Histoire', 464, 2015, 'Harper', 'Une histoire synthétique de l’humanité.', 'https://covers.openlibrary.org/isbn/9780062316097-L.jpg', 4, 4, (SELECT id FROM categories WHERE name = 'Histoire')),
('A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Sciences', 212, 1998, 'Bantam', 'Introduction accessible à la cosmologie moderne.', 'https://covers.openlibrary.org/isbn/9780553380163-L.jpg', 2, 2, (SELECT id FROM categories WHERE name = 'Sciences')),
('Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Économie', 512, 2011, 'Farrar, Straus and Giroux', 'Comprendre les mécanismes de la pensée et de la décision.', 'https://covers.openlibrary.org/isbn/9780374533557-L.jpg', 3, 3, (SELECT id FROM categories WHERE name = 'Économie')),
('Principles of Economics', 'N. Gregory Mankiw', '9780357541598', 'Économie', 896, 2024, 'Cengage', 'Introduction aux grands principes de l’économie.', 'https://covers.openlibrary.org/isbn/9780357541598-L.jpg', 2, 2, (SELECT id FROM categories WHERE name = 'Économie')),
('Cours de mathématiques', 'Jean Dupont', '9780000000001', 'Mathématiques', 420, 2023, 'Éditions Campus', 'Cours général de mathématiques.', 'https://covers.openlibrary.org/b/id/placeholder-L.jpg', 3, 3, (SELECT id FROM categories WHERE name = 'Mathématiques'))
) AS v(title, author, isbn13, genre, pages, published_year, publisher, description, cover_url, stock, available, category_id)
ON CONFLICT (isbn13) DO NOTHING;
*/