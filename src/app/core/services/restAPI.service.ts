import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

const headers = new HttpHeaders().set('Content-Type', 'application/json');

@Injectable()
export class RestAPIService {

  private baseUrl: string;

  constructor(private http: HttpClient) {
          // this.baseUrl = this.configService.get<string>('serverUrl');
        }

  public getRequest<T>(url: string): Observable<HttpResponse<T>> {
    return this.http.get<T>(this.baseUrl + url, { observe: 'response', headers })
      .pipe(
        catchError((error: HttpErrorResponse) => Observable.throw(error))
      );
  }

  public postRequest<T>(url: string, body: T, bodyName?: string): Observable<HttpResponse<T>> {
    let tempBody = {};
    if (bodyName) {
      tempBody[bodyName] = body;
    }
    else {
      tempBody = body;
    }

    return this.http.post<T>(this.baseUrl + url, tempBody, { observe: 'response', headers })
      .pipe(
        catchError((error: HttpErrorResponse) => Observable.throw(error))
      );
  }

  public putRequest<T>(url: string, body: T, bodyName?: string): Observable<HttpResponse<T>> {
    let tempBody = {};
    if (bodyName) {
      tempBody[bodyName] = body;
    }
    else {
      tempBody = body;
    }

    return this.http.put<T>(this.baseUrl + url, tempBody, { observe: 'response', headers })
      .pipe(
        catchError((error: HttpErrorResponse) => Observable.throw(error))
      );
  }
}
