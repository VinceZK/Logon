import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {User} from './user';

@Injectable()
export class LogonService {
  private logonUrl = 'api/logon';

  constructor(private http: HttpClient) { }

  logon(): Observable<User> {
    return this.http.post<User>(this.logonUrl, {email: '', password: 'abc123'});
  }
}
