import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ScrollRefService } from 'src/app/core/services/scroll-ref.service';

@Component({
  selector: 'pp-password-nouns-chart',
  templateUrl: './password-nouns-chart.component.html',
  styleUrls: ['./password-nouns-chart.component.scss']
})
export class PasswordNounsChartComponent implements AfterViewInit {

  @ViewChild('firstChart') public scrollReference: ElementRef;

  constructor(private scrollRefService: ScrollRefService) { }

  public ngAfterViewInit(): void {
    this.scrollRefService.scrollElement = this.scrollReference;
  }

}
