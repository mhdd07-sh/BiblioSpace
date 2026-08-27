document.addEventListener(
    'DOMContentLoaded',
    loadBookDetails
);


/* =========================================================
   CHARGEMENT DU LIVRE
   ========================================================= */

async function loadBookDetails() {

    const container =
        document.getElementById('bookDetails');

    if (!container) {
        return;
    }


    /*
     * Récupérer l'ID dans l'URL
     */
    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get('id');


    /*
     * Vérification
     */
    if (!id) {

        showError(
            'Aucun livre sélectionné.'
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/api/books/${encodeURIComponent(id)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Livre introuvable.'
            );

        }


        const book =
            data.book;


        /*
         * Afficher le livre
         */
        displayBook(book);


    } catch (error) {

        console.error(
            'Erreur chargement livre :',
            error
        );


        showError(
            'Impossible de charger les détails du livre.'
        );

    }

}


/* =========================================================
   AFFICHAGE
   ========================================================= */

function displayBook(book) {

    const container =
        document.getElementById('bookDetails');


    const cover =
        book.cover ||
        '/images/default-book.png';


    const available =
        Boolean(book.available);


    container.innerHTML = `

        <div class="book-details-layout">


            <!-- =========================
                 COUVERTURE
                 ========================= -->

            <div class="book-details-cover">

                <img
                    id="detailBookImage"
                    src="${escapeHtml(cover)}"
                    alt="Couverture de ${escapeHtml(book.title)}"
                >

            </div>



            <!-- =========================
                 INFORMATIONS
                 ========================= -->

            <div class="book-details-info">


                ${
                    book.genre
                        ? `
                            <span class="eyebrow">
                                ${escapeHtml(book.genre)}
                            </span>
                        `
                        : ''
                }


                <h1>
                    ${escapeHtml(book.title)}
                </h1>


                <div class="book-main-info">


                    <p>
                        <strong>Auteur :</strong>
                        ${escapeHtml(book.author || 'Inconnu')}
                    </p>


                    <p>
                        <strong>ISBN :</strong>
                        ${escapeHtml(
                            book.isbn13 ||
                            book.isbn ||
                            'N/A'
                        )}
                    </p>


                    <p>
                        <strong>Éditeur :</strong>
                        ${escapeHtml(
                            book.publisher ||
                            'N/A'
                        )}
                    </p>


                    <p>
                        <strong>Année :</strong>
                        ${book.publishedYear || 'N/A'}
                    </p>


                    <p>
                        <strong>Pages :</strong>
                        ${book.pages || 'N/A'}
                    </p>


          <p>
    <strong>Stock total :</strong>
    ${book.stock || 0}
</p>

<p>
    <strong>Exemplaires disponibles :</strong>

    <span class="book-status ${
        book.availableStock > 0
            ? 'available'
            : 'unavailable'
    }">

        ${
            book.availableStock > 0
                ? `${book.availableStock} disponible(s)`
                : 'Aucun exemplaire disponible'
        }

    </span>

</p>


                </div>



                ${
                    book.description
                        ? `
                            <div class="book-description">

                                <h3>
                                    Description
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        book.description
                                    )}
                                </p>

                            </div>
                        `
                        : ''
                }



                <!-- =========================
                     ACTIONS
                     ========================= -->

                <div class="book-actions">

                    <button
                        class="btn"
                        onclick="borrowBook(${book.id})"
                        ${!available ? 'disabled' : ''}
                    >

                        ${
                            available
                                ? 'Emprunter'
                                : 'Indisponible'
                        }

                    </button>


                    <a
                        href="/books.html"
                        class="btn btn-outline"
                    >
                        ← Retour au catalogue
                    </a>

                </div>


            </div>

        </div>

    `;


    /*
     * Attendre le chargement de l'image
     */
    waitForBookImage();

}


/* =========================================================
   IMAGE
   ========================================================= */

function waitForBookImage() {

    const image =
        document.getElementById(
            'detailBookImage'
        );


    if (!image) {
        return;
    }


    if (
        image.complete &&
        image.naturalWidth > 0
    ) {

        image.classList.add(
            'loaded'
        );

        return;
    }


    image.addEventListener(
        'load',
        () => {

            image.classList.add(
                'loaded'
            );

        },
        { once: true }
    );


    image.addEventListener(
        'error',
        () => {

            image.src =
                '/images/default-book.png';

            image.classList.add(
                'loaded'
            );

        },
        { once: true }
    );

}


/* =========================================================
   EMPRUNT
   ========================================================= */

async function borrowBook(bookId) {

    const token =
        localStorage.getItem('token');


    /*
     * Vérifier la connexion
     */
    if (!token) {

        window.location.href =
            `/login.html?redirect=${encodeURIComponent(
                window.location.pathname +
                window.location.search
            )}`;

        return;
    }


    try {

        const response =
            await fetch(
                '/api/loans',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        bookId: bookId
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Impossible d’emprunter ce livre.'
            );

        }


        alert(
            '📚 Livre emprunté avec succès !'
        );


        /*
         * Recharger les informations
         * de disponibilité.
         */
        window.location.reload();


    } catch (error) {

        console.error(error);


        alert(
            error.message ||
            'Une erreur est survenue.'
        );

    }

}


/* =========================================================
   ERREUR
   ========================================================= */

function showError(message) {

    const container =
        document.getElementById(
            'bookDetails'
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="error">

            <h3>
                📚 Livre introuvable
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

            <a
                href="/books.html"
                class="btn"
            >
                Retour au catalogue
            </a>

        </div>

    `;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

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