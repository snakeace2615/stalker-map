import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { LocaleService } from './locale.service';
import { findLayerMarker, getLayerMarkers, hasLevelChangerProperties } from '../leaflet/leaflet-setup';

/** Deep-link query contract used across trilogy and HoC maps. */
export interface MapDeepLink {
    /** Game world Z (Leaflet lat). */
    lat: number;
    /** Game world X (Leaflet lng). */
    lng: number;
    /** Layer unique name, e.g. `stash`, `anomaly-zone-no-art`, `rich-stuff`. */
    type: string;
    /** Underground location id when the marker is below ground. */
    underground?: number;
}

export interface MapDeepLinkLayers {
    name?: string;
    _layers?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ShareLinkService {
    public static readonly surfaceTolerance = 1;
    public static readonly undergroundTolerance = 1;
    public static readonly hiddenLayerName = 'hidden-markers';

    constructor(private readonly locale: LocaleService) {}

    /**
     * Share / deep-link URL without language prefix, e.g.
     * `/map/hoc?lat=…&lng=…&type=stash`.
     * Legacy redirect applies the recipient's preferred language from localStorage,
     * so sharing never overrides their UI language. SEO still uses `/{lang}/…`.
     */
    public build(game: string, link: MapDeepLink): string {
        return this.locale.absoluteNeutralMapUrl(game, {
            lat: link.lat,
            lng: link.lng,
            type: link.type || undefined,
            underground: link.underground,
        });
    }

    /**
     * Build from in-game coordinates (z/x) and layer name.
     * `underground` is only attached when `isUnderground` is true.
     */
    public forMarker(
        game: string,
        z: number,
        x: number,
        type: string,
        options: { isUnderground?: boolean; locationId?: number | null } = {}
    ): string {
        return this.build(game, this.markerDeepLink(z, x, type, options));
    }

    /**
     * Localized deep-link for crawlable HTML (content index pages).
     * Prefer this over `forMarker` when the URL itself should be language-specific.
     */
    public forMarkerLocalized(
        game: string,
        z: number,
        x: number,
        type: string,
        options: { isUnderground?: boolean; locationId?: number | null } = {}
    ): string {
        const link = this.markerDeepLink(z, x, type, options);
        return this.locale.absoluteLocalizedMapUrl(game, {
            lat: link.lat,
            lng: link.lng,
            type: link.type || undefined,
            underground: link.underground,
        });
    }

    public markerDeepLink(
        z: number,
        x: number,
        type: string,
        options: { isUnderground?: boolean; locationId?: number | null } = {}
    ): MapDeepLink {
        return {
            lat: z,
            lng: x,
            type,
            underground:
                options.isUnderground && options.locationId != null && options.locationId > 0
                    ? options.locationId
                    : undefined,
        };
    }

    public parse(params: Params | Record<string, unknown>): MapDeepLink | null {
        const lat = this.toNumber(params['lat']);
        const lng = this.toNumber(params['lng']);
        if (lat == null || lng == null) {
            return null;
        }

        const rawType = params['type'];
        const type = rawType == null || rawType === '' ? '' : String(rawType);
        const underground = this.toNumber(params['underground']);

        return {
            lat,
            lng,
            type,
            underground: underground != null && underground > 0 ? underground : undefined,
        };
    }

    public findSurfaceMarker(
        layers: MapDeepLinkLayers[],
        link: MapDeepLink,
        options: { includeHidden?: boolean } = {}
    ): any | null {
        const includeHidden = options.includeHidden !== false;
        const layerNames = [link.type];

        if (includeHidden) {
            layerNames.push(ShareLinkService.hiddenLayerName);
        }

        for (const name of layerNames) {
            if (!name) {
                continue;
            }

            const layer = layers.find((item) => item.name === name);
            if (!layer) {
                continue;
            }

            const marker = findLayerMarker(layer, (candidate) =>
                this.markerMatchesLink(candidate, link)
            );

            if (marker) {
                return marker;
            }

            // HoC / markers without stamped properties.coordinates
            for (const candidate of Object.values(layer._layers ?? {}) as any[]) {
                if (this.markerMatchesLink(candidate, link)) {
                    return candidate;
                }
            }
        }

        return null;
    }

    public findUndergroundEntrance(
        levelChangersLayer: MapDeepLinkLayers | undefined,
        undergroundId: number
    ): any | null {
        if (!levelChangersLayer) {
            return null;
        }

        return (
            findLayerMarker(
                levelChangersLayer,
                (marker) =>
                    hasLevelChangerProperties(marker.properties) &&
                    marker.properties.levelChanger.destinationLocationId == undergroundId
            ) ?? null
        );
    }

    public findUndergroundMarker(
        layers: MapDeepLinkLayers[],
        link: MapDeepLink,
        shift: { zShift: number; xShift: number }
    ): any | null {
        if (!link.type) {
            return null;
        }

        const layer = layers.find((item) => item.name === link.type);
        if (!layer) {
            return null;
        }

        const targetLat = link.lat + shift.zShift;
        const targetLng = link.lng + shift.xShift;

        for (const marker of getLayerMarkers(layer)) {
            const latlng = (marker as any)._latlng ?? (marker as any).getLatLng?.();
            if (!latlng) {
                continue;
            }

            if (
                Math.abs(latlng.lat - targetLat) < ShareLinkService.undergroundTolerance &&
                Math.abs(latlng.lng - targetLng) < ShareLinkService.undergroundTolerance
            ) {
                return marker;
            }
        }

        return null;
    }

    public markerMatchesLink(marker: any, link: MapDeepLink): boolean {
        const coords = this.resolveMarkerCoords(marker);
        if (!coords) {
            return false;
        }

        return (
            Math.abs(coords.lat - link.lat) < ShareLinkService.surfaceTolerance &&
            Math.abs(coords.lng - link.lng) < ShareLinkService.surfaceTolerance
        );
    }

    private resolveMarkerCoords(marker: any): { lat: number; lng: number } | null {
        if (marker?.properties?.coordinates) {
            return {
                lat: Number(marker.properties.coordinates.lat),
                lng: Number(marker.properties.coordinates.lng),
            };
        }

        const latlng = marker?.getLatLng?.() ?? marker?._latlng;
        if (latlng && latlng.lat != null && latlng.lng != null) {
            return { lat: Number(latlng.lat), lng: Number(latlng.lng) };
        }

        if (marker?.data?.z != null && marker?.data?.x != null) {
            return { lat: Number(marker.data.z), lng: Number(marker.data.x) };
        }

        return null;
    }

    private toNumber(value: unknown): number | null {
        if (value == null || value === '') {
            return null;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
}
