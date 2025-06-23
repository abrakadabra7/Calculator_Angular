import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, retry } from 'rxjs/operators';

export interface CalculateRequestDto {
  parameter1: number;
  parameter2: number;
}

export interface ResultDto {
  result: number;
  operation: 'ADDITION' | 'SUBTRACTION' | 'MULTIPLICATION' | 'DIVISION' | 'SQUARE_ROOT' | 'POWER';
}

@Injectable({
  providedIn: 'root'
})
export class CalculatorApiService {
  private readonly baseUrl = 'http://s1.divlop.com:5001/api/calculator';
  private readonly token = 'ipEjAfe1zXy1EAEsIzFQJacDCjcMDwJRt2rZIlIXoqb4e7TyE4HWM0A1bZSPDChB';
  private authFormat = 'Bearer'; // Bearer, Basic, Token, veya direct

  constructor(private http: HttpClient) {}

  private getHeaders(format: string = this.authFormat): HttpHeaders {
    let authValue: string;
    
    switch (format) {
      case 'Bearer':
        authValue = `Bearer ${this.token}`;
        break;
      case 'Token':
        authValue = `Token ${this.token}`;
        break;
      case 'Basic':
        authValue = `Basic ${this.token}`;
        break;
      case 'direct':
        authValue = this.token;
        break;
      default:
        authValue = `Bearer ${this.token}`;
    }

    console.log(`🔑 Authorization Header: ${format} -> ${authValue.substring(0, 20)}...`);
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': authValue
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('🚨 API Hatası Detayı:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error,
      headers: error.headers.keys()
    });
    
    let errorMessage = 'Bilinmeyen hata';
    
    if (error.status === 0) {
      errorMessage = 'CORS hatası: API sunucusuna bağlanılamıyor';
    } else if (error.status === 401) {
      // 401 hatası aldığımızda farklı format deneyelim
      if (this.authFormat === 'Bearer') {
        console.log('🔄 Bearer başarısız, Token formatını deniyorum...');
        this.authFormat = 'Token';
      } else if (this.authFormat === 'Token') {
        console.log('🔄 Token başarısız, direct formatını deniyorum...');
        this.authFormat = 'direct';
      } else if (this.authFormat === 'direct') {
        console.log('🔄 Direct başarısız, Basic formatını deniyorum...');
        this.authFormat = 'Basic';
      } else {
        errorMessage = 'Yetkilendirme hatası - Tüm token formatları denendi';
      }
    } else if (error.status === 403) {
      errorMessage = 'Erişim reddedildi';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint bulunamadı';
    } else if (error.status >= 500) {
      errorMessage = 'Sunucu hatası';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private makeRequest<T>(endpoint: string, body: CalculateRequestDto): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`📡 API İsteği:`, { 
      url, 
      body,
      authFormat: this.authFormat 
    });
    
    return this.http.post<T>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log(`✅ API Başarılı (${endpoint}):`, response)),
      retry(1), // Bir kez tekrar dene
      catchError(this.handleError.bind(this))
    );
  }

  // Toplama işlemi
  add(parameter1: number, parameter2: number): Observable<ResultDto> {
    return this.makeRequest<ResultDto>('/add', { parameter1, parameter2 });
  }

  // Çıkarma işlemi
  subtract(parameter1: number, parameter2: number): Observable<ResultDto> {
    return this.makeRequest<ResultDto>('/subtract', { parameter1, parameter2 });
  }

  // Çarpma işlemi
  multiply(parameter1: number, parameter2: number): Observable<ResultDto> {
    return this.makeRequest<ResultDto>('/multiply', { parameter1, parameter2 });
  }

  // Bölme işlemi
  divide(parameter1: number, parameter2: number): Observable<ResultDto> {
    return this.makeRequest<ResultDto>('/divide', { parameter1, parameter2 });
  }

  // Üs alma işlemi
  power(parameter1: number, parameter2: number): Observable<ResultDto> {
    return this.makeRequest<ResultDto>('/power', { parameter1, parameter2 });
  }

  // Karekök işlemi
  squareRoot(parameter1: number): Observable<ResultDto> {
    return this.makeRequest<ResultDto>('/squareRoot', { parameter1, parameter2: 0 });
  }

  // Test için farklı auth formatını manuel olarak ayarla
  setAuthFormat(format: 'Bearer' | 'Token' | 'Basic' | 'direct') {
    this.authFormat = format;
    console.log(`🔧 Auth format değiştirildi: ${format}`);
  }

  // Mevcut auth formatını öğren
  getCurrentAuthFormat(): string {
    return this.authFormat;
  }
} 