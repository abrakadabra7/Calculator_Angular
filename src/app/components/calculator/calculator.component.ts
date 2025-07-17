import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculatorButtonComponent } from '../buttons/calculator-button.component';
// import { HistoryService, HistoryItem } from '../../services/history.service';
import { CalculatorApiService, ResultDto } from '../../services/calculator-api.service';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { HistoryItem } from '../../store/history/history.models';
import * as HistoryActions from '../../store/history/history.actions';
import * as HistorySelectors from '../../store/history/history.selectors';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, CalculatorButtonComponent],
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})
export class CalculatorComponent implements OnInit {
  displayValue: string = '0';
  operationDisplay: string = ''; 
  errorMessage: string = '';
  isCalculating: boolean = false;
  
  // Hesap makinesi durumu
  private currentValue: number = 0;
  private previousValue: number = 0;
  private currentOperator: string = '';
  private waitingForNumber: boolean = false;

  // Store injection
  private store = inject(Store);
  private apiService = inject(CalculatorApiService);
  private exchangeRateService = inject(ExchangeRateService);
  
  // History observable (NgRx store'dan)
  public history$: Observable<HistoryItem[]> = this.store.select(HistorySelectors.selectHistory);
  public rate$: Observable<number | null> = this.exchangeRateService.rate$;

  // Hem history hem de kur ile birlikte gösterilecek veri
  public historyWithDollar$: Observable<Array<{ item: HistoryItem, dollar: number | null }>> = combineLatest([
    this.history$,
    this.rate$
  ]).pipe(
    map(([history, rate]) =>
      history.map(item => ({
        item,
        dollar: rate ? Number((item.result / rate).toFixed(2)) : null
      }))
    )
  );

  public shownDollarId: number | null = null;

  showDollar(itemId: number) {
    console.log('Butona basıldı, id:', itemId);
    this.shownDollarId = itemId;
  }

  ngOnInit(): void {
    this.store.dispatch(HistoryActions.loadHistory());
  }

  onButtonClick(label: string) {
    this.errorMessage = '';
    
    // Hesaplama devam ediyorsa button'ları devre dışı bırak
    if (this.isCalculating) {
      return;
    }
    
    // Sayı butonları
    if (this.isNumber(label)) {
      this.inputNumber(label);
    }
    // Operatör butonları
    else if (this.isOperator(label)) {
      this.inputOperator(label);
    }
    // Özel fonksiyon butonları
    else if (label === '=') {
      this.calculateWithAPI();
    }
    else if (label === 'C') {
      this.clear();
    }
    else if (label === 'CE') {
      this.clearEntry();
    }
    else if (label === '←') {
      this.backspace();
    }
    else if (label === '±') {
      this.toggleSign();
    }
    else if (label === '.') {
      this.inputDecimal();
    }
    else if (label === '√') {
      this.squareRootWithAPI();
    }
    
    console.log(`🔘 Buton tıklandı: ${label}, Display: ${this.displayValue}`);
  }

  // History'den işlem seç
  onHistorySelect(historyItem: HistoryItem) {
    this.displayValue = this.formatResult(historyItem.result);
    this.currentValue = historyItem.result;
    this.waitingForNumber = true;
    this.currentOperator = '';
    this.operationDisplay = '';
  }

  // History'yi temizle
  onClearHistory() {
    this.store.dispatch(HistoryActions.clearHistory());
  }

  // TrackBy function for ngFor performance
  trackByHistoryId(index: number, obj: { item: HistoryItem, dollar: number | null }): number {
    return obj.item.id;
  }

