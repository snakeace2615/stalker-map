import { MapComponent } from './../components/map/map.component';
import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Injectable, ViewContainerRef } from "@angular/core";
import { HiddenMarker } from "../models/hidden-marker.model";
import { StuffComponent } from '../components/stuff/stuff.component';
import { Item } from '../models/item.model';
import { LootBoxClusterComponent } from '../components/loot-box-cluster/loot-box-cluster.component';
import { LootBox } from '../models/loot-box/loot-box-section.model';
import { LootBoxConfig } from '../models/loot-box/loot-box-config.model';
import { Location } from '../models/location.model';
import { AnomalyZoneComponent } from '../components/anomaly-zone/anomaly-zone.component';
import { TraderComponent } from '../components/trader/trader.component';
import { TraderModel } from '../models/trader';
import { TraderSectionsConfig } from '../models/trader/trader-sections-config.model';
import { MapConfig } from '../models/gamedata/map-config';
import { StalkerComponent } from '../components/stalker/stalker.component';
import { Mechanic } from '../models/mechanic.model';
import { MechanicComponent } from '../components/mechanic/mechanic.component';
import { ItemUpgrade, UpgradeProperty } from '../models/upgrades/upgrades';
import { TranslateService } from '@ngx-translate/core';
import { Game } from '../models/game.model';
import { BottomSheetWrapperComponent } from '../components/bottom-sheet-wrapper/bottom-sheet-wrapper.component';
import { PopupComponent } from '../components/popup/popup.component';
import { L } from '../leaflet/leaflet-setup';
import { createCanvasIconClass, createCanvasMarkerClass, createCanvasRenderer } from '../leaflet/canvas-markers';
import type { StalkerLayerGroup, StalkerMap, StalkerMarker, StalkerRulerControl } from '../leaflet/stalker-leaflet.types';

@Injectable({
    providedIn: 'root'
})

export class MapService {
    private hiddenMarksLocalStorageKey: string = 'hidden-markers';
    private hiddenMarksCache: HiddenMarker[];
    private mapComponent: MapComponent;
    private bottomSheetWrapper: ComponentRef<BottomSheetWrapperComponent>;

    constructor(
        private translate: TranslateService,
        private environmentInjector: EnvironmentInjector,
        private appRef: ApplicationRef) {

    }

    public setMapComponent(mapComponent: MapComponent): void {
        this.mapComponent = mapComponent;
    }

    public createStashContent(stash: any, container: ViewContainerRef, game: Game, allItems: Item[], isUnderground: boolean, isPopup: boolean) {
        const componentRef = container.createComponent(StuffComponent);
        componentRef.instance.stuff = stash.properties.stuff;
        componentRef.instance.game = game;
        componentRef.instance.allItems = allItems;
        componentRef.instance.stuffType = stash.properties.typeUniqueName;
        componentRef.instance.isUnderground = isUnderground;
        componentRef.instance.isPopup = isPopup;

        return componentRef;
    }

    public createLootBoxContent(lootBox: any, container: ViewContainerRef, game: Game, allItems: Item[], locations: Location[], lootBoxConfig: LootBoxConfig, isUnderground: boolean) {
        const componentRef = container.createComponent(LootBoxClusterComponent);
        componentRef.instance.cluster = lootBox.properties.lootBox;
        componentRef.instance.game = game;
        componentRef.instance.allItems = allItems;

        let location: Location = locations.find(x => x.id == lootBox.properties.lootBox.locationId) as Location;
        let lootBoxLocationConfig = lootBoxConfig.locations.find(x => x.name == location.uniqueName);

        componentRef.instance.lootBoxConfigs = lootBoxConfig.boxes;
        componentRef.instance.lootBoxLocationConfig = lootBoxLocationConfig as LootBox;
        componentRef.instance.isUnderground = isUnderground;

        return componentRef;
    }

