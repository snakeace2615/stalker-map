import { Component, OnDestroy } from '@angular/core';
import { CompareService } from '../../services/compare.service';
import { NgStyle } from '@angular/common';
import { ItemUpgradesComponent } from '../mechanic/item-upgrades/item-upgrades.component';
import { MechanicDiscount } from '../../models/mechanic.model';
import { ItemUpgrade, UpgradeProperty, UpgradeSelectedEventModel } from '../../models/upgrades/upgrades';
import { ItemPropertyNumberComponent } from "../mechanic/item-property-number/item-property-number.component";
import { TranslatePipe } from '@ngx-translate/core';
import { Outfit, Weapon } from '../../models/item.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-compare',
    standalone: true,
    imports: [ItemUpgradesComponent, NgStyle, ItemPropertyNumberComponent, TranslatePipe],
    templateUrl: './compare.component.html',
    styleUrl: './compare.component.scss'
})

export class CompareComponent implements OnDestroy {
    public element: HTMLElement;

    public tabs: string[] = ['weapon', 'outfit'];
    public selectedTab: string = this.tabs[0];

    public selectedDiscount: MechanicDiscount;
    public upgradeProperties: { [id: string]: UpgradeProperty[]; } = {};
    private upgrades: { [id: string]: { [id: string]: ItemUpgrade; }; } = {};
    public upgradeForItems: { [id: string]: ItemUpgrade; } = {};

    public isLoaded: boolean = false;
    public Math: Math = Math;

    public bestWeaponStats: Weapon;
    public bestOutfitStats: Outfit;

    private subscription = new Subscription();

    constructor(public compare: CompareService) {
        this.selectedDiscount = new MechanicDiscount();
        this.selectedDiscount.value = 1;
        this.selectedTab = this.tabs[0];
    }

