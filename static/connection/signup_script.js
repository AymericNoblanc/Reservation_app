let domaine = null;

document.getElementById('signup-form').addEventListener('submit', async (event) => {
    try {
        event.preventDefault(); // Empêche la soumission classique du formulaire

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        let firstname = document.getElementById('firstname').value;
        firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);
        let lastname = document.getElementById('lastname').value;
        lastname = lastname.charAt(0).toUpperCase() + lastname.slice(1);
        if (domaine === null) {
            domaine = document.getElementById('domaine').value.toLowerCase();
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password, firstname, lastname, domaine})
            });

            const result = await response.json();
            if (response.ok) {
                window.location.href = "/" + result.domaine; // Redirige vers la page d'accueil (ou autre)
            } else {
                document.getElementById('error-message').innerText = result;
            }
        } catch (error) {
            document.getElementById('error-message').innerText = error;
        }
    } catch (error) {
        document.getElementById('error-message').innerText = error;
    }
});

window.addEventListener('keydown',function(e) {
    try {
        if (e.keyIdentifier === 'U+000A' || e.keyIdentifier === 'Enter' || e.keyCode === 13) {
            e.preventDefault();

            return false;
        }
    } catch (error) {
        document.getElementById('error-message').innerText = error;
    }
}, true);


document.addEventListener('DOMContentLoaded', function() {
    try{
        const domaineInput = document.getElementById('domaine');
        if (domaineInput.value.trim() !== '') {
            domaineInput.parentElement.remove();
            document.querySelector('.signup-button').style.marginTop = '10px';
            domaine = domaineInput.value;
        }
    } catch (error) {
        document.getElementById('error-message').innerText = error;
    }
});