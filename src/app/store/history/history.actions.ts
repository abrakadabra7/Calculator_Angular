import { createAction, props } from '@ngrx/store';
import { HistoryItem } from './history.models';

// Geçmişi API'den veya local'den yükle
export const loadHistory = createAction('[History] Load History');
export const loadHistorySuccess = createAction('[History] Load History Success', props<{ history: HistoryItem[] }>());
export const loadHistoryFailure = createAction('[History] Load History Failure', props<{ error: any }>());

// Yeni işlem ekle
export const addOperation = createAction('[History] Add Operation', props<{ operation: HistoryItem }>());

// Geçmişi temizle
export const clearHistory = createAction('[History] Clear History');
export const clearHistorySuccess = createAction('[History] Clear History Success');
export const clearHistoryFailure = createAction('[History] Clear History Failure', props<{ error: any }>()); 