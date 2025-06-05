import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  
  /**
   * Get the current user ID from localStorage
   * @returns The user ID as a number, or null if not found
   */
  getUserId(): number | null {
    const userIdString = localStorage.getItem('userId');
    if (userIdString) {
      return parseInt(userIdString, 10);
    }
    return null;
  }
}
