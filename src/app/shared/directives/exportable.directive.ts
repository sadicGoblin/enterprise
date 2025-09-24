import { Directive, Input, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appExportable]',
  standalone: true
})
export class ExportableDirective implements OnInit {
  @Input('appExportable') exportId!: string;
  @Input() exportName?: string;
  @Input() exportIcon?: string;
  @Input() exportType?: string;
  
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}
  
  ngOnInit(): void {
    if (!this.exportId) {
      console.warn('ExportableDirective: exportId is required');
      return;
    }
    
    // Set data attributes for export system
    this.renderer.setAttribute(this.elementRef.nativeElement, 'data-export-id', this.exportId);
    
    if (this.exportName) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'data-export-name', this.exportName);
    }
    
    if (this.exportIcon) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'data-export-icon', this.exportIcon);
    }
    
    if (this.exportType) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'data-export-type', this.exportType);
    }
    
    // Add exportable class for styling
    this.renderer.addClass(this.elementRef.nativeElement, 'exportable-element');
  }
}
