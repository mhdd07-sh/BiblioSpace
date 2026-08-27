const express = require('express');

const router = express.Router();

const {
    getAllBooks,
    getBookById,
    searchBooks,
    filterBooks,
    getBookStats,
    createBook,
    updateBook,
    updateBookAvailability,
    deleteBook
} = require('../services/bookService');


// =====================================================
// GET /api/books
// Tous les livres + statistiques
// =====================================================

router.get('/', (req, res) => {

    try {

        const {
            q,
            genre,
            available
        } = req.query;


        // =============================================
        // Récupération des livres
        // =============================================

        let books;


        // Si des filtres sont utilisés
        if (
            q ||
            genre ||
            available !== undefined
        ) {

            books = filterBooks({
                search: q,
                genre: genre,
                available: available
            });

        } else {

            books = getAllBooks();

        }


        // =============================================
        // Statistiques globales du catalogue
        // =============================================

        const stats = getBookStats();


        // =============================================
        // Statistiques des résultats actuels
        // =============================================

        const resultAvailable = books.filter(
            book => book.available === true
        ).length;

        const resultUnavailable = books.filter(
            book => book.available === false
        ).length;


        // =============================================
        // Réponse
        // =============================================

        res.json({

            success: true,

            count: books.length,

            books: books,

            stats: {

                total:
                    stats.total,

                available:
                    stats.available,

                unavailable:
                    stats.unavailable,

                resultCount:
                    books.length,

                resultAvailable:
                    resultAvailable,

                resultUnavailable:
                    resultUnavailable
            }

        });

    } catch (error) {

        console.error(
            'Erreur récupération des livres :',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Impossible de récupérer les livres.'
        });
    }

});


// =====================================================
// GET /api/books/:id
// Récupérer un livre
// =====================================================

router.get('/:id', (req, res) => {

    try {

        const book =
            getBookById(req.params.id);


        if (!book) {

            return res.status(404).json({

                success: false,

                message:
                    'Livre introuvable.'
            });

        }


        res.json({

            success: true,

            book: book
        });

    } catch (error) {

        console.error(
            'Erreur récupération du livre :',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Erreur lors de la récupération du livre.'
        });
    }

});


// =====================================================
// POST /api/books
// Ajouter un livre
// =====================================================

router.post('/', (req, res) => {

    try {

        const {
            title,
            author
        } = req.body;


        if (!title || !author) {

            return res.status(400).json({

                success: false,

                message:
                    'Le titre et l’auteur sont obligatoires.'
            });

        }


        const book =
            createBook(req.body);


        if (!book) {

            return res.status(500).json({

                success: false,

                message:
                    'Impossible d’ajouter le livre.'
            });

        }


        res.status(201).json({

            success: true,

            message:
                'Livre ajouté avec succès.',

            book: book
        });

    } catch (error) {

        console.error(
            'Erreur ajout livre :',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Impossible d’ajouter le livre.'
        });
    }

});


// =====================================================
// PUT /api/books/:id
// Modifier un livre
// =====================================================

router.put('/:id', (req, res) => {

    try {

        const book =
            updateBook(
                req.params.id,
                req.body
            );


        if (!book) {

            return res.status(404).json({

                success: false,

                message:
                    'Livre introuvable.'
            });

        }


        res.json({

            success: true,

            message:
                'Livre modifié avec succès.',

            book: book
        });

    } catch (error) {

        console.error(
            'Erreur modification livre :',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Impossible de modifier le livre.'
        });
    }

});


// =====================================================
// PATCH /api/books/:id/availability
// Modifier uniquement la disponibilité
// =====================================================

router.patch(
    '/:id/availability',
    (req, res) => {

        try {

            const {
                available
            } = req.body;


            if (typeof available !== 'boolean') {

                return res.status(400).json({

                    success: false,

                    message:
                        'La disponibilité doit être true ou false.'
                });

            }


            const book =
                updateBookAvailability(
                    req.params.id,
                    available
                );


            if (!book) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Livre introuvable.'
                });

            }


            res.json({

                success: true,

                message:
                    'Disponibilité mise à jour.',

                book: book
            });

        } catch (error) {

            console.error(
                'Erreur disponibilité livre :',
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Impossible de modifier la disponibilité.'
            });
        }

    }
);


// =====================================================
// DELETE /api/books/:id
// Supprimer un livre
// =====================================================

router.delete('/:id', (req, res) => {

    try {

        const deleted =
            deleteBook(
                req.params.id
            );


        if (!deleted) {

            return res.status(404).json({

                success: false,

                message:
                    'Livre introuvable.'
            });

        }


        res.json({

            success: true,

            message:
                'Livre supprimé avec succès.'
        });

    } catch (error) {

        console.error(
            'Erreur suppression livre :',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Impossible de supprimer le livre.'
        });
    }

});


module.exports = router;