    private async ngOnInit(): Promise<void> {
        await Promise.all([
            this.loadUpgradeProperties('cop'),
            this.loadUpgradeProperties('cs'),
            this.loadUpgrades('cop'),
            this.loadUpgrades('cs'),
        ]);

        this.calculateBestItems();
        this.calculateUpgradesForItems();

        this.isLoaded = true;
        if (this.element) {
            this.element.style.top = '0';
        }

        this.subscription.add(
            this.compare.itemsChanged.subscribe(() => {
                this.cleanupUpgradeForItems();
                this.calculateBestItems();
                this.calculateUpgradesForItems();
            })
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public selectTab(tab: string): void {
        this.selectedTab = tab;
    }

    public close(): void {
        this.compare.close();
    }

    public removeWeapon(weapon: Weapon): void {
        this.compare.removeWeapon(weapon);
        delete this.upgradeForItems[weapon.guid];
        this.calculateBestItems();
    }

    public duplicateWeapon(weapon: Weapon): void {
        this.compare.duplicateWeapon(weapon);
    }

    public removeOutfit(outfit: Outfit): void {
        this.compare.removeOutfit(outfit);
        delete this.upgradeForItems[outfit.guid];
        this.calculateBestItems();
    }

    public duplicateOutfit(outfit: Outfit): void {
        this.compare.duplicateOutfit(outfit);
    }

    public hasUpgrades(guid: string): boolean {
        return !!this.upgradeForItems[guid];
    }

    public selectUpgrade(model: UpgradeSelectedEventModel): void {
        this.compare.selectUpgrade(model.upgrade, model.upgradeSection, model.item, model.selectedItemUpgrade, model.isCs);
        this.calculateBestItems();
    }

    private cleanupUpgradeForItems(): void {
        const activeGuids = new Set([
            ...this.compare.weaponsToCompare.map(x => x.guid),
            ...this.compare.outfitsToCompare.map(x => x.guid),
        ]);
        for (const guid of Object.keys(this.upgradeForItems)) {
            if (!activeGuids.has(guid)) {
                delete this.upgradeForItems[guid];
            }
        }
    }

    private calculateBestItems(): void {
        if (this.compare.weaponsToCompare.length > 0) {
            this.bestWeaponStats = new Weapon();
            const weapons = this.compare.weaponsToCompare;

            this.bestWeaponStats.rpm = Math.max(...weapons.map(x => x.rpm));
            this.bestWeaponStats.conditionShotDec = Math.min(...weapons.map(x => x.conditionShotDec));
            this.bestWeaponStats.fireDispersionBase = Math.min(...weapons.map(x => x.fireDispersionBase));
            this.bestWeaponStats.fireDispersionConditionFactor = Math.min(...weapons.map(x => x.fireDispersionConditionFactor));
            this.bestWeaponStats.bulletSpeed = Math.max(...weapons.map(x => x.bulletSpeed));
            this.bestWeaponStats.fireDistance = Math.max(...weapons.map(x => x.fireDistance));
            this.bestWeaponStats.ammoMagazineSize = Math.max(...weapons.map(x => x.ammoMagazineSize));
            this.bestWeaponStats.weight = Math.min(...weapons.map(x => x.weight));
        }

        if (this.compare.outfitsToCompare.length > 0) {
            this.bestOutfitStats = new Outfit();
            const outfits = this.compare.outfitsToCompare;

            this.bestOutfitStats.burnProtection = Math.max(...outfits.map(x => x.burnProtection));
            this.bestOutfitStats.shockProtection = Math.max(...outfits.map(x => x.shockProtection));
            this.bestOutfitStats.radiationProtection = Math.max(...outfits.map(x => x.radiationProtection));
            this.bestOutfitStats.chemicalBurnProtection = Math.max(...outfits.map(x => x.chemicalBurnProtection));
            this.bestOutfitStats.telepaticProtection = Math.max(...outfits.map(x => x.telepaticProtection));
            this.bestOutfitStats.strikeProtection = Math.max(...outfits.map(x => x.strikeProtection));
            this.bestOutfitStats.explosionProtection = Math.max(...outfits.map(x => x.explosionProtection));
            this.bestOutfitStats.woundProtection = Math.max(...outfits.map(x => x.woundProtection));
            this.bestOutfitStats.hitFractionActor = Math.min(...outfits.map(x => x.hitFractionActor));
            this.bestOutfitStats.artefactCount = Math.max(...outfits.map(x => x.artefactCount));
            this.bestOutfitStats.additionalInventoryWeight = Math.max(...outfits.map(x => x.additionalInventoryWeight ?? 0));
            this.bestOutfitStats.powerRestoreSpeed = Math.max(...outfits.map(x => x.powerRestoreSpeed ?? 0));
            this.bestOutfitStats.healthRestoreSpeed = Math.max(...outfits.map(x => x.healthRestoreSpeed ?? 0));
            this.bestOutfitStats.bleedingRestoreSpeed = Math.max(...outfits.map(x => x.bleedingRestoreSpeed ?? 0));
            this.bestOutfitStats.weight = Math.min(...outfits.map(x => x.weight));
        }
    }

    private calculateUpgradesForItems(): void {
        for (const item of [...this.compare.weaponsToCompare, ...this.compare.outfitsToCompare]) {
            if (this.upgradeForItems[item.guid] == null && this.upgrades[item.game]?.[item.uniqueName] != null) {
                this.upgradeForItems[item.guid] = this.compare.prepareUpgradeTree(this.upgrades[item.game][item.uniqueName]);
            }
        }
    }

    private async loadUpgradeProperties(game: string): Promise<void> {
        if (game == 'shoc' || game == 'hoc') {
            return;
        }

        try {
            const response = await fetch(`/assets/data/${game}/upgrade_properties.json`);
            if (!response.ok) {
                return;
            }

            const config: UpgradeProperty[] = await response.json();
            if (config) {
                this.upgradeProperties[game] = config;
            }
        } catch {
            // game without upgrade properties
        }
    }

    private async loadUpgrades(game: string): Promise<void> {
        if (game == 'shoc' || game == 'hoc') {
            return;
        }

        try {
            const response = await fetch(`/assets/data/${game}/upgrades.json`);
            if (!response.ok) {
                return;
            }

            const config: ItemUpgrade[] = await response.json();
            if (config) {
                let upgrades: { [id: string]: ItemUpgrade; } = {};

                for (let c of config) {
                    upgrades[c.item] = c;
                }

                this.upgrades[game] = upgrades;
            }
        } catch {
            // game without upgrades
        }
    }
}
