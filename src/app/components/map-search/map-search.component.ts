import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface MapSearchResult {
    marker: any;
    title: string;
    typeClass: string;
    locationLabel: string;
}

export interface MapSearchGroup {
    key: string;
    label: string;
    items: MapSearchResult[];
}

@Component({
    selector: 'app-map-search',
    standalone: true,
    imports: [TranslateModule],
    templateUrl: './map-search.component.html',
    styleUrl: './map-search.component.scss',
})
export class MapSearchComponent {
    @Input() placeholder = '';
    @Input() showLocation = true;
    @Input() getMarkers: () => any[] = () => [];

    @Output() resultSelected = new EventEmitter<any>();

    public query = '';
    public groups: MapSearchGroup[] = [];
    public lastSelectedMarker: any = null;

    private readonly minQueryLength = 3;
    private readonly maxResults = 100;
    private readonly emptyLocationKey = '__none__';
    private collapsedGroups = new Set<string>();

    constructor(private translate: TranslateService) {}

    public get hasResults(): boolean {
        return this.groups.length > 0;
    }

    public onQueryInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value ?? '';
        this.query = value;
        this.refreshResults();
    }

    public refreshResults(): void {
        const trimmed = this.query.trim();

        if (trimmed.length < this.minQueryLength) {
            this.groups = [];
            return;
        }

        const needle = trimmed.toLowerCase();
        const markers = this.getMarkers() ?? [];
        const matched: MapSearchResult[] = [];

        for (const marker of markers) {
            const searchText = marker?.feature?.properties?.search;
            if (!searchText || typeof searchText !== 'string') {
                continue;
            }

            if (!searchText.toLowerCase().includes(needle)) {
                continue;
            }

            matched.push({
                marker,
                title: this.resolveTitle(marker),
                typeClass: marker?.properties?.typeUniqueName ?? '',
                locationLabel: this.resolveLocation(marker),
            });

            if (matched.length >= this.maxResults) {
                break;
            }
        }

        matched.sort((a, b) => {
            const aLocation = a.locationLabel || '';
            const bLocation = b.locationLabel || '';

            if (!aLocation && bLocation) {
                return 1;
            }

            if (aLocation && !bLocation) {
                return -1;
            }

            const byLocation = aLocation.localeCompare(bLocation, undefined, { sensitivity: 'base' });
            if (byLocation !== 0) {
                return byLocation;
            }

            return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        });

        this.groups = this.buildGroups(matched);
    }

    public isGroupCollapsed(group: MapSearchGroup): boolean {
        return this.collapsedGroups.has(group.key);
    }

    public toggleGroup(group: MapSearchGroup, event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        if (this.collapsedGroups.has(group.key)) {
            this.collapsedGroups.delete(group.key);
        } else {
            this.collapsedGroups.add(group.key);
        }
    }

    public onResultClick(result: MapSearchResult, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.lastSelectedMarker = result.marker;
        this.resultSelected.emit(result.marker);
    }

    public isLastSelected(result: MapSearchResult): boolean {
        return this.lastSelectedMarker != null && result.marker === this.lastSelectedMarker;
    }

    private buildGroups(matched: MapSearchResult[]): MapSearchGroup[] {
        if (!this.showLocation) {
            return matched.length
                ? [{ key: this.emptyLocationKey, label: '', items: matched }]
                : [];
        }

        const groups: MapSearchGroup[] = [];
        const byKey = new Map<string, MapSearchGroup>();

        for (const item of matched) {
            const key = item.locationLabel || this.emptyLocationKey;
            let group = byKey.get(key);

            if (!group) {
                group = {
                    key,
                    label: item.locationLabel || this.translate.instant('offMapContent'),
                    items: [],
                };
                byKey.set(key, group);
                groups.push(group);
            }

            group.items.push(item);
        }

        return groups;
    }

    private resolveTitle(marker: any): string {
        if (marker?.properties?.name) {
            return this.translate.instant(marker.properties.name);
        }

        if (marker?.name) {
            return this.translate.instant(marker.name);
        }

        return '';
    }

    private resolveLocation(marker: any): string {
        if (!this.showLocation) {
            return '';
        }

        const locationKey = marker?.properties?.locationUniqueName;
        if (!locationKey) {
            return '';
        }

        return this.translate.instant(locationKey);
    }
}
