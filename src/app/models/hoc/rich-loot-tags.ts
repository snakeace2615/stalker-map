import { Item } from '../item.model';

export const RICH_LOOT_EXPENSIVE_THRESHOLD = 20000;

export const RICH_STASH_SUB_FILTERS: { id: string; nameKey: string }[] = [
    { id: 'blueprint', nameKey: 'richFilter.blueprint' },
    { id: 'attachment', nameKey: 'richFilter.attachment' },
    { id: 'nvg', nameKey: 'richFilter.nvg' },
    { id: 'binoculars', nameKey: 'richFilter.binoculars' },
    { id: 'money', nameKey: 'richFilter.money' },
    { id: 'artifact', nameKey: 'richFilter.artifact' },
    { id: 'note', nameKey: 'richFilter.note' },
    { id: 'expensive', nameKey: 'richFilter.expensive' },
];

/** Blueprints only drop in stashes — keep them out of rich-stuff filters. */
export const RICH_STUFF_SUB_FILTERS: { id: string; nameKey: string }[] =
    RICH_STASH_SUB_FILTERS.filter((filter) => filter.id !== 'blueprint');

const FALLBACK_RICH_CATEGORIES = new Set([
    'EItemType::Armor',
    'QuestItem',
    'KeyItem',
]);

export function getItemRichTags(item: Item): string[] {
    const tags: string[] = [];

    if (item.uniqueName?.startsWith('Blueprint_')) {
        tags.push('blueprint');
    }

    if (item.category === 'EItemType::Attach') {
        tags.push('attachment');
    }

    if (item.category === 'EItemType::NightVisionGoggles') {
        tags.push('nvg');
    }

    if (item.category === 'EItemType::Binoculars') {
        tags.push('binoculars');
    }

    if (item.uniqueName?.startsWith('Money')) {
        tags.push('money');
    }

    if (item.category === 'EItemType::Artifact') {
        tags.push('artifact');
    }

    if (item.category === 'EItemType::Info') {
        tags.push('note');
    }

    if (FALLBACK_RICH_CATEGORIES.has(item.category) && tags.length === 0) {
        tags.push('expensive');
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

    if (cost > RICH_LOOT_EXPENSIVE_THRESHOLD) {
        tags.add('expensive');
    }

    return {
        tags: Array.from(tags),
        cost,
        isRich: tags.size > 0,
    };
}
