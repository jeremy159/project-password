import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'pp-shield-icon',
  templateUrl: './shield-icon.component.html',
  styleUrls: ['./shield-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShieldIconComponent implements OnInit {

  public percentage = 0;
  @Input() public set fillPercentage(value: number) {
    this.percentage = (value < 0) ? 0 : (value > 1) ? 1 : value;
  }
  public color: string;
  @Input() public set fillColor(value: zxcvbn.ZXCVBNScore) {
    switch (value) {
      case 0:
        this.color = '#d40000'; // red
      break;

      case 1:
        this.color = '#ff6600'; // orange
      break;

      case 2:
        this.color = '#ff8c1a'; // light-orange
      break;

      case 3:
        this.color = '#ffcc00'; // yellow
      break;

      case 4:
        this.color = '#339900'; // green
      break;

      default:
        this.color = '#d40000'; // red
      break;
    }
  }

  constructor() { }

  ngOnInit() {
  }

}
