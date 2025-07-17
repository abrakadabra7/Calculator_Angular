import { createReducer, on } from '@ngrx/store';
import * as HistoryActions from './history.actions';
import { HistoryItem } from './history.models';

export interface HistoryState {
  history: HistoryItem[];
  loading: boolean;
  error: any;
}

export const initialState: HistoryState = {
  history: [],
  loading: false,
  error: null
};

export const historyReducer = createReducer(
  initialState,
  on(HistoryActions.loadHistory, (state) => ({ ...state, loading: true, error: null })),
  on(HistoryActions.loadHistorySuccess, (state, { history }) => ({ ...state, loading: false, history })),
  on(HistoryActions.loadHistoryFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(HistoryActions.addOperation, (state, { operation }) => ({
    ...state,
    history: [operation, ...state.history].slice(0, 5) // max 5 kayıt
  })),

  on(HistoryActions.clearHistory, (state) => ({ ...state, loading: true })),
  on(HistoryActions.clearHistorySuccess, (state) => ({ ...state, loading: false, history: [] })),
  on(HistoryActions.clearHistoryFailure, (state, { error }) => ({ ...state, loading: false, error }))
); 