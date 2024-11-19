document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Empêche la soumission classique du formulaire
    // Ici vous pouvez valider les champs, appeler une API, etc.
    window.location.href = "/test/app.html"; // Redirection vers la page suivante
});

document.getElementById("forgot-password-link").addEventListener("click", (e) => {
    e.preventDefault(); // Empêche le comportement par défaut
    //alert("Lien de réinitialisation envoyé à votre email.");
});