const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const bookService = require('../services/bookService');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, async (_req, res) => {
  try {
   
      //LIVRES

     
    const books = await bookService.getAllBooks();

    const totalBooks = books.length;

    const availableBooks = books.filter(
      book => book.available === true
    ).length;

    const unavailableBooks = books.filter(
      book => book.available === false
    ).length;


    
     // UTILISATEURS ET EMPRUNTS
     
    const [
      membersResult,
      activeResult,
      lateResult,
      returnedResult,
      loansTotalResult
    ] = await Promise.all([

      // Nombre de membres
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE role = 'member'
      `),

      // Emprunts actuellement actifs
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM loans
        WHERE status <> 'RETOURNE'
      `),

      // Emprunts en retard
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM loans
        WHERE status <> 'RETOURNE'
        AND due_date < CURRENT_TIMESTAMP
      `),

      // Livres retournés
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM loans
        WHERE status = 'RETOURNE'
      `),

      // Nombre total d'emprunts
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM loans
      `)
    ]);


    
     // CATÉGORIES
     

    const categoryMap = {};

    books.forEach(book => {

      const category =
        book.genre ||
        book.category ||
        'Sans catégorie';

      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }

      categoryMap[category]++;
    });

    const byCategory = Object.entries(categoryMap)
      .map(([category, count]) => ({
        category,
        count
      }))
      .sort((a, b) => b.count - a.count);


    
     // LIVRES LES PLUS POPULAIRES
     

    const popularLoansResult = await pool.query(`
      SELECT
        book_id,
        COUNT(*)::int AS loan_count
      FROM loans
      GROUP BY book_id
      ORDER BY loan_count DESC
      LIMIT 5
    `);

    const popularBooks = popularLoansResult.rows.map(loan => {

      const book = books.find(
        b => Number(b.id) === Number(loan.book_id)
      );

      return {
        id: loan.book_id,
        title: book ? book.title : 'Livre inconnu',
        loan_count: loan.loan_count
      };

    });


 
     // RÉPONSE API
     

    res.json({
      success: true,

      data: {

        // Statistiques des livres
        totalBooks,
        availableBooks,
        unavailableBooks,

        // Statistiques utilisateurs
        totalMembers: membersResult.rows[0].count,

        // Statistiques emprunts
        activeLoans: activeResult.rows[0].count,
        lateLoans: lateResult.rows[0].count,
        returnedLoans: returnedResult.rows[0].count,
        totalLoans: loansTotalResult.rows[0].count,

        // Répartition par catégorie
        byCategory,

        // Livres populaires
        popularBooks
      }
    });

  } catch (error) {

    console.error(
      'Erreur lors de la récupération des statistiques :',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les statistiques.'
    });
  }
});

module.exports = router;