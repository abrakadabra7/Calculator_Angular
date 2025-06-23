import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HistoryItem {
  id: number;
  operation: string;
  parameter1: number;
  parameter2?: number;
  result: number;
  timestamp: Date;
  expression: string; // "5 + 3 = 8" formatında
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly maxHistoryItems = 5;
  private historySubject = new BehaviorSubject<HistoryItem[]>([]);
  private nextId = 1;

  // Observable olarak history'yi dışarı veriyoruz
  public history$: Observable<HistoryItem[]> = this.historySubject.asObservable();

  constructor() {
    // LocalStorage'dan geçmişi yükle
    this.loadHistoryFromStorage();
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
    this.historySubject.next([]);
    this.saveHistoryToStorage([]);
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
    try {
      localStorage.setItem('calculator-history', JSON.stringify(history));
    } catch (error) {
      console.warn('LocalStorage\'a geçmiş kaydedilemedi:', error);
    }
  }

  // LocalStorage'dan yükle
  private loadHistoryFromStorage(): void {
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