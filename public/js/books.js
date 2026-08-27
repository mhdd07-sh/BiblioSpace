/* =========================================================
   BIBLIOSPACE - CATALOGUE DES LIVRES
   ========================================================= */

/*
 * Catégories proposées dans le catalogue
 */
const DEFAULT_CATEGORIES = [
    'Droit',
    'Économie',
    'Histoire',
    'Informatique',
    'Mathématiques',
    'Roman',
    'Science-fiction',
    'Philosophie',
    'Poésie',
    'Littérature africaine',
    'Sciences'
];


/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadBooks();

    /*
     * Recherche
     */
    const searchInput = document.getElementById("search");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyFilters
        );
    }


    /*
     * Filtre catégorie
     */
    const categorySelect =
        document.getElementById("category");

    if (categorySelect) {
        categorySelect.addEventListener(
            "change",
            applyFilters
        );
    }


    /*
     * Filtre disponibilité
     */
    const availableSelect =
        document.getElementById("available");

    if (availableSelect) {
        availableSelect.addEventListener(
            "change",
            applyFilters
        );
    }

});


/* =========================================================
   VARIABLES
   ========================================================= */

/*
 * Tous les livres chargés depuis l'API.
 *
 * On les conserve en mémoire afin de pouvoir appliquer
 * les filtres sans refaire une requête à chaque fois.
 */
let allBooks = [];


/* =========================================================
   CHARGEMENT DES LIVRES
   ========================================================= */

async function loadBooks() {

    const container =
        document.getElementById("books");

    const message =
        document.getElementById("message");


    if (!container) {
        return;
    }


    /*
     * Cacher complètement le catalogue pendant
     * le chargement.
     */
    container.style.visibility = "hidden";
    container.style.opacity = "0";


    /*
     * Message de chargement
     */
    if (message) {

        message.innerHTML = `
            <div class="loading">
                <p>📚 Chargement du catalogue...</p>
            </div>
        `;

    }


    try {

        const response =
            await fetch("/api/books");


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Erreur lors du chargement des livres."
            );

        }


        /*
         * Récupération des livres
         */
        allBooks = Array.isArray(data.books)
            ? data.books
            : [];


        /*
         * Normalisation des données
         */
        allBooks = allBooks.map(book => {

            const stock =
                Number(book.stock) || 0;

            const availableStock =
                book.availableStock !== undefined
                    ? Number(book.availableStock) || 0
                    : (
                        book.available
                            ? stock
                            : 0
                    );


            return {
                ...book,

                stock: stock,

                availableStock:
                    Math.max(
                        0,
                        Math.min(
                            availableStock,
                            stock
                        )
                    ),

                /*
                 * La disponibilité réelle est calculée
                 * à partir de availableStock.
                 */
                available:
                    availableStock > 0
            };

        });


        /*
         * Remplir la liste des catégories
         */
        populateCategories(allBooks);


        /*
         * Afficher les statistiques générales
         */
        updateStats(
            allBooks,
            allBooks
        );


        /*
         * Afficher les livres
         */
        await displayBooks(allBooks);


        /*
         * Afficher le catalogue seulement après
         * le chargement de toutes les images.
         */
        container.style.visibility = "visible";
        container.style.opacity = "1";


        /*
         * Supprimer le message de chargement
         */
        if (message) {
            message.innerHTML = "";
        }

    } catch (error) {

        console.error(
            "Erreur chargement livres :",
            error
        );


        container.style.visibility = "visible";
        container.style.opacity = "1";


        if (message) {

            message.innerHTML = `
                <div class="message error">
                    Impossible de charger les livres.
                </div>
            `;

        }

    }

}


/* =========================================================
   CATÉGORIES
   ========================================================= */

function populateCategories(books) {

    const select =
        document.getElementById("category");


    if (!select) {
        return;
    }


    /*
     * Conserver uniquement l'option par défaut.
     */
    select.innerHTML = `
        <option value="">
            Toutes les catégories
        </option>
    `;


    /*
     * Catégories demandées
     */
    const categories =
        new Set(DEFAULT_CATEGORIES);


    /*
     * Ajouter également les genres présents
     * dans db.json.
     *
     * Exemple :
     * - Science-fiction
     * - Littérature africaine
     */
    books.forEach(book => {

        if (book.genre) {
            categories.add(
                String(book.genre).trim()
            );
        }

    });


    /*
     * Tri alphabétique
     */
    const sortedCategories =
        Array.from(categories)
            .sort((a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
            );


    /*
     * Ajouter les catégories au select
     */
    sortedCategories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;
        option.textContent = category;

        select.appendChild(option);

    });

}


