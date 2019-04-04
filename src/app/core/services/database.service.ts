import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { User } from 'src/app/shared/models/user';
import { RestAPIService } from './restAPI.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private passwordsRef: AngularFireList<any>;

  constructor(private db: AngularFireDatabase) { }

  private getPasswordsList() {
    this.passwordsRef = this.db.list('passwords');
    return this.passwordsRef;
  }
}
