document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Empêche la soumission classique du formulaire

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const domaine = document.getElementById('domaine').value;

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstname, lastname, domaine })
        });

        const result = await response.text();
        if (response.ok) {
            window.location.href = "/" + result + "/app/"; // Redirige vers la page de login
        } else {
            alert(result); // Affiche l'erreur
        }
    } catch (error) {
        console.error('Erreur lors de l inscription:', error);
    }
});