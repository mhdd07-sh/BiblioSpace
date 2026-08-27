/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

const token =
    localStorage.getItem('token');

const user =
    JSON.parse(
        localStorage.getItem('user') || '{}'
    );

if (
    !token ||
    user.role !== 'admin'
) {

    window.location.href =
        '/login.html';
}


const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
};


/* =========================================================
   ELEMENTS
   ========================================================= */

const form =
    document.getElementById('editBookForm');

const message =
    document.getElementById('message');

const logout =
    document.getElementById('logout');


/* =========================================================
   ID DU LIVRE
   ========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const bookId =
    params.get('id');


if (!bookId) {

    alert(
        'Livre introuvable.'
    );

    window.location.href =
        '/admin.html';
}


/* =========================================================
   DECONNEXION
   ========================================================= */

if (logout) {

    logout.addEventListener(
        'click',
        function (event) {

            event.preventDefault();

            localStorage.clear();

            window.location.href =
                '/';
        }
    );
}


/* =========================================================
   CHARGER LE LIVRE
   ========================================================= */

async function loadBook() {

    try {

        const response =
            await fetch(
                `/api/books/${bookId}`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                'Impossible de charger le livre.'
            );
        }

        const book =
            result.book;

        /*
         * Remplissage du formulaire
         */

        document.getElementById(
            'title'
        ).value =
            book.title || '';

        document.getElementById(
            'author'
        ).value =
            book.author || '';

        document.getElementById(
            'isbn'
        ).value =
            book.isbn || '';

        document.getElementById(
            'genre'
        ).value =
            book.genre || '';

        document.getElementById(
            'pages'
        ).value =
            book.pages || '';

        document.getElementById(
            'publishedYear'
        ).value =
            book.publishedYear || '';

        document.getElementById(
            'publisher'
        ).value =
            book.publisher || '';

        document.getElementById(
            'stock'
        ).value =
            book.stock ?? 0;

        document.getElementById(
            'cover'
        ).value =
            book.cover || '';

        document.getElementById(
            'description'
        ).value =
            book.description || '';

    } catch (error) {

        console.error(error);

        message.textContent =
            error.message ||
            'Impossible de charger le livre.';

        message.classList.add(
            'error'
        );
    }
}


/* =========================================================
   ENREGISTRER LES MODIFICATIONS
   ========================================================= */

form.addEventListener(
    'submit',
    async function (event) {

        event.preventDefault();

        message.textContent =
            'Enregistrement en cours...';

        message.className =
            'message';


        const body = {

            title:
                document.getElementById(
                    'title'
                ).value.trim(),

            author:
                document.getElementById(
                    'author'
                ).value.trim(),

            isbn:
                document.getElementById(
                    'isbn'
                ).value.trim(),

            genre:
                document.getElementById(
                    'genre'
                ).value.trim(),

            pages:
                Number(
                    document.getElementById(
                        'pages'
                    ).value
                ) || 0,

            publishedYear:
                Number(
                    document.getElementById(
                        'publishedYear'
                    ).value
                ) || null,

            publisher:
                document.getElementById(
                    'publisher'
                ).value.trim(),

            stock:
                Number(
                    document.getElementById(
                        'stock'
                    ).value
                ) || 0,

            cover:
                document.getElementById(
                    'cover'
                ).value.trim(),

            description:
                document.getElementById(
                    'description'
                ).value.trim()

        };


        if (
            !body.title ||
            !body.author
        ) {

            message.textContent =
                'Le titre et l’auteur sont obligatoires.';

            message.classList.add(
                'error'
            );

            return;
        }


        try {

            const response =
                await fetch(
                    `/api/books/${bookId}`,
                    {
                        method: 'PUT',
                        headers,
                        body:
                            JSON.stringify(body)
                    }
                );

            const result =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    'Erreur lors de la modification.'
                );
            }


            message.textContent =
                '✅ Livre modifié avec succès.';

            message.classList.add(
                'success-message'
            );


            /*
             * Retour automatique vers
             * l'administration après 1 seconde.
             */

            setTimeout(
                () => {

                    window.location.href =
                        '/admin.html';

                },
                1000
            );


        } catch (error) {

            console.error(error);

            message.textContent =
                error.message ||
                'Impossible de modifier le livre.';

            message.classList.add(
                'error'
            );
        }

    }
);


/* =========================================================
   INITIALISATION
   ========================================================= */

loadBook();