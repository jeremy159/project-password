import { Injectable } from '@angular/core';
import { D3Service } from './d3.service';

@Injectable({
  providedIn: 'root'
})
export class PreProcessService {

  constructor(private d3Service: D3Service) { }

  public convertNumbers<T>(data: T[] | T, fields: string[]): void {
    if (Array.isArray(data)) {
      data.forEach(d => {
        fields.forEach(f => {
          d[f] = +d[f];
        });
      });
    }
    else {
      fields.forEach(f => {
        data[f] = +data[f];
      });
    }
  }
}
