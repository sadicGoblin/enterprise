import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { animate, state, style, transition, trigger } from '@angular/animations';

export enum MessageType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: 0,
        overflow: 'hidden',
        padding: '0 16px'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
        padding: '8px 16px'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class MessageComponent implements OnInit {
  @Input() text: string = '';
  @Input() type: MessageType = MessageType.INFO;
  @Input() dismissible: boolean = true;
  @Input() timeout: number = 0; // 0 means no auto-dismissal
  @Input() technicalDetails: string = ''; // Información técnica detallada del error

  visible: boolean = true;
  icon: string = 'info';
  timeoutId: any = null;
  showDetails: boolean = false; // Controla la visibilidad de los detalles técnicos

  ngOnInit(): void {
    // Set icon based on type
    this.setIconByType();

    // Setup auto-dismiss timer if specified
    if (this.timeout > 0) {
      this.timeoutId = setTimeout(() => {
        this.dismiss();
      }, this.timeout);
    }
  }

  private setIconByType(): void {
    switch (this.type) {
      case MessageType.SUCCESS:
        this.icon = 'check_circle';
        break;
      case MessageType.WARNING:
        this.icon = 'warning';
        break;
      case MessageType.ERROR:
        this.icon = 'error';
        break;
      case MessageType.INFO:
      default:
        this.icon = 'info';
        break;
    }
  }

  dismiss(): void {
    this.visible = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
