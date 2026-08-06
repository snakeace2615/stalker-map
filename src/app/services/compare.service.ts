import { EventEmitter, Injectable } from '@angular/core';
import { Outfit, UpgradableItem, Weapon } from '../models/item.model';
import { v4 as uuidv4 } from 'uuid';
import { ItemUpgrade, Upgrade, UpgradeSection } from '../models/upgrades/upgrades';

@Injectable({
    providedIn: 'root'
})
export class CompareService {
    public readonly maxWeapons = 16;
    public readonly maxOutfits = 16;
    public weaponsToCompare: Weapon[] = [];
    public outfitsToCompare: Outfit[] = [];
    public weaponsToCompareStorageKey = 'weapons-to-compare';

    public isOpen = false;
    public itemsChanged = new EventEmitter<void>();
    public openChanged = new EventEmitter<boolean>();

    /** Base (pre-upgrade) snapshots keyed by compare column guid. */
    private weaponBases = new Map<string, Weapon>();
    private outfitBases = new Map<string, Outfit>();

    constructor() {
        this.restore();
    }

    public get activeGame(): string | null {
        return this.weaponsToCompare[0]?.game
            ?? this.outfitsToCompare[0]?.game
            ?? null;
    }

    public get totalCount(): number {
        return this.weaponsToCompare.length + this.outfitsToCompare.length;
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
        this.openChanged.emit(this.isOpen);
    }

    public open(): void {
        if (!this.isOpen) {
            this.isOpen = true;
            this.openChanged.emit(true);
        }
    }

    public close(): void {
        if (this.isOpen) {
            this.isOpen = false;
            this.openChanged.emit(false);
        }
    }

    /** Keep only items for the current map game. */
    public restrictToGame(game: string): void {
        const before = this.totalCount;
        this.weaponsToCompare = this.weaponsToCompare.filter(x => x.game === game);
        this.outfitsToCompare = this.outfitsToCompare.filter(x => x.game === game);

        for (const guid of [...this.weaponBases.keys()]) {
            if (!this.weaponsToCompare.some(x => x.guid === guid)) {
                this.weaponBases.delete(guid);
            }
        }
        for (const guid of [...this.outfitBases.keys()]) {
            if (!this.outfitsToCompare.some(x => x.guid === guid)) {
                this.outfitBases.delete(guid);
            }
        }

        if (this.totalCount !== before) {
            this.persist();
            this.itemsChanged.emit();
        }
    }

    public addWeaponToCompare(item: Weapon, game: string): boolean {
        this.ensureSameGame(game);

        if (this.weaponsToCompare.length >= this.maxWeapons) {
            return false;
        }

        const copy: Weapon = JSON.parse(JSON.stringify(item));
        copy.guid = uuidv4();
        copy.game = game;
        copy.installedUpgrades = [];
        copy.hitPowers = undefined as unknown as number[][];

        this.weaponBases.set(copy.guid, JSON.parse(JSON.stringify(copy)));
        this.weaponsToCompare.push(copy);
        this.persist();
        this.itemsChanged.emit();
        return true;
    }

    public duplicateWeapon(item: Weapon): boolean {
        const base = this.weaponBases.get(item.guid) ?? item;
        return this.addWeaponToCompare(base, item.game);
    }

    public removeWeapon(item: Weapon): void {
        this.weaponsToCompare = this.weaponsToCompare.filter(x => x.guid != item.guid);
        this.weaponBases.delete(item.guid);
        this.persist();
        this.itemsChanged.emit();
    }

    public addOutfitToCompare(item: Outfit, game: string): boolean {
        this.ensureSameGame(game);

        if (this.outfitsToCompare.length >= this.maxOutfits) {
            return false;
        }

        const copy: Outfit = JSON.parse(JSON.stringify(item));
        copy.guid = uuidv4();
        copy.game = game;
        copy.installedUpgrades = [];

        this.outfitBases.set(copy.guid, JSON.parse(JSON.stringify(copy)));
        this.outfitsToCompare.push(copy);
        this.persist();
        this.itemsChanged.emit();
        return true;
    }

    public duplicateOutfit(item: Outfit): boolean {
        const base = this.outfitBases.get(item.guid) ?? item;
        return this.addOutfitToCompare(base, item.game);
    }

    public removeOutfit(item: Outfit): void {
        this.outfitsToCompare = this.outfitsToCompare.filter(x => x.guid != item.guid);
        this.outfitBases.delete(item.guid);
        this.persist();
        this.itemsChanged.emit();
    }

    private ensureSameGame(game: string): void {
        const current = this.activeGame;
        if (current && current !== game) {
            this.weaponsToCompare = [];
            this.outfitsToCompare = [];
            this.weaponBases.clear();
            this.outfitBases.clear();
        }
    }

