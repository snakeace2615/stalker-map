import { Component, EventEmitter, Input, Output } from '@angular/core';
import { asUpgradable, asWeapon, Item } from '../../../models/item.model';
import { ItemTooltipComponent } from '../../tooltips/item-tooltip/item-tooltip.component';
import { TooltipDirective } from '../../tooltips/tooltip.directive';

@Component({
  selector: 'app-trader-item-tile',
  standalone: true,
  templateUrl: './trader-item-tile.component.html',
  styleUrl: './trader-item-tile.component.scss',
  imports: [TooltipDirective]
})
export class TraderItemTileComponent {
  @Input() item: Item;
  @Input() price: number | undefined;
  /** When true, display Math.floor(price); otherwise display price as-is (for sell vs buy) */
  @Input() floorPrice = false;
  @Input() gameStyle: string;

  @Output() itemClick = new EventEmitter<Item>();

  readonly itemTooltipComponent = ItemTooltipComponent;

  protected readonly asWeapon = asWeapon;
  protected readonly asUpgradable = asUpgradable;

  get displayPrice(): string | number {
    if (this.price == null) return '';
    return this.floorPrice ? Math.floor(this.price) : this.price;
  }

  get showBugIcon(): boolean {
    return this.price === 0 || this.price == null;
  }

  onClick(): void {
    this.itemClick.emit(this.item);
  }
}
