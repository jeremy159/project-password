import { Directive, HostListener } from '@angular/core';
import { ScrollRefService } from 'src/app/core/services/scroll-ref.service';

@Directive({
  selector: '[ppScrollToRef]'
})
export class ScrollToRefDirective {

  constructor(private scrollRefService: ScrollRefService) { }

  @HostListener('click')
  private onCLick(): void {
    const nativeElement: HTMLElement = this.scrollRefService.scrollElement.nativeElement;

    if (nativeElement) {
      nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

}