    private restore(): void {
        const raw = localStorage.getItem(this.weaponsToCompareStorageKey);
        if (!raw) {
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                this.weaponsToCompare = parsed;
                for (const weapon of this.weaponsToCompare) {
                    if (weapon.guid) {
                        this.weaponBases.set(weapon.guid, JSON.parse(JSON.stringify(weapon)));
                    }
                }
                return;
            }

            this.weaponsToCompare = parsed.weapons ?? [];
            this.outfitsToCompare = parsed.outfits ?? [];

            const weaponBases: { [guid: string]: Weapon } = parsed.weaponBases ?? parsed.bases ?? {};
            for (const [guid, base] of Object.entries(weaponBases)) {
                this.weaponBases.set(guid, base);
            }

            const outfitBases: { [guid: string]: Outfit } = parsed.outfitBases ?? {};
            for (const [guid, base] of Object.entries(outfitBases)) {
                this.outfitBases.set(guid, base);
            }

            for (const weapon of this.weaponsToCompare) {
                if (weapon.guid && !this.weaponBases.has(weapon.guid)) {
                    this.weaponBases.set(weapon.guid, JSON.parse(JSON.stringify(weapon)));
                }
            }
            for (const outfit of this.outfitsToCompare) {
                if (outfit.guid && !this.outfitBases.has(outfit.guid)) {
                    this.outfitBases.set(outfit.guid, JSON.parse(JSON.stringify(outfit)));
                }
            }

            // Enforce single-game list after restore
            const game = this.activeGame;
            if (game) {
                this.weaponsToCompare = this.weaponsToCompare.filter(x => x.game === game);
                this.outfitsToCompare = this.outfitsToCompare.filter(x => x.game === game);
            }
        } catch {
            this.weaponsToCompare = [];
            this.outfitsToCompare = [];
            this.weaponBases.clear();
            this.outfitBases.clear();
        }
    }

    private persist(): void {
        const weaponBases: { [guid: string]: Weapon } = {};
        for (const [guid, base] of this.weaponBases.entries()) {
            weaponBases[guid] = base;
        }

        const outfitBases: { [guid: string]: Outfit } = {};
        for (const [guid, base] of this.outfitBases.entries()) {
            outfitBases[guid] = base;
        }

        localStorage.setItem(this.weaponsToCompareStorageKey, JSON.stringify({
            weapons: this.weaponsToCompare,
            outfits: this.outfitsToCompare,
            weaponBases,
            outfitBases,
        }));
    }

    public selectUpgrade(upgrade: Upgrade, upgradeSection: UpgradeSection, item: UpgradableItem, selectedItemUpgrade: ItemUpgrade, isCs: boolean): void {
        if (upgrade.isLocked) {
            return;
        }

        if (!upgrade.isInstalled && upgradeSection.needPreviousUpgrade != null && upgradeSection.needPreviousUpgrade.length > 0) {
            let canInstall = false;

            if (item.installedUpgrades != null) {
                if (isCs) {
                    canInstall = upgradeSection.needPreviousUpgrade.every(x => item.installedUpgrades.includes(x));
                }
                else {
                    for (let i = 0; i < upgradeSection.needPreviousUpgrade.length; i++) {
                        if (item.installedUpgrades.includes(upgradeSection.needPreviousUpgrade[i])) {
                            canInstall = true;
                            break;
                        }
                    }
                }
            }

            if (!canInstall) {
                return;
            }
        }

        let effectsProps: string[] = []
        let effectsValues: any[] = [];

        if (upgrade.propertiesEffects) {
            effectsProps = Object.keys(upgrade.propertiesEffects);
            effectsValues = Object.values(upgrade.propertiesEffects);
        }

        if (upgrade.isInstalled) {
            for (let up of upgradeSection.elements) {
                up.isBlocked = false;

                if (up.isInstalled && up.propertiesEffects) {
                    let effectsPropsUp = Object.keys(up.propertiesEffects);
                    let effectsValuesUp = Object.values(up.propertiesEffects);

                    for (let i = 0; i < effectsPropsUp.length; i++) {
                        this.applyUpgradeEffect(item, effectsPropsUp[i], effectsValuesUp[i], -1);
                    }
                }

                up.isInstalled = false;
            }

            item.installedUpgrades = item.installedUpgrades.filter(x => x != upgrade.name);
        }
        else {
            for (let up of upgradeSection.elements) {
                up.isBlocked = true;

                if (up.isInstalled && up.propertiesEffects) {
                    let effectsPropsUp = Object.keys(up.propertiesEffects);
                    let effectsValuesUp = Object.values(up.propertiesEffects);

                    for (let i = 0; i < effectsPropsUp.length; i++) {
                        this.applyUpgradeEffect(item, effectsPropsUp[i], effectsValuesUp[i], -1);
                    }

                    item.installedUpgrades = item.installedUpgrades.filter(x => x != up.name);
                }

                up.isInstalled = false;
            }

            upgrade.isBlocked = false;
            upgrade.isInstalled = true;

            for (let i = 0; i < effectsProps.length; i++) {
                this.applyUpgradeEffect(item, effectsProps[i], effectsValues[i], 1);
            }

            if (item.installedUpgrades == null) {
                item.installedUpgrades = [];
            }

            item.installedUpgrades.push(upgrade.name);
        }

        this.updateViewData(upgradeSection, selectedItemUpgrade, item, upgrade.isInstalled, isCs);
        this.persist();
    }

    /** Assign branches / previous-upgrade links the same way MechanicComponent.selectItem does. */
    public prepareUpgradeTree(itemUpgrade: ItemUpgrade): ItemUpgrade {
        const prepared: ItemUpgrade = JSON.parse(JSON.stringify(itemUpgrade));
        let branchId = 0;

        for (const section of prepared.upgradeSections) {
            if (section.branch == null || section.branch < 0) {
                section.branch = branchId++;

                if (section.elements) {
                    const branchElements: Upgrade[] = [...section.elements];

                    for (const element of branchElements) {
                        if (!element.effects) {
                            continue;
                        }

                        for (const effect of element.effects) {
                            const anotherSection = prepared.upgradeSections.find(x => x.name == effect);
                            if (!anotherSection) {
                                continue;
                            }

                            anotherSection.branch = section.branch;

                            if (!anotherSection.needPreviousUpgrade) {
                                anotherSection.needPreviousUpgrade = [];
                            }

                            if (!anotherSection.needPreviousUpgrade.includes(element.name)) {
                                anotherSection.needPreviousUpgrade.push(element.name);
                            }

                            if (anotherSection.elements) {
                                for (const aElement of anotherSection.elements) {
                                    branchElements.push(aElement);
                                    aElement.needPreviousUpgrades = true;
                                }
                            }
                        }
                    }
                }
            }
        }

        return prepared;
    }

    public updateViewData(section: UpgradeSection, selectedItemUpgrade: ItemUpgrade, item: UpgradableItem, installed: boolean, isCs: boolean): void {
        if (section.elements) {
            for (let element of section.elements) {
                if (element.effects) {
                    for (let effect of element.effects) {
                        let anotherSection = selectedItemUpgrade.upgradeSections.find(x => x.name == effect);

                        if (anotherSection) {
                            let canBeSelected: boolean = installed;

                            if (isCs) {
                                if (anotherSection.needPreviousUpgrade?.length > 0) {
                                    canBeSelected = anotherSection.needPreviousUpgrade.every(x => item.installedUpgrades.includes(x));
                                }
                            }
                            if (anotherSection.elements) {
                                for (let aElement of anotherSection.elements) {
                                    aElement.needPreviousUpgrades = !canBeSelected;

                                    if (aElement.isInstalled) {
                                        this.selectUpgrade(aElement, anotherSection, item, selectedItemUpgrade, isCs);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    public applyUpgradeEffect(item: UpgradableItem, propName: string, effectsValues: string, koeff: number): void {
        let weapon = item as Weapon;
        let propNameParts = propName.split('_');

        if (propNameParts.length > 1) {

            for (let i = 1; i < propNameParts.length; i++) {
                propNameParts[i] = propNameParts[i].charAt(0).toUpperCase() + propNameParts[i].slice(1);
            }

            propName = propNameParts.join('')
        }

        let value = parseFloat(effectsValues);

        switch (propName) {
            case "ammoMagSize": {
                weapon.ammoMagazineSize += koeff * value;
                break;
            }
            case "invWeight": {
                item.weight += koeff * value;
                item.weight = Math.round(item.weight * 100) / 100;
                break;
            }
            case "fireDispersionBase": {
                weapon.fireDispersionBase += koeff * value;
                weapon.fireDispersionBase = Math.round(weapon.fireDispersionBase * 100) / 100;
                break;
            }
            case "hitPower": {
                let strings = effectsValues.split(",");
                let number = [];

                for (let s of strings) {
                    number.push(parseFloat(s));
                }

                let itemity = [];
                itemity.push(...number);
                itemity.push(...weapon.hitPower);

                if (weapon.hitPowers == null) {
                    weapon.hitPowers = [];

                    if (koeff > 0) {
                        weapon.hitPowers.push(itemity);

                        weapon.hitPower = number;
                    }
                    else {
                        console.error(weapon.hitPower, number);
                    }
                }
                else {
                    if (koeff > 0) {
                        weapon.hitPowers.push(itemity);

                        weapon.hitPower = number;
                    }
                    else {
                        let config = weapon.hitPowers.find(x => {
                            for (let i = 0; i < weapon.hitPower.length; i++) {
                                if (weapon.hitPower[i] != x[i]) {
                                    return false;
                                }
                            }

                            return true;
                        })

                        if (config) {
                            let currentLenght = weapon.hitPower.length;

                            weapon.hitPower = config.slice(currentLenght, config.length);
                            weapon.hitPowers = weapon.hitPowers.filter(x => {
                                if (config?.length != x.length) {
                                    return true;
                                }

                                for (let i = 0; i < config.length; i++) {
                                    if (config[i] != x[i]) {
                                        return true;
                                    }
                                }

                                return false;
                            })
                        }
                    }
                }
                break;
            }
            default: {
                if ((item as any)[propName] == undefined) {
                    (item as any)[propName] = koeff * value;
                }
                else {
                    (item as any)[propName] += koeff * value;
                }
            }
        }
    }
}
