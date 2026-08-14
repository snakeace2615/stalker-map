import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Item } from '../../../models/item.model';

@Component({
  selector: 'app-item-tooltip',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './item-tooltip.component.html',
  styleUrl: './item-tooltip.component.scss'
})
export class ItemTooltipComponent {
  @Input() item: Item;
}
