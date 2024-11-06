# Application d'un système de réservation pour petite entreprise

Ce projet est une application web permettant de visualiser et gérer les réservations de bureaux hebdomadaires, avec une interface interactive pour sélectionner les travailleurs et afficher leurs réservations. Le défilement horizontal des semaines permet une navigation continue, et les utilisateurs peuvent interagir avec des éléments pour mettre à jour la disponibilité et la répartition des travailleurs.

## Fonctionnalités Principales

•	Système de Réservation Hebdomadaire : Chaque semaine est représentée par des cases ou “rectangles” sur lesquels les réservations sont affichées.

•	Scroll Horizontal et Infini : La navigation entre les semaines s’effectue par un scroll horizontal infini ou via des flèches pour afficher les semaines suivante et précédente.

•	API pour la Gestion des Réservations : Les réservations sont gérées via des appels API pour obtenir, ajouter, et supprimer des réservations.

•	Couleurs et Bordures Dynamiques : Les éléments sont stylisés dynamiquement avec des couleurs vives et des bordures dorées pour représenter différentes informations de réservation.

## Affichage des Réservations

•	Création Dynamique des Semaines : Les semaines sont générées dynamiquement avec une fonction JavaScript asynchrone, qui gère les appels API pour charger les réservations de chaque semaine.

•	Circles Représentant les Travailleurs : Chaque réservation est représentée par un cercle coloré placé dans le rectangle de la date correspondante, avec des cercles superposés s’il y a plusieurs réservations le même jour.

## Installation et Lancement

1.	Cloner le projet : Clonez ce dépôt GitHub sur votre machine locale.
2.	Installer les dépendances : Assurez-vous que Flask est installé et que les dépendances nécessaires pour les appels API et la gestion des événements sont en place.
3.	Configurer l’API : Mettez en place les routes API pour la gestion des réservations (ajout, suppression, récupération).
4.	Lancer le serveur : Si vous avez un serveur de développement (Node.js, Flask, etc.), démarrez-le pour que les appels API fonctionnent.
5.	Ouvrir le projet : Ouvrez index.html dans votre navigateur pour tester l’interface.
