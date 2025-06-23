import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculatorButtonComponent } from '../buttons/calculator-button.component';
import { HistoryService, HistoryItem } from '../../services/history.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, CalculatorButtonComponent],
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})
export class CalculatorComponent {
  displayValue: string = '0';
  errorMessage: string = '';
  
  // Hesap makinesi durumu
  private currentValue: number = 0;
  private previousValue: number = 0;
  private currentOperator: string = '';
  private waitingForNumber: boolean = false;

  // History service injection
  private historyService = inject(HistoryService);
  
  // History observable
  public history$: Observable<HistoryItem[]> = this.historyService.history$;

  onButtonClick(label: string) {
    this.errorMessage = '';
    
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
      this.calculate();
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
      this.squareRoot();
    }
    
    console.log(`Buton tıklandı: ${label}, Display: ${this.displayValue}`);
  }

  // History'den işlem seç
  onHistorySelect(historyItem: HistoryItem) {
    this.displayValue = this.formatResult(historyItem.result);
    this.currentValue = historyItem.result;
    this.waitingForNumber = true;
    this.currentOperator = '';
  }

  // History'yi temizle
  onClearHistory() {
    this.historyService.clearHistory();
  }

  // TrackBy function for ngFor performance
  trackByHistoryId(index: number, item: HistoryItem): number {
    return item.id;
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
  }

  private inputOperator(operator: string) {
    if (this.currentOperator && !this.waitingForNumber) {
      this.calculate();
    }
    
    this.previousValue = this.currentValue;
    // − operatörünü - olarak normalize et
    this.currentOperator = operator === '−' ? '-' : operator;
    this.waitingForNumber = true;
  }

  private inputDecimal() {
    if (this.waitingForNumber) {
      this.displayValue = '0.';
      this.waitingForNumber = false;
    } else if (this.displayValue.indexOf('.') === -1) {
      this.displayValue += '.';
    }
  }

  private backspace() {
    if (this.displayValue.length > 1) {
      this.displayValue = this.displayValue.slice(0, -1);
    } else {
      this.displayValue = '0';
    }
    this.currentValue = parseFloat(this.displayValue) || 0;
  }

  private calculate() {
    if (!this.currentOperator || this.waitingForNumber) {
      return;
    }

    let result: number;
    
    try {
      switch (this.currentOperator) {
        case '+':
          result = this.previousValue + this.currentValue;
          break;
        case '-':
          result = this.previousValue - this.currentValue;
          break;
        case '×':
          result = this.previousValue * this.currentValue;
          break;
        case '÷':
          if (this.currentValue === 0) {
            this.errorMessage = 'Sıfıra bölme hatası';
            return;
          }
          result = this.previousValue / this.currentValue;
          break;
        case '^':
          result = Math.pow(this.previousValue, this.currentValue);
          break;
        default:
          return;
      }

      // History'ye kaydet
      this.historyService.addOperation(
        this.currentOperator,
        this.previousValue,
        this.currentValue,
        result
      );

      this.displayValue = this.formatResult(result);
      this.currentValue = result;
      this.currentOperator = '';
      this.waitingForNumber = true;
      
    } catch (error) {
      this.errorMessage = 'Hesaplama hatası';
    }
  }

  private squareRoot() {
    if (this.currentValue < 0) {
      this.errorMessage = 'Negatif sayının karekökü alınamaz';
      return;
    }
    
    const result = Math.sqrt(this.currentValue);
    
    // History'ye kaydet
    this.historyService.addOperation(
      '√',
      this.currentValue,
      undefined,
      result
    );
    
    this.displayValue = this.formatResult(result);
    this.currentValue = result;
    this.waitingForNumber = true;
  }

  private toggleSign() {
    if (this.displayValue !== '0') {
      if (this.displayValue.startsWith('-')) {
        this.displayValue = this.displayValue.substring(1);
      } else {
        this.displayValue = '-' + this.displayValue;
      }
      this.currentValue = parseFloat(this.displayValue);
    }
  }

  private clear() {
    this.displayValue = '0';
    this.currentValue = 0;
    this.previousValue = 0;
    this.currentOperator = '';
    this.waitingForNumber = false;
    this.errorMessage = '';
  }

  private clearEntry() {
    this.displayValue = '0';
    this.currentValue = 0;
    this.waitingForNumber = false;
  }

  private formatResult(result: number): string {
    // Çok büyük veya çok küçük sayılar için bilimsel notasyon
    if (Math.abs(result) > 999999999999 || (Math.abs(result) < 0.000001 && result !== 0)) {
      return result.toExponential(6);
    }
    
    // Ondalık sayılar için maksimum 10 basamak
    if (result % 1 !== 0) {
      return parseFloat(result.toFixed(10)).toString();
    }
    
    return result.toString();
  }
}
