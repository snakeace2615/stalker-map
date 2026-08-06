import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { TranslateModule } from '@ngx-translate/core';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [HeaderComponent, TranslateModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  constructor(
    private seo: SeoService,
    public locale: LocaleService
  ) {
  }

  private ngOnInit(): void {
    this.seo.applyHomePage();
  }

  public mapHref(game: string): string {
    return this.locale.mapPath(game);
  }
}
