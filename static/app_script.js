const BASE_URL = window.location.href;

let switchSiteSelected = null;

let User = null;

let sitesData = null;
let usersData = null;
let reservationData = null;

const weekLimit = 12
let currentWeek = 0;
let dayRectangle = new Date();

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

    return usersData;

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

async function getWeekReservation(siteId, date) {
  try {
    const response = await fetch(BASE_URL + "reservations/site/" + siteId + "/week?start_date=" + date);
    const data = await response.json();

    reservationData = { ...reservationData };

    for (const key in data) {
      const newKey = key + date; // Add a suffix to the new key
      reservationData[newKey] = data[key];
    }

    reservationData = Object.values({ ...reservationData});



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
      date: date
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
        !(reservation.user_id === userIdToRemove && reservation.date === dateToRemove)
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

  const overlay = document.getElementById('overlayProfile');
  overlay.remove();
  const container = document.querySelector('.profile_rectangle');

// Supprimer tous les enfants du conteneur
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  profileRectangle.style.boxShadow = '0 0 0 0';

  profileRectangle.style.left = `${selectUserCircle.getBoundingClientRect().left + 20}px`;
  profileRectangle.style.top = `${selectUserCircle.getBoundingClientRect().top + 20}px`;
  profileRectangle.style.width = "0px";
  profileRectangle.style.height = "0px";


  setTimeout(() => {
    profileRectangle.remove();
  }, 300)
}

let profileRectangle

let selectUserCircle = document.getElementById("selectUser");
selectUserCircle.addEventListener("click", () => {

  profileRectangle = document.createElement("div");
  profileRectangle.classList.add("profile_rectangle");

  profileRectangle.style.left = `${selectUserCircle.getBoundingClientRect().left + 20}px`;
  profileRectangle.style.top = `${selectUserCircle.getBoundingClientRect().top + 20}px`;

  const overlay = document.createElement("div");
  overlay.id = 'overlayProfile';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'all';
  overlay.style.backgroundColor = 'transparent';
  overlay.style.display = 'block';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';

  overlay.addEventListener('click', null);
  document.body.appendChild(overlay);

  document.body.appendChild(profileRectangle);

  setTimeout(() => {
    profileRectangle.style.height = '550px';
    profileRectangle.style.width = '320px';

    profileRectangle.style.top = '30px';
    profileRectangle.style.left = '35px';

  }, 1)

  setTimeout(() => {
    createProfile();
  }, 200)

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

// Ajouter un écouteur d'événement pour l'input des initiales
  initialsInput.addEventListener('input', updateAvatarInitials);

// Initialiser l'avatar avec la valeur actuelle des initiales au chargement
  updateAvatarInitials();

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

  navContainer.style.width = sitesData.length * 100 + 'px';

  const animation = document.querySelector('.animation');
  animation.style.width = 100 - 6 + 'px'; 

  sitesData.slice().reverse().forEach(function (site, index) {
    index = sitesData.length - 1 - index;
    const siteDiv = document.createElement("div");
    siteDiv.classList.add("sites");
    siteDiv.id = index;
    siteDiv.textContent = site.display_name;
    if (index === 0){
      siteDiv.classList.add('active');
      animation.style.left = siteDiv.id + 'px';
    }
    navContainer.insertBefore(siteDiv, navContainer.firstChild);
  });
  
  // Gérer les clics sur les autres éléments
  document.querySelectorAll('.sites').forEach(site => {
    site.addEventListener('click', function() {
      // Supprimer la classe active de tous les autres éléments
      document.querySelectorAll('.sites').forEach(s => s.classList.remove('active'));

      // Ajouter la classe active à l'élément sélectionné
      this.classList.add('active');

      // Déplacer l'animation
      const targetLeft = this.id * 100; // Valeur "left" à partir de l'attribut data target
      animation.style.left = targetLeft + 'px';
      animation.style.width = 100 - 6 + 'px'; // Largeur de l'élément sélectionné (enlever les marges)

      document.querySelectorAll('.main').forEach(e => e.remove());
      reservationData = null;

      currentWeek = 0;
      dayRectangle = new Date();

      switchSiteSelected = sitesData[this.id];

      weekContainer.scrollLeft = 0;
      createWeek();
      createWeek();
      createWeek();   
    
    });
  });
}

// Désactivation du zoom sur mobile

document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

// Gestion du scroll entre les différentes semaines

const weekContainer = document.getElementById("weekSelector");
function handleInfiniteScroll () {
  const endOfScroll =
  weekContainer.scrollLeft + 2 * weekContainer.clientWidth >= weekContainer.scrollWidth - 5; // Détecte la fin du scroll

  if (endOfScroll && currentWeek < weekLimit) {
    createWeek();
  }

  if (currentWeek === weekLimit) {
    removeInfiniteScroll();
  }

  const scrollLeft = weekContainer.scrollLeft; // Position actuelle du scroll
  const itemWidth = weekContainer.clientWidth; // Largeur d'un élément (suppose largeur fixe)
  currentIndex = Math.round(scrollLeft / itemWidth); // Trouver l'élément le plus proche
}
weekContainer.addEventListener("scroll", handleInfiniteScroll);

function removeInfiniteScroll () {
  window.removeEventListener("scroll", handleInfiniteScroll);
}

let currentIndex = 0;

function scrollToIndex(index) {
  const items = document.querySelectorAll('.container > div');

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

const leftButton = document.body.querySelector('.scroll-button-left');
leftButton.addEventListener('click', () => {
  scrollToIndex(currentIndex - 1);
});

const rightButton = document.body.querySelector('.scroll-button-right');
rightButton.addEventListener('click', () => {
  scrollToIndex(currentIndex + 1);
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
  circle.style.left = `${leftPosition}px`;
  circle.textContent = user.initial;

  circle.style.backgroundColor = user.color;
  if (user.id === User.id){
    circle.id = 'activeUser';
  }

  return circle;
}

function createRectangle(classes, dayOfWeek) {

  const date = dayRectangle.toLocaleString('fr-Fr', { month: "numeric", day: "numeric" });
  const formattedDate = dayRectangle.getFullYear() + '-' +
      String(dayRectangle.getMonth() + 1).padStart(2, '0') + '-' +
      String(dayRectangle.getDate()).padStart(2, '0');

  const rectangle = document.createElement("div");
  classes.forEach(cls => rectangle.classList.add(cls));

  const dayElement = document.createElement("p");
  dayElement.classList.add("dayOfTheWeek");
  dayElement.textContent = dayOfWeek;
  rectangle.appendChild(dayElement);

  const dateElement = document.createElement("p");
  dateElement.classList.add("dayNum");
  dateElement.textContent = date;
  rectangle.appendChild(dateElement);

  const checkCircle = document.createElement('div');
  checkCircle.classList.add('self-circle');
  checkCircle.addEventListener('click', checkCircleClick);

  rectangle.appendChild(checkCircle);

  rectangle.id = formattedDate;

  dayRectangle.setDate(dayRectangle.getDate()+1);

  return rectangle;
}

function createNumResa(rectangle, resaRectangle) {
  const nbResa = document.createElement('div');
  nbResa.classList.add('nbResa');
  nbResa.classList.add('circle');

  nbResa.textContent = resaRectangle.length;

  if (resaRectangle.length > 99){
    nbResa.style.width = '35px';
    nbResa.style.borderRadius = '30%';
    nbResa.style.right = '7px';
  }

  rectangle.appendChild(nbResa);
}

// Gestion de l'ajout/enlevage d'une réservation

let lookupRectangle;
function lookupRectangleClick() {

  const overlay = document.getElementById('overlayLookup');
  overlay.remove();

  const formerRectangle = weekContainer.querySelector(`[id='${lookupRectangle.id}']`);

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

  const rect = this.getBoundingClientRect();
  const clickY = event.clientY - rect.top;
  const clickX = event.clientX - rect.left;// Y coordinate of the click relative to the top of the div
  const divWidth = rect.width;

  if ((clickY < 50) && (clickX > divWidth - 50)) {
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
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';

  overlay.addEventListener('click', lookupRectangleClick);
  document.body.appendChild(overlay);

  lookupRectangle.addEventListener('click', lookupRectangleClick);
  document.body.appendChild(lookupRectangle);

  lookupRectangle.style.position = 'absolute';
  lookupRectangle.style.left = `${this.getBoundingClientRect().left}px`;
  lookupRectangle.style.top = `${this.getBoundingClientRect().top}px`;
  lookupRectangle.style.width = `${this.getBoundingClientRect().width}px`;
  lookupRectangle.style.height = `${this.getBoundingClientRect().height}px`;

  const reservationListDiv = document.createElement('div');
  reservationListDiv.classList.add('lookup_list');
  reservationListDiv.style.marginTop = "22%";

  lookupRectangle.appendChild(reservationListDiv);

  const resaRectangle = reservationData.filter(reservation => reservation.date === lookupRectangle.id);

  createNumResa(lookupRectangle, resaRectangle);

  resaRectangle.forEach(reservation => {

    let container = document.createElement('div');
    container.classList.add('lookup_list_element');

    // Créer un div pour le cercle
    let circle = createReservationCircle(usersData.find(user => user.id === reservation.user_id), lookupRectangle);

    let reservationName = document.createElement('div');
    reservationName.classList.add('lookup_list_name');
    reservationName.textContent = usersData.find(user => user.id === reservation.user_id).firstname + ' ' + usersData.find(user => user.id === reservation.user_id).lastname;
    reservationName.style.animation = 'growlookup_list_name 0.3s ease-out';

    container.appendChild(circle);
    container.appendChild(reservationName);
    // Ajouter le cercle au rectangle
    reservationListDiv.appendChild(container);
  })

  setTimeout(() => {

    lookupRectangle.style.height = '400px';
    lookupRectangle.style.width = '320px';

    lookupRectangle.style.top = '165px';
    lookupRectangle.style.left = '35px';

    reservationListDiv.style.marginTop = "28%";

    jour.style.fontSize = '32px';
    jour.style.marginLeft = '3vh';

    jourNum.style.fontSize = '20px';
    jourNum.style.marginTop = '6.5vh';
    jourNum.style.marginLeft = '5vh';

    const elements = reservationListDiv.querySelectorAll(".lookup_list_element");
    elements.forEach(element => {

      const circle = element.querySelector('.circle');
      circle.style.position = 'relative';
      circle.style.left = '15px';
      circle.style.bottom = '0px';

      const reservationName = element.querySelector('.lookup_list_name');
      reservationName.style.color = 'rgb(71, 71, 71)';

    });

  }, 1)

}

function checkCircleClick(event) {
  event.stopPropagation();
  event.currentTarget.classList.toggle('self-circle-active');

  const site = sitesData.find(site => site.name === switchSiteSelected.name);

  const parentDiv = this.parentElement;
  const numResa = parentDiv.querySelector('.nbResa');
  const listOfCircles = parentDiv.querySelectorAll('.circle');
  const circleUser = parentDiv.querySelector('#activeUser');
  let maxResa = 4;
  if (parentDiv.classList.contains('big_rectangle')){
    maxResa = 5;
  }

  if (this.classList.contains('self-circle-active')){
    // Create reservation
    createReservation(site.id, this.parentElement.id);
    numResa.textContent = parseInt(numResa.textContent) + 1;
    if (listOfCircles.length -1 < maxResa){
      const circle = createReservationCircle(User, parentDiv);
      parentDiv.appendChild(circle);
    }
  }else{
    // Delete reservation
    deleteReservation(site.id, this.parentElement.id);
    numResa.textContent = parseInt(numResa.textContent) - 1;
    if (circleUser !== null){
      listOfCircles.forEach(circle => {
        if (!circle.classList.contains('nbResa')) {
          circle.remove();
        }
      });

      const resaRectangle = reservationData.filter(reservation => reservation.date === parentDiv.id && reservation.user_id !== User.id).slice(0, maxResa);

      resaRectangle.forEach(reservation => {
        const circle = createReservationCircle(usersData.find(user => user.id === reservation.user_id), parentDiv);
        parentDiv.appendChild(circle);
      });
    }
  }
}

// Création d'une semaine

function weekTemplate (){
  currentWeek += 1;

  if (dayRectangle.getDay() === 0){
    dayRectangle.setDate(dayRectangle.getDate() +1);
  }else if (dayRectangle.getDay() === 6){
    dayRectangle.setDate(dayRectangle.getDate() +2);
  }

  dayRectangle.setDate((dayRectangle.getDate() - (dayRectangle.getDay() + 6) % 7));

  // Créer l'élément principal contenant la semaine et les rectangles
  const mainDiv = document.createElement("div");
  mainDiv.classList.add("main");

  // Créer l'élément p pour la semaine
  const weekElement = document.createElement("p");
  weekElement.classList.add("week");
  weekElement.textContent = `Semaine du ${dayRectangle.toLocaleString('fr-Fr',{month: "numeric", day: "numeric"})}`;

  // Créer le conteneur principal des jours
  const daysDiv = document.createElement("div");
  daysDiv.classList.add("days");

  // Créer le grand rectangle
  const bigRectangle = createRectangle(["big_rectangle"], "Lundi");

  // Créer le conteneur pour les petits rectangles
  const smallDaysDiv = document.createElement("div");
  smallDaysDiv.classList.add("days", "small");

  // Conteneur pour la ligne du haut des petits rectangles
  const topSmallDaysDiv = document.createElement("div");
  topSmallDaysDiv.classList.add("days", "small", "top");

  // Petits rectangles dans la ligne du haut
  const smallRectangle1 = createRectangle(["small_rectangle"], "Mardi");
  const smallRectangle2 = createRectangle(["small_rectangle"], "Mercredi");

  // Ajouter les petits rectangles à la ligne du haut
  topSmallDaysDiv.appendChild(smallRectangle1);
  topSmallDaysDiv.appendChild(smallRectangle2);

  // Conteneur pour la ligne du bas des petits rectangles
  const bottomSmallDaysDiv = document.createElement("div");
  bottomSmallDaysDiv.classList.add("days", "small", "bottom");

  const smallRectangle3 = createRectangle(["small_rectangle"], "Jeudi");
  const smallRectangle4 = createRectangle(["small_rectangle"], "Vendredi");

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
  mainDiv.appendChild(weekElement);
  mainDiv.appendChild(daysDiv);

  // Ajouter l'élément principal dans le container (par exemple `body')
  weekContainer.appendChild(mainDiv);

  return mainDiv;
}

async function fetchReservations(allRectanglesInCreation) {
  try {

    let weekRectangle = new Date();
    let dayOfWeek = weekRectangle.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    let diffToMonday = (dayOfWeek + 6) % 7; // Trouver le décalage pour revenir à lundi (si on est dimanche, ce sera 6)

    if (dayOfWeek === 0) {
      weekRectangle.setDate(weekRectangle.getDate() + 1); // Revenir au lundi
    }else if (dayOfWeek === 6){
      weekRectangle.setDate(weekRectangle.getDate() + 2); // Revenir au lundi
    }else{
      weekRectangle.setDate(weekRectangle.getDate() - diffToMonday); // Revenir au lundi
    }

    weekRectangle.setDate(weekRectangle.getDate() + 7 * (currentWeek-1));
    weekRectangle = weekRectangle.getFullYear() + '-' +
        String(weekRectangle.getMonth() + 1).padStart(2, '0') + '-' +
        String(weekRectangle.getDate()).padStart(2, '0');

    const sitesId = await getSites();
    const siteId = sitesId.find(site => site.name === switchSiteSelected.name).id;

    await getWeekReservation(siteId, weekRectangle);

    const users = await getUsers();

    allRectanglesInCreation.forEach(rectangle => {
      const resaRectangle = reservationData.filter(reservation => reservation.date === rectangle.id);

      createNumResa(rectangle, resaRectangle);

      if (resaRectangle.length === 0 || ((resaRectangle.length === 1) && (resaRectangle[0].user_id === User.id))){
        rectangle.style.backgroundColor = '#FFA178';
      }

      let maxResa = 4;
      if (rectangle.classList.contains('big_rectangle')){
        maxResa = 5;
      }

      const resaRectangleShow = resaRectangle.slice(0, maxResa);

      resaRectangleShow.forEach(reservation => {
        const circle = createReservationCircle(users.find(user => user.id === reservation.user_id), rectangle);

        rectangle.appendChild(circle);
      });

      const checkCircle = rectangle.querySelector('.self-circle');
      if (reservationData.find(reservation => reservation.date === rectangle.id && reservation.user_id === User.id)) {
        checkCircle.classList.add('self-circle-active');
      }
    });

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

function createWeek () {

  const mainDiv = weekTemplate();

  const allRectanglesInCreation = mainDiv.querySelectorAll(".big_rectangle, .small_rectangle");

  allRectanglesInCreation.forEach(rect => {
    rect.removeEventListener('click', lookupClick);
    rect.addEventListener('click', lookupClick);
  });

  fetchReservations(allRectanglesInCreation);

}

// Démarrage de l'app

window.onload = async function () {

  weekTemplate();

  await getSites();
  await getUsers();

  sitesSelection();

  document.querySelectorAll('.main').forEach(e => e.remove());
  currentWeek = 0;
  dayRectangle = new Date();

  createWeek();
  createWeek();
  createWeek(); 
};
