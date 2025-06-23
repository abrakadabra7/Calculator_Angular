import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonType = 'number' | 'operator' | 'func';

interface CalcButton {
  label: string;
  type: ButtonType;
  extraClass?: string;
}

@Component({
  selector: 'app-calculator-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator-button.component.html',
  styleUrls: ['./calculator-button.component.css']
})
export class CalculatorButtonComponent {
  @Output() buttonClick = new EventEmitter<string>();

  buttons: CalcButton[][] = [
    [
      { label: 'C', type: 'func' },
      { label: '←', type: 'func' },
      { label: '√', type: 'func' },
      { label: '÷', type: 'operator' }
    ],
    [
      { label: '7', type: 'number' },
      { label: '8', type: 'number' },
      { label: '9', type: 'number' },
      { label: '×', type: 'operator' }
    ],
    [
      { label: '4', type: 'number' },
      { label: '5', type: 'number' },
      { label: '6', type: 'number' },
      { label: '−', type: 'operator' }
    ],
    [
      { label: '1', type: 'number' },
      { label: '2', type: 'number' },
      { label: '3', type: 'number' },
      { label: '+', type: 'operator' }
    ],
    [
      { label: '0', type: 'number', extraClass: 'btn-zero' },
      { label: '.', type: 'number' },
      { label: '^', type: 'operator' },
      { label: '=', type: 'func', extraClass: 'btn-eq' }
    ]
  ];

  onClick(label: string) {
    this.buttonClick.emit(label);
  }
} 