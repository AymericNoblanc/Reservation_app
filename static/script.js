const BASE_URL = window.location.href;

let switchSiteSelected = null;

let workerSelected = null;
let workerSelectedNum = -1;

let sitesData = null;
let workersData = null;
let reservationData = null;

let isModiferState = false;

const colorGreen = '#8FE2A4';
const colorGray = '#E5E5E5';

const weekLimit = 52;
let currentWeek = 0;
let dayRectangle = new Date();
dayRectangle.setDate(dayRectangle.getDate()-7);

// API call :

async function getSites() {
  if (sitesData) {
    // Si les données sont déjà récupérées, les retourner directement
    return sitesData;
  }

  try {

    sitesData = await fetch(BASE_URL + "sites"); // Appel de l'API
    if (!sitesData.ok) {
      throw new Error('Erreur lors de la récupération des données');
    }
    sitesData = await sitesData.json();
    return sitesData;

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

async function getWorkers() {
  if (workersData) {
    // Si les données sont déjà récupérées, les retourner directement
    return workersData;
  }

  try {
    workersData = await fetch(BASE_URL + "workers"); // Appel de l'API
    if (!workersData.ok) {
      throw new Error('Erreur lors de la récupération des données');
    }
    workersData = await workersData.json();

    workersData.forEach((element) => {
      element.color = getRandomColor();
    });

    workerSelected = getRandomWorker();
    selectWorkerCircle.style.backgroundColor = workerSelected.color;
    selectWorkerCircle.textContent = workerSelected.firstname[0] + workerSelected.lastname[0];

    return workersData;

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

async function getWeekReservation(siteId, date) {
  try {
    const response = await fetch(BASE_URL + "reservations/site/" + siteId + "/week?start_date=" + date);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données');
    }
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

async function createReservation(workerId, siteId, date) {
  const url = BASE_URL + "reservations";
  
  const body = JSON.stringify({
    worker_id: workerId,
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

    if (!response.ok) {
      throw new Error(`Erreur: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Réservation créée:', data);
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
  }
}

async function deleteReservation(workerId, siteId, date) {
  const url = BASE_URL + "reservations";
  
  const body = JSON.stringify({
    worker_id: workerId,
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

    if (!response.ok) {
      throw new Error(`Erreur: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Réservation supprimée:', data);
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation:', error);
  }
}

// Gestion du travailleur sélectionné

function getRandomColor() {
  // Génère une teinte (Hue) entre 0 et 360 degrés
  const hue = Math.floor(Math.random() * 360);

  // Saturation fixée à 70% pour des couleurs vives
  const saturation = 70; 

  // Luminosité entre 50% et 70% pour éviter des couleurs trop sombres ou trop claires
  const lightness = Math.floor(Math.random() * 20) + 50;

  // Créer la couleur en utilisant le modèle HSL
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getRandomWorker(){
  workerSelectedNum += 1;
  return workersData[workerSelectedNum%workersData.length];
  //return workersData[Math.floor(Math.random() * workersData.length)];
}

const selectWorkerCircle = document.getElementById("selectWorker");
selectWorkerCircle.addEventListener("click", () => {
  workerSelected = getRandomWorker();
  selectWorkerCircle.style.backgroundColor = workerSelected.color;
  selectWorkerCircle.textContent = workerSelected.firstname[0] + workerSelected.lastname[0];

  const circles = document.querySelectorAll('.circle');
  circles.forEach(circle => {
    circle.classList.remove('circle-inner-border');
    if (circle.id === workerSelected.firstname + "_" + workerSelected.lastname) {
      circle.classList.add('circle-inner-border');
    }
  });


});

// Gestion du slide des sites

function sitesSelection() {

  switchSiteSelected = sitesData[0];

  const navContainer = document.getElementById('navContainer');
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
      const targetLeft = this.id * 100; // Valeur "left" à partir de l'attribut data-target
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

function createReservationCircle(worker, rectangle) {
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
  circle.textContent = worker.firstname[0] + worker.lastname[0];

  if (worker.firstname === workerSelected.firstname && worker.lastname === workerSelected.lastname) {
    circle.classList.add('circle-inner-border');
    if (isModiferState){
      rectangle.style.backgroundColor = colorGreen;
    }
  }

  circle.style.backgroundColor = worker.color;
  circle.id = worker.firstname + "_" + worker.lastname;

  return circle;
}

// Gestion de l'ajout/enlevage d'une réservation

function modifierButtonFunction() {

  const circles = document.querySelectorAll('.circle');

  const rectangles = document.querySelectorAll(".big_rectangle, .small_rectangle");

  circles.forEach(circle => {
    if (circle.style.display === 'none') {
      circle.style.display = 'flex';
    } else {
      circle.style.display = 'none';
    }
  });

  if (!isModiferState) {
    rectangles.forEach((element) => {
      if(element.querySelector("#" + workerSelected.firstname + "_" + workerSelected.lastname)){
        element.style.backgroundColor = colorGreen;
      }else{
        element.style.backgroundColor = colorGray;
      }
    });
    this.innerText = 'Sauvegarder'
  }else {
    rectangles.forEach((element) => {
      if (element.classList.contains('activeWeek')){
        element.style.backgroundColor = '#93DDFF';
      }else{
        element.style.backgroundColor = '#FFE371';
      }
    });
    this.innerText = "Réserver"
  }
  isModiferState = !isModiferState;
}

function reservationClick() {
  function lookupRectangleClick() {

    const formerRectangle = weekContainer.querySelector(`[id='${lookupRectangle.id}']`);

    lookupRectangle.style.boxShadow = '0 0 0 0';

    const jour = lookupRectangle.querySelector(".dayOfTheWeek");
    jour.style.animation = 'none';
    jour.offsetHeight;
    jour.style.animation = 'growDayOfTheWeek 0.5s ease-in reverse';

    const jourNum = lookupRectangle.querySelector(".dayNum");
    jourNum.style.animation = 'none';
    jourNum.offsetHeight;
    jourNum.style.animation = 'growDayNum 0.5s ease-in reverse';

    lookupRectangle.style.left = `${formerRectangle.getBoundingClientRect().left}px`;
    lookupRectangle.style.top = `${formerRectangle.getBoundingClientRect().top}px`;
    lookupRectangle.style.width = `${formerRectangle.getBoundingClientRect().width}px`;
    lookupRectangle.style.height = `${formerRectangle.getBoundingClientRect().height}px`;

    setTimeout(() => {
      this.remove();
      weekContainer.style.pointerEvents = 'auto';
    }, 475)
  }

  if (isModiferState) {
    isReserved = this.querySelector("#" + workerSelected.firstname + "_" + workerSelected.lastname);

    const site = sitesData.find(site => site.name === switchSiteSelected.name);

    const worker = workersData.find(worker => worker.firstname === workerSelected.firstname && worker.lastname === workerSelected.lastname);
    
    reservationCircles = this.querySelectorAll(".circle");

    if (isReserved){
      this.style.backgroundColor = colorGray;
      deleteReservation(worker.id, site.id, this.id);

      const leftPosition = Number(isReserved.style.left.split('px')[0]);

      reservationCircles.forEach(circle => {
        const circleLeftPosition = Number(circle.style.left.split('px')[0]);
        if (circleLeftPosition > leftPosition){
          if(this.className.includes("big_rectangle")){
            circle.style.left = circleLeftPosition-45 + 'px';
          }else{
            circle.style.left = circleLeftPosition-20 + 'px';
          }
        }

      });
      
      isReserved.remove();
    }else{
      createReservation(worker.id, site.id, this.id);
      const circle = createReservationCircle(worker, this);

      circle.style.display = 'none';

      // Ajouter le cercle au rectangle
      this.appendChild(circle);
    }
  }else{

    lookupRectangle = document.createElement("div");
    lookupRectangle.classList.add("lookup_rectangle");
    lookupRectangle.classList.add(this.className.split(' ')[0]);

    // Créer le jour de la semaine
    const jour = document.createElement("p");
    jour.classList.add("dayOfTheWeek");
    jour.textContent = this.querySelector(".dayOfTheWeek").textContent;
    jour.style.animation = 'growDayOfTheWeek 0.5s ease-out'

    lookupRectangle.appendChild(jour);

    // Créer la date
    const jourNum = document.createElement("p");
    jourNum.classList.add("dayNum");
    jourNum.textContent = this.querySelector(".dayNum").textContent;
    jourNum.style.animation = 'growDayNum 0.5s ease-out'

    lookupRectangle.id = this.id;
    lookupRectangle.appendChild(jourNum);

    document.body.appendChild(lookupRectangle);

    lookupRectangle.style.position = 'absolute';
    lookupRectangle.style.left = `${this.getBoundingClientRect().left}px`;
    lookupRectangle.style.top = `${this.getBoundingClientRect().top}px`;
    lookupRectangle.style.width = `${this.getBoundingClientRect().width}px`;
    lookupRectangle.style.height = `${this.getBoundingClientRect().height}px`;

    lookupRectangle.addEventListener('click', lookupRectangleClick);

    weekContainer.style.pointerEvents = 'none';

    reservationData.forEach(reservation => {
      if (reservation.date === this.id) {

        // Créer un div pour le cercle
        const circle = createReservationCircle(workersData.find(worker => worker.id === reservation.worker_id), lookupRectangle);

        // Ajouter le cercle au rectangle
        lookupRectangle.appendChild(circle);
      }
    });

    setTimeout(() => {
      lookupRectangle.style.height = '400px';
      lookupRectangle.style.width = '320px';

      if (this.querySelector(".dayOfTheWeek").textContent === 'Lundi') {
        lookupRectangle.style.top = `${this.getBoundingClientRect().top + 15}px`; // Adjust left position
      }else if (this.querySelector(".dayOfTheWeek").textContent === 'Mardi') {
        lookupRectangle.style.top = `${this.getBoundingClientRect().top - 135}px`; // Adjust left position
      }else if (this.querySelector(".dayOfTheWeek").textContent === 'Mercredi') {
        lookupRectangle.style.left = `${this.getBoundingClientRect().left - 170}px`; // Adjust left position
        lookupRectangle.style.top = `${this.getBoundingClientRect().top - 135}px`; // Adjust left position
      }else if (this.querySelector(".dayOfTheWeek").textContent === 'Jeudi') {
        lookupRectangle.style.top = `${this.getBoundingClientRect().top - 285}px`; // Adjust left position
      }else if (this.querySelector(".dayOfTheWeek").textContent === 'Vendredi') {
        lookupRectangle.style.left = `${this.getBoundingClientRect().left - 170}px`; // Adjust left position
        lookupRectangle.style.top = `${this.getBoundingClientRect().top - 285}px`; // Adjust left position
      }

      jour.style.fontSize = '32px';
      jour.style.marginLeft = '3vh';

      jourNum.style.fontSize = '20px';
      jourNum.style.marginTop = '6.5vh';
      jourNum.style.marginLeft = '5vh';

      }, 1)

  }
}

// Création d'une semaine

function weekTemplate (){
  currentWeek += 1;

  dayRectangle.setDate((dayRectangle.getDate() - (dayRectangle.getDay() + 6) % 7)+7);
  let formattedDate;

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
  const bigRectangle = document.createElement("div");
  bigRectangle.classList.add("big_rectangle");
  if (currentWeek === 1){bigRectangle.classList.add("activeWeek");}
  if (isModiferState){
    bigRectangle.style.backgroundColor = colorGray;
  }

  // Créer le jour de la semaine
  const lundi = document.createElement("p");
  lundi.classList.add("dayOfTheWeek");
  lundi.textContent = "Lundi";

  bigRectangle.appendChild(lundi);

  // Créer la date
  const lundiNum = document.createElement("p");
  lundiNum.classList.add("dayNum");
  lundiNum.textContent = `${dayRectangle.toLocaleString('fr-Fr',{month: "numeric", day: "numeric"})}`;

  formattedDate = dayRectangle.getFullYear() + '-' +
    String(dayRectangle.getMonth() + 1).padStart(2, '0') + '-' +
    String(dayRectangle.getDate()).padStart(2, '0');

  bigRectangle.id = formattedDate;
  bigRectangle.appendChild(lundiNum);

  // Créer le conteneur pour les petits rectangles
  const smallDaysDiv = document.createElement("div");
  smallDaysDiv.classList.add("days", "small");

  // Conteneur pour la ligne du haut des petits rectangles
  const topSmallDaysDiv = document.createElement("div");
  topSmallDaysDiv.classList.add("days", "small", "top");

  // Petits rectangles dans la ligne du haut
  const smallRectangle1 = document.createElement("div");
  smallRectangle1.classList.add("small_rectangle");
  if (currentWeek === 1){smallRectangle1.classList.add("activeWeek");}
  if (isModiferState){
    smallRectangle1.style.backgroundColor = colorGray;
  }

  // Créer le jour de la semaine
  const mardi = document.createElement("p");
  mardi.classList.add("dayOfTheWeek");
  mardi.textContent = "Mardi";

  smallRectangle1.appendChild(mardi);

  // Créer la date
  const mardiNum = document.createElement("p");
  mardiNum.classList.add("dayNum");
  dayRectangle.setDate(dayRectangle.getDate()+1);
  mardiNum.textContent = `${dayRectangle.toLocaleString('fr-Fr',{month: "numeric", day: "numeric"})}`;

  formattedDate = dayRectangle.getFullYear() + '-' +
    String(dayRectangle.getMonth() + 1).padStart(2, '0') + '-' +
    String(dayRectangle.getDate()).padStart(2, '0');

  smallRectangle1.id = formattedDate;
  smallRectangle1.appendChild(mardiNum);

  const smallRectangle2 = document.createElement("div");
  smallRectangle2.classList.add("small_rectangle");
  if (currentWeek === 1){smallRectangle2.classList.add("activeWeek");}
  if (isModiferState){
    smallRectangle2.style.backgroundColor = colorGray;
  }
  
  // Créer le jour de la semaine
  const mercredi = document.createElement("p");
  mercredi.classList.add("dayOfTheWeek");
  mercredi.textContent = "Mercredi";

  smallRectangle2.appendChild(mercredi);

  // Créer la date
  const mercrediNum = document.createElement("p");
  mercrediNum.classList.add("dayNum");
  dayRectangle.setDate(dayRectangle.getDate()+1);
  mercrediNum.textContent = `${dayRectangle.toLocaleString('fr-Fr',{month: "numeric", day: "numeric"})}`;

  formattedDate = dayRectangle.getFullYear() + '-' +
    String(dayRectangle.getMonth() + 1).padStart(2, '0') + '-' +
    String(dayRectangle.getDate()).padStart(2, '0');

  smallRectangle2.id = formattedDate;
  smallRectangle2.appendChild(mercrediNum);

  // Ajouter les petits rectangles à la ligne du haut
  topSmallDaysDiv.appendChild(smallRectangle1);
  topSmallDaysDiv.appendChild(smallRectangle2);

  // Conteneur pour la ligne du bas des petits rectangles
  const bottomSmallDaysDiv = document.createElement("div");
  bottomSmallDaysDiv.classList.add("days", "small", "bottom");

  // Petits rectangles dans la ligne du bas
  const smallRectangle3 = document.createElement("div");
  smallRectangle3.classList.add("small_rectangle");
  if (currentWeek === 1){smallRectangle3.classList.add("activeWeek");}
  if (isModiferState){
    smallRectangle3.style.backgroundColor = colorGray;
  }
    
  // Créer le jour de la semaine
  const jeudi = document.createElement("p");
  jeudi.classList.add("dayOfTheWeek");
  jeudi.textContent = "Jeudi";

  smallRectangle3.appendChild(jeudi);

  // Créer la date
  const jeudiNum = document.createElement("p");
  jeudiNum.classList.add("dayNum");
  dayRectangle.setDate(dayRectangle.getDate()+1);
  jeudiNum.textContent = `${dayRectangle.toLocaleString('fr-Fr',{month: "numeric", day: "numeric"})}`;

  formattedDate = dayRectangle.getFullYear() + '-' +
    String(dayRectangle.getMonth() + 1).padStart(2, '0') + '-' +
    String(dayRectangle.getDate()).padStart(2, '0');

  smallRectangle3.id = formattedDate;
  smallRectangle3.appendChild(jeudiNum);

  const smallRectangle4 = document.createElement("div");
  smallRectangle4.classList.add("small_rectangle");
  if (currentWeek === 1){smallRectangle4.classList.add("activeWeek");}
  if (isModiferState){
    smallRectangle4.style.backgroundColor = colorGray;
  }
    
  // Créer le jour de la semaine
  const vendredi = document.createElement("p");
  vendredi.classList.add("dayOfTheWeek");
  vendredi.textContent = "Vendredi";

  smallRectangle4.appendChild(vendredi);

  // Créer la date
  const vendrediNum = document.createElement("p");
  vendrediNum.classList.add("dayNum");
  dayRectangle.setDate(dayRectangle.getDate()+1);
  vendrediNum.textContent = `${dayRectangle.toLocaleString('fr-Fr',{month: "numeric", day: "numeric"})}`;

  formattedDate = dayRectangle.getFullYear() + '-' +
    String(dayRectangle.getMonth() + 1).padStart(2, '0') + '-' +
    String(dayRectangle.getDate()).padStart(2, '0');

  smallRectangle4.id = formattedDate;
  smallRectangle4.appendChild(vendrediNum);

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

  // Ajouter l'élément principal dans le container (par exemple `body`)
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

    const workers = await getWorkers();

    reservationData.forEach(reservation => {
      allRectanglesInCreation.forEach(rectangle => {
        if (reservation.date === rectangle.id) {

          // Créer un div pour le cercle
          const circle = createReservationCircle(workers.find(worker => worker.id === reservation.worker_id), rectangle);

          if (isModiferState) {
            circle.style.display = 'none';
          }

          // Ajouter le cercle au rectangle
          rectangle.appendChild(circle);
        }
      });
    });

  } catch (error) {
    console.error('Erreur:', error); // Gestion des erreurs
  }
}

function createWeek () {

  const mainDiv = weekTemplate();

  const allRectanglesInCreation = mainDiv.querySelectorAll(".big_rectangle, .small_rectangle");

  allRectanglesInCreation.forEach(rect => {
    rect.removeEventListener('click', reservationClick);
    rect.addEventListener('click', reservationClick);
  });

  const modifierButton = document.getElementById('modifierButton');
  modifierButton.onclick = function() {modifierButtonFunction()};

  fetchReservations(allRectanglesInCreation);

}

// Démarrage de l'app

window.onload = async function () {

  weekTemplate();

  await getSites();
  await getWorkers();

  sitesSelection();

  document.querySelectorAll('.main').forEach(e => e.remove());
  currentWeek = 0;
  dayRectangle = new Date();
  dayRectangle.setDate(dayRectangle.getDate()-7);

  createWeek();
  createWeek();
  createWeek(); 
};
