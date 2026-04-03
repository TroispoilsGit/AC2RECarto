// scripts/modules/icons.js
// Defines all custom Leaflet marker icons used throughout the application.
// Requires Leaflet (L) to be available as a global, which is guaranteed by the
// <script> tag in index.html.

/** Shared pixel dimensions applied to every icon. */
const ICON_SIZE = [9, 9]
const ICON_ANCHOR = [4.5, 4.5]

/**
 * Creates a Leaflet Icon from the given URL using the shared icon dimensions.
 * @param {string} iconUrl Path to the icon image file.
 * @returns {L.Icon}
 */
function makeIcon(iconUrl) {
    return new L.Icon({ iconUrl, iconSize: ICON_SIZE, iconAnchor: ICON_ANCHOR })
}

/**
 * Named icon instances for every POI category and live entity type.
 * Icon image files live in the `/icons/` directory.
 */
const icons = {
    // ── POI category icons ────────────────────────────────────────────────────
    redCrossFull:       makeIcon('./icons/red_cross_full.png'),
    redCrossVoid:       makeIcon('./icons/red_cross_void.png'),
    redCrossAdditional: makeIcon('./icons/red_cross_additional_full.png'),
    blueCircleFull:     makeIcon('./icons/blue_circle_full.png'),
    blueCircleVoid:     makeIcon('./icons/blue_circle_void.png'),
    blueCrossFull:      makeIcon('./icons/blue_cross_full.png'),
    greySquare:         makeIcon('./icons/grey_square.png'),
    yellowSquareFull:   makeIcon('./icons/yellow_square_full.png'),
    yellowSquareVoid:   makeIcon('./icons/yellow_square_void.png'),
    yellowCrown:        makeIcon('./icons/yellow_crown.png'),

    // ── Live entity icons ─────────────────────────────────────────────────────
    greenPlayer:        makeIcon('./icons/green_circle_full.png'),
    yellowNpc:          makeIcon('./icons/yellow_star_big.png'),
}

export default icons
