import { Component, NgZone, ViewEncapsulation } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MapService } from '../../services/map.service';
import { SeoService } from '../../services/seo.service';
import { ShareLinkService } from '../../services/share-link.service';

@Component({
  selector: 'app-map-export',
  standalone: true,
  imports: [],
  templateUrl: './map-export.component.html',
  styleUrls: [
    '../map/map.component.inventory.base.scss',
    '../map/map.component.inventory.addons.scss',
    '../map/map.component.inventory.hovers.scss',
    '../map/map.component.scss',
  ],
  encapsulation: ViewEncapsulation.None
})
export class MapExportComponent extends MapComponent {
  constructor(
    protected override translate: TranslateService,
    protected override route: ActivatedRoute,
    protected override seo: SeoService,
    protected override mapService: MapService,
    protected override shareLinks: ShareLinkService,
    ngZone: NgZone
  ) {
    super(
      translate,
      route,
      seo,
      mapService,
      shareLinks,
      ngZone);

    this.overlaysListTop = '';
    let lang: string = this.route.snapshot.paramMap.get('lang') as string;

    this.translate.use(lang);
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.documentElement.style.height = '100%';
  }
}
