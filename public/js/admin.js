/* =========================================================
   BIBLIOSPACE - ADMINISTRATION
   Gestion des livres + emprunts + statistiques
   ========================================================= */

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || user.role !== 'admin') {
    window.location.href = '/login.html';
}

const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
};


/* =========================================================
   ELEMENTS DOM
   ========================================================= */

const logoutBtn = document.getElementById('logout');

const bookForm = document.getElementById('bookForm');
const message = document.getElementById('message');

const loansBody = document.getElementById('loansBody');

const booksAdminBody =
    document.getElementById('booksAdminBody');

const searchBookInput =
    document.getElementById('searchBook');


/* =========================================================
   DECONNEXION
   ========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener('click', function (e) {

        e.preventDefault();

        localStorage.clear();

        window.location.href = '/';

    });

}


/* =========================================================
   CHARGEMENT GLOBAL
   ========================================================= */

async function load() {

    try {

        await loadStats();

        await loadCategories();

        await loadBooks();

        await loadLoans();

    } catch (error) {

        console.error(
            'Erreur chargement administration :',
            error
        );

        showMessage(
            'Impossible de charger les données.',
            false
        );
    }
}


/* =========================================================
   STATISTIQUES
   ========================================================= */

async function loadStats() {

    const response = await fetch(
        '/api/stats',
        {
            headers
        }
    );

    if (response.status === 401 ||
        response.status === 403) {

        localStorage.clear();

        window.location.href = '/login.html';

        return;
    }

    const result = await response.json();

    if (!response.ok) {

        throw new Error(
            result.message ||
            'Erreur lors du chargement des statistiques.'
        );
    }

    const stats = result.data || {};

    const sBooks =
        document.getElementById('sBooks');

    const sMembers =
        document.getElementById('sMembers');

    const sActive =
        document.getElementById('sActive');

    const sLate =
        document.getElementById('sLate');

    if (sBooks) {
        sBooks.textContent =
            stats.totalBooks || 0;
    }

    if (sMembers) {
        sMembers.textContent =
            stats.totalMembers || 0;
    }

    if (sActive) {
        sActive.textContent =
            stats.activeLoans || 0;
    }

    if (sLate) {
        sLate.textContent =
            stats.lateLoans || 0;
    }
}


/* =========================================================
   CATEGORIES
   ========================================================= */

async function loadCategories() {

    const categorySelect =
        document.getElementById('category_id');

    if (!categorySelect) {
        return;
    }

    try {

        const response =
            await fetch('/api/categories');

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                'Impossible de charger les catégories.'
            );
        }

        const categories =
            result.data || [];

        categorySelect.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;

        categories.forEach(category => {

            const option =
                document.createElement('option');

            option.value = category.id;

            option.textContent =
                category.name;

            categorySelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            'Erreur catégories :',
            error
        );

        categorySelect.innerHTML = `
            <option value="">
                Aucune catégorie disponible
            </option>
        `;
    }
}


/* =========================================================
   CHARGER LES LIVRES
   ========================================================= */

