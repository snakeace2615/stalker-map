import { NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocaleService } from '../../services/locale.service';
import { isAppLanguage } from '../../locale';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [TranslatePipe, RouterModule, NgClass],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
    @ViewChild('container') container!: ElementRef;
    @ViewChild('wrapper') wrapper!: ElementRef;

    public selectedLanguage: string = '';
    public showShort: boolean = false;

    private resizeObserver: ResizeObserver;

    constructor(
        private translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute,
        public locale: LocaleService
    ) {
    }

    public get avaliableLanguages(): readonly string[] {
        return this.locale.availableLanguages;
    }

    public ngOnInit(): void {
        const langRoute = this.route.parent ?? this.route;

        langRoute.paramMap.subscribe((params) => {
            const lang = params.get('lang');
            if (!isAppLanguage(lang)) {
                return;
            }

            this.selectedLanguage = lang;
            this.locale.persistLang(lang);

            if (this.translate.currentLang() !== lang) {
                this.translate.use(lang);
            }
        });

        this.translate.onLangChange.subscribe((event) => {
            this.selectedLanguage = event.lang;
            this.locale.persistLang(event.lang);
        });
    }

    public ngOnDestroy() {
        this.resizeObserver?.disconnect();
    }

    public changeLanguage(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const newLang = select.value;
        if (!isAppLanguage(newLang) || newLang === this.selectedLanguage) {
            return;
        }

        const updatedUrl = this.router.url.replace(/^\/[^\/?#]+/, `/${newLang}`);
        this.locale.persistLang(newLang);
        this.router.navigateByUrl(updatedUrl);
    }

    public mapHref(game: string): string {
        return this.locale.mapPath(game);
    }
}
