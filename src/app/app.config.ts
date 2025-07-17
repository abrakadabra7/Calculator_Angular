import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

// NgRx: History reducer ve effects importları
import { historyReducer } from './store/history/history.reducer';
import { HistoryEffects } from './store/history/history.effects';
import { CalculatorApiService } from './services/calculator-api.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideStore({ history: historyReducer }),
    provideEffects([HistoryEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    CalculatorApiService
]
};
