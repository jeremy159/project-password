import { Directive, Input, Output, EventEmitter, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[ppDefearLoad]'
})
export class DefearLoadDirective implements AfterViewInit {
  private intersectionObserver: IntersectionObserver;
  @Output() private ppDefearLoad: EventEmitter<any> = new EventEmitter();

  constructor(private elementRef: ElementRef) { }

  public ngAfterViewInit(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '10px',
      threshold: 1.0
    };
    this.intersectionObserver = new IntersectionObserver(entries => {
      this.checkForIntersection(entries);
    }, options);
    this.intersectionObserver.observe(<Element>this.elementRef.nativeElement);
  }

  private checkForIntersection(entries: Array<IntersectionObserverEntry>): void {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if (this.isIntersecting(entry)) {
        this.ppDefearLoad.emit();
        this.intersectionObserver.unobserve(<Element>this.elementRef.nativeElement);
        this.intersectionObserver.disconnect();
      }
    });
  }

  private isIntersecting(entry: IntersectionObserverEntry): boolean {
    return entry.isIntersecting && entry.target === this.elementRef.nativeElement;
  }
}
