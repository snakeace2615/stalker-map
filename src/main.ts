import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { applyHocIconCacheBust } from './app/utils/asset-url';

applyHocIconCacheBust();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
