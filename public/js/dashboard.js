/* =========================================================
   AUTHENTIFICATION
========================================================= */

const token = localStorage.getItem('token');

if (!token) {

    window.location.href = '/login.html';

}


/* =========================================================
   UTILISATEUR CONNECTÉ
========================================================= */

const user =
    JSON.parse(
        localStorage.getItem('user') || '{}'
    );


/* =========================================================
   REDIRECTION SELON LE RÔLE
========================================================= */

// Si l'utilisateur est administrateur,
// il ne doit pas utiliser le dashboard membre.

if (user.role === 'admin') {

    window.location.href = '/admin.html';

}


/* =========================================================
   NOM DE L'UTILISATEUR
========================================================= */

const userName =
    document.getElementById('userName');

if (userName) {

    userName.textContent =
        user.first_name || 'Utilisateur';

}


/* =========================================================
   DÉCONNEXION
========================================================= */

const logout =
    document.getElementById('logout');

if (logout) {

    logout.addEventListener(
        'click',
        event => {

            event.preventDefault();

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            window.location.href = '/';

        }
    );

}


/* =========================================================
   CHARGEMENT DU DASHBOARD MEMBRE
========================================================= */

async function loadDashboard() {

    // Sécurité supplémentaire :
    // un admin ne doit jamais charger les données membre.

    if (user.role === 'admin') {
        return;
    }


    try {

        const response =
            await fetch(
                '/api/loans/my',
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        /* =================================================
           TOKEN EXPIRÉ / INVALIDE
        ================================================= */

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            window.location.href =
                '/login.html';

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                'Impossible de charger les emprunts.'
            );

        }


        const data =
            Array.isArray(result.data)
                ? result.data
                : [];


        /* =================================================
           CALCUL DES STATISTIQUES
        ================================================= */

        const active =
            data.filter(
                loan =>
                    loan.effective_status ===
                    'EN_COURS'
            ).length;


        const late =
            data.filter(
                loan =>
                    loan.effective_status ===
                    'EN_RETARD'
            ).length;


        const returned =
            data.filter(
                loan =>
                    loan.effective_status ===
                    'RETOURNE'
            ).length;


        const total =
            data.length;


        /* =================================================
           AFFICHAGE DES COMPTEURS
        ================================================= */

        setText(
            'mActive',
            active
        );

        setText(
            'mLate',
            late
        );

        setText(
            'mReturned',
            returned
        );

        setText(
            'mTotal',
            total
        );


        /* =================================================
           AFFICHAGE DU TABLEAU
        ================================================= */

        const body =
            document.getElementById(
                'loansBody'
            );


        if (!body) {
            return;
        }


        if (data.length === 0) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-table"
                    >
                        📚 Aucun emprunt pour le moment.
                    </td>

                </tr>

            `;

            return;
        }


        body.innerHTML =
            data.map(
                loan => createLoanRow(loan)
            ).join('');


    } catch (error) {

        console.error(
            'Erreur dashboard :',
            error
        );


        const body =
            document.getElementById(
                'loansBody'
            );


        if (body) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-table error"
                    >
                        ❌ Impossible de charger
                        vos emprunts.
                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   CRÉATION D'UNE LIGNE
========================================================= */

function createLoanRow(loan) {

    const title =
        escapeHtml(
            loan.title ||
            'Livre inconnu'
        );


    const author =
        escapeHtml(
            loan.author ||
            'Auteur inconnu'
        );


    const borrowDate =
        formatDate(
            loan.borrow_date ||
            loan.created_at
        );


    const dueDate =
        formatDate(
            loan.due_date
        );


    const status =
        loan.effective_status ||
        'EN_COURS';


    let statusLabel =
        'En cours';


    let statusClass =
        'status-active';


    if (status === 'EN_RETARD') {

        statusLabel =
            'En retard';

        statusClass =
            'status-late';

    }
    else if (
        status === 'RETOURNE'
    ) {

        statusLabel =
            'Retourné';

        statusClass =
            'status-return';

    }


    return `

        <tr>

            <td>

                <strong>
                    ${title}
                </strong>

                <br>

                <small>
                    ${author}
                </small>

            </td>


            <td>
                ${borrowDate}
            </td>


            <td>
                ${dueDate}
            </td>


            <td>

                <span
                    class="${statusClass}"
                >
                    ${statusLabel}
                </span>

            </td>

        </tr>

    `;

}


/* =========================================================
   FORMATAGE DATE
========================================================= */

function formatDate(date) {

    if (!date) {
        return 'N/A';
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return 'N/A';

    }


    return parsed.toLocaleDateString(
        'fr-FR'
    );

}


/* =========================================================
   AFFICHAGE TEXTE
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            Number(value) || 0;

    }

}


/* =========================================================
   PROTECTION HTML
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)

        .replaceAll(
            '&',
            '&amp;'
        )

        .replaceAll(
            '<',
            '&lt;'
        )

        .replaceAll(
            '>',
            '&gt;'
        )

        .replaceAll(
            '"',
            '&quot;'
        )

        .replaceAll(
            "'",
            '&#039;'
        );

}


/* =========================================================
   LANCEMENT
========================================================= */

loadDashboard();