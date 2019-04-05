import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';

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
