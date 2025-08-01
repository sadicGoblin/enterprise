import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly apiEndpoint = '/bucket/api/v1/files/html-to-pdf';
  sheetType: string = 'V';

  constructor(private proxyService: ProxyService) {}

  htmlToPdf(
    html: string,
    filename: string,
    title: string,
    sheet_type?: string
  ): Observable<any> {
    const request = {
      html: html,
      filename: filename,
      title: title,
      sheet_type: sheet_type || this.sheetType,
    };

    console.log('Request body:', JSON.stringify(request));
    return this.proxyService.post<any>(
      environment.apiBaseUrl + this.apiEndpoint,
      request
    );
  }

}