    public createTraderContent(marker: any, traders: TraderModel[], container: ViewContainerRef, game: Game, allItems: Item[], mapConfig: MapConfig, isPopup: boolean): ComponentRef<TraderComponent> {
        let trader: TraderModel = marker.properties.traderConfig;

        const componentRef = container.createComponent(TraderComponent);
        componentRef.instance.trader = trader;
        componentRef.instance.allTraders = traders;
        componentRef.instance.game = game;
        componentRef.instance.allItems = allItems;
        componentRef.instance.rankSetting = mapConfig.rankSetting;
        componentRef.instance.relationType = mapConfig.traderRelationType;
        componentRef.instance.actor = mapConfig.actor;
        componentRef.instance.traderConfigs = mapConfig.traderConfigs;
        componentRef.instance.traderConfig = mapConfig.traderConfigs?.find(x => x.trader == trader.profile.name) as TraderSectionsConfig;
        componentRef.instance.isPopup = isPopup;

        return componentRef;
    }

    public createStalkerContent(stalkerMarker: any, container: ViewContainerRef, game: Game, allItems: Item[], mapConfig: MapConfig, isUnderground: boolean, ismobile: boolean): ComponentRef<StalkerComponent> {
        const componentRef = container.createComponent(StalkerComponent);
        componentRef.instance.stalker = stalkerMarker.properties.stalker;
        componentRef.instance.game = game;
        componentRef.instance.allItems = allItems;
        componentRef.instance.rankSetting = mapConfig.rankSetting;
        componentRef.instance.isUnderground = isUnderground;
        componentRef.instance.isBottomSheet = ismobile;

        return componentRef;
    }

    public createAnomalyZoneContent(marker: any, container: ViewContainerRef, game: Game, allItems: Item[], isUnderground: boolean): ComponentRef<AnomalyZoneComponent> {
        const componentRef = container.createComponent(AnomalyZoneComponent);
        componentRef.instance.anomalZone = marker.properties.zoneModel;
        componentRef.instance.game = game;
        componentRef.instance.allItems = allItems;
        componentRef.instance.isUnderground = isUnderground;

        return componentRef;
    }

    public createMechanicContent(marker: any, container: ViewContainerRef, game: Game, allItems: Item[], mapConfig: MapConfig, upgrades: ItemUpgrade[], upgradeProperties: UpgradeProperty[]): ComponentRef<MechanicComponent> {
        const componentRef = container.createComponent(MechanicComponent);
        componentRef.instance.mechanic = marker.properties.mechanic;
        componentRef.instance.game = game;
        componentRef.instance.allItems = allItems;
        componentRef.instance.rankSetting = mapConfig.rankSetting;
        componentRef.instance.relationType = mapConfig.traderRelationType;
        componentRef.instance.actor = mapConfig.actor;
        componentRef.instance.upgrades = upgrades;
        componentRef.instance.upgradeProperties = upgradeProperties;

        return componentRef;
    }

    private getMapWrapperWidth(): number {
        const wrapper = document.getElementById('map-wrapper');
        if (wrapper) {
            return Math.ceil(wrapper.getBoundingClientRect().width);
        }

        return window.innerWidth;
    }

    private preparePopup(innerContentRef: ComponentRef<any>): { popupComponentRef: ComponentRef<PopupComponent>, calculatedWidth: number } {
        const popupComponentRef = createComponent(PopupComponent, {
            environmentInjector: this.environmentInjector,
            projectableNodes: [[innerContentRef.location.nativeElement]]
        });

        // 1. Спочатку ініціалізуємо внутрішній контент (StalkerComponent тощо),
        // щоб там відпрацював ngOnInit і з'явився hiddenMarker
        innerContentRef.changeDetectorRef.detectChanges();

        // 2. Тепер передаємо дані через setInput (це надійніше в Angular 21)
        if (innerContentRef.instance.hiddenMarker) {
            popupComponentRef.setInput('marker', innerContentRef.instance.hiddenMarker);
        }
        if (innerContentRef.instance.shareUrl) {
            popupComponentRef.setInput('shareUrl', innerContentRef.instance.shareUrl);
        }

        this.appRef.attachView(popupComponentRef.hostView);

        // 3. Робимо заміри ширини
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;top:0;left:0;';
        document.body.appendChild(tempContainer);
        tempContainer.appendChild(popupComponentRef.location.nativeElement);

        // 4. Фінальна перевірка змін для попапа
        popupComponentRef.changeDetectorRef.detectChanges();

        const calculatedWidth = Math.ceil(popupComponentRef.location.nativeElement.getBoundingClientRect().width);
        document.body.removeChild(tempContainer);

        return { popupComponentRef, calculatedWidth };
    }

