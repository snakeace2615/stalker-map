import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Stuff } from '../../../models/hoc/map-hoc';
import { isHocWeapon, Item } from '../../../models/item.model';
import { StuffItem } from '../../../models/stuff/stuff-item.model';
import { ItemTooltipComponent } from '../../tooltips/item-tooltip/item-tooltip.component';
import { MapService } from '../../../services/map.service';
import { Game } from '../../../models/game.model';
import { HocInventoryItem } from "../hoc-inventory-item/hoc-inventory-item";
import { HiddenMarker } from '../../../models/hidden-marker.model';

@Component({
    selector: 'app-hoc-stuff',
    standalone: true,
    imports: [TranslatePipe, HocInventoryItem],
    templateUrl: './hoc-stuff.component.html',
    styleUrl: './hoc-stuff.component.scss'
})
export class HocStuffComponent {
    @Input() public stuff: Stuff;
    @Input() public game: Game;
    @Input() public stuffType: string;
    @Input() public allItems: Item[];
    @Input() public isUnderground: boolean;
    @Input() public shareUrl: string = '';
    public hiddenMarker: HiddenMarker;
    public itemTooltipComponent: any = ItemTooltipComponent;

    public items: StuffItem[];
    public condition: {
        conditions: string[][],
        communities: string[]
    }

    private actorOnLevel = /actor_on_level\(([^\)]+)\)/;
    private npcRank = /npc_rank\(([^\)]+)\)/;

    constructor(private mapService: MapService) { }

    private async ngOnInit(): Promise<void> {
        this.hiddenMarker = new HiddenMarker();
        this.hiddenMarker.game = this.game.uniqueName;
        this.hiddenMarker.layerName = this.stuffType;
        this.hiddenMarker.lat = this.stuff.z;
        this.hiddenMarker.lng = this.stuff.x;

        if (this.stuff.items) {
            this.items = this.stuff.items.map(x => {
                let item = new StuffItem();
                item.item = this.allItems.find(y => y.uniqueName == x.uniqueName) as Item;
                item.count = x.count;
                item.preinstalled = [];

                if (item.item && isHocWeapon(item.item) && item.item.preinstalledAttachments != null) {
                    if (item.item.compatibleAttachments != null) {
                        for (let attName of item.item.preinstalledAttachments) {
                            let attachment = item.item.compatibleAttachments.find(x => x.uniqueName == attName);

                            if (attachment) {
                                item.preinstalled.push(attachment);
                            }
                        }
                    }
                }

                return item;
            });

            this.items = this.items.filter(x => x.item != null)

            this.items.sort((x, y) => {
                let dw = x.item.width - y.item.width;

                if (dw != 0) {
                    return -dw;
                }

                return y.item.area - x.item.area;
            })
        }

        if (this.items == null) {
            this.items = [];
        }
    }
}
