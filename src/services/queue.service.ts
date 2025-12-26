import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface QueueModel {
  id: string;
  x: number;
  y: number;
  size: number; // Frontend uses 'size'
}

// Backend response type
interface QueueResponse {
  id: string;
  x: number;
  y: number;
  currentSize: number; // Backend returns 'currentSize'
}

@Injectable({ providedIn: 'root' })
export class QueueService {

  private api = 'http://localhost:8080/api/queue';

  constructor(private http: HttpClient) {}

  createQueue(x: number, y: number): Observable<QueueModel> {
    return this.http.post<QueueResponse>(this.api, { x, y }).pipe(
      map(q => ({ ...q, size: q.currentSize || 0 }))
    );
  }

  getQueues(): Observable<QueueModel[]> {
    return this.http.get<QueueResponse[]>(this.api).pipe(
      map(queues => queues.map(q => ({ 
        id: q.id, 
        x: q.x, 
        y: q.y, 
        size: q.currentSize || 0 
      })))
    );
  }

  updatePosition(id: string, x: number, y: number): Observable<QueueModel> {
    return this.http.put<QueueResponse>(`${this.api}/${id}/position`, { x, y }).pipe(
      map(q => ({ ...q, size: q.currentSize || 0 }))
    );
  }
  deleteQueue(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.api}/${id}`);
  }
}