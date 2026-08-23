import type { Control as LeafletControl, ImageOverlay, LayerGroup, Map, Marker } from 'leaflet';

import type { StalkerMarkerProperties } from './stalker-marker.types';

export type { StalkerMarkerProperties } from './stalker-marker.types';
export type {
    StalkerLevelChangerMarkerProperties,
    StalkerLootBoxMarkerProperties,
    StalkerMarkerPropertiesBase,
    StalkerStuffMarkerProperties,
    StalkerTraderMarkerProperties,
} from './stalker-marker.types';
export {
    asStalkerLayerGroup,
    findLayerMarker,
    getLayerMarkers,
    hasLevelChangerProperties,
    isStalkerMarker,
} from './stalker-marker.types';

export interface StalkerMap extends Map {
    scaleFactor: number;
    filterStorageKey?: string;
}

export interface MarkerCoordinates {
    lat: number;
    lng: number;
}

export interface StalkerSearchLocation {
    lat: number;
    lng: number;
    type?: string;
    layer?: StalkerMarker;
}

export interface StalkerMarker extends Marker {
    properties: StalkerMarkerProperties;
    search?: string;
    undergroundLocation?: { uniqueName: string; id?: number };
    _latlng?: import('leaflet').LatLng;
}

export interface StalkerLayerGroup extends LayerGroup {
    name: string;
    ableToSearch?: boolean;
    addToTop?: boolean;
    isUnderground?: boolean;
    topId?: number;
    _layers: Record<string, StalkerMarker>;
}

export interface StalkerLocationsLayer extends StalkerLayerGroup {
    locations: ImageOverlay[];
}

export type StalkerCustomLayersControl = LeafletControl & {
    searchName?: string;
    isUnderground?: boolean;
    setLayersVisible(layers: unknown[], visible: boolean): void;
};

export type StalkerRulerControl = LeafletControl;
