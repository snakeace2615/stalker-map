import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MapComponent } from '../map/map.component';
import { Map } from '../../models/map.model';
import { HeaderComponent } from '../header/header.component';
import { TooltipDirective } from '../tooltips/tooltip.directive';
import { ItemTooltipComponent } from '../tooltips/item-tooltip/item-tooltip.component';
import { asUpgradable, asWeapon, Item } from '../../models/item.model';
import { StuffItem } from '../../models/stuff';
import { InventoryItem } from '../../models/inventory-item.model';
import { StuffContent } from '../../models/content';
import { Game } from '../../models/game.model';
import { ShareLinkService } from '../../services/share-link.service';
import { DEFAULT_LANG } from '../../locale';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-map-content',
  standalone: true,
  imports: [TranslatePipe, HeaderComponent, TooltipDirective],
  templateUrl: './map-content.component.html',
  styleUrl: './map-content.component.scss'
})
export class MapContentComponent implements OnInit {
  public readonly game: Game;
  public itemTooltipComponent: any = ItemTooltipComponent;

  protected readonly asWeapon = asWeapon;
  protected readonly asUpgradable = asUpgradable;
  public items: Item[] = [];

  public display = false;
  public stuffs: StuffContent[] = [];

  public readonly stuffTypes: string[] = ['stash', 'quest', 'stuff', 'stuff'];

  constructor(
    protected translate: TranslateService,
    protected route: ActivatedRoute,
    private shareLinks: ShareLinkService,
    private seo: SeoService,
    private cdr: ChangeDetectorRef,
  ) {
    const urlGame: string = this.route.snapshot.paramMap.get('game') as string;

    if (MapComponent.avaliableGames[urlGame]) {
      this.game = MapComponent.avaliableGames[urlGame];
    } else {
      this.game = MapComponent.defaultGame;
    }
  }

  public async ngOnInit(): Promise<void> {
    this.seo.applyMapContentPage(this.game.uniqueName);
    this.setupInventoryCellSize();

    this.translate.onLangChange.subscribe((event) => {
      void this.loadLocales(event.lang);
    });

    await Promise.all([
      this.loadLocales(this.translate.currentLang() ?? DEFAULT_LANG),
      this.loadItems(),
    ]);

    try {
      const response = await fetch(`/assets/data/${this.game.uniqueName}/map.json`);
      if (response.ok) {
        const gamedata: Map = await response.json();
        this.prepareToDisplay(gamedata);
      }
    } finally {
      this.display = true;
      this.cdr.markForCheck();
    }
  }

  private prepareToDisplay(gamedata: Map): void {
    if (!gamedata.stuffs?.length) {
      this.stuffs = [];
      return;
    }

    this.stuffs = [];

    for (const stuff of gamedata.stuffs) {
      const view = new StuffContent();
      view.name = stuff.name;
      view.description = stuff.description;
      view.typeId = stuff.typeId;

      const location = gamedata.locations?.find(x => x.id == stuff.locationId);

      if (location) {
        view.isUnderground = location.isUnderground;
        view.locaton = location.uniqueName;
        view.link = this.shareLinks.forMarkerLocalized(
          this.game.uniqueName,
          stuff.z,
          stuff.x,
          this.stuffTypes[stuff.typeId] || 'stuff',
          { isUnderground: view.isUnderground, locationId: stuff.locationId }
        );
      }

      view.items = (stuff.items ?? [])
        .map(x => this.getStuffItem(x))
        .filter((item): item is StuffItem => item != null);

      view.items.sort((x, y) => {
        const dw = x.item.width - y.item.width;

        if (dw != 0) {
          return -dw;
        }

        return y.item.area - x.item.area;
      });

      view.summaryPrice = 0;
      for (const item of view.items) {
        view.summaryPrice += item.item.price;
      }

      view.maxColumns = view.items.length
        ? Math.max(...view.items.map(x => x.item.width))
        : 0;

      this.stuffs.push(view);
    }
  }

  private setupInventoryCellSize(): void {
    const cellSize = 50;
    document.documentElement.style.setProperty('--inventory-cell-size', `${cellSize}px`);
    document.documentElement.style.setProperty('--inventory-cell-size-texture-factor', '100%');
  }

  private async loadLocales(language: string): Promise<void> {
    const langFile = language;
    const response = await fetch(`/assets/data/${this.game.uniqueName}/${langFile}.json`);
    if (response.ok) {
      const locales = await response.json();
      if (locales) {
        this.translate.setTranslation(language, locales, true);
      }
    }

    const importResponse = await fetch(`/assets/data/${this.game.uniqueName}/locale_import.json`);
    if (!importResponse.ok) {
      return;
    }

    const localeImport = await importResponse.json();
    const games = Object.keys(localeImport ?? {});
    for (const game of games) {
      const importLocales: string[] = localeImport[game]?.locales ?? [];
      if (importLocales.length === 0) {
        continue;
      }

      const gameLocalesResponse = await fetch(`/assets/data/${game}/${langFile}.json`);
      if (!gameLocalesResponse.ok) {
        continue;
      }

      const gameLocales = await gameLocalesResponse.json();
      if (!gameLocales) {
        continue;
      }

      const localesToInject: Record<string, string> = {};
      for (const locale of importLocales) {
        if (gameLocales[locale] != null) {
          localesToInject[locale] = gameLocales[locale];
        }
      }

      this.translate.setTranslation(language, localesToInject, true);
    }
  }

  private async loadItems(): Promise<void> {
    const response = await fetch(`/assets/data/${this.game.uniqueName}/items.json`);
    if (response.ok) {
      const items: Item[] = await response.json();
      if (items) {
        this.items = items;
      }
    }
  }

  private getStuffItem(itemToConvert: InventoryItem): StuffItem | null {
    const item = this.items.find(y => y.uniqueName == itemToConvert.uniqueName);
    if (!item) {
      return null;
    }

    const stuffItem = new StuffItem();
    stuffItem.item = item;
    stuffItem.count = itemToConvert.count;
    return stuffItem;
  }
}
