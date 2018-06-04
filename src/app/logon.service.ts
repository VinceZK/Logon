import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {MessageService} from './message.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({providedIn: 'root'})
export class LogonService {
  private logonUrl = 'api/logon';

  constructor(private http: HttpClient,
              private messageService: MessageService) { }

  logon(userid: string, password: string): Observable<any> {
    return this.http.post<any>(this.logonUrl, {username: userid, password: password}, httpOptions).pipe(
      catchError(this.handleError<any>('Logon')));
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      this.messageService.pushMessage(error);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
