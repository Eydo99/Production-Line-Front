import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MachineModel {
  id: string;
  x: number;
  y: number;
  status: 'idle' | 'processing' | 'error';
  currentTask?: string;
}

@Injectable({ providedIn: 'root' })
export class MachineService {

  private api = 'http://localhost:8080/api/machine';

  constructor(private http: HttpClient) {}

  createMachine(x: number, y: number): Observable<MachineModel> {
    return this.http.post<MachineModel>(this.api, { x, y });
  }

  getMachines(): Observable<MachineModel[]> {
    return this.http.get<MachineModel[]>(this.api);
  }

  updatePosition(id: string, x: number, y: number) {
    return this.http.put(`${this.api}/${id}/position`, { x, y });
  }
}