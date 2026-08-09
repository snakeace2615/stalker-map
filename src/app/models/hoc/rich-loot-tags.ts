import { Item } from '../item.model';

export const DEFAULT_RICH_LOOT_EXPENSIVE_THRESHOLD = 20000;

export interface RichLootSubFilterConfig {
    id: string;
    nameKey: string;
    /** Match `item.category` (category unique names). */
    categories?: string[];
    /** Exact `item.uniqueName` matches. */
    uniqueNames?: string[];
    /** Prefix matches on `item.uniqueName`. */
    uniqueNamePrefixes?: string[];
    /** Also tag when stash/stuff total cost exceeds the threshold. */
    matchByCostThreshold?: boolean;
    /** Only shown on rich-stash (e.g. blueprints). */
    stashOnly?: boolean;
}

let richLootSubFilters: RichLootSubFilterConfig[] = [];
let richLootExpensiveThreshold = DEFAULT_RICH_LOOT_EXPENSIVE_THRESHOLD;

/** Load subcategory rules from hoc_config.json (or equivalent). */
export function configureRichLootTags(config?: {
    richLootSubFilters?: RichLootSubFilterConfig[];
    richLootExpensiveThreshold?: number;
}): void {
    richLootSubFilters = config?.richLootSubFilters ?? [];
    richLootExpensiveThreshold =
        config?.richLootExpensiveThreshold ?? DEFAULT_RICH_LOOT_EXPENSIVE_THRESHOLD;
}

export function getRichLootSubFilters(): RichLootSubFilterConfig[] {
    return richLootSubFilters;
}

export function getRichStashSubFilters(): RichLootSubFilterConfig[] {
    return richLootSubFilters;
}

export function getRichStuffSubFilters(): RichLootSubFilterConfig[] {
    return richLootSubFilters.filter((filter) => !filter.stashOnly);
}

function itemMatchesFilter(item: Item, filter: RichLootSubFilterConfig): boolean {
    if (filter.categories?.includes(item.category)) {
        return true;
    }

    const uniqueName = item.uniqueName;
    if (!uniqueName) {
        return false;
    }

    if (filter.uniqueNames?.includes(uniqueName)) {
        return true;
    }

    if (filter.uniqueNamePrefixes?.some((prefix) => uniqueName.startsWith(prefix))) {
        return true;
    }

    return false;
}

export function getItemRichTags(item: Item): string[] {
    const tags: string[] = [];

    for (const filter of richLootSubFilters) {
        if (filter.id === 'expensive') {
            continue;
        }

        if (itemMatchesFilter(item, filter)) {
            tags.push(filter.id);
        }
    }

    // Fallback categories only when the item has no more specific rich tag.
    if (tags.length === 0) {
        const expensive = richLootSubFilters.find((filter) => filter.id === 'expensive');
        if (expensive && itemMatchesFilter(item, expensive)) {
            tags.push('expensive');
        }
    }

    return tags;
}

export function collectRichLootInfo(
    items: { item: Item; count?: number }[]
): { tags: string[]; cost: number; isRich: boolean } {
    const tags = new Set<string>();
    let cost = 0;

    for (const entry of items) {
        const item = entry.item;
        if (!item) {
            continue;
        }

        cost += (item.price ?? 0) * (entry.count ?? 1);

        for (const tag of getItemRichTags(item)) {
            tags.add(tag);
        }
    }

    const expensiveFilter = richLootSubFilters.find((filter) => filter.id === 'expensive');
    if (
        expensiveFilter?.matchByCostThreshold !== false &&
        cost > richLootExpensiveThreshold
    ) {
        tags.add('expensive');
    }

    return {
        tags: Array.from(tags),
        cost,
        isRich: tags.size > 0,
    };
}

/** Keep only subcategories that appear on at least one marker. */
export function pickPresentRichSubFilters(
    filters: RichLootSubFilterConfig[],
    markers: { richTags?: string[] }[]
): RichLootSubFilterConfig[] {
    const presentTags = new Set<string>();

    for (const marker of markers) {
        for (const tag of marker.richTags ?? []) {
            presentTags.add(tag);
        }
    }

    return filters.filter((filter) => presentTags.has(filter.id));
}

/** Locale / synonym / uniqueName keys used by map search. */
export function getItemSearchKeys(item: Item | null | undefined): string[] {
    if (!item) {
        return [];
    }

    const keys: string[] = [];

    if (item.localeName) {
        keys.push(item.localeName);
    }

    if (item.uniqueName) {
        // Keep uniqueName searchable (e.g. "artifact" → CArtifactLiquidStone).
        keys.push(item.uniqueName);
        keys.push(`synonyms.${item.uniqueName}`);
    }

    return keys;
}

/** Tag id + translated subcategory label keys for map search. */
export function getRichTagSearchKeys(tags: string[] | null | undefined): string[] {
    if (!tags?.length) {
        return [];
    }

    const keys: string[] = [];

    for (const tag of tags) {
        keys.push(tag);

        const filter = richLootSubFilters.find((entry) => entry.id === tag);
        if (filter) {
            keys.push(filter.nameKey);
        }
    }

    return keys;
}
