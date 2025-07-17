import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExchangeRateService implements OnDestroy {
  private ws: WebSocket | null = null;
  private rateSubject = new BehaviorSubject<number | null>(null);
  public rate$: Observable<number | null> = this.rateSubject.asObservable();
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  private connect() {
    this.ws = new WebSocket('ws://5.250.255.84:12668/');
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // data bir array ve ilk elemanında Bid veya Ask var
        if (Array.isArray(data) && data.length > 0 && data[0].Bid) {
          const kur = Number(data[0].Bid); // veya data[0].Ask
          console.log('Güncel kur:', kur);
          this.rateSubject.next(kur);
        }
      } catch (e) {
        // Hatalı veri gelirse ignore et
      }
    };
    this.ws.onerror = () => {
      this.rateSubject.next(null);
    };
    this.ws.onclose = () => {
      // Otomatik reconnect (basit)
      setTimeout(() => this.connect(), 3000);
    };
  }

  ngOnDestroy(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
} 