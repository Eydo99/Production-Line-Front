import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QueueModel {
  id: string;
  x: number;
  y: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class QueueService {

  private api = 'http://localhost:8080/api/queue';

  constructor(private http: HttpClient) {}

  createQueue(x: number, y: number): Observable<QueueModel> {
    return this.http.post<QueueModel>(this.api, { x, y });
  }

  getQueues(): Observable<QueueModel[]> {
    return this.http.get<QueueModel[]>(this.api);
  }

  updatePosition(id: string, x: number, y: number) {
    return this.http.put(`${this.api}/${id}/position`, { x, y });
  }
}