/* =========================================================
   FILTRES
   ========================================================= */

async function applyFilters() {

    const searchInput =
        document.getElementById("search");

    const categorySelect =
        document.getElementById("category");

    const availableSelect =
        document.getElementById("available");


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const category =
        categorySelect
            ? categorySelect.value
            : "";


    const availability =
        availableSelect
            ? availableSelect.value
            : "";


    /*
     * Filtrer les livres
     */
    const filteredBooks =
        allBooks.filter(book => {

            /*
             * Recherche
             */
            const matchesSearch =
                !search ||
                String(book.title || "")
                    .toLowerCase()
                    .includes(search) ||

                String(book.author || "")
                    .toLowerCase()
                    .includes(search) ||

                String(book.isbn || "")
                    .toLowerCase()
                    .includes(search);


            /*
             * Catégorie
             */
            const matchesCategory =
                !category ||
                String(book.genre || "")
                    .toLowerCase() ===
                category.toLowerCase();


            /*
             * Disponibilité
             */
            const availableStock =
                Number(book.availableStock) || 0;


            let matchesAvailability = true;


            if (availability === "true") {

                matchesAvailability =
                    availableStock > 0;

            }


            if (availability === "false") {

                matchesAvailability =
                    availableStock <= 0;

            }


            return (
                matchesSearch &&
                matchesCategory &&
                matchesAvailability
            );

        });


    /*
     * Mettre à jour les statistiques
     */
    updateStats(
        allBooks,
        filteredBooks
    );


    /*
     * Afficher les résultats
     */
    await displayBooks(
        filteredBooks
    );

}


/* =========================================================
   STATISTIQUES
   ========================================================= */

function updateStats(
    allBooksList,
    filteredBooks
) {

    /*
     * Nombre total de titres/livres dans le catalogue
     */
    const totalBooks =
        document.getElementById("totalBooks");


    /*
     * Nombre de livres actuellement disponibles
     *
     * Ici, on compte les exemplaires disponibles,
     * pas uniquement les titres.
     */
    const availableBooks =
        document.getElementById("availableBooks");


    /*
     * Nombre de résultats après filtrage
     */
    const resultCount =
        document.getElementById("resultCount");


    if (totalBooks) {

        totalBooks.textContent =
            allBooksList.length;

    }


    if (availableBooks) {

        const totalAvailable =
            allBooksList.reduce(
                (total, book) => {

                    return total +
                        (
                            Number(
                                book.availableStock
                            ) || 0
                        );

                },
                0
            );


        availableBooks.textContent =
            totalAvailable;

    }


    if (resultCount) {

        resultCount.textContent =
            filteredBooks.length;

    }

}


/* =========================================================
   AFFICHAGE DES LIVRES
   ========================================================= */

