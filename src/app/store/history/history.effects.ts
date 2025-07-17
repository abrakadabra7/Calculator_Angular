import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { CalculatorApiService } from '../../services/calculator-api.service';
import * as HistoryActions from './history.actions';
import { catchError, map, mergeMap, of } from 'rxjs';
import { HistoryEntity } from '../../services/calculator-api.service';
import { HistoryItem } from './history.models';

@Injectable()
export class HistoryEffects {
  private actions$ = inject(Actions);
  private apiService = inject(CalculatorApiService);
  private nextId = 1;

  private convertApiHistoryToLocal(apiHistory: HistoryEntity[]): HistoryItem[] {
    return apiHistory.slice(0, 5).map((item) => ({
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

  private formatExpression(operation: string, param1: number, param2: number | undefined, result: number): string {
    const formattedParam1 = param1 % 1 === 0 ? param1.toString() : parseFloat(param1.toFixed(6)).toString();
    const formattedResult = result % 1 === 0 ? result.toString() : parseFloat(result.toFixed(6)).toString();
    switch (operation) {
      case '+':
        return `${formattedParam1} + ${param2} = ${formattedResult}`;
      case '-':
        return `${formattedParam1} − ${param2} = ${formattedResult}`;
      case '×':
        return `${formattedParam1} × ${param2} = ${formattedResult}`;
      case '÷':
        return `${formattedParam1} ÷ ${param2} = ${formattedResult}`;
      case '^':
        return `${formattedParam1} ^ ${param2} = ${formattedResult}`;
      case '√':
        return `√${formattedParam1} = ${formattedResult}`;
      default:
        return `${formattedParam1} = ${formattedResult}`;
    }
  }

  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.loadHistory),
      mergeMap(() =>
        this.apiService.getHistory().pipe(
          map(apiHistory => {
            const history = this.convertApiHistoryToLocal(apiHistory);
            return HistoryActions.loadHistorySuccess({ history });
          }),
          catchError(error => of(HistoryActions.loadHistoryFailure({ error })))
        )
      )
    )
  );

  clearHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.clearHistory),
      mergeMap(() =>
        this.apiService.clearHistory().pipe(
          map(() => HistoryActions.clearHistorySuccess()),
          catchError(error => of(HistoryActions.clearHistoryFailure({ error })))
        )
      )
    )
  );
} 