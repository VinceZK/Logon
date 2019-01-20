import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MessageService, messageType} from 'ui-message-angular';
import {msgStore} from './msgStore';
import {QueryObject} from './user';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({providedIn: 'root'})
export class LogonService {
  private logonUrl = 'api/logon';
  private logoutUrl = 'api/logout';
  private queryUrl = 'api/query';
  private entityUrl = 'api/entity';
  constructor(private http: HttpClient,
              private messageService: MessageService) {
    this.messageService.setMessageStore(msgStore, 'EN');
  }

  logon(userid: string, password: string): Observable<any> {
    return this.http.post<any>(this.logonUrl, {username: userid, password: password}, httpOptions).pipe(
      catchError(this.handleError<any>('Logon')));
  }

  logout(): Observable<any> {
    return this.http.delete<any>(this.logoutUrl, httpOptions).pipe(
      catchError(this.handleError<any>('Logout'))
    );
  }

  session(): Observable<any> {
    return this.http.get<any>('api/session', httpOptions).pipe(
      catchError(this.handleError<any>('Get session'))
    );
  }

  query(queryObject: QueryObject): Observable<any> {
    return this.http.post<any>(this.queryUrl, queryObject, httpOptions).pipe(
      catchError(this.handleError<any>('query')));
  }

  read(instanceGUID: string): Observable<any> {
    return this.http.get<any>(this.entityUrl + `/instance/${instanceGUID}`).pipe(
      catchError(this.handleError<any>('read')));
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      this.messageService.addMessage('EXCEPTION', 'GENERIC', messageType.Exception, JSON.stringify(error));

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
