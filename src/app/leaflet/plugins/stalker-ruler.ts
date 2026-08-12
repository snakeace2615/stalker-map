import * as L from 'leaflet';
export type StalkerRulerMode = 'route' | 'area';

export interface StalkerRulerLabels {
    length?: string;
    azimuth?: string;
    area?: string;
    perimeter?: string;
    speed?: string;
    time?: string;
    meterShort?: string;
    m2?: string;
    km2?: string;
    rulerRoute?: string;
    rulerArea?: string;
}

export interface StalkerRulerControlOptions extends L.ControlOptions {
    lengthFactor?: number;
    speed?: number;
    debugScale?: boolean;
    labels?: StalkerRulerLabels;
    circleMarker?: L.CircleMarkerOptions;
    lineStyle?: L.PolylineOptions;
    fillStyle?: L.PolylineOptions;
}

type InternalMode = StalkerRulerMode | null;

interface VertexState {
    latlng: L.LatLng;
    marker: L.Marker;
}

const VERTEX_ICON = L.divIcon({
    className: 'stalker-ruler-vertex',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const MIDPOINT_ICON = L.divIcon({
    className: 'stalker-ruler-midpoint',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
});

function distanceMeters(a: L.LatLng, b: L.LatLng, lengthFactor: number): number {
    const dLat = a.lat - b.lat;
    const dLng = a.lng - b.lng;
    return Math.sqrt(dLat * dLat + dLng * dLng) * lengthFactor;
}

function bearingDegrees(a: L.LatLng, b: L.LatLng): number {
    const angle = (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI;
    return angle < 0 ? angle + 360 : angle;
}

function shoelaceArea(points: L.LatLng[], lengthFactor: number): number {
    if (points.length < 3) {
        return 0;
    }

    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        sum += current.lng * next.lat - next.lng * current.lat;
    }

    const factor = lengthFactor * lengthFactor;
    return Math.abs(sum) * 0.5 * factor;
}

function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '—';
    }

    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    }

    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
        return `${minutes}m`;
    }

    if (minutes <= 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}

const SCALE_SAMPLE_PX = 100;

function metersInPixels(map: L.Map, pixels: number, lengthFactor: number): number {
    const a = map.containerPointToLatLng(L.point(0, 0));
    const b = map.containerPointToLatLng(L.point(pixels, 0));
    return distanceMeters(a, b, lengthFactor);
}

function formatMetersPer100px(meters: number): string {
    if (!Number.isFinite(meters) || meters <= 0) {
        return '—';
    }

    if (meters >= 100) {
        return `${meters.toFixed(1)} m / ${SCALE_SAMPLE_PX}px`;
    }

    if (meters >= 10) {
        return `${meters.toFixed(2)} m / ${SCALE_SAMPLE_PX}px`;
    }

    return `${meters.toFixed(3)} m / ${SCALE_SAMPLE_PX}px`;
}

