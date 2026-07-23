import * as L from 'leaflet';

interface KeepMapSizeRegistry {
    markers: Set<any>;
    handler: () => void;
}

const keepMapSizeRegistries = new WeakMap<object, KeepMapSizeRegistry>();

let canvasIconClass: any;
let canvasMarkerClass: any;
let canvasRendererPatched = false;

function updateMarkerDrawSize(marker: any): void {
    const map = marker._map;
    const iconWrapper = marker.options?.icon;
    const canvasIcon = iconWrapper?.icon;

    if (!map || !canvasIcon) {
        return;
    }

    const imageFactor = canvasIcon.options?.imageFactor ?? 1;
    const baseRadius = marker.options.radius;
    const scaleFactor = map.scaleFactor ?? 1;

    const calculatedRadius = iconWrapper.keepMapSize
        ? baseRadius * Math.pow(2, map._zoom)
        : baseRadius;

    marker._radius = calculatedRadius * scaleFactor;
    marker._radius2 = marker._radius * 2;
    marker._drawRadius = marker._radius2 * imageFactor;
    marker._drawRadiusHalf = marker._radius * imageFactor;
}

function registerKeepMapSizeMarker(marker: any, map: any): void {
    let registry = keepMapSizeRegistries.get(map);

    if (!registry) {
        registry = {
            markers: new Set(),
                handler: () => {
                    for (const registered of registry!.markers) {
                        if (registered._map) {
                            updateMarkerDrawSize(registered);
                            if (typeof registered.redraw === 'function') {
                                registered.redraw();
                            }
                        }
                    }
                },
        };

        map.on('zoomend', registry.handler);
        keepMapSizeRegistries.set(map, registry);
    }

    registry.markers.add(marker);
    updateMarkerDrawSize(marker);
}

function unregisterKeepMapSizeMarker(marker: any, map: any): void {
    const registry = keepMapSizeRegistries.get(map);
    if (!registry) {
        return;
    }

    registry.markers.delete(marker);

    if (registry.markers.size === 0) {
        map.off('zoomend', registry.handler);
        keepMapSizeRegistries.delete(map);
    }
}

export function createCanvasIconClass(): any {
    if (canvasIconClass) {
        return canvasIconClass;
    }

    canvasIconClass = L.Icon.extend({
        setOptions(obj: any, options: any) {
            if (!Object.hasOwn(obj, 'options')) {
                obj.options = obj.options ? Object.create(obj.options) : {};
            }

            for (const i in options) {
                if (Object.hasOwn(options, i)) {
                    obj.options[i] = options[i];
                }
            }

            return obj.options;
        },

        initialize(options: any) {
            this.setOptions(this, options);
            this._image = new Image();

            if (this.options.imageFactor == null) {
                this.options.imageFactor = 1;
            }

            if (options.color) {
                fetch(options.iconUrl).then((response) => {
                    if (response.ok) {
                        response.text().then((svg: string) => {
                            const colored = svg.replace(/#FFFFFF/gm, options.color);
                            const svgBlob = new Blob([colored], { type: 'image/svg+xml' });
                            this._image.src = URL.createObjectURL(svgBlob);
                        });
                    }
                });
            } else {
                this._image.src = options.iconUrl;
            }
        },
    });

    return canvasIconClass;
}

export function createCanvasMarkerClass(): any {
    if (canvasMarkerClass) {
        return canvasMarkerClass;
    }

    canvasMarkerClass = L.CircleMarker.extend({
        _updatePath: function () {
            this._renderer._updateSvgMarker(this);
        },

        setOpacity: function (opacity: number) {
            this.setStyle({
                opacity: opacity,
                fillOpacity: opacity,
            });
        },

        onAdd: function (map: any) {
            L.CircleMarker.prototype.onAdd.call(this, map);

            if (this.options.icon) {
                updateMarkerDrawSize(this);

                if (this.options.icon.keepMapSize) {
                    registerKeepMapSizeMarker(this, map);
                }
            }

            return this;
        },

        onRemove: function (map: any) {
            if (this.options.icon?.keepMapSize) {
                unregisterKeepMapSizeMarker(this, map);
            }

            return L.CircleMarker.prototype.onRemove.call(this, map);
        },
    });

    return canvasMarkerClass;
}

export function createCanvasRenderer(): any {
    if (!canvasRendererPatched) {
        L.Canvas.include({
            _updateSvgMarker: function (layer: any) {
                if (!this._drawing || layer._empty() || layer.doNotRender) {
                    return;
                }

                try {
                    this._ctx.globalAlpha = layer.options.opacity;

                    const x = layer._point.x - layer._drawRadiusHalf;
                    const y = layer._point.y - layer._drawRadiusHalf;

                    this._ctx.drawImage(
                        layer.options.icon.icon._image,
                        x,
                        y,
                        layer._drawRadius,
                        layer._drawRadius
                    );
                } catch (ex) {
                    console.log(layer);
                    console.log(ex);
                }
            },
        });

        canvasRendererPatched = true;
    }

    return L.canvas();
}
