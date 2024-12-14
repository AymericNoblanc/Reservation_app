let domaine = null;
let domaineInURL = false;

document.getElementById('signup-form').addEventListener('submit', async (event) => {
    try {
        event.preventDefault(); // Empêche la soumission classique du formulaire

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        let firstname = document.getElementById('firstname').value;
        firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);
        let lastname = document.getElementById('lastname').value;
        lastname = lastname.charAt(0).toUpperCase() + lastname.slice(1);
        if (!domaineInURL) {
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
            domaineInURL = true;
        }
    } catch (error) {
        document.getElementById('error-message').innerText = error;
    }
});

// Fonction afin de ne pas que l'on puisse mettre n'importe quoi dans les noms et prénoms
const validRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' \-]+$/;

function addValidation(inputField) {
    // Corriger les valeurs invalides après la saisie (ex. copier-coller)
    inputField.addEventListener('input', function () {
        const currentValue = inputField.value;

        // Filtrer les caractères pour ne garder que ceux valides
        const filteredValue = currentValue.split('').filter(char => validRegex.test(char)).join('');

        // Trouver le premier caractère invalide
        let invalidChar = '';
        for (let char of inputField.value) {
            if (!validRegex.test(char)) {
                invalidChar = char;
                break;
            }
        }

        // Si la valeur a changé, la mettre à jour
        if (currentValue !== filteredValue) {
            inputField.value = filteredValue;
        }

        // Si un caractère invalide est trouvé, afficher un message d'erreur
        if (invalidChar) {
            inputField.setCustomValidity(`Caractère invalide: "${invalidChar}". Seuls les lettres, espaces, apostrophes et tirets sont autorisés.`);
        } else {
            inputField.setCustomValidity(''); // Réinitialiser la validité si tout est bon
        }

        // Déclencher la validation, ce qui affichera l'erreur si nécessaire
        inputField.reportValidity();
    });
}

const firstNameInput = document.querySelector('#firstname');
const lastNameInput = document.querySelector('#lastname');
addValidation(firstNameInput);
addValidation(lastNameInput);