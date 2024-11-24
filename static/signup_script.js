document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Empêche la soumission classique du formulaire

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const domaine = document.getElementById('domaine').value.toLowerCase();

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstname, lastname, domaine })
        });

        const result = await response.json();
        if (response.ok) {
            window.location.href = "/" + result.domaine; // Redirige vers la page d'accueil (ou autre)
        } else {
            alert(result); // Affiche l'erreur
        }
    } catch (error) {
        console.error('Erreur lors de l inscription:', error);
    }
});

window.addEventListener('keydown',function(e) {
    if (e.keyIdentifier==='U+000A' || e.keyIdentifier==='Enter' || e.keyCode===13) {
            e.preventDefault();

            return false;
    }
}, true);