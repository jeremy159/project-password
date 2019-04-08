import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'pp-footer',
  template: `
    <div class="footer-content">
      <small fxLayout="row" fxLayoutAlign="center center" fxLayoutGap="24px">Auteurs : 
        <ul fxLayout="row" fxLayoutAlign="center center" fxLayoutGap="6px">
          <li>Sofien Ben Ayed</li>
          <span class="dot">•</span><li >Jérémy Dubé</li>
          <span class="dot">•</span><li >Salah Eddine Kamate</li>
          <span class="dot">•</span><li >Antoine Pèlegrin</li>
          <span class="dot">•</span><li >Maxime Thibault</li>
        </ul>
      </small>
    </div>
  `,
  styles: [`
    .footer-content {
      margin-top: 36px;
      padding: 8px 16px;
      background-color: #FAFAFA;
    }

    ul {
      list-style-type: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
