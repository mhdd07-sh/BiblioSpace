const express = require('express');
const pool = require('../db');

const {
    authenticateToken,
    requireAdmin
} = require('../middleware/auth');

const {
    getBookById,
    updateBook
} = require('../services/bookService');

const router = express.Router();

    //CALCUL DU STATUT EFFECTIF
 

function getCurrentStatus(row) {
    // Si le livre a été retourné, le statut reste RETOURNE.

    if (row.status === 'RETOURNE') {
        return 'RETOURNE';
    }

    // Si la date limite est dépassée, l'emprunt est en retard.
     
    return new Date(row.due_date) < new Date()
        ? 'EN_RETARD'
        : 'EN_COURS';
}


   // GET /api/loans/my
   // MES EMPRUNTS
  

router.get(
    '/my',
    authenticateToken,
    async (req, res) => {
        try {
            // Les emprunts sont toujours stockés dans PostgreSQL.
             
            const result = await pool.query(
                `
                SELECT *
                FROM loans
                WHERE user_id = $1
                ORDER BY created_at DESC
                `,
                [req.user.id]
            );

            
             //Les informations des livres viennent maintenant de db.json.
             
            const data = result.rows.map(loan => {
                const book = getBookById(loan.book_id);

                return {
                    ...loan,

                    
                     // Informations du livre
                     
                    title: book
                        ? book.title
                        : 'Livre supprimé',

                    author: book
                        ? book.author
                        : '',

                    cover: book
                        ? book.cover
                        : '',

                    genre: book
                        ? book.genre
                        : '',

                    
                     // Statut calculé
                     
                    effective_status: getCurrentStatus(loan)
                };
            });

            res.json({
                success: true,
                data: data
            });

        } catch (error) {
            console.error(
                'Erreur GET /api/loans/my :',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Erreur lors du chargement de vos emprunts.'
            });
        }
    }
);


   // GET /api/loans
   // TOUS LES EMPRUNTS - ADMIN


router.get(
    '/',
    authenticateToken,
    requireAdmin,
    async (_req, res) => {
        try {
            /*
             * Les emprunts viennent de PostgreSQL.
             */
            const result = await pool.query(
                `
                SELECT
                    l.*,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM loans l
                JOIN users u
                    ON u.id = l.user_id
                ORDER BY l.created_at DESC
                `
            );

            
             // Ajouter les informations des livres provenant de db.json.
            const data = result.rows.map(loan => {
                const book = getBookById(loan.book_id);

                return {
                    ...loan,

                    title: book
                        ? book.title
                        : 'Livre supprimé',

                    author: book
                        ? book.author
                        : '',

                    cover: book
                        ? book.cover
                        : '',

                    genre: book
                        ? book.genre
                        : '',

                    effective_status: getCurrentStatus(loan)
                };
            });

            res.json({
                success: true,
                data: data
            });

        } catch (error) {
            console.error(
                'Erreur GET /api/loans :',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Erreur lors du chargement des emprunts.'
            });
        }
    }
);

   // POST /api/loans
   // EMPRUNTER UN LIVRE


