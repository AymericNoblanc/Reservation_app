const BASE_URL = URLformator(window.location.href);

let switchSiteSelected = null;

let User = null;
let UserNum = -1;

let sitesData = null;
let usersData = null;
let reservationData = null;

const weekLimit = 52;
let currentWeek = 0;
let dayRectangle = new Date();
dayRectangle.setDate(dayRectangle.getDate()-7);

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
    cookie = cookie.split("; authToken=");
    cookie = cookie.pop().split(';').shift();

    console.log(document.cookie);

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
    selectUserCircle.textContent = User.firstname[0] + User.lastname[0];

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

async function createReservation(userId, siteId, date) {
  const url = BASE_URL + "reservations";
  
  const body = JSON.stringify({
    user_id: userId,
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
    console.log('Réservation créée:', data);
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
  }
}

async function deleteReservation(userId, siteId, date) {
  const url = BASE_URL + "reservations";
  
  const body = JSON.stringify({
    user_id: userId,
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
    console.log('Réservation supprimée:', data);
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation:', error);
  }
}

// Gestion du travailleur sélectionné

const selectUserCircle = document.getElementById("selectUser");
selectUserCircle.addEventListener("click", () => {
});

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
      dayRectangle.setDate(dayRectangle.getDate()-7);

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
}
weekContainer.addEventListener("scroll", handleInfiniteScroll);

function removeInfiniteScroll () {
  window.removeEventListener("scroll", handleInfiniteScroll);
}

// Création d'éléments

function createReservationCircle(user, rectangle) {
  const circle = document.createElement('div');
  circle.classList.add('circle'); // Ajoute la classe pour le style

  let leftPosition = rectangle.querySelectorAll(".circle").length;

  if(rectangle.className.includes("big_rectangle")){
    leftPosition = leftPosition * 45 + 15;
  }else{
    leftPosition = leftPosition * 20 + 15;
  }

  // Appliquer la position gauche (left) au cercle pour le décaler
  circle.style.left = `${leftPosition}px`;
  circle.textContent = user.firstname[0] + user.lastname[0];

  circle.style.backgroundColor = user.color;
  circle.id = user.firstname + "_" + user.lastname;

  return circle;
}

function createRectangle(classes, dayOfWeek) {

  dayRectangle.setDate(dayRectangle.getDate()+1);

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

  return rectangle;
}

function createNumMoreResa(rectangle, resaRectangle, maxResa) {
  const nbMoreResa = document.createElement('div');
  nbMoreResa.classList.add('nbMoreResa');
  nbMoreResa.classList.add('circle');

  nbMoreResa.textContent = '+' + (resaRectangle.length - maxResa);

  if (maxResa > 9){
    nbMoreResa.style.width = '45px';
    nbMoreResa.style.borderRadius = '40%';
  }

  if(rectangle.className.includes("big_rectangle")){
    nbMoreResa.style.left = "240px";
  }else{
    nbMoreResa.style.left = "100px";
  }

  rectangle.appendChild(nbMoreResa);
}

// Gestion de l'ajout/enlevage d'une réservation

let lookupRectangle;
function lookupRectangleClick() {

  const overlay = document.getElementById('overlay');
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
    weekContainer.style.pointerEvents = 'auto';
  }, 300)
}

function lookupClick(event) {

  const rect = this.getBoundingClientRect();
  const clickY = event.clientY - rect.top; // Y coordinate of the click relative to the top of the div
  const divHeight = rect.height;

  if (clickY < divHeight / 1.7) {
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
  overlay.id = 'overlay';
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

  reservationData.forEach(reservation => {
    if (reservation.date === this.id && reservation.user_id !== User.id) {

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
    }
  });

  setTimeout(() => {

    lookupRectangle.style.height = '400px';
    lookupRectangle.style.width = '320px';

    if (this.querySelector(".dayOfTheWeek").textContent === 'Lundi') {
      lookupRectangle.style.top = `${this.getBoundingClientRect().top + 15}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Mardi') {
      lookupRectangle.style.top = `${this.getBoundingClientRect().top - 135}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Mercredi') {
      lookupRectangle.style.left = `${this.getBoundingClientRect().left - 170}px`; // Adjust left position
      lookupRectangle.style.top = `${this.getBoundingClientRect().top - 135}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Jeudi') {
      lookupRectangle.style.top = `${this.getBoundingClientRect().top - 285}px`; // Adjust left position
    } else if (this.querySelector(".dayOfTheWeek").textContent === 'Vendredi') {
      lookupRectangle.style.left = `${this.getBoundingClientRect().left - 170}px`; // Adjust left position
      lookupRectangle.style.top = `${this.getBoundingClientRect().top - 285}px`; // Adjust left position
    }

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
  const user = usersData.find(user => user.firstname === User.firstname && user.lastname === User.lastname);

  if (this.classList.contains('self-circle-active')){
    // Create reservation
    createReservation(user.id, site.id, this.parentElement.id);

  }else{
    // Delete reservation
    deleteReservation(user.id, site.id, this.parentElement.id);

  }
}

// Création d'une semaine

function weekTemplate (){
  currentWeek += 1;

  dayRectangle.setDate((dayRectangle.getDate() - (dayRectangle.getDay() + 6) % 7)+7);

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
  dayRectangle.setDate(dayRectangle.getDate()-1);
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
    weekRectangle.setDate(weekRectangle.getDate() - diffToMonday); // Revenir au lundi

    weekRectangle.setDate(weekRectangle.getDate() + 7 * (currentWeek-1));
    weekRectangle = weekRectangle.getFullYear() + '-' +
        String(weekRectangle.getMonth() + 1).padStart(2, '0') + '-' +
        String(weekRectangle.getDate()).padStart(2, '0');

    const sitesId = await getSites();
    const siteId = sitesId.find(site => site.name === switchSiteSelected.name).id;

    await getWeekReservation(siteId, weekRectangle);

    const users = await getUsers();

    allRectanglesInCreation.forEach(rectangle => {
      const resaRectangle = reservationData.filter(reservation => reservation.date === rectangle.id && reservation.user_id !== User.id);

      if (resaRectangle.length === 0){
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
      if (resaRectangle.length > maxResa) {
        createNumMoreResa(rectangle, resaRectangle, maxResa);
      }
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
  dayRectangle.setDate(dayRectangle.getDate()-7);

  createWeek();
  createWeek();
  createWeek(); 
};
