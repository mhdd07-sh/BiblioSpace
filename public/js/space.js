/* =========================================================
   BIBLIOSPACE - REDIRECTION VERS L'ESPACE UTILISATEUR
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const spaceLink = document.getElementById('spaceLink');

    if (!spaceLink) {
        return;
    }

    spaceLink.addEventListener('click', (event) => {

        event.preventDefault();

        const token = localStorage.getItem('token');
        const user = JSON.parse(
            localStorage.getItem('user') || '{}'
        );

        /* ================================================
           PAS CONNECTÉ
           ================================================ */

        if (!token) {
            window.location.href = '/login.html';
            return;
        }


        /* ================================================
           ADMIN
           ================================================ */

        if (user.role === 'admin') {
            window.location.href = '/admin.html';
            return;
        }


        /* ================================================
           MEMBRE
           ================================================ */

        window.location.href = '/dashboard.html';
    });

});