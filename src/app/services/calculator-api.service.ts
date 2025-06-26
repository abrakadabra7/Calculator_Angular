import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// API dokümantasyonundaki interface'ler
export interface CalculateRequestDto {
  parameter1: number;
  parameter2: number;
}

export interface ResultDto {
  result: number;
  operation: 'ADDITION' | 'SUBTRACTION' | 'MULTIPLICATION' | 'DIVISION' | 'SQUARE_ROOT' | 'POWER';
}

export interface HistoryEntity {
  operation: 'ADDITION' | 'SUBTRACTION' | 'MULTIPLICATION' | 'DIVISION' | 'SQUARE_ROOT' | 'POWER';
  parameter1: number;
  parameter2: number;
  result: number;
  date: string; 
}

@Injectable({
  providedIn: 'root'
})
export class CalculatorApiService {
  private readonly baseUrl = environment.useProxy ? '' : environment.apiUrl;
  private readonly token = 'ipEjAfe1zXy1EAEsIzFQJacDCjcMDwJRt2rZIlIXoqb4e7TyE4HWM0A1bZSPDChB';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('🚨 API Hatası:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
    
    let errorMessage = 'Bilinmeyen hata';
    
    if (error.status === 0) {
      errorMessage = 'API sunucusuna bağlanılamıyor (CORS hatası)';
    } else if (error.status === 401) {
      errorMessage = 'Yetkilendirme hatası - Geçersiz token';
    } else if (error.status === 403) {
      errorMessage = 'Erişim reddedildi';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint bulunamadı';
    } else if (error.status >= 500) {
      errorMessage = 'Sunucu hatası';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Calculator API metodları
  add(parameter1: number, parameter2: number): Observable<ResultDto> {
    const url = `${this.baseUrl}/api/calculator/add`;
    const body: CalculateRequestDto = { parameter1, parameter2 };
    
    console.log('📡 Toplama API çağrısı:', { url, body });
    
    return this.http.post<ResultDto>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ Toplama başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  subtract(parameter1: number, parameter2: number): Observable<ResultDto> {
    const url = `${this.baseUrl}/api/calculator/subtract`;
    const body: CalculateRequestDto = { parameter1, parameter2 };
    
    console.log('📡 Çıkarma API çağrısı:', { url, body });
    
    return this.http.post<ResultDto>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ Çıkarma başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  multiply(parameter1: number, parameter2: number): Observable<ResultDto> {
    const url = `${this.baseUrl}/api/calculator/multiply`;
    const body: CalculateRequestDto = { parameter1, parameter2 };
    
    console.log('📡 Çarpma API çağrısı:', { url, body });
    
    return this.http.post<ResultDto>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ Çarpma başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  divide(parameter1: number, parameter2: number): Observable<ResultDto> {
    const url = `${this.baseUrl}/api/calculator/divide`;
    const body: CalculateRequestDto = { parameter1, parameter2 };
    
    console.log('📡 Bölme API çağrısı:', { url, body });
    
    return this.http.post<ResultDto>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ Bölme başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  power(parameter1: number, parameter2: number): Observable<ResultDto> {
    const url = `${this.baseUrl}/api/calculator/power`;
    const body: CalculateRequestDto = { parameter1, parameter2 };
    
    console.log('📡 Üs alma API çağrısı:', { url, body });
    
    return this.http.post<ResultDto>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ Üs alma başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  squareRoot(parameter1: number): Observable<ResultDto> {
    const url = `${this.baseUrl}/api/calculator/squareRoot`;
    const body: CalculateRequestDto = { parameter1, parameter2: 0 }; 
    
    console.log('📡 Karekök API çağrısı:', { url, body });
    
    return this.http.post<ResultDto>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ Karekök başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  // History API metodları
  getHistory(): Observable<HistoryEntity[]> {
    const url = `${this.baseUrl}/api/history/getHistory`;
    
    console.log('📡 History API çağrısı:', { url });
    
    return this.http.get<HistoryEntity[]>(url, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ History başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  getAllHistory(): Observable<HistoryEntity[]> {
    const url = `${this.baseUrl}/api/history/getAllHistory`;
    
    console.log('📡 All History API çağrısı:', { url });
    
    return this.http.get<HistoryEntity[]>(url, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('✅ All History başarılı:', response)),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  clearHistory(): Observable<void> {
    const url = `${this.baseUrl}/api/history/clearHistory`;
    
    console.log('📡 Clear History API çağrısı:', { url });
    
    return this.http.delete<void>(url, { headers: this.getHeaders() }).pipe(
      tap(() => console.log('✅ Clear History başarılı')),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  // API operation enum'ını local operation'a çevir
  mapApiOperationToLocal(apiOperation: string): string {
    switch (apiOperation) {
      case 'ADDITION': return '+';
      case 'SUBTRACTION': return '-';
      case 'MULTIPLICATION': return '×';
      case 'DIVISION': return '÷';
      case 'POWER': return '^';
      case 'SQUARE_ROOT': return '√';
      default: return apiOperation;
    }
  }

  // Local operation'ı API operation enum'ına çevir
  mapLocalOperationToApi(localOperation: string): string {
    switch (localOperation) {
      case '+': return 'ADDITION';
      case '-': return 'SUBTRACTION';
      case '×': return 'MULTIPLICATION';
      case '÷': return 'DIVISION';
      case '^': return 'POWER';
      case '√': return 'SQUARE_ROOT';
      default: return localOperation;
    }
  }
} 