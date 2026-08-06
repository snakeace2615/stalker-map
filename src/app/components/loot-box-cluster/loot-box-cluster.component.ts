import { Component, Input } from '@angular/core';
import { LootBoxCluster } from '../../models/loot-box/loot-box-cluster.model';
import { TranslateModule } from '@ngx-translate/core';
import { LootBoxView } from '../../models/loot-box/loot-box-veiw.model';
import { asUpgradable, asWeapon, Item } from '../../models/item.model';
import { LootBox } from '../../models/loot-box/loot-box-section.model';
import { StuffItem } from '../../models/stuff';
import { MapService } from '../../services/map.service';
import { ItemTooltipComponent } from '../tooltips/item-tooltip/item-tooltip.component';
import { TooltipDirective } from '../tooltips/tooltip.directive';
import { Game } from '../../models/game.model';
import { HiddenMarker } from '../../models/hidden-marker.model';
import { ShareLinkService } from '../../services/share-link.service';

@Component({
    selector: 'app-loot-box-cluster',
    standalone: true,
    imports: [TranslateModule, TooltipDirective],
    templateUrl: './loot-box-cluster.component.html',
    styleUrl: './loot-box-cluster.component.scss'
})
export class LootBoxClusterComponent {
    @Input() public cluster: LootBoxCluster;
    @Input() public game: Game;
    @Input() public allItems: Item[];
    @Input() public lootBoxLocationConfig: LootBox;
    @Input() public lootBoxConfigs: LootBox[];
    @Input() public isUnderground: boolean;
    public itemTooltipComponent: any = ItemTooltipComponent;

    protected readonly asWeapon = asWeapon;
    protected readonly asUpgradable = asUpgradable;

    public boxes: LootBoxView[];
    
    public hiddenMarker: HiddenMarker;
    public shareUrl: string = '';

    constructor(
        private mapService: MapService,
        private shareLinks: ShareLinkService
    ) { }

    private async ngOnInit(): Promise<void> {

        if (this.cluster.lootBoxes && this.cluster.lootBoxes.length > 0) {
            this.boxes = [];

            for (let box of this.cluster.lootBoxes) {
                let boxView: LootBoxView = new LootBoxView();
                boxView.count = box.count;

                boxView.items = box.items.map(x => {
                    let item = new StuffItem();
                    item.item = this.allItems.find(y => y.uniqueName == x.uniqueName) as Item;
                    item.count = x.count;

                    return item;
                });

                boxView.items.sort((x, y) => {
                    let dw = x.item.width - y.item.width;

                    if (dw != 0) {
                        return -dw;
                    }

                    return y.item.area - x.item.area;
                })

                if (box.name) {
                    let lootBox: LootBox = this.lootBoxConfigs.find(x => x.name == box.name) as LootBox;

                    if (lootBox && this.lootBoxLocationConfig) {
                        boxView.boxItems = [];
                        boxView.boxConfig = box.name;

                        for (let item of lootBox.items) {
                            if (this.lootBoxLocationConfig.items.some(x => x.uniqueName == item.uniqueName)) {
                                let item1 = new StuffItem();
                                item1.item = this.allItems.find(y => y.uniqueName == item.uniqueName) as Item;

                                if (item1.item) {
                                    item1.probability = Math.floor(item.probability * 100);
                                    boxView.boxItems.push(item1);
                                }
                            }
                        }

                        boxView.boxItems.sort((x, y) => {
                            let dw = x.item.width - y.item.width;

                            if (dw != 0) {
                                return -dw;
                            }

                            return y.item.area - x.item.area;
                        })
                    }
                }

                this.boxes.push(boxView);
            }
        }

        this.shareUrl = this.shareLinks.forMarker(
            this.game.uniqueName,
            this.cluster.z,
            this.cluster.x,
            'destroyable-box',
            { isUnderground: this.isUnderground, locationId: this.cluster.locationId }
        );
        
        this.hiddenMarker = new HiddenMarker();
        this.hiddenMarker.game = this.game.uniqueName;
        this.hiddenMarker.isUnderground = this.isUnderground;
        this.hiddenMarker.layerName = 'destroyable-box';
        this.hiddenMarker.lat = this.cluster.z;
        this.hiddenMarker.lng = this.cluster.x;
    }
}
