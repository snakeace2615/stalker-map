import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface MapSearchResult {
    marker: any;
    title: string;
    typeClass: string;
    locationLabel: string;
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
    public results: MapSearchResult[] = [];

    private readonly minQueryLength = 3;
    private readonly maxResults = 100;

    constructor(private translate: TranslateService) {}

    public onQueryInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value ?? '';
        this.query = value;
        this.refreshResults();
    }

    public refreshResults(): void {
        const trimmed = this.query.trim();

        if (trimmed.length < this.minQueryLength) {
            this.results = [];
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

        this.results = matched;
    }

    public onResultClick(result: MapSearchResult, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.resultSelected.emit(result.marker);
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
