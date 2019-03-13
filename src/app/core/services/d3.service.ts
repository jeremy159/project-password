import { Injectable } from '@angular/core';
import * as d3Instance from 'd3';

@Injectable({
  providedIn: 'root'
})
export class D3Service {

  get d3(): any {
    return d3Instance;
  }
}
