export interface HistoryItem {
  id: number;
  operation: string;
  parameter1: number;
  parameter2?: number;
  result: number;
  timestamp: Date;
  expression: string;
} 