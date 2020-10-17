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
  private host = '';
  constructor(private http: HttpClient,
              private messageService: MessageService) {
    this.messageService.setMessageStore(msgStore, 'EN');
  }

  setHost(host: string) {
    this.host = host;
  }

  logon(userid: string, password: string): Observable<any> {
    return this.http.post<any>(
      this.host ? this.host + '/api/logon' : 'api/logon',
      {username: userid, password: password}, httpOptions).pipe(
      catchError(this.handleError<any>('Logon')));
  }

  logout(): Observable<any> {
    return this.http.delete<any>(this.host ? this.host + '/api/logout' : 'api/logout', httpOptions).pipe(
      catchError(this.handleError<any>('Logout'))
    );
  }

  session(): Observable<any> {
    return this.http.get<any>(this.host ? this.host + '/api/session' : 'api/session', httpOptions).pipe(
      catchError(this.handleError<any>('Get session'))
    );
  }

  /**
   * this method is called during logon component initialization. It tries to get the session,
   * but without raising any errors.
   */
  try_get_session(): Observable<any> {
    return this.http.get<any>(this.host ? this.host + '/api/session' : 'api/session', httpOptions);
  }

  query(queryObject: QueryObject): Observable<any> {
    return this.http.post<any>(this.host ? this.host + '/api/query' : 'api/query', queryObject, httpOptions).pipe(
      catchError(this.handleError<any>('query')));
  }

  read(instanceGUID: string): Observable<any> {
    return this.http.get<any>(
      this.host ? this.host + `/api/entity/instance/${instanceGUID}` : `api/entity/instance/${instanceGUID}`)
      .pipe( catchError(this.handleError<any>('read')));
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
