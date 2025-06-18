import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-change-passwords',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './change-passwords.component.html',
  styleUrls: ['./change-passwords.component.scss']
})
export class ChangePasswordsComponent {

  username: string = '';
  oldPassword: string = '';
  newPassword: string = '';
  repeatPassword: string = '';

  changePassword() {
    
  }
}