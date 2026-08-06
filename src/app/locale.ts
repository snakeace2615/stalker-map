export const AVAILABLE_LANGUAGES = [
    'ua',
    'en',
    'ru',
    'pl',
    'fr',
    'de',
    'esp',
    'it',
    'cz',
    'chn',
    'jpn',
    'kor',
    'ar',
] as const;

export type AppLanguage = (typeof AVAILABLE_LANGUAGES)[number];

export const DEFAULT_LANG: AppLanguage = 'en';

export const LANGUAGE_STORAGE_KEY = 'language';

/** BCP 47 tags for html[lang] and hreflang. */
export const HTML_LANG_MAP: Record<string, string> = {
    ua: 'uk',
    en: 'en',
    ru: 'ru',
    pl: 'pl',
    fr: 'fr',
    de: 'de',
    esp: 'es',
    it: 'it',
    cz: 'cs',
    chn: 'zh',
    jpn: 'ja',
    kor: 'ko',
    ar: 'ar',
    hg: 'hu',
};

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
    return !!value && (AVAILABLE_LANGUAGES as readonly string[]).includes(value);
}

export function getPreferredLang(): AppLanguage {
    try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isAppLanguage(stored)) {
            return stored;
        }
    } catch {
        // ignore storage access errors
    }
    return DEFAULT_LANG;
}

export function resolveLangFromQuery(queryParams: Record<string, unknown>): AppLanguage {
    const lang = queryParams['lang'];
    if (typeof lang === 'string' && isAppLanguage(lang)) {
        return lang;
    }
    return getPreferredLang();
}
