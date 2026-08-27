// =====================================================
// AUTHENTIFICATION - BIBLIOSPACE
// =====================================================


// =====================================================
// CONNEXION
// =====================================================

const loginForm = document.getElementById('loginForm');

if (loginForm) {

    loginForm.addEventListener('submit', async function (event) {

        event.preventDefault();

        const message = document.getElementById('message');

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            console.error('Champs de connexion introuvables.');
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        message.className = 'message';
        message.textContent = '';

        // Validation
        if (!email || !password) {

            message.textContent =
                'Veuillez remplir tous les champs.';

            message.classList.add('error');

            return;
        }

        try {

            const response = await fetch('/api/auth/login', {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })

            });


            const data = await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    'Email ou mot de passe incorrect.'
                );
            }


            // Sauvegarde du token
            localStorage.setItem(
                'token',
                data.token
            );


            // Sauvegarde de l'utilisateur
            localStorage.setItem(
                'user',
                JSON.stringify(data.user)
            );


            message.textContent =
                'Connexion réussie. Redirection...';

            message.classList.add('success');


            // Redirection selon le rôle
            setTimeout(function () {

                if (data.user.role === 'admin') {

                    window.location.href = '/admin.html';

                } else {

                    window.location.href = '/dashboard.html';

                }

            }, 500);


        } catch (error) {

            console.error(
                'Erreur de connexion :',
                error
            );

            message.textContent =
                error.message ||
                'Une erreur est survenue.';

            message.classList.add('error');

        }

    });

}



// =====================================================
// INSCRIPTION
// =====================================================

const registerForm = document.getElementById('registerForm');

if (registerForm) {

    registerForm.addEventListener('submit', async function (event) {

        event.preventDefault();


        const message =
            document.getElementById('message');


        // Récupération des champs
        const firstNameInput =
            document.getElementById('first_name');

        const lastNameInput =
            document.getElementById('last_name');

        const emailInput =
            document.getElementById('email');

        const phoneInput =
            document.getElementById('phone');

        const addressInput =
            document.getElementById('address');

        const passwordInput =
            document.getElementById('password');

        const confirmInput =
            document.getElementById('confirm');


        // Vérification des champs
        if (
            !firstNameInput ||
            !lastNameInput ||
            !emailInput ||
            !passwordInput ||
            !confirmInput
        ) {

            console.error(
                'Un ou plusieurs champs sont introuvables.'
            );

            message.textContent =
                'Erreur dans le formulaire.';

            message.className =
                'message error';

            return;
        }


        // Valeurs
        const firstName =
            firstNameInput.value.trim();

        const lastName =
            lastNameInput.value.trim();

        const email =
            emailInput.value.trim().toLowerCase();

        const phone =
            phoneInput
                ? phoneInput.value.trim()
                : '';

        const address =
            addressInput
                ? addressInput.value.trim()
                : '';


        /*
         * IMPORTANT :
         * Ne pas utiliser trim() sur les mots de passe.
         */
        const password =
            passwordInput.value;

        const confirmPassword =
            confirmInput.value;


        message.className = 'message';
        message.textContent = '';


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            message.textContent =
                'Veuillez remplir tous les champs obligatoires.';

            message.classList.add('error');

            return;
        }


        // Validation email
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(email)) {

            message.textContent =
                'Veuillez saisir une adresse email valide.';

            message.classList.add('error');

            return;
        }


        // Longueur du mot de passe
        if (password.length < 6) {

            message.textContent =
                'Le mot de passe doit contenir au moins 6 caractères.';

            message.classList.add('error');

            return;
        }


        // =================================================
        // COMPARAISON
        // =================================================

        console.log(
            'Mot de passe :',
            password.length,
            'caractères'
        );

        console.log(
            'Confirmation :',
            confirmPassword.length,
            'caractères'
        );

        console.log(
            'Correspondance :',
            password === confirmPassword
        );


        if (password !== confirmPassword) {

            message.textContent =
                'Les mots de passe ne correspondent pas.';

            message.classList.add('error');


            passwordInput.classList.add(
                'input-error'
            );

            confirmInput.classList.add(
                'input-error'
            );

            return;
        }


        // Les mots de passe sont corrects
        passwordInput.classList.remove(
            'input-error'
        );

        confirmInput.classList.remove(
            'input-error'
        );


        // =================================================
        // ENVOI AU SERVEUR
        // =================================================

        try {

            message.textContent =
                'Création de votre compte...';

            message.className =
                'message';


            const response =
                await fetch('/api/auth/register', {

                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({

                        first_name: firstName,

                        last_name: lastName,

                        email: email,

                        password: password,

                        phone: phone,

                        address: address

                    })

                });


            const data =
                await response.json();


            console.log(
                'Réponse du serveur :',
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    'Impossible de créer le compte.'
                );

            }


            // =================================================
            // SUCCÈS
            // =================================================

            message.textContent =
                'Compte créé avec succès !';

            message.className =
                'message success';


            registerForm.reset();


            setTimeout(function () {

                window.location.href =
                    '/login.html';

            }, 1200);


        } catch (error) {

            console.error(
                'Erreur lors de l’inscription :',
                error
            );


            message.textContent =
                error.message ||
                'Une erreur est survenue lors de la création du compte.';

            message.className =
                'message error';

        }

    });

}
