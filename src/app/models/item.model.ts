export type ItemType = 'item' | 'weapon' | 'outfit' | 'artefact' | 'hocWeapon';

export class Item {
    /** Discriminator written by the extractor (System.Text.Json polymorphism). */
    public $type: ItemType;

    public uniqueName: string;
    public localeName: string;
    public description: string;
    public category: string;

    public width: number;
    public height: number;
    public area: number;
    public weight: number;

    public gridX: number;
    public gridY: number;

    public price: number;
    public boxSize: number;

    public isQuest: boolean;
    public invisibleInPlayerInventory: boolean;
    public destroyOnPickup: boolean;

    // client-side metadata used by the compare feature
    public guid: string;
    public game: string;
}

/** Trilogy (CS/COP) item that can be upgraded at a mechanic. */
export class UpgradableItem extends Item {
    public upgradeScheme: string;
    public upgrades: string[];
    public installedUpgrades: string[];

    public upgr_icon_x: number;
    public upgr_icon_y: number;
    public upgr_icon_width: number;
    public upgr_icon_height: number;
}

/** Trilogy weapon ($type: "weapon"). */
export class Weapon extends UpgradableItem {
    public hasScope: boolean;
    public hasSilencer: boolean;
    public hasGrenadeLauncher: boolean;

    public scopeX: number;
    public scopeY: number;
    public silencerX: number;
    public silencerY: number;
    public grenadeLauncherX: number;
    public grenadeLauncherY: number;

    public camRelaxSpeed: number;
    public camDispersion: number;
    public camDispersionInc: number;
    public camDispertionFrac: number;
    public camMaxAngle: number;
    public camMaxAngleHorz: number;
    public camStepAngleHorz: number;

    public zoomCamRelaxSpeed: number;
    public zoomCamDispersion: number;
    public zoomCamDispersionInc: number;
    public zoomCamDispertionFrac: number;
    public zoomCamMaxAngle: number;
    public zoomCamMaxAngleHorz: number;
    public zoomCamStepAngleHorz: number;

    public fireDistance: number;
    public bulletSpeed: number;
    public rpm: number;
    public ammoMagazineSize: number;
    public conditionShotDec: number;

    public fireDispersionBase: number;
    public fireDispersionConditionFactor: number;

    public misfireProbability: number;
    public misfireConditionK: number;
    public hitPower: number[];

    // client-side: stack of hitPower configs while toggling upgrades
    public hitPowers: number[][];
}

/** Trilogy outfit/helmet ($type: "outfit"). */
export class Outfit extends UpgradableItem {
    public burnProtection: number;
    public shockProtection: number;
    public radiationProtection: number;
    public chemicalBurnProtection: number;
    public telepaticProtection: number;
    public strikeProtection: number;
    public explosionProtection: number;
    public woundProtection: number;
    public hitFractionActor: number;
    public powerLoss: number;
    public artefactCount: number;

    // added at runtime by upgrade effects
    public healthRestoreSpeed: number = 0;
    public bleedingRestoreSpeed: number = 0;
    public powerRestoreSpeed: number = 0;
    public additionalInventoryWeight: number = 0;
}

/** S2/HoC artefact ($type: "artefact"). */
export class Artefact extends Item {
    public name: string;
    public rarity: string;
    public detectorRequired: boolean;
    public artifactType: string;
    public archiartifactType: string;
    public lifeTime: number;
    public cost: number;
}

/** S2/HoC weapon ($type: "hocWeapon"). */
export class HocWeapon extends Item {
    public ammoPackCount: number;
    public fireInterval: number;

    public preinstalledAttachments: string[];
    public compatibleAttachments: Attachment[];
}

export class Attachment {
    public uniqueName: string;
    public gridX: number;
    public gridY: number;
}

export function isWeapon(item: Item): item is Weapon {
    return item?.$type === 'weapon';
}

export function isOutfit(item: Item): item is Outfit {
    return item?.$type === 'outfit';
}

export function isArtefact(item: Item): item is Artefact {
    return item?.$type === 'artefact';
}

export function isHocWeapon(item: Item): item is HocWeapon {
    return item?.$type === 'hocWeapon';
}

export function isUpgradable(item: Item): item is UpgradableItem {
    return isWeapon(item) || isOutfit(item);
}

// helpers for templates: `@if (asWeapon(item); as weapon) { ... }`
export function asWeapon(item: Item): Weapon | null {
    return isWeapon(item) ? item : null;
}

export function asOutfit(item: Item): Outfit | null {
    return isOutfit(item) ? item : null;
}

export function asUpgradable(item: Item): UpgradableItem | null {
    return isUpgradable(item) ? item : null;
}
