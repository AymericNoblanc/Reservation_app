/*document.getElementById("forgot-password-link").addEventListener("click", (e) => {
    e.preventDefault(); // Empêche le comportement par défaut
    //alert("Lien de réinitialisation envoyé à votre email.");
})*/

document.getElementById('login-form').addEventListener('submit', async (event) => {
    try{
        event.preventDefault(); // Empêche la soumission classique du formulaire

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = "/" + result.domaine; // Redirige vers la page d'accueil (ou autre)
            } else {
                if (result.message === "Invalid password"){
                    document.getElementById('error-message').innerText = "Mot de passe incorrect";
                }
                if (result.message === "User not found"){
                    document.getElementById('error-message').innerText = "Utilisateur non trouvé";
                }
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
    }
});


document.addEventListener('DOMContentLoaded', function () {
    try{
        const emailInput = document.getElementById('email');
        const signupLink = document.getElementById('signup-link');

        signupLink.addEventListener('click', function (event) {
            const email = emailInput.value;
            if (email) {
                signupLink.href = `/signup/?email=${encodeURIComponent(email)}`;
            } else {
                signupLink.href = '/signup/';
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
    }
});