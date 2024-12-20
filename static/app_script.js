const BASE_URL = window.location.href;

let switchSiteSelected = null;

let User = null;

let sitesData = null;
let usersData = null;
let reservationData = null;
let weekReservationData = [{date: ""}];

const weekLimit = 12
let currentCreateWeek = 0;
let currentCreateHistoryTemplate = 1;
let currentCreateHistoryFetch = 2;
let actualMondayDate = new Date();

const RATIO = 748;

// API call :

function URLformator(str) {
  const lastSlashIndex = str.lastIndexOf('/');
  const secondLastSlashIndex = str.lastIndexOf('/', lastSlashIndex - 1);
  if (secondLastSlashIndex !== -1) {
    return str.substring(0, secondLastSlashIndex + 1); // Inclut le dernier '/'
  }
  return str; // Si aucun '/' n'est trouvé, retourne la chaîne entière
}

async function getSites() {
  if (sitesData) {
    // Si les données sont déjà récupérées, les retourner directement
    return sitesData;
  }

  try {

    sitesData = await fetch(BASE_URL + "sites"); // Appel de l'API
    sitesData = await sitesData.json();
    return sitesData;

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

async function getUserFromCookie() {
  try {

    let cookie = `; ${document.cookie}`;
    cookie = cookie.split("authToken=");
    cookie = cookie.pop().split(';').shift();

    User = await fetch(URLformator(BASE_URL) + "find-cookie/" + cookie); // Appel de l'API
    User = await User.json();

    return User[0].user_id;

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

async function getUsers() {
  if (usersData) {
    // Si les données sont déjà récupérées, les retourner directement
    return usersData;
  }

  try {
    usersData = await fetch(BASE_URL + "users"); // Appel de l'API
    usersData = await usersData.json();
    User = await getUserFromCookie()

    User = usersData.find(user => user.id === User);

    selectUserCircle.style.backgroundColor = User.color;
    selectUserCircle.textContent = User.initial;
    selectUserCircle.style.position = 'relative';
    selectUserCircle.style.marginLeft = '11%';

    return usersData;

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

async function getWeekReservation(date) {
  try {
    const response = await fetch(BASE_URL + "reservations/week?start_date=" + date);
    const data = await response.json();

    reservationData = { ...reservationData };

    for (const key in data) {
      const newKey = key + date; // Add a suffix to the new key
      reservationData[newKey] = data[key];
    }

    reservationData = Object.values({ ...reservationData});

    const newAPIcall = {date: date};
    weekReservationData.push(newAPIcall);

  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function createReservation(siteId, date) {
  const url = BASE_URL + "reservations";

  const body = JSON.stringify({
    user_id: User.id,
    site_id: siteId,
    date: date
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });

    const data = await response.json();

    const newReservation = {
      user_id: User.id,
      date: date,
      site_id: siteId
    };

    reservationData.push(newReservation);

    console.log('Réservation créée:', data);
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
  }
}

async function deleteReservation(siteId, date) {
  const url = BASE_URL + "reservations";

  const body = JSON.stringify({
    user_id: User.id,
    site_id: siteId,
    date: date
  });

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });

    const data = await response.json();

    const userIdToRemove = User.id;
    const dateToRemove = date;

    reservationData = reservationData.filter(reservation =>
        !(reservation.user_id === userIdToRemove && reservation.date === dateToRemove && reservation.site_id === siteId)
    )

    console.log('Réservation supprimée:', data);
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation:', error);
  }
}

async function changeUserData(firstname, lastname, color, initial) {
  const url = BASE_URL + "updateUserData";

  const body = JSON.stringify({
    user_id: User.id,
    firstname: firstname,
    lastname: lastname,
    color: color,
    initial: initial
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });

    const data = await response.json();

    User.firstname = firstname;
    User.lastname = lastname;
    User.color = color;
    User.initial = initial;

    console.log('Utilisateur mis à jour:', data);
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
  }
}

async function logoutUser() {
  try {
    const response = await fetch('/logout', {
      method: 'POST',
      credentials: 'include'  // Inclure les cookies pour cette requête
    })

    const data = await response.json();

    if (data.message === "Déconnexion réussie") {
      // Si la déconnexion est réussie, rediriger l'utilisateur vers la page de login
      window.location.href = '/login';  // Rediriger vers la page de login
    } else {
      console.log('Erreur de déconnexion');
    }

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

// Gestion du travailleur sélectionné

function closeProfileClick() {

  profileRectangle.style.left = `${(profileRectangle.getBoundingClientRect().left)}px`;

  const overlay = document.getElementById('overlayProfile');
  overlay.remove();
  const container = document.querySelector('.profile_rectangle');

// Supprimer tous les enfants du conteneur
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  profileRectangle.style.boxShadow = '0 0 0 0';


  setTimeout(() => {
    profileRectangle.style.left = `${(selectUserCircle.offsetLeft + 20)}px`;
    profileRectangle.style.top = `${(selectUserCircle.offsetTop + 20)}px`;
    profileRectangle.style.width = `${0 * 100 / RATIO}vh`;
    profileRectangle.style.height = `${0 * 100 / RATIO}vh`;
  }, 1)

  setTimeout(() => {
    profileRectangle.remove();
  }, 300)
}

let profileRectangle
let selectUserCircle = document.querySelector(".selectUser");
selectUserCircle.addEventListener("click", () => {

  profileRectangle = document.createElement("div");
  profileRectangle.classList.add("profile_rectangle");

  profileRectangle.style.left = `${(selectUserCircle.offsetLeft + 20)}px`;
  profileRectangle.style.top = `${(selectUserCircle.offsetTop + 20)}px`;

  const overlay = document.createElement("div");
  overlay.id = 'overlayProfile';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'all';
  overlay.style.backgroundColor = 'transparent';
  overlay.style.display = 'block';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.zIndex = '10';

  overlay.addEventListener('click', null);
  document.body.insertBefore(overlay, document.body.firstChild);

  document.body.insertBefore(profileRectangle, document.body.firstChild);

  setTimeout(() => {
    profileRectangle.style.height = `${550 * 100 / RATIO}vh`;
    profileRectangle.style.width = `${320 * 100 / RATIO}vh`;

    const rectangleTop = document.querySelector('.big_rectangle').offsetTop - (135 * window.innerHeight / 844);
    const rectangleLeft = document.querySelector('.big_rectangle').offsetLeft;

    profileRectangle.style.top = `${rectangleTop}px`;
    profileRectangle.style.left = `${rectangleLeft}px`;

  }, 1)

  setTimeout(() => {
    createProfile();
    profileRectangle.style.left = 'auto';
  }, 250)

});

function createProfile() {
  // Créer l'en-tête
  const profileHeader = document.createElement('div');
  profileHeader.className = 'profile-header';

  const profileTitle = document.createElement('span');
  profileTitle.className = 'profile-title';
  profileTitle.textContent = 'Profile';

  const profileAvatar = document.createElement('div');
  profileAvatar.className = 'profile-avatar';
  profileAvatar.textContent = User.initial; // Initiales par défaut
  profileAvatar.style.backgroundColor = User.color;

  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.textContent = '✕';
  closeButton.addEventListener('click', closeProfileClick);

// Ajouter les éléments à l'en-tête
  profileHeader.appendChild(profileTitle);
  profileHeader.appendChild(profileAvatar);
  profileHeader.appendChild(closeButton);

// Créer le formulaire
  const profileForm = document.createElement('div');
  profileForm.className = 'profile-form';

// Fonction pour créer un groupe de saisie
  const createInputGroup = (labelText, id, value, readonly = false, maxLength = null) => {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    input.value = value;
    if (readonly) input.readOnly = true;
    if (maxLength) input.maxLength = maxLength;

    inputGroup.appendChild(label);
    inputGroup.appendChild(input);

    return inputGroup;
  };

// Ajouter les champs de saisie
  const initialsGroup = createInputGroup('Initiales', 'initials', User.initial, false, 2)
  createColorSlider(initialsGroup)
  profileForm.appendChild(initialsGroup);
  profileForm.appendChild(createInputGroup('Prénom', 'first-name', User.firstname));
  profileForm.appendChild(createInputGroup('Nom de famille', 'last-name', User.lastname));
  profileForm.appendChild(createInputGroup('Email', 'email', User.email, true));

// Créer la section d'actions
  const profileActions = document.createElement('div');
  profileActions.className = 'profile-actions';

  const logoutButton = document.createElement('button');
  logoutButton.className = 'logout-button';
  logoutButton.textContent = 'Se déconnecter';
  logoutButton.addEventListener('click', () => {
    logoutUser();
  });

  const saveButton = document.createElement('button');
  saveButton.className = 'save-button';
  saveButton.textContent = 'Enregistrer';
  saveButton.addEventListener('click', () => {
    const hue = parseInt(profileForm.querySelector('#hue-slider').value);
    const luminosity = profileForm.querySelector('#luminosity-slider').value;
    changeUserData(
        profileForm.querySelector('#first-name').value,
        profileForm.querySelector('#last-name').value,
        `hsl(${(hue + 60)}, 70%, ${luminosity}%)`,
        profileForm.querySelector('#initials').value
    );
    document.querySelectorAll("#activeUser").forEach(element => {
      element.style.backgroundColor = `hsl(${(hue + 60)}, 70%, ${luminosity}%)`;
      element.textContent = profileForm.querySelector('#initials').value
      const elementParentDiv = element.parentElement.querySelector('.lookup_list_name')
      if (elementParentDiv) elementParentDiv.textContent = profileForm.querySelector('#first-name').value + ' ' + profileForm.querySelector('#last-name').value;
    });
    selectUserCircle.style.backgroundColor = `hsl(${(hue + 60)}, 70%, ${luminosity}%)`;
    selectUserCircle.textContent = profileForm.querySelector('#initials').value;
    closeProfileClick();
  });

// Ajouter les boutons à la section d'actions
  profileActions.appendChild(logoutButton);
  profileActions.appendChild(saveButton);

// Ajouter tout au conteneur principal
  profileRectangle.appendChild(profileHeader);
  profileRectangle.appendChild(profileForm);
  profileRectangle.appendChild(profileActions);

  const initialsInput = document.getElementById('initials');

// Fonction pour mettre à jour les initiales de l'avatar
  function updateAvatarInitials() {
    profileAvatar.textContent = initialsInput.value.toUpperCase(); // Mettre à jour le texte de l'avatar
  }
  initialsInput.addEventListener('input', updateAvatarInitials);
  updateAvatarInitials(); // Initialiser l'avatar avec la valeur actuelle des initiales au chargement

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

  const firstNameInput = document.querySelector('#first-name');
  const lastNameInput = document.querySelector('#last-name');
  addValidation(firstNameInput);
  addValidation(lastNameInput);


}

function createColorSlider(initialsGroup) {

  const newContainer = document.createElement('div');
  while (initialsGroup.firstChild) {
    newContainer.appendChild(initialsGroup.firstChild);
  }
  initialsGroup.appendChild(newContainer);

  initialsGroup.style.display = 'flex';
  initialsGroup.style.flexDirection = 'row';
  initialsGroup.style.alignItems = 'center';


  const UserColorHSL = User.color.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);

  // Définir les constantes pour les valeurs initiales
  const HUE_INITIAL_VALUE = parseInt(UserColorHSL[1]) - 60
  const LUMINOSITY_INITIAL_VALUE = parseInt(UserColorHSL[3])

  // Sélectionner ou créer le conteneur principal
  const container = document.createElement('div');
  container.classList.add('color-picker-container');

  // Créer la barre de teinte
  const colorBar = document.createElement('div');
  colorBar.classList.add('color-bar');

  const hueSlider = document.createElement('input');
  hueSlider.type = 'range';
  hueSlider.id = 'hue-slider';
  hueSlider.min = '0';
  hueSlider.max = '300';
  hueSlider.value = HUE_INITIAL_VALUE;

  colorBar.appendChild(hueSlider);

  // Créer la barre de luminosité
  const luminosityBar = document.createElement('div');
  luminosityBar.classList.add('luminosity-bar');

  const luminositySlider = document.createElement('input');
  luminositySlider.type = 'range';
  luminositySlider.id = 'luminosity-slider';
  luminositySlider.min = '50';
  luminositySlider.max = '70';
  luminositySlider.value = LUMINOSITY_INITIAL_VALUE;

  luminosityBar.appendChild(luminositySlider);

  // Ajouter les éléments au conteneur principal
  container.appendChild(colorBar);
  container.appendChild(luminosityBar);

  // Fonction pour mettre à jour la couleur d'aperçu
  function updateColorPreview() {
    const hue = parseInt(hueSlider.value);
    const luminosity = luminositySlider.value;
    // Intègre la luminosité
    let avatar = document.body.querySelector(".profile-avatar");
    avatar.style.backgroundColor = `hsl(${(hue + 60)}, 70%, ${luminosity}%)`; // Met à jour l'aperçu
  }

  function updateLuminosityBar() {
    const hue = parseInt(hueSlider.value);
    luminosityBar.style.background = `linear-gradient(to top, hsl(${(hue + 60)}, 70%, 40%), hsl(${(hue + 60)}, 70%, 80%))`;
  }

  function updateHueSlider() {
    const luminosity = luminositySlider.value;
    colorBar.style.background = `linear-gradient(to right,
  hsl(60, 70%, ${luminosity}%),
  hsl(120, 70%, ${luminosity}%),
  hsl(180, 70%, ${luminosity}%),
  hsl(240, 70%, ${luminosity}%),
  hsl(300, 70%, ${luminosity}%),
  hsl(360, 70%, ${luminosity}%)
  )`;
  }

  // Écouteurs pour les sliders
  hueSlider.addEventListener("input", () => {
    updateColorPreview();
    updateLuminosityBar();
  });
  luminositySlider.addEventListener("input", () => {
    updateColorPreview();
    updateHueSlider();
  });

  // Initialiser la couleur

  updateLuminosityBar();
  updateHueSlider();

  initialsGroup.appendChild(container);
}

// Gestion du slide des sites

const navContainer = document.getElementById('navContainer');
function sitesSelection() {

  switchSiteSelected = sitesData[0];

  navContainer.style.width = sitesData.length * 100 * 100 / RATIO + 'vh';

  const siteSlideAnimation = document.querySelector('.siteSlideAnimation');
  siteSlideAnimation.style.width = `${94 * 100 / RATIO}vh`; // 100 - 6 pour la marge

  sitesData.slice().reverse().forEach(function (site, index) {
    index = sitesData.length - 1 - index;
    const siteDiv = document.createElement("div");
    siteDiv.classList.add("sites");
    siteDiv.id = index;
    siteDiv.textContent = site.display_name;
    if (index === 0){
      siteDiv.classList.add('active');
      siteSlideAnimation.style.marginLeft = `${3 * 100 / RATIO}vh`;
    }
    navContainer.insertBefore(siteDiv, navContainer.firstChild);
  });

  // Gérer les clics sur les autres éléments
  document.querySelectorAll('.sites').forEach(site => {
    site.addEventListener('click', function() {
      if (this.classList.contains('active')) return;

      // Supprimer la classe active de tous les autres éléments
      document.querySelectorAll('.sites').forEach(s => s.classList.remove('active'));

      // Ajouter la classe active à l'élément sélectionné
      this.classList.add('active');

      // Déplacer l'animation
      const marginLeft = this.id * 100 + 3; // Valeur "left" à partir de l'attribut data target
      siteSlideAnimation.style.marginLeft = marginLeft * 100 / RATIO + 'vh';
      siteSlideAnimation.style.width = `${94 * 100 / RATIO}vh`; // 100 - 6 pour la marge

      document.querySelectorAll('.oneWeekContainer').forEach(week => {
        if (weekReservationData.some(entry => entry.date === week.id)) {
          const allRectangle = week.querySelectorAll(".big_rectangle, .small_rectangle");
          allRectangle.forEach(rectangle => {
            rectangle.querySelector('.nbResa').remove();
            rectangle.querySelector('.lookup_list')?.remove();
            rectangle.removeEventListener('click', lookupClick);
            rectangle.querySelectorAll('.circle').forEach(e => e.remove());
            rectangle.querySelector('.self-circle').classList.remove('self-circle-active');
          });
          fetchReservations(week);
        }
      });

      switchSiteSelected = sitesData[this.id];

    });
  });
}

// Désactivation du zoom sur mobile

document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

// Gestion du scroll entre les différentes semaines

const weekContainer = document.querySelector(".weekContainer");
function handleInfiniteScroll () {
  const endOfScrollRight = weekContainer.scrollLeft + 2 * weekContainer.clientWidth >= weekContainer.scrollWidth - 5; // Détecte la fin du scroll
  if (endOfScrollRight && currentCreateWeek < weekLimit) {
    createWeek();
  }
  const endOfScrollLeft = weekContainer.scrollLeft - weekContainer.clientWidth <= weekContainer.clientWidth * (weekLimit - currentCreateHistoryFetch); // Détecte la fin du scroll
  if (endOfScrollLeft && currentCreateHistoryFetch < weekLimit){

    currentCreateHistoryFetch += 1;

    const targetDate = new Date(actualMondayDate);
    targetDate.setDate(targetDate.getDate() - (7 * currentCreateHistoryFetch));

    const targetDateID = targetDate.getFullYear() + '-' +
        String(targetDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(targetDate.getDate()).padStart(2, '0');

    fetchReservations(weekContainer.querySelector(`.oneWeekContainer[id='${targetDateID}']`));
  }

  const scrollLeft = weekContainer.scrollLeft; // Position actuelle du scroll
  const itemWidth = weekContainer.clientWidth; // Largeur d'un élément (suppose largeur fixe)
  currentIndex = Math.round(scrollLeft / itemWidth); // Trouver l'élément le plus proche
  activeScrollIndicator()
}
weekContainer.addEventListener("scroll", handleInfiniteScroll);

let currentIndex = 0;
function scrollToIndex(index) {
  const items = document.querySelectorAll('.weekContainer > div');

  // Ajuster l'index pour rester dans les limites
  if (index < 0) index = 0;
  if (index >= items.length) index = items.length - 1;

  // Calculer la position à atteindre
  const scrollPosition = index * weekContainer.clientWidth;

  // Faire défiler de manière fluide
  weekContainer.scrollTo({
    left: scrollPosition,
    behavior: 'smooth',
  });

  currentIndex = index; // Mettre à jour l'index actuel
}

const leftScroll = document.querySelector(".indicator.left");
leftScroll.addEventListener('click', () => {
  scrollToIndex(currentIndex - 1);
  activeScrollIndicator()
});

const rightScroll = document.querySelector(".indicator.right");
rightScroll.addEventListener('click', () => {
  scrollToIndex(currentIndex + 1);
  activeScrollIndicator()
});

function activeScrollIndicator() {
  document.querySelectorAll('.indicator').forEach(element => {
    element.classList.remove('active');
  });
  if (currentIndex === currentCreateHistoryTemplate - 1) {
    document.querySelector(".history").style.opacity = "0";
    leftScroll.classList.add('active');
  } else if (currentIndex === weekLimit + currentCreateHistoryTemplate - 2) {
    rightScroll.classList.add('active');
    rightScroll.style.cursor = 'default';
  } else if (currentIndex === 0) {
    leftScroll.style.cursor = 'default';
  } else if (currentIndex < currentCreateHistoryTemplate - 1){
    document.querySelector(".history").style.opacity = "1";
    rightScroll.style.cursor = 'e-resize';
    leftScroll.style.cursor = 'w-resize';
  } else{
    document.querySelector('.indicator:not([class*=" "])').classList.add('active');
    rightScroll.style.cursor = 'e-resize';
    leftScroll.style.cursor = 'w-resize';
  }
}

const historyButton = document.querySelector(".history");
historyButton.addEventListener('click', () => {
  scrollToIndex(12);
  activeScrollIndicator()
});

// Gestion du ratio

function getViewportRatio() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = width / height;
  if (ratio <= 0.76){
    return "vertical";
  }else if(ratio > 2.3){
    return "horizontal mobile"; // Mobile en horizontal : plus large
  }else{
    return "horizontal desktop"; // Ecran d'ordinateur
  }
}

let currentAspectRatio = getViewportRatio();
window.addEventListener('resize', () => {
  const newRatio = getViewportRatio();

  if (newRatio !== currentAspectRatio) {

    const actualWeekShow = currentIndex;

    currentAspectRatio = newRatio;

    document.querySelector('.lookup_rectangle')?.remove();
    document.querySelector('.overlayLookup')?.remove();

    document.querySelectorAll('.oneWeekContainer').forEach(week => {
      if (weekReservationData.some(entry => entry.date === week.id)) {
        const allRectangle = week.querySelectorAll(".big_rectangle, .small_rectangle");
        allRectangle.forEach(rectangle => {
          rectangle.querySelector('.nbResa').remove();
          rectangle.querySelector('.lookup_list')?.remove();
          rectangle.removeEventListener('click', lookupClick);
          rectangle.querySelectorAll('.circle').forEach(e => e.remove());
          rectangle.querySelector('.self-circle').classList.remove('self-circle-active');
        });
        fetchReservations(week);
      }
    });

    weekContainer.scrollTo({
      left: actualWeekShow * weekContainer.clientWidth,
      behavior: 'instant',
    });
  }
});

// Création d'éléments

function createReservationCircle(user, rectangle) {
  const circle = document.createElement('div');
  circle.classList.add('circle'); // Ajoute la classe pour le style

  let leftPosition = rectangle.querySelectorAll(".circle").length - 1;

  if(rectangle.className.includes("big_rectangle")){
    leftPosition = leftPosition * 45 + 15;
  }else{
    leftPosition = leftPosition * 20 + 15;
  }

  // Appliquer la position gauche (left) au cercle pour le décaler
  circle.style.left = `${leftPosition * 100 / RATIO}vh`;
  circle.textContent = user.initial;

  circle.style.backgroundColor = user.color;
  if (user.id === User.id){
    circle.id = 'activeUser';
  }

  return circle;
}

function createRectangle(weekDate, dayOfWeek) {

  let dayDate = new Date(weekDate)

  const rectangle = document.createElement("div");
  if (dayOfWeek === 'Lundi'){rectangle.classList.add("big_rectangle");}else{
    if (dayOfWeek === 'Mardi'){dayDate.setDate(dayDate.getDate() + 1);} else
    if (dayOfWeek === 'Mercredi'){dayDate.setDate(dayDate.getDate() + 2);} else
    if (dayOfWeek === 'Jeudi'){dayDate.setDate(dayDate.getDate() + 3);} else
    if (dayOfWeek === 'Vendredi'){dayDate.setDate(dayDate.getDate() + 4);}
    rectangle.classList.add("small_rectangle");
  }

  const dayDateID = dayDate.getFullYear() + '-' +
      String(dayDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(dayDate.getDate()).padStart(2, '0');

  const dayElement = document.createElement("p");
  dayElement.classList.add("dayOfTheWeek");
  dayElement.textContent = dayOfWeek;
  rectangle.appendChild(dayElement);

  const dateElement = document.createElement("p");
  dateElement.classList.add("dayNum");
  dateElement.textContent = `${dayDateID.split("-")[2]}/${dayDateID.split("-")[1]}`;
  rectangle.appendChild(dateElement);

  const checkCircle = document.createElement('div');
  checkCircle.classList.add('self-circle');
  rectangle.appendChild(checkCircle);
  if (dayDate < new Date().setHours(0, 0, 0, 0)){
    const checkCircleOld = document.createElement('div');
    checkCircleOld.classList.add('self-circle-old');
    rectangle.appendChild(checkCircleOld);
  }else{
    checkCircle.addEventListener('click', checkCircleClick);
  }

  rectangle.id = dayDateID;

  return rectangle;
}

function createNumResa(rectangle, resaRectangle) {
  const nbResa = document.createElement('div');
  nbResa.classList.add('nbResa');
  nbResa.classList.add('circle');

  nbResa.textContent = resaRectangle.length;

  if (resaRectangle.length > 99){
    nbResa.style.width = `${35 * 100 / RATIO}vh`;
    nbResa.style.borderRadius = '30%';
    nbResa.style.right = `${7 * 100 / RATIO}vh`;
  }

  rectangle.appendChild(nbResa);
}

// Gestion de l'ajout/enlevage d'une réservation

let lookupRectangle;
function lookupRectangleClick() {

  const overlay = document.getElementById('overlayLookup');
  overlay.remove();

  const formerRectangle = weekContainer.querySelector(`[id='${lookupRectangle.id}'].small_rectangle, [id='${lookupRectangle.id}'].big_rectangle`);
  lookupRectangle.style.boxShadow = '0 0 0 0';

  const jour = lookupRectangle.querySelector(".dayOfTheWeek");
  jour.style.animation = 'none';
  jour.offsetHeight;
  jour.style.animation = 'growDayOfTheWeek 0.3s ease-in reverse';

  const jourNum = lookupRectangle.querySelector(".dayNum");
  jourNum.style.animation = 'none';
  jourNum.offsetHeight;
  jourNum.style.animation = 'growDayNum 0.3s ease-in reverse';

  lookupRectangle.style.left = `${formerRectangle.getBoundingClientRect().left}px`;
  lookupRectangle.style.top = `${formerRectangle.getBoundingClientRect().top}px`;
  lookupRectangle.style.width = `${formerRectangle.getBoundingClientRect().width}px`;
  lookupRectangle.style.height = `${formerRectangle.getBoundingClientRect().height}px`;

  const lookupRectangleNames = lookupRectangle.querySelectorAll(".lookup_list_name");
  lookupRectangleNames.forEach(name => {
    name.style.animation = 'none';
    name.offsetHeight;
    name.style.animation = 'growlookup_list_name 0.3s ease-in reverse';
    name.style.color = 'rgb(71, 71, 71, 0)';
  })

  const lookupRectangleList = lookupRectangle.querySelector(".lookup_list");
  lookupRectangleList.style.marginTop = "22%";

  const lookupRectangleCircle = lookupRectangle.querySelectorAll(".circle");
  lookupRectangleCircle.forEach(circle => {
    circle.remove();
  })


  setTimeout(() => {
    lookupRectangle.remove();
  }, 300)
}

function lookupClick(event) {

  const boundingClientRect = this.getBoundingClientRect();
  const clickY = event.clientY - boundingClientRect.top;
  const clickX = event.clientX - boundingClientRect.left;// Y coordinate of the click relative to the top of the div
  const divWidth = boundingClientRect.width;

  if ((clickY < (50 * (window.innerHeight / 844))) && (clickX > divWidth - (50 * (window.innerHeight / 844)))) {
    return;
  }

  lookupRectangle = document.createElement("div");
  lookupRectangle.classList.add("lookup_rectangle");
  lookupRectangle.classList.add(this.className.split(' ')[0]);

  // Créer le jour de la semaine
  const jour = document.createElement("div");
  jour.classList.add("dayOfTheWeek");
  jour.textContent = this.querySelector(".dayOfTheWeek").textContent;
  jour.style.animation = 'growDayOfTheWeek 0.3s ease-out'

  lookupRectangle.appendChild(jour);

  // Créer la date
  const jourNum = document.createElement("div");
  jourNum.classList.add("dayNum");
  jourNum.textContent = this.querySelector(".dayNum").textContent;
  jourNum.style.animation = 'growDayNum 0.3s ease-out'

  lookupRectangle.id = this.id;
  lookupRectangle.appendChild(jourNum);

  const overlay = document.createElement("div");
  overlay.id = 'overlayLookup';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'all';
  overlay.style.backgroundColor = 'transparent';
  overlay.style.display = 'block';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.zIndex = '10';

  overlay.addEventListener('click', lookupRectangleClick);
  document.body.insertBefore(overlay, document.body.firstChild);

  lookupRectangle.addEventListener('click', lookupRectangleClick);
  document.body.appendChild(lookupRectangle);

  lookupRectangle.style.position = 'absolute';
  lookupRectangle.style.left = `${boundingClientRect.left}px`;
  lookupRectangle.style.top = `${boundingClientRect.top}px`;
  lookupRectangle.style.width = `${boundingClientRect.width}px`;
  lookupRectangle.style.height = `${boundingClientRect.height}px`;

  const reservationListDiv = document.createElement('div');
  reservationListDiv.classList.add('lookup_list');
  reservationListDiv.style.marginTop = "22%";

  lookupRectangle.appendChild(reservationListDiv);

  const resaRectangle = reservationData.filter(reservation => reservation.date === lookupRectangle.id && reservation.site_id === switchSiteSelected.id);

  createNumResa(lookupRectangle, resaRectangle);

  resaRectangle.forEach(reservation => {

    let container = document.createElement('div');
    container.classList.add('lookup_list_element');

    let containerCircle = document.createElement('div');

    // Créer un div pour le cercle
    let circle = createReservationCircle(usersData.find(user => user.id === reservation.user_id), lookupRectangle);

    let reservationName = document.createElement('div');
    reservationName.classList.add('lookup_list_name');
    reservationName.textContent = usersData.find(user => user.id === reservation.user_id).firstname + ' ' + usersData.find(user => user.id === reservation.user_id).lastname;
    reservationName.style.animation = 'growlookup_list_name 0.3s ease-out';

    containerCircle.style.width = '20%';
    containerCircle.appendChild(circle);
    container.appendChild(containerCircle);
    reservationName.style.width = '80%;';
    container.appendChild(reservationName);
    // Ajouter le cercle au rectangle
    reservationListDiv.appendChild(container);
  })

  setTimeout(() => {

    lookupRectangle.style.height = `${400 * 100 / RATIO}vh`;
    lookupRectangle.style.width = `${320 * 100 / RATIO}vh`;

    const rectangleTop = document.querySelector('.big_rectangle').offsetTop + (19 * window.innerHeight / 844);
    const rectangleLeft = document.querySelector('.big_rectangle').offsetLeft;

    if (this.querySelector(".dayOfTheWeek").textContent === 'Lundi') {
      lookupRectangle.style.top = `${rectangleTop}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Mardi') {
      lookupRectangle.style.top = `${rectangleTop}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Mercredi') {
      lookupRectangle.style.left = `${rectangleLeft}px`; // Adjust left position
      lookupRectangle.style.top = `${rectangleTop}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Jeudi') {
      lookupRectangle.style.top = `${rectangleTop}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Vendredi') {
      lookupRectangle.style.left = `${rectangleLeft}px`; // Adjust left position
      lookupRectangle.style.top = `${rectangleTop}px`; // Adjust left position
    }

    reservationListDiv.style.marginTop = "28%";

    jour.style.fontSize = `${32 * 100 / RATIO}vh`;
    jour.style.marginLeft = `${20 * 100 / RATIO}vh`;

    jourNum.style.fontSize = `${20 * 100 / RATIO}vh`;
    jourNum.style.marginTop = `${52 * 100 / RATIO}vh`;
    jourNum.style.marginLeft = `${35 * 100 / RATIO}vh`;

    const elements = reservationListDiv.querySelectorAll(".lookup_list_element");
    elements.forEach(element => {

      const circle = element.querySelector('.circle');
      circle.style.position = 'relative';
      circle.style.left = `${15 * 100 / RATIO}vh`;
      circle.style.bottom = `${0 * 100 / RATIO}vh`;

      const reservationName = element.querySelector('.lookup_list_name');
      reservationName.style.color = 'rgb(71, 71, 71)';

    });

  }, 1)

  setTimeout(() => {
    lookupRectangle.style.left = 'auto';
  }, 300000)
}

async function checkCircleClick(event) {
  event.stopPropagation();
  event.currentTarget.classList.toggle('self-circle-active');

  const site = sitesData.find(site => site.name === switchSiteSelected.name);

  let parentDiv = this.parentElement;

  if (this.classList.contains('self-circle-active')) {
    await createReservation(site.id, parentDiv.id);
  } else {
    await deleteReservation(site.id, parentDiv.id);
  }

  parentDiv = parentDiv.parentElement

  parentDiv.querySelectorAll('.nbResa').forEach(e => e.remove());
  parentDiv.querySelectorAll('.lookup_list')?.forEach(e => e.remove());
  Array.from(parentDiv.children).forEach(child => {
    child.removeEventListener('click', lookupClick);
  });
  parentDiv.querySelectorAll('.circle').forEach(e => e.remove());
  parentDiv.querySelectorAll('.self-circle').forEach(e => e.classList.remove('self-circle-active'));

  fetchReservations(parentDiv);

}

// Création d'une semaine

function weekTemplate (createHistory = false) {

  let weekDate = new Date(actualMondayDate)

  if (createHistory){
    weekDate.setDate(weekDate.getDate() - 7 * currentCreateHistoryTemplate);
    currentCreateHistoryTemplate += 1;
  }else{
    weekDate.setDate(weekDate.getDate() + 7 * currentCreateWeek);
    currentCreateWeek += 1;
  }

  const weekDateID = weekDate.getFullYear() + '-' +
      String(weekDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(weekDate.getDate()).padStart(2, '0');

  // Créer l'élément principal contenant la semaine et les rectangles
  const mainDiv = document.createElement("div");
  mainDiv.classList.add("oneWeekContainer");
  mainDiv.id = weekDateID

  // Créer l'élément p pour la semaine
  const weekTitle = document.createElement("p");
  weekTitle.classList.add("weekTitle");
  weekTitle.textContent = `Semaine du ${weekDateID.split("-")[2]}/${weekDateID.split("-")[1]}`;

  // Créer le conteneur principal des jours
  const daysDiv = document.createElement("div");
  daysDiv.classList.add("days");

  // Créer le grand rectangle
  const bigRectangle = createRectangle(weekDate, "Lundi");

  // Créer le conteneur pour les petits rectangles
  const smallDaysDiv = document.createElement("div");
  smallDaysDiv.classList.add("days", "small");

  // Conteneur pour la ligne du haut des petits rectangles
  const topSmallDaysDiv = document.createElement("div");
  topSmallDaysDiv.classList.add("days", "small", "top");

  // Petits rectangles dans la ligne du haut
  const smallRectangle1 = createRectangle(weekDate, "Mardi");
  const smallRectangle2 = createRectangle(weekDate, "Mercredi");

  // Ajouter les petits rectangles à la ligne du haut
  topSmallDaysDiv.appendChild(smallRectangle1);
  topSmallDaysDiv.appendChild(smallRectangle2);

  // Conteneur pour la ligne du bas des petits rectangles
  const bottomSmallDaysDiv = document.createElement("div");
  bottomSmallDaysDiv.classList.add("days", "small", "bottom");

  const smallRectangle3 = createRectangle(weekDate, "Jeudi");
  const smallRectangle4 = createRectangle(weekDate, "Vendredi");

  // Ajouter les petits rectangles à la ligne du bas
  bottomSmallDaysDiv.appendChild(smallRectangle3);
  bottomSmallDaysDiv.appendChild(smallRectangle4);

  // Ajouter la ligne du haut et du bas dans le conteneur des petits jours
  smallDaysDiv.appendChild(topSmallDaysDiv);
  smallDaysDiv.appendChild(bottomSmallDaysDiv);

  // Ajouter le grand rectangle et le conteneur des petits jours dans le conteneur des jours
  daysDiv.appendChild(bigRectangle);
  daysDiv.appendChild(smallDaysDiv);

  // Ajouter la semaine et les jours dans l'élément principal
  mainDiv.appendChild(weekTitle);
  mainDiv.appendChild(daysDiv);

  // Ajouter l'élément principal dans le container (par exemple `body')
  if (createHistory){
    weekContainer.insertBefore(mainDiv, weekContainer.firstChild);
  }else{
    weekContainer.appendChild(mainDiv);
  }

  return mainDiv;
}

async function fetchReservations(mainDiv) {
  try {
    if (!weekReservationData.some(entry => entry.date === mainDiv.id)) {
      await getWeekReservation(mainDiv.id);
    }

    const users = await getUsers();

    const allRectanglesInCreation = mainDiv.querySelectorAll(".big_rectangle, .small_rectangle");

    allRectanglesInCreation.forEach(rectangle => {
      const resaRectangle = reservationData.filter(reservation => reservation.date === rectangle.id && reservation.site_id === switchSiteSelected.id);

      createNumResa(rectangle, resaRectangle);

      if (resaRectangle.length === 0){
        rectangle.style.backgroundColor = '#FFA178';
        rectangle.style.cursor = 'default';
      }else{
        if (currentAspectRatio === 'vertical' || (currentAspectRatio === 'horizontal desktop' && rectangle.classList.contains('small_rectangle'))){
          rectangle.addEventListener('click', lookupClick);
          rectangle.style.cursor = 'pointer';
        }else{
          rectangle.style.cursor = 'default';
        }
        rectangle.style.backgroundColor = '#FFE371';
      }

      const checkCircle = rectangle.querySelector('.self-circle');
      if (reservationData.find(reservation => reservation.date === rectangle.id && reservation.user_id === User.id && reservation.site_id === switchSiteSelected.id)) {
        checkCircle.classList.add('self-circle-active');
      }

      if (currentAspectRatio === 'vertical' || (currentAspectRatio === 'horizontal desktop' && rectangle.classList.contains('small_rectangle'))) {
        let maxResa = 4;
        if (rectangle.classList.contains('big_rectangle')) {
          maxResa = 6;
        }

        const resaRectangleShow = resaRectangle.slice(0, maxResa);

        resaRectangleShow.forEach(reservation => {
          const circle = createReservationCircle(users.find(user => user.id === reservation.user_id), rectangle);

          rectangle.appendChild(circle);
        });
      }else if (currentAspectRatio === 'horizontal mobile' || (currentAspectRatio === 'horizontal desktop' && rectangle.classList.contains('big_rectangle'))) {
        const reservationListDiv = document.createElement('div');
        reservationListDiv.classList.add('lookup_list');

        rectangle.appendChild(reservationListDiv);

        const resaRectangle = reservationData.filter(reservation => reservation.date === rectangle.id && reservation.site_id === switchSiteSelected.id);

        resaRectangle.forEach(reservation => {

          let container = document.createElement('div');
          container.classList.add('lookup_list_element');

          let containerCircle = document.createElement('div');
          containerCircle.classList.add('lookup_list_container_circle');

          // Créer un div pour le cercle
          let circle = createReservationCircle(usersData.find(user => user.id === reservation.user_id), rectangle);

          let reservationName = document.createElement('div');
          reservationName.classList.add('lookup_list_name');
          reservationName.textContent = usersData.find(user => user.id === reservation.user_id).firstname + ' ' + usersData.find(user => user.id === reservation.user_id).lastname;

          containerCircle.style.width = '27%';
          containerCircle.appendChild(circle);
          container.appendChild(containerCircle);
          reservationName.style.width = '73%;';
          container.appendChild(reservationName);
          // Ajouter le cercle au rectangle
          reservationListDiv.appendChild(container);

          circle.style.position = 'relative';
          circle.style.left = `${15 * 100 / RATIO}vh`;
          circle.style.bottom = `${0 * 100 / RATIO}vh`;

          reservationName.style.color = 'rgb(71, 71, 71)';
        });

      }

    });

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

function createWeek (createHistory = false) {

  const mainDiv = weekTemplate(createHistory);

  fetchReservations(mainDiv);

}

// Démarrage de l'app

window.onload = async function () {

  actualMondayDate.setDate(actualMondayDate.getDate() + 2); // Si c'est le week end charger la semaine suivante
  actualMondayDate.setDate(actualMondayDate.getDate() - (actualMondayDate.getDay() + 6) % 7); // Trouver le lundi de la semaine

  weekTemplate();

  await getSites();
  await getUsers();

  sitesSelection();

  document.querySelectorAll('.oneWeekContainer').forEach(e => e.remove());
  currentCreateWeek = 0;

  createWeek();
  createWeek();
  createWeek();

  createWeek(true);
  createWeek(true);

  for (let i = 0; i < weekLimit-2; i++) {
    weekTemplate(true);
  }

  // Faire défiler de manière fluide
  weekContainer.scrollTo({
    left: 12 * weekContainer.clientWidth,
  });

};
