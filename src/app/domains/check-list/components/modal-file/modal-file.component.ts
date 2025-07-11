import { Component, Inject, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-modal-file',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './modal-file.component.html',
  styleUrls: ['./modal-file.component.scss']
})
export class ModalFileComponent implements AfterViewInit {
  pdfSrc: SafeResourceUrl;
  isUrlMode = false;

  constructor(
    private dialogRef: MatDialogRef<ModalFileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { base64Data?: string; documentUrl?: string; filename: string },
    private sanitizer: DomSanitizer,
    private elementRef: ElementRef
  ) {
    console.log('Modal data received:', this.data);
    
    // Check if we have a direct URL
    if (this.data.documentUrl && this.data.documentUrl.trim() !== '') {
      this.isUrlMode = true;
      const url = this.data.documentUrl.trim();
      console.log('Using direct document URL:', url);
      this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    // Otherwise try base64 data if available
    else if (this.data.base64Data && this.data.base64Data.trim() !== '') {
      let base64Data = this.data.base64Data.trim();
      
      // Remove data URL prefix if it exists
      if (base64Data.startsWith('data:application/pdf;base64,')) {
        base64Data = base64Data.replace('data:application/pdf;base64,', '');
      }
      
      // Validate base64 format
      try {
        // Test if it's valid base64
        const testDecode = atob(base64Data.substring(0, 100)); // Test first 100 chars
        
        // Check if it's actually a PDF by looking for PDF header
        const fullDecode = atob(base64Data.substring(0, 20)); // Get first ~15 bytes
        const isPdf = fullDecode.startsWith('%PDF');
        
        console.log('Base64 validation:', {
          isValidBase64: true,
          isPdfFormat: isPdf,
          firstBytes: fullDecode.substring(0, 10),
          dataLength: base64Data.length
        });
        
        if (!isPdf) {
          console.warn('Warning: Data does not appear to be a PDF file');
        }
        
        const dataUrl = `data:application/pdf;base64,${base64Data}`;
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
        console.log('PDF source created successfully');
        console.log('Base64 data length:', base64Data.length);
        console.log('First 100 chars of base64:', base64Data.substring(0, 100));
      } catch (error) {
        console.error('Invalid base64 data:', error);
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl('data:application/pdf;base64,');
      }
    } else {
      console.error('No valid document source (URL or base64) provided');
      this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl('data:application/pdf;base64,');
    }
  }

  ngAfterViewInit(): void {
    // Try different PDF viewing methods if embed fails
    setTimeout(() => {
      this.setupPdfFallbacks();
    }, 1000);
  }

  private setupPdfFallbacks(): void {
    const embed = this.elementRef.nativeElement.querySelector('#pdf-embed');
    const iframe = this.elementRef.nativeElement.querySelector('#pdf-iframe');
    const object = this.elementRef.nativeElement.querySelector('#pdf-object');

    // Check if embed is working
    if (embed && !this.isPdfLoaded(embed)) {
      console.log('Embed failed, trying iframe...');
      embed.style.display = 'none';
      iframe.style.display = 'block';
      
      // If iframe also fails, try object
      setTimeout(() => {
        if (!this.isPdfLoaded(iframe)) {
          console.log('Iframe failed, trying object...');
          iframe.style.display = 'none';
          object.style.display = 'block';
        }
      }, 1000);
    }
  }

  private isPdfLoaded(element: any): boolean {
    // Simple check to see if PDF is loaded
    try {
      return element && element.contentDocument !== null;
    } catch (e) {
      return false;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onDownload(): void {
    const link = document.createElement('a');
    
    if (this.isUrlMode && this.data.documentUrl) {
      // For direct URL, just open in new tab as download may not work for cross-origin URLs
      window.open(this.data.documentUrl, '_blank');
    } else if (this.data.base64Data) {
      // For base64 data
      link.href = `data:application/pdf;base64,${this.data.base64Data}`;
      link.download = this.data.filename || 'document.pdf';
      link.click();
    }
  }
}