    private openPreparedPopup(map: any, marker: any, innerContentRef: ComponentRef<any>, popupComponentRef: ComponentRef<PopupComponent>, calculatedWidth: number): void {
        const popup = L.popup({
            minWidth: calculatedWidth,
            maxWidth: calculatedWidth,
            className: 'stalker-custom-popup',
            autoPanPadding: [20, 20],
            closeButton: false
        })
            .setLatLng(marker.getLatLng())
            .setContent(popupComponentRef.location.nativeElement);

        popupComponentRef.instance.popup = popup;

        popup.on('remove', () => {
            popupComponentRef.destroy();
            innerContentRef.destroy();
        });

        popup.openOn(map);
    }

    public onMarkerClick(event: any, map: any, container: ViewContainerRef, bottomSheetContainer: BottomSheetWrapperComponent, contentMaker: (container: ViewContainerRef, isPopup: boolean) => any): void {
        const canUseSheet = bottomSheetContainer != null && (bottomSheetContainer as any).contentContainer != null;
        let wantsPopup: boolean = !(window.innerWidth < 500 && canUseSheet);

        if (!wantsPopup) {
            bottomSheetContainer.contentContainer.clear();
            contentMaker(bottomSheetContainer.contentContainer, false);
            bottomSheetContainer.show();
            return;
        }

        // Створюємо контент для popup (щоб коректно поміряти реальну ширину)
        const popupContent = contentMaker(container, true) as ComponentRef<any>;

        const { popupComponentRef, calculatedWidth } = this.preparePopup(popupContent);
        const mapWrapperWidth = this.getMapWrapperWidth();

        if (canUseSheet && calculatedWidth > mapWrapperWidth) {
            // Якщо popup виходить за ширину контейнера карти - замінюємо на sheet.
            this.appRef.detachView(popupComponentRef.hostView);
            popupComponentRef.destroy();

            container.clear();

            bottomSheetContainer.contentContainer.clear();
            contentMaker(bottomSheetContainer.contentContainer, false);
            bottomSheetContainer.show();
            return;
        }

        this.openPreparedPopup(map, event.target, popupContent, popupComponentRef, calculatedWidth);
    }

    public handleStalkerClick(event: any, map: any, container: ViewContainerRef, bottomSheetContainer: BottomSheetWrapperComponent, game: Game, items: Item[], mapConfig: MapConfig, isUnderground: boolean): void {
        const canUseSheet = bottomSheetContainer != null && (bottomSheetContainer as any).contentContainer != null;
        let wantsPopup: boolean = !(window.innerWidth < 500 && canUseSheet);

        if (!wantsPopup) {
            bottomSheetContainer.contentContainer.clear();
            this.createStalkerContent(
                event.target,
                bottomSheetContainer.contentContainer,
                game,
                items,
                mapConfig,
                isUnderground,
                true // bottom sheet mode
            );
            bottomSheetContainer.show();
            return;
        }

        // Створюємо контент для popup (щоб коректно поміряти реальну ширину)
        const popupContent = this.createStalkerContent(
            event.target,
            container,
            game,
            items,
            mapConfig,
            isUnderground,
            false // popup mode
        );

        const { popupComponentRef, calculatedWidth } = this.preparePopup(popupContent);
        const mapWrapperWidth = this.getMapWrapperWidth();

        if (canUseSheet && calculatedWidth > mapWrapperWidth) {
            this.appRef.detachView(popupComponentRef.hostView);
            popupComponentRef.destroy();

            container.clear();

            bottomSheetContainer.contentContainer.clear();
            this.createStalkerContent(
                event.target,
                bottomSheetContainer.contentContainer,
                game,
                items,
                mapConfig,
                isUnderground,
                true // bottom sheet mode
            );
            bottomSheetContainer.show();
            return;
        }

        this.openPreparedPopup(map, event.target, popupContent, popupComponentRef, calculatedWidth);
    }

