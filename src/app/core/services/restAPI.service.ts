import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

const headers = new HttpHeaders().set('Content-Type', 'application/json');

@Injectable()
export class RestAPIService {

  private serverBaseUrl = 'http://localhost:3000/';
  private localBaseUrl = '/data/donnees_traitees/';

  constructor(private http: HttpClient) { }

  public getRequest<T>(url: string, isLocal: boolean = false): Observable<HttpResponse<T>> {
    return this.http.get<T>(isLocal ? this.localBaseUrl + url : this.serverBaseUrl + url, { observe: 'response', headers })
      .pipe(
        catchError((error: HttpErrorResponse) => Observable.throw(error))
      );
  }
}