router.post(
    '/',
    authenticateToken,
    async (req, res) => {
        const client = await pool.connect();

        try {
            const { bookId } = req.body;

            
             // Vérification du bookId
             
            if (!bookId) {
                return res.status(400).json({
                    success: false,
                    message: 'bookId requis.'
                });
            }

            const numericBookId = Number(bookId);

            if (
                !Number.isInteger(numericBookId) ||
                numericBookId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Identifiant de livre invalide.'
                });
            }

            
             // Récupérer le livre depuis db.json
             
            const book = getBookById(numericBookId);

            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Livre introuvable.'
                });
            }

            
             // Calcul du stock disponible.
             
            const stock = Number(book.stock) || 0;

            let availableStock;

            if (book.availableStock !== undefined) {
                availableStock = Number(book.availableStock) || 0;
            } else {
                availableStock = book.available
                    ? stock
                    : 0;
            }

            
              // Vérifier la disponibilité
             
            if (availableStock <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Livre indisponible.'
                });
            }

             // Commencer la transaction PostgreSQL.
             
            await client.query('BEGIN');

            // VÉRIFIER LA LIMITE DE 3 EMPRUNTS

            const count = await client.query(
                `
                SELECT COUNT(*)::int AS total
                FROM loans
                WHERE user_id = $1
                AND status <> 'RETOURNE'
                `,
                [req.user.id]
            );

            if (count.rows[0].total >= 3) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    success: false,
                    message: 'Limite de 3 emprunts actifs atteinte.'
                });
            }

            // VÉRIFIER SI LE MEMBRE A DÉJÀ CE LIVRE

            const already = await client.query(
                `
                SELECT id
                FROM loans
                WHERE user_id = $1
                AND book_id = $2
                AND status <> 'RETOURNE'
                `,
                [
                    req.user.id,
                    numericBookId
                ]
            );

            if (already.rowCount > 0) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    success: false,
                    message: 'Vous avez déjà ce livre en emprunt.'
                });
            }

            // CRÉER L'EMPRUNT


            const loan = await client.query(
                `
                INSERT INTO loans
                    (
                        user_id,
                        book_id,
                        due_date
                    )
                VALUES
                    (
                        $1,
                        $2,
                        CURRENT_TIMESTAMP
                            + INTERVAL '7 days'
                    )
                RETURNING *
                `,
                [
                    req.user.id,
                    numericBookId
                ]
            );

            // DIMINUER LE STOCK DANS db.json

            const newAvailableStock = availableStock - 1;

            const updatedBook = updateBook(
                numericBookId,
                {
                    availableStock: newAvailableStock,

                    /*
                     * La disponibilité est déterminée
                     * par le nombre d'exemplaires.
                     */
                    available: newAvailableStock > 0
                }
            );

            
              // Vérifier que la modification de db.json a bien fonctionné.
             
            if (!updatedBook) {
                await client.query('ROLLBACK');

                return res.status(500).json({
                    success: false,
                    message: 'Impossible de mettre à jour le stock du livre.'
                });
            }

            
              //Valider la transaction PostgreSQL.
             
            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Livre emprunté avec succès.',
                data: {
                    ...loan.rows[0],

                    title: book.title,
                    author: book.author,
                    cover: book.cover,
                    stock: updatedBook.stock,
                    availableStock: updatedBook.availableStock
                }
            });

        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch (_) {
                // Rien à faire
            }

            console.error(
                'Erreur POST /api/loans :',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Erreur serveur.'
            });

        } finally {
            client.release();
        }
    }
);


   //PUT /api/loans/:id/return
   //RETOURNER UN LIVRE - ADMIN


router.put(
    '/:id/return',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            //Récupérer l'emprunt.
             
            const loanResult = await client.query(
                `
                SELECT *
                FROM loans
                WHERE id = $1
                FOR UPDATE
                `,
                [req.params.id]
            );

            if (!loanResult.rowCount) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    success: false,
                    message: 'Emprunt introuvable.'
                });
            }

            const loan = loanResult.rows[0];

            // Vérifier si déjà retourné.
           
            if (loan.status === 'RETOURNE') {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    success: false,
                    message: 'Livre déjà retourné.'
                });
            }

            // Récupérer le livre dans db.json.
             
            const book = getBookById(loan.book_id);

            if (!book) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    success: false,
                    message: 'Livre associé introuvable dans db.json.'
                });
            }

            //CALCUL DU STOCK

            const stock = Number(book.stock) || 0;

            const currentAvailable = book.availableStock !== undefined
                ? Number(book.availableStock) || 0
                : (
                    book.available
                        ? stock
                        : 0
                );

            // Ne jamais dépasser le stock maximum.
            
            const newAvailableStock = Math.min(
                stock,
                currentAvailable + 1
            );

            //METTRE À JOUR L'EMPRUNT

            const updated = await client.query(
                `
                UPDATE loans
                SET
                    return_date = CURRENT_TIMESTAMP,
                    status = 'RETOURNE'
                WHERE id = $1
                RETURNING *
                `,
                [req.params.id]
            );

            /* =================================================
               RESTAURER LE STOCK DANS db.json
               ================================================= */

            const updatedBook = updateBook(
                loan.book_id,
                {
                    availableStock: newAvailableStock,
                    available: newAvailableStock > 0
                }
            );

            if (!updatedBook) {
                await client.query('ROLLBACK');

                return res.status(500).json({
                    success: false,
                    message: 'Impossible de mettre à jour le stock du livre.'
                });
            }

            /*
             * Valider.
             */
            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Retour enregistré.',
                data: {
                    ...updated.rows[0],

                    title: updatedBook.title,
                    author: updatedBook.author,
                    cover: updatedBook.cover,
                    stock: updatedBook.stock,
                    availableStock: updatedBook.availableStock
                }
            });

        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch (_) {
                // Rien à faire
            }

            console.error(
                'Erreur retour livre :',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Erreur serveur.'
            });

        } finally {
            client.release();
        }
    }
);

// EXPORT

module.exports = router;