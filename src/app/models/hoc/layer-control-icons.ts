/** Layer-control icon config for HOC — mirrors marker assets/colors on the map. */
export type HocLayerControlIcon = {
    iconUrl: string;
    /** Recolor `#FFFFFF` in SVG (same as canvas markers). Omit for PNGs / multi-color SVGs. */
    color?: string;
};

export const HOC_LAYER_CONTROL_ICONS: Record<string, HocLayerControlIcon> = {
    stash: {
        iconUrl: '/assets/images/svg/marks/colored/items.svg',
        color: '#00df07',
    },
    'random-stash': {
        iconUrl: '/assets/images/svg/marks/colored/items-low.svg',
        color: '#00df07',
    },
    'rich-stash': {
        iconUrl: '/assets/images/svg/marks/colored/items.svg',
        color: '#dd2a00',
    },
    stuff: {
        iconUrl: '/assets/images/svg/marks/colored/items-low.svg',
        color: '#ffffff',
    },
    'rich-stuff': {
        iconUrl: '/assets/images/svg/marks/colored/items.svg',
        color: '#ffffff',
    },
    'anomaly-zone': {
        iconUrl: '/assets/images/svg/marks/anomaly.svg',
    },
    'anomaly-zone-no-art': {
        iconUrl: '/assets/images/svg/marks/anomaly_noart.svg',
    },
    psychic: {
        iconUrl: '/assets/images/svg/marks/psi.svg',
    },
    psychic_zone: {
        iconUrl: '/assets/images/svg/marks/psi.svg',
    },
    acidic: {
        iconUrl: '/assets/images/svg/marks/chemical.svg',
    },
    acidic_zone: {
        iconUrl: '/assets/images/svg/marks/chemical.svg',
    },
    radioactive: {
        iconUrl: '/assets/images/svg/marks/radiation.svg',
    },
    radioactive_zone: {
        iconUrl: '/assets/images/svg/marks/radiation.svg',
    },
    thermal: {
        iconUrl: '/assets/images/svg/marks/fire.svg',
    },
    thermal_zone: {
        iconUrl: '/assets/images/svg/marks/fire.svg',
    },
    traders: {
        iconUrl: '/assets/images/s2/Markers/Texture_Trader_NotActive_General_Shadow.png',
    },
    medics: {
        iconUrl: '/assets/images/s2/Markers/Texture_Medecine_NotActive_General_Shadow.png',
    },
    guides: {
        iconUrl: '/assets/images/s2/Markers/Texture_Guide_NotActive_General_Shadow.png',
    },
    'sub-location': {
        iconUrl: '/assets/images/s2/Markers/T_LocationOrigin_NotActive_Shadow.png',
    },
    'stalker-respawn': {
        iconUrl: '/assets/images/svg/marks/character.svg',
    },
    'monster-lair': {
        iconUrl: '/assets/images/svg/marks/monsters.svg',
    },
    shelters: {
        iconUrl: '/assets/images/svg/marks/shelter.svg',
    },
    botPlayerShelters: {
        iconUrl: '/assets/images/svg/marks/shelter.svg',
    },
    hubs: {
        iconUrl: '/assets/images/svg/marks/s2/camp.svg',
    },
    quest: {
        iconUrl: '/assets/images/svg/marks/quest-item.svg',
    },
    'destroyable-box': {
        iconUrl: '/assets/images/svg/marks/items.svg',
    },
    artefacts: {
        iconUrl: '/assets/images/svg/marks/anomaly.svg',
    },
    regions: {
        iconUrl: '/assets/images/svg/marks/s2/area.svg',
        color: '#c9a227',
    },
    grid: {
        iconUrl: '/assets/images/svg/marks/pre-mark.svg',
        color: '#ffffff',
    },
    roads: {
        iconUrl: '/assets/images/svg/marks/artefact-ways.svg',
    },
    mines: {
        iconUrl: '/assets/images/svg/marks/mines.svg',
    },
    teleport: {
        iconUrl: '/assets/images/svg/marks/portal.svg',
    },
};