async function loadBooks(search = '') {

    if (!booksAdminBody) {
        return;
    }

    booksAdminBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-cell">
                📚 Chargement des livres...
            </td>
        </tr>
    `;

    try {

        let url = '/api/books';

        if (search.trim()) {

            url +=
                `?q=${encodeURIComponent(search.trim())}`;

        }

        const response =
            await fetch(
                url,
                {
                    headers
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                'Impossible de charger les livres.'
            );
        }

        const books =
            result.books || [];

        displayAdminBooks(books);

    } catch (error) {

        console.error(
            'Erreur chargement livres :',
            error
        );

        booksAdminBody.innerHTML = `
            <tr>
                <td colspan="8">
                    Impossible de charger les livres.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   AFFICHER LES LIVRES ADMIN
   ========================================================= */

function displayAdminBooks(books) {

    if (!booksAdminBody) {
        return;
    }

    if (books.length === 0) {

        booksAdminBody.innerHTML = `
            <tr>
                <td colspan="8">
                    Aucun livre trouvé.
                </td>
            </tr>
        `;

        return;
    }


    booksAdminBody.innerHTML =
        books.map(book => {

            const stock =
                Number(book.stock) || 0;

            const availableStock =
                Number(
                    book.availableStock
                ) || 0;

            const available =
                availableStock > 0;

            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(book.title)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            book.author || 'Inconnu'
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            book.genre || '—'
                        )}
                    </td>

                    <td>
                        ${stock}
                    </td>

                    <td>
                        ${availableStock}
                    </td>

                    <td>

                        <span class="
                            book-status
                            ${available
                                ? 'available'
                                : 'unavailable'}
                        ">
                            ${
                                available
                                    ? 'Disponible'
                                    : 'Indisponible'
                            }
                        </span>

                    </td>

                    <td>
                        ${
                            book.publishedYear ||
                            '—'
                        }
                    </td>

                    <td>

                        <div class="admin-actions">

                            <button
                              class="btn btn-edit"
                                onclick="window.location.href='edit-book.html?id=${book.id}'"
                              >
                                  ✏️ Modifier
                            </button>

                            <button
                                class="btn btn-delete"
                                onclick="
                                    deleteBook(${book.id})
                                "
                            >
                                🗑️ Supprimer
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join('');
}


/* =========================================================
   RECHERCHE LIVRE
   ========================================================= */

if (searchBookInput) {

    let timer;

    searchBookInput.addEventListener(
        'input',
        function () {

            clearTimeout(timer);

            timer = setTimeout(() => {

                loadBooks(
                    searchBookInput.value
                );

            }, 300);

        }
    );
}


/* =========================================================
   AJOUTER UN LIVRE
   ========================================================= */

if (bookForm) {

    bookForm.addEventListener(
        'submit',
        async function (e) {

            e.preventDefault();

            const body = {

                title:
                    document.getElementById('title')
                        .value.trim(),

                author:
                    document.getElementById('author')
                        .value.trim(),

                isbn:
                    document.getElementById('isbn13')
                        .value.trim(),

                genre:
                    document.getElementById('genre')
                        .value.trim(),

                pages:
                    Number(
                        document.getElementById('pages')
                            .value
                    ) || 0,

                publishedYear:
                    Number(
                        document.getElementById(
                            'published_year'
                        ).value
                    ) || null,

                publisher:
                    document.getElementById(
                        'publisher'
                    ).value.trim(),

                stock:
                    Number(
                        document.getElementById('stock')
                            .value
                    ) || 1,

                cover:
                    document.getElementById(
                        'cover_url'
                    ).value.trim(),

                genre:
                    document.getElementById('genre')
                        .value.trim(),

                description:
                    document.getElementById(
                        'description'
                    ).value.trim(),

                available: true

            };


            try {

                const response =
                    await fetch(
                        '/api/books',
                        {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(body)
                        }
                    );

                const result =
                    await response.json();

                showMessage(
                    result.message ||
                    'Livre ajouté.',
                    response.ok
                );

                if (response.ok) {

                    bookForm.reset();

                    await load();

                }

            } catch (error) {

                console.error(error);

                showMessage(
                    'Erreur lors de l’ajout du livre.',
                    false
                );
            }

        }
    );
}


/* =========================================================
   MODIFIER UN LIVRE
   ========================================================= */

async function editBook(id) {

    try {

        const response =
            await fetch(
                `/api/books/${id}`,
                {
                    headers
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                'Livre introuvable.'
            );
        }

        const book =
            result.book;


        const title =
            prompt(
                'Titre :',
                book.title || ''
            );

        if (title === null) {
            return;
        }


        const author =
            prompt(
                'Auteur :',
                book.author || ''
            );

        if (author === null) {
            return;
        }


        const genre =
            prompt(
                'Catégorie / Genre :',
                book.genre || ''
            );

        if (genre === null) {
            return;
        }


        const stockInput =
            prompt(
                'Stock total :',
                book.stock || 1
            );

        if (stockInput === null) {
            return;
        }

        const stock =
            Number(stockInput);


        if (!Number.isInteger(stock) ||
            stock < 1) {

            alert(
                'Le stock doit être un nombre entier supérieur à 0.'
            );

            return;
        }


        const description =
            prompt(
                'Description :',
                book.description || ''
            );

        if (description === null) {
            return;
        }


        const updatedBook = {

            ...book,

            title:
                title.trim(),

            author:
                author.trim(),

            genre:
                genre.trim(),

            stock,

            /*
             * On conserve le nombre de livres
             * actuellement disponibles.
             *
             * Si le nouveau stock est inférieur
             * à l'ancien stock disponible,
             * on limite availableStock.
             */

            availableStock:
                Math.min(
                    Number(
                        book.availableStock
                    ) || 0,
                    stock
                ),

            description:
                description.trim()

        };


        const updateResponse =
            await fetch(
                `/api/books/${id}`,
                {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(
                        updatedBook
                    )
                }
            );

        const updateResult =
            await updateResponse.json();


        showMessage(
            updateResult.message ||
            'Livre modifié.',
            updateResponse.ok
        );


        if (updateResponse.ok) {

            await load();

        }

    } catch (error) {

        console.error(error);

        showMessage(
            'Impossible de modifier le livre.',
            false
        );
    }
}


/* =========================================================
   SUPPRIMER UN LIVRE
   ========================================================= */

async function deleteBook(id) {

    const confirmation =
        confirm(
            'Voulez-vous vraiment supprimer ce livre ?'
        );

    if (!confirmation) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/books/${id}`,
                {
                    method: 'DELETE',
                    headers
                }
            );

        const result =
            await response.json();


        showMessage(
            result.message ||
            'Livre supprimé.',
            response.ok
        );


        if (response.ok) {

            await load();

        }

    } catch (error) {

        console.error(error);

        showMessage(
            'Impossible de supprimer le livre.',
            false
        );
    }
}


/* =========================================================
   CHARGER LES EMPRUNTS
   ========================================================= */

async function loadLoans() {

    if (!loansBody) {
        return;
    }

    loansBody.innerHTML = `
        <tr>
            <td colspan="6">
                📖 Chargement des emprunts...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(
                '/api/loans',
                {
                    headers
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                'Impossible de charger les emprunts.'
            );
        }

        const loans =
            result.data || [];

        displayLoans(loans);

    } catch (error) {

        console.error(
            'Erreur emprunts :',
            error
        );

        loansBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Impossible de charger les emprunts.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   AFFICHER LES EMPRUNTS
   ========================================================= */

function displayLoans(loans) {

    if (loans.length === 0) {

        loansBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucun emprunt enregistré.
                </td>
            </tr>
        `;

        return;
    }


    loansBody.innerHTML =
        loans.map(loan => {

            const status =
                loan.effective_status;


            let statusClass = '';

            if (status === 'RETOURNE') {
                statusClass = 'status-return';
            }

            if (status === 'EN_RETARD') {
                statusClass = 'status-late';
            }


            const member =
                `${loan.first_name || ''} ${
                    loan.last_name || ''
                }`.trim();


            return `
                <tr>

                    <td>

                        <strong>
                            ${escapeHtml(
                                member ||
                                'Membre'
                            )}
                        </strong>

                        <br>

                        <small>
                            ${escapeHtml(
                                loan.email || ''
                            )}
                        </small>

                    </td>


                    <td>

                        <strong>
                            ${escapeHtml(
                                loan.title ||
                                'Livre'
                            )}
                        </strong>

                        <br>

                        <small>
                            ${escapeHtml(
                                loan.author ||
                                ''
                            )}
                        </small>

                    </td>


                    <td>
                        ${formatDate(
                            loan.borrow_date ||
                            loan.created_at
                        )}
                    </td>


                    <td>
                        ${formatDate(
                            loan.due_date
                        )}
                    </td>


                    <td class="${statusClass}">

                        ${
                            status === 'EN_RETARD'
                                ? '⚠️ En retard'
                                : status === 'RETOURNE'
                                    ? '↩️ Retourné'
                                    : '📖 En cours'
                        }

                    </td>


                    <td>

                        ${
                            status !== 'RETOURNE'

                                ? `
                                    <button
                                        class="btn"
                                        onclick="
                                            returnLoan(
                                                ${loan.id}
                                            )
                                        "
                                    >
                                        ↩️ Retour
                                    </button>
                                `

                                : `
                                    <span>
                                        —
                                    </span>
                                `
                        }

                    </td>

                </tr>
            `;

        }).join('');
}


/* =========================================================
   ENREGISTRER UN RETOUR
   ========================================================= */

async function returnLoan(id) {

    const confirmation =
        confirm(
            'Confirmer le retour de ce livre ?'
        );

    if (!confirmation) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/loans/${id}/return`,
                {
                    method: 'PUT',
                    headers
                }
            );

        const result =
            await response.json();


        alert(
            result.message ||
            'Retour enregistré.'
        );


        if (response.ok) {

            await load();

        }

    } catch (error) {

        console.error(error);

        alert(
            'Erreur lors de l’enregistrement du retour.'
        );
    }
}


/* =========================================================
   OUTILS
   ========================================================= */

function formatDate(date) {

    if (!date) {
        return '—';
    }

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
        return '—';
    }

    return d.toLocaleDateString(
        'fr-FR'
    );
}


function showMessage(text, success = true) {

    if (!message) {
        return;
    }

    message.textContent = text;

    message.style.color =
        success
            ? '#2a9d8f'
            : '#e76f51';

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


/* =========================================================
   DEMARRAGE
   ========================================================= */

load();