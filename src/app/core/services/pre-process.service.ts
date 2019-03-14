import { Injectable } from '@angular/core';
import { D3Service } from './d3.service';

@Injectable({
  providedIn: 'root'
})
export class PreProcessService {

  constructor(private d3Service: D3Service) { }

  public convertNumbers<T>(data: T[], fields: string[]): void {
    data.forEach(d => {
      fields.forEach(f => {
        d[f] = +d[f];
      });
    });
  }
}
