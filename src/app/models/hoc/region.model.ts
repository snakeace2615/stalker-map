export interface HocRegionGeometry {
    type: string;
    /** Unreal cm coordinates: [x, z, y?] */
    coordinates: number[][];
}

export interface HocRegion {
    id: number;
    map_id: number;
    geometry: HocRegionGeometry;
    region_image: string | null;
    region_title: string;
    region_description: string;
}
