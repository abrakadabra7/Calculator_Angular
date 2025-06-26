import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CalculatorApiService, HistoryEntity } from './calculator-api.service';
import { catchError, tap } from 'rxjs/operators';

export interface HistoryItem {
  id: number;
  operation: string;
  parameter1: number;
  parameter2?: number;
  result: number;
  timestamp: Date;
  expression: string; // 
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly maxHistoryItems = 5;
  private historySubject = new BehaviorSubject<HistoryItem[]>([]);
  private nextId = 1;
  private platformId = inject(PLATFORM_ID);
  private apiService = inject(CalculatorApiService);
  private useApi = true; 
  // Observable olarak history'yi dışarı veriyoruz
  public history$: Observable<HistoryItem[]> = this.historySubject.asObservable();

  constructor() {
    // History'yi yükle (API veya LocalStorage'dan)
    this.loadHistory();
  }

  // Yeni işlem ekle
  addOperation(operation: string, parameter1: number, parameter2: number | undefined, result: number): void {
    const expression = this.formatExpression(operation, parameter1, parameter2, result);
    
    const newItem: HistoryItem = {
      id: this.nextId++,
      operation,
      parameter1,
      parameter2,
      result,
      timestamp: new Date(),
      expression
    };

    const currentHistory = this.historySubject.value;
    const updatedHistory = [newItem, ...currentHistory].slice(0, this.maxHistoryItems);
    
    this.historySubject.next(updatedHistory);
    this.saveHistoryToStorage(updatedHistory);
  }

  // Geçmişi temizle
  clearHistory(): void {
    if (this.useApi) {
      this.apiService.clearHistory().pipe(
        tap(() => {
          console.log('✅ History API ile temizlendi');
          this.historySubject.next([]);
        }),
        catchError(error => {
          console.warn('❌ History API temizlenemedi, LocalStorage\'a geçiliyor:', error);
          this.useApi = false;
          this.historySubject.next([]);
          this.saveHistoryToStorage([]);
          return of(null);
        })
      ).subscribe();
    } else {
      this.historySubject.next([]);
      this.saveHistoryToStorage([]);
    }
  }

  // Mevcut geçmişi al
  getCurrentHistory(): HistoryItem[] {
    return this.historySubject.value;
  }

  // Son işlemi tekrar kullan
  getLastOperation(): HistoryItem | null {
    const history = this.historySubject.value;
    return history.length > 0 ? history[0] : null;
  }

  // Expression formatla
  private formatExpression(operation: string, param1: number, param2: number | undefined, result: number): string {
    const formattedParam1 = this.formatNumber(param1);
    const formattedResult = this.formatNumber(result);

    switch (operation) {
      case '+':
        return `${formattedParam1} + ${this.formatNumber(param2!)} = ${formattedResult}`;
      case '-':
        return `${formattedParam1} − ${this.formatNumber(param2!)} = ${formattedResult}`;
      case '×':
        return `${formattedParam1} × ${this.formatNumber(param2!)} = ${formattedResult}`;
      case '÷':
        return `${formattedParam1} ÷ ${this.formatNumber(param2!)} = ${formattedResult}`;
      case '^':
        return `${formattedParam1} ^ ${this.formatNumber(param2!)} = ${formattedResult}`;
      case '√':
        return `√${formattedParam1} = ${formattedResult}`;
      default:
        return `${formattedParam1} = ${formattedResult}`;
    }
  }

  // Sayıları formatla
  private formatNumber(num: number): string {
    if (num % 1 === 0) {
      return num.toString();
    }
    return parseFloat(num.toFixed(6)).toString();
  }

  // LocalStorage'a kaydet
  private saveHistoryToStorage(history: HistoryItem[]): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('calculator-history', JSON.stringify(history));
      } catch (error) {
        console.warn('LocalStorage\'a geçmiş kaydedilemedi:', error);
      }
    }
  }

  // History'yi API'den veya LocalStorage'dan yükle
  private loadHistory(): void {
    if (this.useApi) {
      this.apiService.getHistory().pipe(
        tap(apiHistory => {
          console.log('✅ History API\'den yüklendi:', apiHistory);
          const history = this.convertApiHistoryToLocal(apiHistory);
          this.historySubject.next(history);
        }),
        catchError(error => {
          console.warn('❌ History API\'den yüklenemedi, LocalStorage\'a geçiliyor:', error);
          this.useApi = false;
          this.loadHistoryFromStorage();
          return of([]);
        })
      ).subscribe();
    } else {
      this.loadHistoryFromStorage();
    }
  }

  // LocalStorage'dan yükle
  private loadHistoryFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem('calculator-history');
        if (saved) {
          const history: HistoryItem[] = JSON.parse(saved);
          // Timestamp'leri Date objesine çevir
          history.forEach(item => {
            item.timestamp = new Date(item.timestamp);
          });
          
          // NextId'yi ayarla
          if (history.length > 0) {
            this.nextId = Math.max(...history.map(h => h.id)) + 1;
          }
          
          this.historySubject.next(history);
        }
      } catch (error) {
        console.warn('LocalStorage\'dan geçmiş yüklenemedi:', error);
        this.historySubject.next([]);
      }
    }
  }

  // API history'sini local history'ye çevir
  private convertApiHistoryToLocal(apiHistory: HistoryEntity[]): HistoryItem[] {
    return apiHistory.slice(0, this.maxHistoryItems).map((item, index) => ({
      id: this.nextId++,
      operation: this.apiService.mapApiOperationToLocal(item.operation),
      parameter1: item.parameter1,
      parameter2: item.parameter2 || undefined,
      result: item.result,
      timestamp: new Date(item.date),
      expression: this.formatExpression(
        this.apiService.mapApiOperationToLocal(item.operation), 
        item.parameter1, 
        item.parameter2, 
        item.result
      )
    }));
  }
} 