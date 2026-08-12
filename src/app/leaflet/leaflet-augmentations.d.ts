import 'leaflet';

declare module 'leaflet' {
    interface Map {
        scaleFactor?: number;
    }

    interface TileLayer {
        name?: string;
        ableToSearch?: boolean;
        addToTop?: boolean;
    }

    interface CRS {
        transformation: Transformation;
    }

    interface LayersOptions {
        overlaysListTop?: string | null;
    }

    interface ImageOverlay {
        name?: string;
        uniqueName?: string;
        id?: number;
    }

    interface RulerControlOptions extends ControlOptions {
        position?: ControlPosition;
        lengthFactor?: number;
        speed?: number;
        labels?: {
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
        };
        circleMarker?: CircleMarkerOptions;
        lineStyle?: PolylineOptions;
        fillStyle?: PolylineOptions;
        events?: {
            onToggle?: (isActive: boolean) => void;
        };
    }

    interface CustomLayersControlOptions extends LayersOptions {
        overlaysListTop?: string | null;
    }

    interface SliderControlOptions extends ControlOptions {
        onChange?: (value: number | string) => void;
    }

    namespace Control {
        class Ruler extends Control {
            isActive(): boolean;
        }

        // Runtime-defined via L.Control.*.extend(...)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let CustomLayers: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let Slider: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let StashFilter: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let DlcFilter: any;
    }

    interface Transformation {
        _a: number;
        _b: number;
        _c: number;
        _d: number;
    }

    interface StashFilterControlOptions extends ControlOptions {
        gameCategories?: string[];
        categoriesConfig?: { gameCategories: string[]; name: string }[];
        layers?: LayerGroup[];
    }

    namespace control {
        function ruler(options?: RulerControlOptions): Control.Ruler;
        function customLayers(
            baseLayers?: LayersObject | null,
            overlays?: LayersObject | null,
            options?: CustomLayersControlOptions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ): any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function slider(options?: SliderControlOptions): any;
        function stashFilter(options?: StashFilterControlOptions): Control.StashFilter;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function dlcFilter(): any;
    }
}