  // Zaman formatla
  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Az önce';
    } else if (minutes < 60) {
      return `${minutes} dk önce`;
    } else if (hours < 24) {
      return `${hours} sa önce`;
    } else if (days < 7) {
      return `${days} gün önce`;
    } else {
      return timestamp.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  private isNumber(value: string): boolean {
    return /^\d$/.test(value);
  }

  private isOperator(value: string): boolean {
    return ['+', '−', '-', '×', '÷', '^'].includes(value);
  }

  private inputNumber(num: string) {
    if (this.waitingForNumber || this.displayValue === '0') {
      this.displayValue = num;
      this.waitingForNumber = false;
    } else {
      this.displayValue += num;
    }
    this.currentValue = parseFloat(this.displayValue);
    
    // İşlem devam ediyorsa operationDisplay'i güncelle
    if (this.currentOperator) {
      const displayOperator = this.currentOperator === '-' ? '−' : this.currentOperator;
      this.operationDisplay = `${this.formatNumber(this.previousValue)} ${displayOperator} ${this.displayValue}`;
    }
  }

  private inputOperator(operator: string) {
    if (this.currentOperator && !this.waitingForNumber) {
      this.calculateWithAPI();
      return;
    }
    
    this.previousValue = this.currentValue;
    this.currentOperator = operator === '−' ? '-' : operator;
    this.waitingForNumber = true;
    
    // İşlem göstergesini güncelle
    const displayOperator = this.currentOperator === '-' ? '−' : this.currentOperator;
    this.operationDisplay = `${this.formatNumber(this.previousValue)} ${displayOperator}`;
  }

  private inputDecimal() {
    if (this.waitingForNumber) {
      this.displayValue = '0.';
      this.waitingForNumber = false;
    } else if (this.displayValue.indexOf('.') === -1) {
      this.displayValue += '.';
    }
    
    // İşlem devam ediyorsa operationDisplay'i güncelle
    if (this.currentOperator) {
      const displayOperator = this.currentOperator === '-' ? '−' : this.currentOperator;
      this.operationDisplay = `${this.formatNumber(this.previousValue)} ${displayOperator} ${this.displayValue}`;
    }
  }

  private backspace() {
    if (this.displayValue.length > 1) {
      this.displayValue = this.displayValue.slice(0, -1);
    } else {
      this.displayValue = '0';
    }
    this.currentValue = parseFloat(this.displayValue) || 0;
    
    // İşlem devam ediyorsa operationDisplay'i güncelle
    if (this.currentOperator) {
      const displayOperator = this.currentOperator === '-' ? '−' : this.currentOperator;
      this.operationDisplay = `${this.formatNumber(this.previousValue)} ${displayOperator} ${this.displayValue}`;
    }
  }

  // API ile hesaplama
  private calculateWithAPI() {
    if (!this.currentOperator || this.waitingForNumber) {
      return;
    }

    this.isCalculating = true;
    this.displayValue = 'Hesaplanıyor...';
    
    // Operasyon display'ini hazırla
    const displayOperator = this.currentOperator === '-' ? '−' : this.currentOperator;
    const operationExpression = `${this.formatNumber(this.previousValue)} ${displayOperator} ${this.formatNumber(this.currentValue)}`;
    this.operationDisplay = operationExpression;

    let apiCall: Observable<ResultDto>;
    
    switch (this.currentOperator) {
      case '+':
        apiCall = this.apiService.add(this.previousValue, this.currentValue);
        break;
      case '-':
        apiCall = this.apiService.subtract(this.previousValue, this.currentValue);
        break;
      case '×':
        apiCall = this.apiService.multiply(this.previousValue, this.currentValue);
        break;
      case '÷':
        if (this.currentValue === 0) {
          this.showError('Sıfıra bölme hatası!');
          return;
        }
        apiCall = this.apiService.divide(this.previousValue, this.currentValue);
        break;
      case '^':
        apiCall = this.apiService.power(this.previousValue, this.currentValue);
        break;
      default:
        this.showError('Geçersiz operatör!');
        return;
    }

    apiCall.subscribe({
      next: (response: ResultDto) => {
        console.log('🎯 API Başarılı:', response);
        const result = response.result;
        
        // History'ye ekle
        this.addHistoryOperation(this.currentOperator, this.previousValue, this.currentValue, result);
        
        // Sonucu göster
        this.displayValue = this.formatResult(result);
        this.currentValue = result;
        this.previousValue = 0;
        this.currentOperator = '';
        this.waitingForNumber = true;
        this.operationDisplay = '';
        this.isCalculating = false;
      },
      error: (error: Error) => {
        console.error('❌ API Hatası:', error);
        this.showError(error.message);
      }
    });
  }

  // API ile karekök
  private squareRootWithAPI() {
    if (this.currentValue < 0) {
      this.showError('Negatif sayının karekökü alınamaz!');
      return;
    }

    this.isCalculating = true;
    const originalValue = this.currentValue;
    this.displayValue = 'Hesaplanıyor...';
    const operationExpression = `√${this.formatNumber(originalValue)}`;
    this.operationDisplay = operationExpression;

    this.apiService.squareRoot(originalValue).subscribe({
      next: (response: ResultDto) => {
        console.log('🎯 Karekök API Başarılı:', response);
        const result = response.result;
        
        // History'ye ekle
        this.addHistoryOperation('√', originalValue, undefined, result);
        
        // Sonucu göster
        this.displayValue = this.formatResult(result);
        this.currentValue = result;
        this.previousValue = 0;
        this.currentOperator = '';
        this.waitingForNumber = true;
        this.operationDisplay = '';
        this.isCalculating = false;
      },
      error: (error: Error) => {
        console.error('❌ Karekök API Hatası:', error);
        this.showError(error.message);
      }
    });
  }

  // Hata mesajı göster
  private showError(message: string) {
    this.errorMessage = message;
    this.displayValue = 'Hata';
    this.isCalculating = false;
    this.currentOperator = '';
    this.operationDisplay = '';
    
    // 5 saniye sonra hata mesajını temizle
    setTimeout(() => {
      this.errorMessage = '';
      this.clear();
    }, 5000);
  }

  private toggleSign() {
    if (this.displayValue !== '0' && this.displayValue !== 'Hata' && this.displayValue !== 'Hesaplanıyor...') {
      if (this.displayValue.startsWith('-')) {
        this.displayValue = this.displayValue.substring(1);
      } else {
        this.displayValue = '-' + this.displayValue;
      }
      this.currentValue = parseFloat(this.displayValue);
      
      // İşlem devam ediyorsa operationDisplay'i güncelle
      if (this.currentOperator) {
        const displayOperator = this.currentOperator === '-' ? '−' : this.currentOperator;
        this.operationDisplay = `${this.formatNumber(this.previousValue)} ${displayOperator} ${this.displayValue}`;
      }
    }
  }

  private clear() {
    this.displayValue = '0';
    this.operationDisplay = '';
    this.currentValue = 0;
    this.previousValue = 0;
    this.currentOperator = '';
    this.waitingForNumber = false;
    this.errorMessage = '';
    this.isCalculating = false;
  }

  private clearEntry() {
    this.displayValue = '0';
    this.currentValue = 0;
    this.errorMessage = '';
  }

  private formatResult(result: number): string {
    // Çok uzun ondalık sayıları kısalt
    if (Math.abs(result) < 0.000001 && result !== 0) {
      return result.toExponential(6);
    }
    
    const formatted = result.toString();
    return formatted.length > 12 ? parseFloat(result.toPrecision(10)).toString() : formatted;
  }

  private formatNumber(num: number): string {
    return num.toString();
  }

  // History'ye ekle (API sonrası)
  private addHistoryOperation(operation: string, parameter1: number, parameter2: number | undefined, result: number) {
    const expression = this.formatExpression(operation, parameter1, parameter2, result);
    const historyItem: HistoryItem = {
      id: Date.now(), // Basit id, daha iyi bir yöntem isterseniz uuid de kullanabilirsiniz
      operation,
      parameter1,
      parameter2,
      result,
      timestamp: new Date(),
      expression
    };
    this.store.dispatch(HistoryActions.addOperation({ operation: historyItem }));
  }

  // Expression formatla (HistoryService'ten alınan fonksiyon)
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
}
