document.getElementById("forgot-password-link").addEventListener("click", (e) => {
    e.preventDefault(); // Empêche le comportement par défaut
    //alert("Lien de réinitialisation envoyé à votre email.");
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
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
            alert(result); // Affiche l'erreur
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
    }
});