async function displayBooks(books) {

    const container =
        document.getElementById("books");


    if (!container) {
        return;
    }


    /*
     * Toujours vider le catalogue avant
     * de construire le nouveau contenu.
     */
    container.innerHTML = "";


    /*
     * Aucun résultat
     */
    if (!books.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📚
                </div>

                <h3>
                    Aucun livre disponible
                </h3>

                <p>
                    Aucun livre ne correspond
                    aux critères sélectionnés.
                </p>

            </div>
        `;

        return;
    }


    /*
     * Construire toutes les cartes.
     *
     * Elles sont injectées dans le DOM mais
     * le conteneur reste invisible.
     */
    const html =
        books.map(book => {

            const stock =
                Number(book.stock) || 0;


            const availableStock =
                Number(book.availableStock) || 0;


            const isAvailable =
                availableStock > 0;


            const cover =
                book.cover &&
                String(book.cover).trim()
                    ? book.cover
                    : "/images/default-book.png";


            return `

                <article class="book-card">

                    <!-- COUVERTURE -->

                    <div class="book-cover">

                        <img
                            src="${escapeHtml(cover)}"
                            alt="Couverture de ${escapeHtml(book.title)}"
                            loading="eager"
                        >

                    </div>


                    <!-- INFORMATIONS -->

                    <div class="book-info">


                        ${
                            book.genre
                                ? `
                                    <span class="book-genre">
                                        ${escapeHtml(book.genre)}
                                    </span>
                                `
                                : ""
                        }


                        <h3>
                            ${escapeHtml(book.title)}
                        </h3>


                        <p>
                            <strong>Auteur :</strong>
                            ${escapeHtml(
                                book.author ||
                                "Inconnu"
                            )}
                        </p>


                        <p>
                            <strong>Année :</strong>
                            ${
                                book.publishedYear ||
                                "N/A"
                            }
                        </p>


                        ${
                            book.pages
                                ? `
                                    <p>
                                        <strong>Pages :</strong>
                                        ${book.pages}
                                    </p>
                                `
                                : ""
                        }


                        ${
                            book.isbn
                                ? `
                                    <p>
                                        <strong>ISBN :</strong>
                                        ${escapeHtml(
                                            book.isbn
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        <!-- STOCK -->

                        <p class="book-stock">

                            <strong>
                                Stock :
                            </strong>

                            ${availableStock} / ${stock}

                        </p>


                        <!-- DISPONIBILITÉ -->

                        <span class="
                            book-status
                            ${
                                isAvailable
                                    ? "available"
                                    : "unavailable"
                            }
                        ">

                            ${
                                isAvailable
                                    ? `Disponible`
                                    : `Indisponible`
                            }

                        </span>


                        <!-- BOUTON DÉTAILS -->

                        <button
                            type="button"
                            class="btn book-details-btn"
                            onclick="showBookDetails(${Number(book.id)})"
                        >
                            Voir les détails
                        </button>

                    </div>

                </article>

            `;

        }).join("");


    /*
     * Insérer toutes les cartes.
     */
    container.innerHTML = html;


    /*
     * Récupérer toutes les images.
     */
    const images =
        Array.from(
            container.querySelectorAll("img")
        );


    /*
     * Attendre que TOUTES les images soient
     * chargées avant de rendre la grille visible.
     */
    await waitForImages(images);

}


/* =========================================================
   ATTENDRE LE CHARGEMENT DE TOUTES LES IMAGES
   ========================================================= */

function waitForImages(images) {

    if (!images.length) {
        return Promise.resolve();
    }


    return Promise.all(

        images.map(img => {

            /*
             * Image déjà complètement chargée
             */
            if (
                img.complete &&
                img.naturalWidth > 0
            ) {

                return Promise.resolve();

            }


            /*
             * Attendre le chargement.
             */
            return new Promise(resolve => {

                let resolved = false;


                const finish = () => {

                    if (resolved) {
                        return;
                    }

                    resolved = true;

                    resolve();

                };


                /*
                 * Chargement réussi
                 */
                img.addEventListener(
                    "load",
                    finish,
                    {
                        once: true
                    }
                );


                /*
                 * Erreur :
                 * utiliser l'image par défaut.
                 */
                img.addEventListener(
                    "error",
                    () => {

                        const defaultImage =
                            "/images/default-book.png";


                        /*
                         * Éviter une boucle infinie
                         */
                        if (
                            !img.src.endsWith(
                                defaultImage
                            )
                        ) {

                            img.src =
                                defaultImage;

                        } else {

                            finish();

                        }

                    },
                    {
                        once: true
                    }
                );


                /*
                 * Vérification supplémentaire.
                 *
                 * L'image peut avoir terminé son
                 * chargement juste avant l'ajout
                 * des événements.
                 */
                if (
                    img.complete &&
                    img.naturalWidth > 0
                ) {

                    finish();

                }

            });

        })

    );

}


/* =========================================================
   DÉTAILS DU LIVRE
   ========================================================= */

/*
 * Lorsqu'un membre clique sur
 * "Voir les détails", on ouvre la page
 *
 * /book-details.html?id=ID
 */
function showBookDetails(id) {

    if (!id) {
        return;
    }


    window.location.href =
        `/book-details.html?id=${encodeURIComponent(id)}`;

}


/* =========================================================
   ÉCHAPPEMENT HTML
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}