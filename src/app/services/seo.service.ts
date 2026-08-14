import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { AVAILABLE_LANGUAGES, DEFAULT_LANG, HTML_LANG_MAP } from '../locale';

interface SeoPageConfig {
    titleKey: string;
    descriptionKey: string;
    /** Path without language prefix, e.g. `` or `/map/hoc`. */
    pagePath: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
    private readonly siteOrigin = 'https://stalker-map.online';
    private current: SeoPageConfig | null = null;

    constructor(
        private readonly title: Title,
        private readonly meta: Meta,
        private readonly translate: TranslateService,
        @Inject(DOCUMENT) private readonly document: Document
    ) {
        this.translate.onLangChange.subscribe((event) => {
            this.setHtmlLang(event.lang);
            if (this.current) {
                this.applyTags(this.current);
            }
        });
    }

    public applyHomePage(): void {
        this.apply({
            titleKey: 'mainTitle',
            descriptionKey: 'mainMetaDescription',
            pagePath: '',
        });
    }

    public applyMapPage(game: string): void {
        this.apply({
            titleKey: `${game}MapPageTitle`,
            descriptionKey: `${game}MapMetaDescription`,
            pagePath: `/map/${game}`,
        });
    }

    public applyMapContentPage(game: string): void {
        this.apply({
            titleKey: `${game}MapContentPageTitle`,
            descriptionKey: `${game}MapContentMetaDescription`,
            pagePath: `/map/content/${game}`,
        });
    }

    public setHtmlLang(lang: string): void {
        this.document.documentElement.lang = HTML_LANG_MAP[lang] ?? lang;
    }

    private apply(config: SeoPageConfig): void {
        this.current = config;
        this.setHtmlLang(this.translate.currentLang() || DEFAULT_LANG);
        this.applyTags(config);
    }

    private localizedPath(pagePath: string, lang: string): string {
        return pagePath ? `/${lang}${pagePath}` : `/${lang}`;
    }

    private applyTags(config: SeoPageConfig): void {
        this.translate
            .get([config.titleKey, config.descriptionKey])
            .subscribe((translations: Record<string, string>) => {
                if (this.current !== config) {
                    return;
                }

                const lang = this.translate.currentLang() || DEFAULT_LANG;
                const title = translations[config.titleKey];
                const description = translations[config.descriptionKey];
                const path = this.localizedPath(config.pagePath, lang);
                const url = `${this.siteOrigin}${path}`;

                this.title.setTitle(title);

                this.meta.updateTag({ name: 'description', content: description });
                this.meta.updateTag({ name: 'robots', content: 'index, follow' });

                this.meta.updateTag({ property: 'og:title', content: title });
                this.meta.updateTag({ property: 'og:description', content: description });
                this.meta.updateTag({ property: 'og:type', content: 'website' });
                this.meta.updateTag({ property: 'og:url', content: url });
                this.meta.updateTag({ property: 'og:site_name', content: 'StalkerMap' });
                this.meta.updateTag({ property: 'og:locale', content: (HTML_LANG_MAP[lang] ?? lang).replace('-', '_') });

                this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
                this.meta.updateTag({ name: 'twitter:title', content: title });
                this.meta.updateTag({ name: 'twitter:description', content: description });

                this.updateCanonical(url);
                this.updateHreflang(config.pagePath);
            });
    }

    private updateCanonical(url: string): void {
        let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }

    private updateHreflang(pagePath: string): void {
        this.document
            .querySelectorAll('link[rel="alternate"][hreflang]')
            .forEach((el) => el.remove());

        for (const lang of AVAILABLE_LANGUAGES) {
            const link = this.document.createElement('link');
            link.setAttribute('rel', 'alternate');
            link.setAttribute('hreflang', HTML_LANG_MAP[lang] ?? lang);
            link.setAttribute('href', `${this.siteOrigin}${this.localizedPath(pagePath, lang)}`);
            this.document.head.appendChild(link);
        }

        const xDefault = this.document.createElement('link');
        xDefault.setAttribute('rel', 'alternate');
        xDefault.setAttribute('hreflang', 'x-default');
        xDefault.setAttribute('href', `${this.siteOrigin}${this.localizedPath(pagePath, DEFAULT_LANG)}`);
        this.document.head.appendChild(xDefault);
    }
}