    public setCellSize(value: number | string, game: string): void {
        document.documentElement.style.setProperty(
            '--inventory-cell-size',
            `${value}px`
        );
    }

    private bindPopup(map: any, marker: any, innerContentRef: ComponentRef<any>) {
        const { popupComponentRef, calculatedWidth } = this.preparePopup(innerContentRef);
        this.openPreparedPopup(map, marker, innerContentRef, popupComponentRef, calculatedWidth);
    }

    private createPopup(): void {

    }

    public createStuffTooltip(stuff: any) {
        let html = `<div class="header-tip"><p class="p-header">${this.translate.instant(
            stuff.properties.stuff.name
        )}</p></div>`;
        if (stuff.description) {
            html += `<div class="tooltip-text"><p>${this.translate.instant(
                stuff.properties.stuff.description
            )}</p></div>`;
        }

        return html;
    }

    public addRuler(
        map: StalkerMap,
        lengthFactor: number = 1,
        speed: number = 1.4
    ): StalkerRulerControl {
        const options: L.RulerControlOptions = {
            position: 'topright',
            lengthFactor,
            speed,
            labels: {
                length: this.translate.instant('length'),
                azimuth: this.translate.instant('azimuth'),
                area: this.translate.instant('area'),
                perimeter: this.translate.instant('perimeter'),
                speed: this.translate.instant('speed'),
                time: this.translate.instant('time'),
                meterShort: this.translate.instant('meterShort'),
                m2: this.translate.instant('m2'),
                km2: this.translate.instant('km2'),
                rulerRoute: this.translate.instant('rulerRoute'),
                rulerArea: this.translate.instant('rulerArea'),
            },
        };

        return L.control.ruler(options) as StalkerRulerControl;
    }

    public createAnomalyZoneTooltip(zone: any) {
        let html = `<div class="header-tip"><p class="p-header">${this.translate.instant(zone.properties.name)}</p></div>`;
        if (zone.description) {
            html += `<div class="tooltip-text"><p>${zone.properties.description}</p></div>`;
        }

        return html;
    }

    public isMarkHidden(marker: HiddenMarker): boolean {
        return this.getAllHiddenMarkers().some(x => {
            return x.lat == marker.lat &&
                x.lng == marker.lng &&
                x.layerName == marker.layerName
        });
    }

    public hideMark(markerToHide: HiddenMarker): void {
        let hiddenMarkers: HiddenMarker[] = this.getAllHiddenMarkers();
        hiddenMarkers.push(markerToHide);

        this.setHiddenMarkers(hiddenMarkers);

        this.mapComponent.hideMarker(markerToHide);
    }

    public unhideMark(marker: HiddenMarker): void {
        let hiddenMarkers: HiddenMarker[] = this.getAllHiddenMarkers();

        hiddenMarkers = hiddenMarkers.filter((x: HiddenMarker) => {
            if (x.layerName != marker.layerName) {
                return true;
            }

            if (x.lat != marker.lat) {
                return true;
            }

            if (x.lng != marker.lng) {
                return true;
            }

            return false;
        });

        this.setHiddenMarkers(hiddenMarkers);
        this.mapComponent.unhideMarker(marker);
    }

