import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { TranslatePipe } from '@ngx-translate/core';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [HeaderComponent, TranslatePipe],
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

  public contentHref(game: string): string {
    return this.locale.contentPath(game);
  }
}
