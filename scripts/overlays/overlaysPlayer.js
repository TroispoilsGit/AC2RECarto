import customIcons from '../modules/iconsMap.js';
import { map } from "../map.js";
// Dictionnaire pour stocker les marqueurs des personnages
var characterMarkers = {};
// Fonction pour récupérer les positions des personnages
export default function fetchCharacterLocations() {
    fetch("/characterloc") // Effectuer une requête GET vers /characterloc
        .then((response) => response.json()) // Convertir la réponse en JSON
        .then((data) => {
            // Parcourir les données et afficher chaque position de personnage
            data.forEach((character) => {
                updateCharacterMarker(
                    character.literalValue,
                    character.locy,
                    character.locx
                );
            });
        })
        .catch((error) => {
            console.error("Error fetching character locations:", error);
        });
}
// Fonction pour créer ou mettre à jour un marqueur de personnage
function updateCharacterMarker(characterId, lat, lng) {
    // Vérifier si le marqueur existe déjà
    if (characterMarkers[characterId]) {
        // Mettre à jour la position du marqueur existant
        characterMarkers[characterId].setLatLng([lat, lng]);
    } else {
        // Créer un nouveau marqueur
        var marker = L.marker([lat, lng], { icon: customIcons.greenPlayer }).bindPopup(characterId).addTo(map);
        // Stocker le marqueur dans le dictionnaire
        characterMarkers[characterId] = marker;
    }
}
