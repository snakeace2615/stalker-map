import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    AVAILABLE_LANGUAGES,
    DEFAULT_LANG,
    LANGUAGE_STORAGE_KEY,
    isAppLanguage,
    type AppLanguage,
} from '../locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
    public readonly availableLanguages = AVAILABLE_LANGUAGES;
    public readonly defaultLang = DEFAULT_LANG;

    constructor(private readonly translate: TranslateService) {}

    public get currentLang(): AppLanguage {
        const lang = this.translate.currentLang;
        return isAppLanguage(lang) ? lang : DEFAULT_LANG;
    }

    public persistLang(lang: string): void {
        if (!isAppLanguage(lang)) {
            return;
        }
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }

    /** Path with language prefix, e.g. `/ua/map/hoc`. For in-app navigation / SEO URLs. */
    public localizedPath(pagePath: string = ''): string {
        const normalized = pagePath.startsWith('/') ? pagePath : pagePath ? `/${pagePath}` : '';
        return `/${this.currentLang}${normalized}`;
    }

    public mapPath(game: string): string {
        return this.localizedPath(`/map/${game}`);
    }

    /**
     * Language-neutral map path for share / deep links.
     * Opens via legacy redirect that applies the recipient's localStorage language.
     */
    public neutralMapPath(game: string): string {
        return `/map/${game}`;
    }

    public absoluteNeutralMapUrl(
        game: string,
        query: Record<string, string | number | boolean | null | undefined> = {}
    ): string {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value === null || value === undefined || value === false) {
                continue;
            }
            params.set(key, String(value));
        }
        const qs = params.toString();
        return `${window.location.origin}${this.neutralMapPath(game)}${qs ? `?${qs}` : ''}`;
    }
}