    public getAllHiddenMarkers(): HiddenMarker[] {
        if (this.hiddenMarksCache) {
            return this.hiddenMarksCache;
        }
        else {
            let allHiddenMarkers = localStorage.getItem(this.hiddenMarksLocalStorageKey);

            if (allHiddenMarkers) {
                this.hiddenMarksCache = JSON.parse(allHiddenMarkers);

                if (this.hiddenMarksCache) {
                    this.hiddenMarksCache = this.hiddenMarksCache.filter(x => x.game == this.mapComponent.game.uniqueName);
                }

                return this.hiddenMarksCache;
            }
        }

        return [];
    }

    public getCanvasIconConstructor(): any {
        return createCanvasIconClass();
    }

    public getCanvasMarkerConstructor(): any {
        return createCanvasMarkerClass();
    }

    public getCanvasRenderer(): any {
        return createCanvasRenderer();
    }

    public createCustomLayersControl(): void {
        L.Control.CustomLayers = L.Control.Layers.extend({
            // @section
            // @aka Control.Layers options
            options: {
                // @option collapsed: Boolean = true
                // If `true`, the control will be collapsed into an icon and expanded on mouse hover, touch, or keyboard activation.
                collapsed: true,
                position: 'topright',

                // @option autoZIndex: Boolean = true
                // If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
                autoZIndex: true,

                // @option hideSingleBase: Boolean = false
                // If `true`, the base layers in the control will be hidden when there is only one.
                hideSingleBase: false,

                // @option sortLayers: Boolean = false
                // Whether to sort the layers. When `false`, layers will keep the order
                // in which they were added to the control.
                sortLayers: false,
                overlaysListTop: null,

                // @option sortFunction: Function = *
                // A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
                // that will be used for sorting the layers, when `sortLayers` is `true`.
                // The function receives both the `L.Layer` instances and their names, as in
                // `sortFunction(layerA, layerB, nameA, nameB)`.
                // By default, it sorts layers alphabetically by their name.
                sortFunction(layerA: any, layerB: any, nameA: any, nameB: any) {
                    return nameA < nameB ? -1 : (nameB < nameA ? 1 : 0);
                }
            },

            _initLayout: function () {
                (L.Control.Layers.prototype as any)._initLayout.call(this);

                if (!this.isUnderground && this.options.overlaysListTop) {
                    this._overlaysListTop = document.getElementById(this.options.overlaysListTop);
                }
            },

            initialize: function (baseLayers: any, overlays: any, options: any) {
                L.Util.setOptions(this, options);

                this._layerControlInputs = [];
                this._layerControlInputsTop = [];
                this._layers = [];
                this._lastZIndex = 0;
                this._handlingClick = false;
                this._preventClick = false;

                for (const i in baseLayers) {
                    if (Object.hasOwn(baseLayers, i)) {
                        this._addLayer(baseLayers[i], i);
                    }
                }

                for (const i in overlays) {
                    if (Object.hasOwn(overlays, i)) {
                        this._addLayer(overlays[i], i, true);
                    }
                }
            },

            _update: function () {
                if (!this._container) { return this; }

                this._baseLayersList.replaceChildren();
                this._overlaysList.replaceChildren();
                if (!this.isUnderground && this.options.overlaysListTop) {
                    this._overlaysListTop.replaceChildren();
                }

                this._layerControlInputs = [];
                this._layerControlInputsTop = [];
                let baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;

                for (i = 0; i < this._layers.length; i++) {
                    obj = this._layers[i];
                    this._addItem(obj);
                    overlaysPresent = overlaysPresent || obj.overlay;
                    baseLayersPresent = baseLayersPresent || !obj.overlay;
                    baseLayersCount += !obj.overlay ? 1 : 0;
                }

                // Hide base layers section if there's only one layer.
                if (this.options.hideSingleBase) {
                    baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
                    this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
                }

                this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

                return this;
            },

            _addItem: function (obj: any) {
                const label = document.createElement('label'),
                    checked = this._map.hasLayer(obj.layer),
                    labelTop = document.createElement('label');

                let input;
                let inputTop;

                if (obj.overlay) {
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    input.className = 'leaflet-control-layers-selector';
                    input.defaultChecked = checked;

                    inputTop = document.createElement('input');
                    inputTop.type = 'checkbox';
                    inputTop.className = 'leaflet-control-layers-selector';
                    inputTop.defaultChecked = checked;
                } else {
                    input = this._createRadioElement(`leaflet-base-layers_${L.Util.stamp(this)}`, checked);
                    inputTop = this._createRadioElement(`leaflet-base-layers_${L.Util.stamp(this)}`, checked);
                }

                inputTop.hidden = true;

                this._layerControlInputs.push(input);

                if (this.options.overlaysListTop && obj.layer.addToTop !== false) {
                    this._layerControlInputsTop.push(inputTop);
                }
                input.layerId = L.Util.stamp(obj.layer);

                let layerId;

                if (this.options.overlaysListTop) {
                    layerId = this._overlaysListTop.childNodes.length;
                }
                else {
                    layerId = L.Util.stamp(obj.layer);
                }

                const subHeaderPanel = document.createElement('div');
                const subHeaderCheckbox = document.createElement('label');
                const subHeaderSpan = document.createElement('span');
                const subHeaderSpanName = document.createElement('span');
                const labelInsideCheck = document.createElement('label');
                subHeaderSpanName.innerHTML = `${obj.name}`;

                subHeaderPanel.classList.add('sub-header-item');
                subHeaderPanel.classList.add('left-arc');
                subHeaderPanel.classList.add('right-arc');
                subHeaderCheckbox.classList.add('sub-header-checkbox');

                subHeaderPanel.appendChild(subHeaderCheckbox);
                subHeaderCheckbox.appendChild(subHeaderSpan);
                subHeaderSpan.appendChild(inputTop);
                subHeaderSpan.appendChild(labelInsideCheck);
                subHeaderSpan.appendChild(subHeaderSpanName);

                input.id = `layer-${layerId}`;
                inputTop.id = `layer-top-${layerId}`;
                labelInsideCheck.setAttribute('for', inputTop.id);

                if (!obj.layer.isUnderground && this.options.overlaysListTop && obj.layer.addToTop !== false) {
                    obj.layer.topId = this._overlaysListTop.childNodes.length;
                    this._overlaysListTop.appendChild(subHeaderPanel);
                }

                L.DomEvent.on(input, 'click', this._onInputClick, this);
                L.DomEvent.on(subHeaderCheckbox, 'click', this._onInputClickTop, this);

                const name = document.createElement('span');
                name.innerHTML = `${obj.name}`;
                name.classList.add('stalker-search-item', obj.layer.name);

                // Helps from preventing layer control flicker when checkboxes are disabled
                // https://github.com/Leaflet/Leaflet/issues/2771
                const holder = document.createElement('span');
                //const holderTop = document.createElement('span');

                //labelTop.appendChild(holderTop);
                label.appendChild(holder);

                //holderTop.appendChild(inputTop)
                holder.appendChild(input);

                //holderTop.appendChild(nameTop)
                holder.appendChild(name);

                const container = obj.overlay ? this._overlaysList : this._baseLayersList;
                container.appendChild(label);

                this._checkDisabledLayers();
                return label;
            },

            _onInputClick: function () {
                // expanding the control on mobile with a click can cause adding a layer - we don't want this
                if (this._preventClick) {
                    return;
                }

                const inputs = this._layerControlInputs,
                    inputsTop = this._layerControlInputsTop,
                    addedLayers = [],
                    removedLayers = [];
                let input, inputTop, layer;

                this._handlingClick = true;

                if (this.options.overlaysListTop) {
                    for (let i = inputs.length - 1; i >= 0; i--) {
                        input = inputs[i];
                        layer = this._getLayer(input.layerId).layer;

                        inputTop = inputsTop[layer.topId];

                        if (input.checked) {
                            if (layer.addToTop !== false) {
                                inputTop.checked = true;
                            }

                            addedLayers.push(layer);
                        } else if (!input.checked) {
                            if (layer.addToTop !== false) {
                                inputTop.checked = false;
                            }

                            removedLayers.push(layer);
                        }
                    }
                }
                else {
                    for (let i = inputs.length - 1; i >= 0; i--) {
                        input = inputs[i];
                        layer = this._getLayer(input.layerId).layer;

                        if (input.checked) {
                            addedLayers.push(layer);
                        } else if (!input.checked) {
                            removedLayers.push(layer);
                        }
                    }
                }


                this._onInputClickFinal(addedLayers, removedLayers);
            },

            _onInputClickTop: function () {
                // expanding the control on mobile with a click can cause adding a layer - we don't want this
                if (this._preventClick) {
                    return;
                }

                const inputs = this._layerControlInputs,
                    inputsTop = this._layerControlInputsTop,
                    addedLayers = [],
                    removedLayers = [];
                let input, inputTop, layer;

                this._handlingClick = true;

                for (let i = inputs.length - 1; i >= 0; i--) {
                    input = inputs[i];
                    layer = this._getLayer(input.layerId).layer;

                    if (layer.topId) {
                        inputTop = inputsTop[layer.topId];

                        if (inputTop.checked) {
                            input.checked = true;
                            addedLayers.push(layer);
                        } else if (!inputTop.checked) {
                            input.checked = false;
                            removedLayers.push(layer);
                        }
                    }
                }

                this._onInputClickFinal(addedLayers, removedLayers);
            },

            _onInputClickFinal(addedLayers: any, removedLayers: any) {
                for (let i = 0; i < removedLayers.length; i++) {
                    if (this._map.hasLayer(removedLayers[i])) {
                        this._map.removeLayer(removedLayers[i]);
                    }
                }
                for (let i = 0; i < addedLayers.length; i++) {
                    if (!this._map.hasLayer(addedLayers[i])) {
                        this._map.addLayer(addedLayers[i]);
                    }
                }

                this._handlingClick = false;
                this._refocusOnMap();
            },
        } as any);

        L.control.customLayers = function (baseLayers: any, overlays: any, options: any) {
            return new L.Control.CustomLayers(baseLayers, overlays, options);
        }
    }

