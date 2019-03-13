import { Injectable, ElementRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollRefService {

  public scrollElement: ElementRef = undefined;

}
