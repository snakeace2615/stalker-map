import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, RedirectFunction, Router, Routes } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MainComponent } from './components/main/main.component';
import { MapComponent } from './components/map/map.component';
import { MapExportComponent } from './components/map-export/map-export.component';
import { MapContentComponent } from './components/map-content/map-content.component';
import { MapHocComponent } from './components/hoc/map-hoc/map-hoc.component';
import { isAppLanguage, resolveLangFromQuery } from './locale';
import { LocaleService } from './services/locale.service';

const langCanMatch: CanMatchFn = (_route, segments) => isAppLanguage(segments[0]?.path);

const langCanActivate: CanActivateFn = (route) => {
    const lang = route.paramMap.get('lang');
    if (!isAppLanguage(lang)) {
        return false;
    }

    const translate = inject(TranslateService);
    const locale = inject(LocaleService);
    locale.persistLang(lang);
    if (translate.currentLang() !== lang) {
        translate.use(lang);
    }
    return true;
};

function stripLangQuery(queryParams: Record<string, unknown>): Record<string, unknown> {
    const { lang: _lang, ...rest } = queryParams;
    return rest;
}

function legacyRedirect(segments: string[]): RedirectFunction {
    return ({ queryParams }) => {
        const router = inject(Router);
        const lang = resolveLangFromQuery(queryParams);
        return router.createUrlTree(['/', lang, ...segments], {
            queryParams: stripLangQuery(queryParams),
        });
    };
}

function legacyRedirectWithParam(
    buildSegments: (params: Record<string, string>) => string[]
): RedirectFunction {
    return ({ params, queryParams }) => {
        const router = inject(Router);
        const lang = resolveLangFromQuery(queryParams);
        return router.createUrlTree(['/', lang, ...buildSegments(params)], {
            queryParams: stripLangQuery(queryParams),
        });
    };
}

export const routes: Routes = [
    {
        path: ':lang',
        canMatch: [langCanMatch],
        canActivate: [langCanActivate],
        children: [
            { path: '', component: MainComponent },
            { path: 'map/hoc', component: MapHocComponent },
            { path: 'map/content/:game', component: MapContentComponent },
            { path: 'map/:game', component: MapComponent },
        ],
    },
    { path: 'export/map/:game/:lang', component: MapExportComponent },

    // Legacy URLs without language prefix
    { path: '', pathMatch: 'full', redirectTo: legacyRedirect([]) },
    { path: 'main', redirectTo: legacyRedirect([]) },
    { path: 'map/hoc', redirectTo: legacyRedirect(['map', 'hoc']) },
    {
        path: 'map/content/:game',
        redirectTo: legacyRedirectWithParam((params) => ['map', 'content', params['game']]),
    },
    {
        path: 'map/:game',
        redirectTo: legacyRedirectWithParam((params) => ['map', params['game']]),
    },
    { path: '**', redirectTo: legacyRedirect([]) },
];