    public createCarousel(container: string): void {
        let carousel = document.getElementById(container) as HTMLElement;

        if (carousel.scrollWidth > carousel.clientWidth) {
            let arrows: any = document.getElementsByClassName('sub-header-panel-scroll');

            for (let arrow of arrows) {
                arrow.style.display = 'block';
            }

            arrows[0].addEventListener('click', function (e: any) {
                carousel.scrollLeft -= 100
            });

            arrows[1].addEventListener('click', function (e: any) {
                carousel.scrollLeft += 100
            });
        }

        carousel.addEventListener('wheel', function (e) {
            if (e.deltaY > 0)
                carousel.scrollLeft += 100;
            else
                carousel.scrollLeft -= 100;
        });
    }

    public getShapeTypes(): any[] {
        return [
            {
                type: 100,
                stroke: '#00ff00',
                fill: '#00ff001e',
                name: 'acidic',
            },
            {
                type: 101,
                stroke: '#0099ff',
                fill: '#0099ff1e',
                name: 'psychic',
            },
            {
                type: 102,
                stroke: '#fbff00',
                fill: '#fbff001e',
                name: 'radioactive',
                fills: ['#7EA172', '#FFD54F', '#E65100', '#900C3F', '#4A0E17'].map(x => x.toLowerCase())
            },
            {
                type: 103,
                stroke: '#ff8400',
                fill: '#ff84001e',
                name: 'thermal',
            }
        ]
    }

    private setHiddenMarkers(markers: HiddenMarker[]): void {
        this.hiddenMarksCache = markers;
        localStorage.setItem(this.hiddenMarksLocalStorageKey, JSON.stringify(markers));
    }
}