const StalkerRuler = L.Control.extend({
    options: {
        position: 'topright',
        lengthFactor: 1,
        speed: 1.4,
        debugScale: false,
        labels: {
            length: 'Distance:',
            azimuth: 'Azimuth:',
            area: 'Area:',
            perimeter: 'Perimeter:',
            speed: 'Speed:',
            time: 'Time:',
            meterShort: 'm',
            m2: 'm²',
            km2: 'km²',
            rulerRoute: 'Route',
            rulerArea: 'Area',
        },
        circleMarker: {
            color: '#c62828',
            radius: 2,
        },
        lineStyle: {
            color: '#c62828',
            weight: 2,
            dashArray: '1,6',
        },
        fillStyle: {
            color: '#c62828',
            weight: 2,
            fillColor: '#c62828',
            fillOpacity: 0.15,
            dashArray: '1,6',
        },
    } as StalkerRulerControlOptions,

    onAdd(this: any, map: L.Map) {
        this._map = map;
        this._mode = null as InternalMode;
        this._vertices = [] as VertexState[];
        this._midpointMarkers = [] as L.Marker[];
        this._defaultCursor = map.getContainer().style.cursor;
        this._speed = this.options.speed ?? 1.4;
        this._ignoreNextClick = false;
        this._dragging = false;

        this._container = L.DomUtil.create('div', 'leaflet-control stalker-ruler-control');
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.disableScrollPropagation(this._container);

        this._buttons = L.DomUtil.create('div', 'leaflet-bar stalker-ruler-buttons', this._container);

        this._routeButton = L.DomUtil.create('a', 'stalker-ruler-btn stalker-ruler-btn-route', this._buttons);
        this._routeButton.href = '#';
        this._routeButton.title = this.options.labels?.rulerRoute ?? 'Route';
        this._routeButton.setAttribute('role', 'button');
        this._routeButton.innerHTML = this._routeIconHtml();

        this._areaButton = L.DomUtil.create('a', 'stalker-ruler-btn stalker-ruler-btn-area', this._buttons);
        this._areaButton.href = '#';
        this._areaButton.title = this.options.labels?.rulerArea ?? 'Area';
        this._areaButton.setAttribute('role', 'button');
        this._areaButton.innerHTML = this._areaIconHtml();

        this._panel = L.DomUtil.create('div', 'stalker-ruler-panel', this._container);
        this._panel.hidden = true;

        this._debugScale = !!this.options.debugScale;
        this._scaleOpen = false;
        if (this._debugScale) {
            this._container.classList.add('is-debug');

            this._scaleButton = L.DomUtil.create('a', 'stalker-ruler-btn stalker-ruler-btn-scale', this._buttons);
            this._scaleButton.href = '#';
            this._scaleButton.title = 'Scale (m / 100px)';
            this._scaleButton.setAttribute('role', 'button');
            this._scaleButton.innerHTML = this._scaleIconHtml();

            this._scalePanel = L.DomUtil.create('div', 'stalker-ruler-panel stalker-ruler-scale-panel', this._container);
            this._scalePanel.hidden = true;
            this._scalePanel.innerHTML = `
                <div class="stalker-ruler-stat">
                    <span class="stalker-ruler-stat-label">Now</span>
                    <span class="stalker-ruler-stat-value stalker-ruler-scale-current">—</span>
                </div>
                <div class="stalker-ruler-stat stalker-ruler-stat-scale">
                    <span class="stalker-ruler-stat-label">Target</span>
                    <label class="stalker-ruler-scale-input">
                        <input type="number" min="0.001" step="any" />
                        <span>m / ${SCALE_SAMPLE_PX}px</span>
                    </label>
                </div>
                <button type="button" class="stalker-ruler-scale-apply">Set zoom</button>
            `;
            this._scaleCurrentEl = this._scalePanel.querySelector('.stalker-ruler-scale-current');
            this._scaleInput = this._scalePanel.querySelector('input');
            this._scaleApplyBtn = this._scalePanel.querySelector('.stalker-ruler-scale-apply');

            L.DomEvent.on(this._scaleButton, 'click', this._onScaleButtonClick, this);
            L.DomEvent.on(this._scaleApplyBtn, 'click', this._onScaleApplyClick, this);
            L.DomEvent.on(this._scaleInput, 'keydown', this._onScaleInputKeydown, this);
        }

        L.DomEvent.on(this._routeButton, 'click', this._onRouteButtonClick, this);
        L.DomEvent.on(this._areaButton, 'click', this._onAreaButtonClick, this);

        this._layer = L.layerGroup();
        this._shapeLayer = L.layerGroup().addTo(this._layer);
        this._vertexLayer = L.layerGroup().addTo(this._layer);
        this._midpointLayer = L.layerGroup().addTo(this._layer);
        this._tempLayer = L.layerGroup().addTo(this._layer);

        return this._container;
    },

    onRemove(this: any) {
        this._setMode(null);
        this._setScaleOpen(false);
        L.DomEvent.off(this._routeButton, 'click', this._onRouteButtonClick, this);
        L.DomEvent.off(this._areaButton, 'click', this._onAreaButtonClick, this);
        if (this._debugScale) {
            L.DomEvent.off(this._scaleButton, 'click', this._onScaleButtonClick, this);
            L.DomEvent.off(this._scaleApplyBtn, 'click', this._onScaleApplyClick, this);
            L.DomEvent.off(this._scaleInput, 'keydown', this._onScaleInputKeydown, this);
        }
    },

    isActive(this: any): boolean {
        return this._mode != null;
    },

    _routeIconHtml(): string {
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h4l3-8 3 5 3-4h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="18" r="1.6" fill="currentColor"/><circle cx="20" cy="11" r="1.6" fill="currentColor"/></svg>`;
    },

    _areaIconHtml(): string {
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h9l3 5-4 6H8L5 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="7" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/><circle cx="14" cy="18" r="1.5" fill="currentColor"/><circle cx="8" cy="18" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/></svg>`;
    },

    _scaleIconHtml(): string {
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14h18M3 14v5M7 14v3M11 14v5M15 14v3M21 14v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 6h6v6H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 6V4m0 10v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    },

    _onRouteButtonClick(this: any, e: Event) {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
        this._setMode(this._mode === 'route' ? null : 'route');
    },

    _onAreaButtonClick(this: any, e: Event) {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
        this._setMode(this._mode === 'area' ? null : 'area');
    },

    _onScaleButtonClick(this: any, e: Event) {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
        this._setScaleOpen(!this._scaleOpen);
    },

    _onScaleApplyClick(this: any, e: Event) {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
        this._applyTargetScale();
    },

    _onScaleInputKeydown(this: any, e: KeyboardEvent) {
        if (e.key === 'Enter') {
            L.DomEvent.preventDefault(e);
            this._applyTargetScale();
        }
    },

    _setScaleOpen(this: any, open: boolean) {
        if (!this._debugScale) {
            return;
        }

        this._scaleOpen = open;
        this._container.classList.toggle('is-scale', open);
        this._scaleButton.classList.toggle('is-active', open);
        this._scalePanel.hidden = !open;

        if (open) {
            this._updateScaleReadout(true);
            this._map.on('zoom move zoomend moveend', this._onScaleMapChange, this);
        } else {
            this._map.off('zoom move zoomend moveend', this._onScaleMapChange, this);
        }
    },

    _onScaleMapChange(this: any) {
        this._updateScaleReadout(false);
    },

    _updateScaleReadout(this: any, syncInput: boolean) {
        const meters = metersInPixels(this._map, SCALE_SAMPLE_PX, this.options.lengthFactor ?? 1);
        if (this._scaleCurrentEl) {
            this._scaleCurrentEl.textContent = formatMetersPer100px(meters);
        }

        if (syncInput && this._scaleInput && Number.isFinite(meters) && meters > 0) {
            this._scaleInput.value = String(Number(meters.toPrecision(6)));
        }
    },

    _applyTargetScale(this: any) {
        const target = Number(this._scaleInput?.value);
        if (!Number.isFinite(target) || target <= 0) {
            return;
        }

        const current = metersInPixels(this._map, SCALE_SAMPLE_PX, this.options.lengthFactor ?? 1);
        if (!Number.isFinite(current) || current <= 0) {
            return;
        }

        // meters ∝ 2^(-zoom) → targetZoom = currentZoom - log2(target / current)
        const nextZoom = this._map.getZoom() - Math.log2(target / current);
        const prevSnap = this._map.options.zoomSnap;
        this._map.options.zoomSnap = 0;
        this._map.setZoom(nextZoom);
        this._map.options.zoomSnap = prevSnap;
        this._updateScaleReadout(false);
    },

    _setMode(this: any, mode: InternalMode) {
        if (this._mode === mode) {
            return;
        }

        this._clearMeasurement();
        this._unbindMapEvents();

        this._mode = mode;
        this._container.classList.toggle('is-active', mode != null);
        this._container.classList.toggle('is-route', mode === 'route');
        this._container.classList.toggle('is-area', mode === 'area');
        this._routeButton.classList.toggle('is-active', mode === 'route');
        this._areaButton.classList.toggle('is-active', mode === 'area');

        if (mode == null) {
            this._map.getContainer().style.cursor = this._defaultCursor;
            this._map.removeLayer(this._layer);
            this._panel.hidden = true;
            this._panel.innerHTML = '';
            return;
        }

        this._map.getContainer().style.cursor = 'crosshair';
        this._layer.addTo(this._map);
        this._bindMapEvents();
        this._renderPanel();
    },

    _bindMapEvents(this: any) {
        this._map.on('click', this._onMapClick, this);
        this._map.on('mousemove', this._onMouseMove, this);
        this._map.on('dblclick', this._onDoubleClick, this);
        L.DomEvent.on(window as unknown as HTMLElement, 'keydown', this._onKeyDown, this);
        this._map.doubleClickZoom.disable();
    },

    _unbindMapEvents(this: any) {
        this._map.off('click', this._onMapClick, this);
        this._map.off('mousemove', this._onMouseMove, this);
        this._map.off('dblclick', this._onDoubleClick, this);
        L.DomEvent.off(window as unknown as HTMLElement, 'keydown', this._onKeyDown, this);
        this._map.doubleClickZoom.enable();
    },

    _onKeyDown(this: any, e: KeyboardEvent) {
        if ((e as any).keyCode !== 27 && e.key !== 'Escape') {
            return;
        }

        if (this._vertices.length > 0) {
            this._clearMeasurement();
            this._renderPanel();
            return;
        }

        this._setMode(null);
    },

    _onDoubleClick(this: any, e: L.LeafletMouseEvent) {
        L.DomEvent.stop(e);
        this._ignoreNextClick = true;
        this._clearTemp();
        this._rebuildGeometry();
        this._renderPanel();
    },

    _onMapClick(this: any, e: L.LeafletMouseEvent) {
        if (this._dragging || this._ignoreNextClick) {
            this._ignoreNextClick = false;
            return;
        }

        this._addVertex(e.latlng);
    },

    _onMouseMove(this: any, e: L.LeafletMouseEvent) {
        if (this._dragging || this._vertices.length === 0) {
            return;
        }

        this._drawTemp(e.latlng);
    },

    _addVertex(this: any, latlng: L.LatLng, index?: number) {
        const marker = this._createVertexMarker(latlng);
        const vertex: VertexState = { latlng, marker };

        if (index == null || index >= this._vertices.length) {
            this._vertices.push(vertex);
        } else {
            this._vertices.splice(index, 0, vertex);
        }

        this._vertexLayer.addLayer(marker);
        this._clearTemp();
        this._rebuildGeometry();
        this._renderPanel();
    },

    _createVertexMarker(this: any, latlng: L.LatLng): L.Marker {
        const marker = L.marker(latlng, {
            icon: VERTEX_ICON,
            draggable: true,
            zIndexOffset: 1000,
        });

        marker.on('dragstart', () => {
            this._dragging = true;
            this._clearTemp();
        });

        marker.on('drag', () => {
            const idx = this._vertices.findIndex((v: VertexState) => v.marker === marker);
            if (idx < 0) {
                return;
            }

            this._vertices[idx].latlng = marker.getLatLng();
            this._rebuildGeometry(false);
            this._renderPanel();
        });

        marker.on('dragend', () => {
            this._dragging = false;
            const idx = this._vertices.findIndex((v: VertexState) => v.marker === marker);
            if (idx >= 0) {
                this._vertices[idx].latlng = marker.getLatLng();
            }
            this._rebuildGeometry();
            this._renderPanel();
        });

        marker.on('click', (ev: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(ev);
        });

        return marker;
    },

    _rebuildGeometry(this: any, rebuildMidpoints: boolean = true) {
        this._shapeLayer.clearLayers();

        const points = this._vertices.map((v: VertexState) => v.latlng);
        if (points.length < 2) {
            if (rebuildMidpoints) {
                this._rebuildMidpoints();
            }
            return;
        }

        if (this._mode === 'area' && points.length >= 3) {
            L.polygon(points, this.options.fillStyle).addTo(this._shapeLayer);
        } else {
            L.polyline(points, this.options.lineStyle).addTo(this._shapeLayer);
        }

        if (rebuildMidpoints) {
            this._rebuildMidpoints();
        } else {
            this._updateMidpointPositions();
        }
    },

    _rebuildMidpoints(this: any) {
        this._midpointLayer.clearLayers();
        this._midpointMarkers = [];

        const points = this._vertices.map((v: VertexState) => v.latlng);
        if (points.length < 2) {
            return;
        }

        const edgeCount =
            this._mode === 'area' && points.length >= 3 ? points.length : points.length - 1;

        for (let i = 0; i < edgeCount; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            const mid = L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
            const marker = this._createMidpointMarker(mid, i + 1);
            this._midpointMarkers.push(marker);
            this._midpointLayer.addLayer(marker);
        }
    },

    _updateMidpointPositions(this: any) {
        const points = this._vertices.map((v: VertexState) => v.latlng);
        if (points.length < 2 || this._midpointMarkers.length === 0) {
            return;
        }

        const edgeCount =
            this._mode === 'area' && points.length >= 3 ? points.length : points.length - 1;

        for (let i = 0; i < Math.min(edgeCount, this._midpointMarkers.length); i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            this._midpointMarkers[i].setLatLng([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2]);
        }
    },

    _createMidpointMarker(this: any, latlng: L.LatLng, insertIndex: number): L.Marker {
        const marker = L.marker(latlng, {
            icon: MIDPOINT_ICON,
            draggable: true,
            zIndexOffset: 900,
        });

        (marker as any)._insertIndex = insertIndex;

        marker.on('dragstart', () => {
            this._dragging = true;
            this._clearTemp();
            this._promoteMidpoint(marker);
        });

        marker.on('click', (ev: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(ev);
        });

        return marker;
    },

    _promoteMidpoint(this: any, midpointMarker: L.Marker) {
        const insertIndex = (midpointMarker as any)._insertIndex as number;
        const latlng = midpointMarker.getLatLng();

        midpointMarker.off();
        this._midpointLayer.removeLayer(midpointMarker);

        const vertexMarker = this._createVertexMarker(latlng);
        this._vertices.splice(insertIndex, 0, { latlng, marker: vertexMarker });
        this._vertexLayer.addLayer(vertexMarker);
        this._rebuildGeometry(false);
        this._renderPanel();

        const onMove = (e: L.LeafletMouseEvent) => {
            vertexMarker.setLatLng(e.latlng);
            const idx = this._vertices.findIndex((v: VertexState) => v.marker === vertexMarker);
            if (idx >= 0) {
                this._vertices[idx].latlng = e.latlng;
            }
            this._rebuildGeometry(false);
            this._renderPanel();
        };

        const onUp = () => {
            this._map.off('mousemove', onMove, this);
            this._map.off('mouseup', onUp, this);
            document.removeEventListener('mouseup', onDocUp);
            this._dragging = false;
            this._rebuildGeometry();
            this._renderPanel();
        };

        const onDocUp = () => onUp();

        this._map.on('mousemove', onMove, this);
        this._map.on('mouseup', onUp, this);
        document.addEventListener('mouseup', onDocUp);
    },

    _drawTemp(this: any, latlng: L.LatLng) {
        this._tempLayer.clearLayers();
        const last = this._vertices[this._vertices.length - 1]?.latlng;
        if (!last) {
            return;
        }

        L.polyline([last, latlng], this.options.lineStyle).addTo(this._tempLayer);

        if (this._mode === 'area' && this._vertices.length >= 2) {
            const first = this._vertices[0].latlng;
            L.polyline([latlng, first], {
                ...this.options.lineStyle,
                opacity: 0.45,
            }).addTo(this._tempLayer);
        }
    },

    _clearTemp(this: any) {
        this._tempLayer.clearLayers();
    },

    _clearMeasurement(this: any) {
        this._vertices = [];
        this._midpointMarkers = [];
        this._shapeLayer.clearLayers();
        this._vertexLayer.clearLayers();
        this._midpointLayer.clearLayers();
        this._clearTemp();
    },

    _totalLength(this: any): number {
        const factor = this.options.lengthFactor ?? 1;
        const points = this._vertices.map((v: VertexState) => v.latlng);

        let total = 0;
        for (let i = 1; i < points.length; i++) {
            total += distanceMeters(points[i - 1], points[i], factor);
        }

        if (this._mode === 'area' && points.length >= 3) {
            total += distanceMeters(points[points.length - 1], points[0], factor);
        }

        return total;
    },

    _lastBearing(this: any): number | null {
        const points = this._vertices.map((v: VertexState) => v.latlng);

        if (points.length < 2) {
            return null;
        }

        return bearingDegrees(points[points.length - 2], points[points.length - 1]);
    },

    _areaValue(this: any): number {
        const factor = this.options.lengthFactor ?? 1;
        const points = this._vertices.map((v: VertexState) => v.latlng);
        return shoelaceArea(points, factor);
    },

    _formatLength(this: any, meters: number): string {
        const unit = this.options.labels?.meterShort ?? 'm';
        return `${meters.toFixed(2)} ${unit}`;
    },

    _formatArea(this: any, squareMeters: number): string {
        if (squareMeters >= 100_000) {
            const unit = this.options.labels?.km2 ?? 'km²';
            return `${(squareMeters / 1_000_000).toFixed(2)} ${unit}`;
        }

        const unit = this.options.labels?.m2 ?? 'm²';
        return `${squareMeters.toFixed(2)} ${unit}`;
    },

    _renderPanel(this: any) {
        if (this._mode == null) {
            this._panel.hidden = true;
            this._panel.innerHTML = '';
            return;
        }

        this._panel.hidden = false;
        const labels = this.options.labels ?? {};
        const length = this._totalLength();
        const rows: string[] = [];

        if (this._mode === 'route') {
            const bearing = this._lastBearing();
            if (bearing != null) {
                rows.push(this._statRow(labels.azimuth ?? 'Azimuth:', `${bearing.toFixed(2)}°`));
            }
            rows.push(this._statRow(labels.length ?? 'Distance:', this._formatLength(length)));
            rows.push(this._speedRow(labels));
            rows.push(
                this._statRow(
                    labels.time ?? 'Time:',
                    this._speed > 0 ? formatDuration(length / this._speed) : '—',
                    'stalker-ruler-time-value'
                )
            );
        } else {
            rows.push(this._statRow(labels.perimeter ?? 'Perimeter:', this._formatLength(length)));
            if (this._vertices.length >= 3) {
                rows.push(
                    this._statRow(labels.area ?? 'Area:', this._formatArea(this._areaValue()))
                );
            }
        }

        this._panel.innerHTML = rows.join('');
        this._bindSpeedInput();
    },

    _statRow(this: any, label: string, value: string, valueClass?: string): string {
        const extra = valueClass ? ` ${valueClass}` : '';
        return `<div class="stalker-ruler-stat"><span class="stalker-ruler-stat-label">${label}</span><span class="stalker-ruler-stat-value${extra}">${value}</span></div>`;
    },

    _speedRow(this: any, labels: StalkerRulerLabels): string {
        const unit = labels.meterShort ?? 'm';
        return `<div class="stalker-ruler-stat stalker-ruler-stat-speed"><span class="stalker-ruler-stat-label">${labels.speed ?? 'Speed:'}</span><label class="stalker-ruler-speed-input"><input type="number" min="0.1" step="0.1" value="${this._speed}" /><span>${unit}/s</span></label></div>`;
    },

    _bindSpeedInput(this: any) {
        const input = this._panel.querySelector('input[type="number"]') as HTMLInputElement | null;
        if (!input) {
            return;
        }

        const updateTime = () => {
            const next = Number(input.value);
            if (!Number.isFinite(next) || next <= 0) {
                return;
            }

            this._speed = next;
            const timeValue = this._panel.querySelector('.stalker-ruler-time-value');
            if (timeValue) {
                timeValue.textContent = formatDuration(this._totalLength() / this._speed);
            }
        };

        L.DomEvent.on(input, 'change', updateTime);
        L.DomEvent.on(input, 'input', updateTime);
    },
});

(L.Control as any).Ruler = StalkerRuler;

(L.control as any).ruler = function (options?: StalkerRulerControlOptions) {
    return new (StalkerRuler as any)(options);
};

export { StalkerRuler };
