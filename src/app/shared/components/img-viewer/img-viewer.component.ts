import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-img-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './img-viewer.component.html',
  styleUrl: './img-viewer.component.scss'
})
export class ImgViewerComponent implements OnInit {
  @Input() images: string[] = [];
  @Input() showThumbnails: boolean = true;
  @Input() autoPlay: boolean = false;
  @Input() autoPlayInterval: number = 3000;

  currentIndex: number = 0;
  isLoading: boolean = false;
  imageError: boolean = false;
  private autoPlayTimer?: any;

  // Modal properties
  isModalOpen: boolean = false;
  modalImageSrc: string = '';
  modalRotation: number = 0;
  modalZoom: number = 1;

  ngOnInit(): void {
    if (this.autoPlay && this.images.length > 1) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  get currentImage(): string {
    return this.images[this.currentIndex] || '';
  }

  get hasMultipleImages(): boolean {
    return this.images.length > 1;
  }

  get isFirstImage(): boolean {
    return this.currentIndex === 0;
  }

  get isLastImage(): boolean {
    return this.currentIndex === this.images.length - 1;
  }

  previousImage(): void {
    if (this.images.length > 1) {
      this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
      this.resetAutoPlay();
    }
  }

  nextImage(): void {
    if (this.images.length > 1) {
      this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
      this.resetAutoPlay();
    }
  }

  goToImage(index: number): void {
    if (index >= 0 && index < this.images.length) {
      this.currentIndex = index;
      this.resetAutoPlay();
    }
  }

  onImageLoad(): void {
    this.isLoading = false;
    this.imageError = false;
  }

  onImageError(): void {
    this.isLoading = false;
    this.imageError = true;
  }

  onImageLoadStart(): void {
    this.isLoading = true;
    this.imageError = false;
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      this.nextImage();
    }, this.autoPlayInterval);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private resetAutoPlay(): void {
    if (this.autoPlay && this.images.length > 1) {
      this.startAutoPlay();
    }
  }

  // Modal methods
  openImageModal(imageSrc: string): void {
    this.modalImageSrc = imageSrc;
    this.modalRotation = 0;
    this.modalZoom = 1;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeImageModal(): void {
    this.isModalOpen = false;
    this.modalImageSrc = '';
    this.modalRotation = 0;
    this.modalZoom = 1;
    document.body.style.overflow = 'auto'; // Restore scrolling
  }

  rotateImage(): void {
    this.modalRotation = (this.modalRotation + 90) % 360;
  }

  zoomIn(): void {
    this.modalZoom = Math.min(this.modalZoom * 1.2, 3); // Max zoom 3x
  }

  zoomOut(): void {
    this.modalZoom = Math.max(this.modalZoom / 1.2, 0.5); // Min zoom 0.5x
  }

  resetZoom(): void {
    this.modalZoom = 1;
  }

  get modalImageTransform(): string {
    return `rotate(${this.modalRotation}deg) scale(${this.modalZoom})`;
  }
}
