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

  public sortData<T>(data: T[], field: string, ascending: boolean = true): void {
    if (ascending) {
      data.sort((a: T, b: T) => this.d3Service.d3.ascending(a[field], b[field]));
    }
    else {
      data.sort((a: T, b: T) => this.d3Service.d3.descending(a[field], b[field]));
    }
  }
}
