import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, Observer, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { D3Service } from './d3.service';

const headers = new HttpHeaders().set('Content-Type', 'application/json');

@Injectable({
  providedIn: 'root'
})
export class RestAPIService {

  private serverBaseUrl = 'https://project-password-server.herokuapp.com/';
  private localBaseUrl = '/data/donnees_traitees/';

  constructor(private http: HttpClient,
              private d3Service: D3Service) { }

  public getRequest<T>(url: string, isLocal: boolean = false, isCsv: boolean = true): Observable<T> {
    if (isCsv) {
      return from(this.d3Service.d3.csv(isLocal ? this.localBaseUrl + url : this.serverBaseUrl + url)) as Observable<T>;
    }

    return this.http.get<T>(isLocal ? this.localBaseUrl + url : this.serverBaseUrl + url, { observe: 'response' })
      .pipe(
        map((response: HttpResponse<T>) => {
          return response.body;
        }),
        catchError((error: HttpErrorResponse) => throwError(error))
      );
  }
}
