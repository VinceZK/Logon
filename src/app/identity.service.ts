import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Entity, QueryObject} from 'jor-angular';
import {Router} from '@angular/router';
import {environment} from '../environments/environment';
import {Message, MessageService, messageType} from 'ui-message-angular';
import {msgStore} from './msgStore';
import {AppList, AuthObjList, PermissionList, Session} from './permssion';
import {formatDate} from '@angular/common';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({providedIn: 'root'})
export class IdentityService {
  private originalHost = environment.originalHost;
  private session: Session;

  constructor(private http: HttpClient,
              private messageService: MessageService,
              private router: Router) {
    this.messageService.setMessageStore(msgStore, 'EN');
  }

  setSession( data: any ) {
    this.session = <Session>data;
  }

  get Session(): Session {
    if (this.session) { return this. session; }
    const defaultSession = new Session();
    defaultSession.USER_ID = 'DH001';
    defaultSession.LANGUAGE = 'EN';
    return defaultSession;
  }

  get CurrentTime(): string {
    return formatDate( new Date(), 'yyyy-MM-dd hh:mm:ss', 'en-US' );
  }
  searchPermissions(permissionID: string, permissionDesc: string): Observable<PermissionList[] | Message[]> {
    const queryObject = new QueryObject();
    queryObject.ENTITY_ID = 'permission';
    queryObject.RELATION_ID = 'r_role';
    queryObject.PROJECTION = ['NAME', 'DESCRIPTION',
      {FIELD_NAME: 'CREATED_BY', RELATION_ID: 'permission'},
      {FIELD_NAME: 'CREATE_TIME', RELATION_ID: 'permission'},
      {FIELD_NAME: 'CHANGED_BY', RELATION_ID: 'permission'},
      {FIELD_NAME: 'CHANGE_TIME', RELATION_ID: 'permission'}];
    queryObject.FILTER = [];
    if (permissionID) {
      if (permissionID.includes('*') || permissionID.includes('%')) {
        queryObject.FILTER.push({FIELD_NAME: 'NAME', OPERATOR: 'CN', LOW: permissionID});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'NAME', OPERATOR: 'EQ', LOW: permissionID});
      }
    }
    if (permissionDesc) {
      if (permissionDesc.includes('*')) {
        permissionDesc = permissionDesc.replace(/\*/gi, '%');
        queryObject.FILTER.push({FIELD_NAME: 'DESCRIPTION', OPERATOR: 'CN', LOW: permissionDesc});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'DESCRIPTION', OPERATOR: 'EQ', LOW: permissionDesc});
      }
    }
    queryObject.SORT = ['NAME'];
    return this.http.post<any>(this.originalHost + `/api/query`, queryObject, httpOptions).pipe(
      catchError(this.handleError<any>('searchObjects')));
  }

  getPermissionDetail(permissionName: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'r_role', NAME: permissionName},
      piece: {RELATIONS: ['permission', 'r_role'],
        RELATIONSHIPS: [
          {
            RELATIONSHIP_ID: 'rs_user_role',
            PARTNER_ENTITY_PIECES: { RELATIONS: ['r_user'] }
          },
          {
            RELATIONSHIP_ID: 'rs_system_role_category',
            PARTNER_ENTITY_PIECES: {
              RELATIONS: ['r_app_category'],
              RELATIONSHIPS: [
                {
                  RELATIONSHIP_ID: 'rs_app_category',
                  PARTNER_ENTITY_PIECES: { RELATIONS: ['app'] }
                }
              ]
            }
          },
          {
            RELATIONSHIP_ID: 'rs_system_role_profile',
            PARTNER_ENTITY_PIECES: { RELATIONS: ['authProfile', 'r_authorization'] }
          }
        ]
      }
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getPermissionDetail')));
  }

  getPermissionByName(permissionName: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'r_role', NAME: permissionName},
      piece: {RELATIONS: ['r_role']}
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getPermissionByName')));
  }

  searchApps(appID: string, appName: string): Observable<AppList[] | Message[]> {
    const queryObject = new QueryObject();
    queryObject.ENTITY_ID = 'app';
    queryObject.RELATION_ID = 'app';
    queryObject.PROJECTION = ['APP_ID', 'NAME', 'ROUTE_LINK', 'IS_EXTERNAL', 'CREATED_BY', 'CREATE_TIME', 'CHANGED_BY', 'CHANGE_TIME'];
    queryObject.FILTER = [];
    if (appID) {
      if (appID.includes('*') || appID.includes('%')) {
        queryObject.FILTER.push({FIELD_NAME: 'APP_ID', OPERATOR: 'CN', LOW: appID});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'APP_ID', OPERATOR: 'EQ', LOW: appID});
      }
    }
    if (appName) {
      if (appName.includes('*')) {
        appName = appName.replace(/\*/gi, '%');
        queryObject.FILTER.push({FIELD_NAME: 'NAME', OPERATOR: 'CN', LOW: appName});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'NAME', OPERATOR: 'EQ', LOW: appName});
      }
    }
    queryObject.SORT = ['APP_ID'];
    return this.http.post<any>(this.originalHost + `/api/query`, queryObject, httpOptions).pipe(
      catchError(this.handleError<any>('searchObjects')));
  }

  getAppDetail(appID: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'app', APP_ID: appID},
      piece: {
        RELATIONS: ['app'],
        RELATIONSHIPS: [
          {
            RELATIONSHIP_ID: 'rs_app_category',
            PARTNER_ENTITY_PIECES: { RELATIONS: ['r_app_category'] }
          },
          {
            RELATIONSHIP_ID: 'rs_app_auth',
            PARTNER_ENTITY_PIECES: {
              RELATIONS: ['authObject'],
              RELATIONSHIPS: [
                {
                  RELATIONSHIP_ID: 'rs_auth_object_field',
                  PARTNER_ENTITY_PIECES: { RELATIONS: ['authField'] }
                }
              ]
            }
          }
        ]
      }
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getAppDetail')));
  }

  getAppByID(appID: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'app', APP_ID: appID},
      piece: {RELATIONS: ['app']}
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getAppByID')));
  }

  getCategoryName(categoryID: string): Observable<{}> {
    const pieceObject = {
      ID: { RELATION_ID: 'r_app_category', ID: categoryID},
      piece: {RELATIONS: ['r_app_category']}
    };
    return this.http.post<{}>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      map(instance => {
        return 'INSTANCE_GUID' in instance ?
          {
            INSTANCE_GUID: instance['INSTANCE_GUID'],
            NAME: instance['r_app_category'] ? instance['r_app_category'][0]['NAME'] : '',
            ICON: instance['r_app_category'] ? instance['r_app_category'][0]['ICON'] : ''
          } : instance[0];
      }),
      catchError(this.handleError<any>('getCategoryName')));
  }

  searchAuthObjects(authObjName: string, authObjDesc: string): Observable<AuthObjList[] | Message[]> {
    const queryObject = new QueryObject();
    queryObject.ENTITY_ID = 'authObject';
    queryObject.RELATION_ID = 'authObject';
    queryObject.PROJECTION = ['OBJ_NAME', 'DESC', 'CREATED_BY', 'CREATE_TIME', 'CHANGED_BY', 'CHANGE_TIME'];
    queryObject.FILTER = [];
    if (authObjName) {
      if (authObjName.includes('*') || authObjName.includes('%')) {
        queryObject.FILTER.push({FIELD_NAME: 'OBJ_NAME', OPERATOR: 'CN', LOW: authObjName});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'OBJ_NAME', OPERATOR: 'EQ', LOW: authObjName});
      }
    }
    if (authObjDesc) {
      if (authObjDesc.includes('*')) {
        authObjDesc = authObjDesc.replace(/\*/gi, '%');
        queryObject.FILTER.push({FIELD_NAME: 'DESC', OPERATOR: 'CN', LOW: authObjDesc});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'DESC', OPERATOR: 'EQ', LOW: authObjDesc});
      }
    }
    queryObject.SORT = ['OBJ_NAME'];
    return this.http.post<any>(this.originalHost + `/api/query`, queryObject, httpOptions).pipe(
      catchError(this.handleError<any>('searchAuthObjects')));
  }

  getAuthObjectDetail(authObjName: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'authObject', OBJ_NAME: authObjName},
      piece: {
        RELATIONS: ['authObject'],
        RELATIONSHIPS: [
          {
            RELATIONSHIP_ID: 'rs_auth_object_field',
            PARTNER_ENTITY_PIECES: { RELATIONS: ['authField'] }
          }
        ]
      }
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getAuthObjectDetail')));
  }

  getAuthObjectByName(authObjName: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'authObject', OBJ_NAME: authObjName},
      piece: {RELATIONS: ['authObject']}
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getAuthObjectByName')));
  }

  getAuthFieldInfo(authFieldName: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'authField', FIELD_NAME: authFieldName},
      piece: {RELATIONS: ['authField']}
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      map(instance => {
        return 'INSTANCE_GUID' in instance ?
          {
            INSTANCE_GUID: instance['INSTANCE_GUID'],
            NAME: instance['authField'] ? instance['authField'][0]['FIELD_NAME'] : '',
            DATA_ELEMENT: instance['authField'] ? instance['authField'][0]['DATA_ELEMENT'] : ''
          } : instance[0];
      }),
      catchError(this.handleError<any>('getAuthObjectByName')));
  }

  save(entity: Entity): Observable<Entity | Message[]> {
    if (entity['INSTANCE_GUID']) {
      return this.http.put<Entity | Message[]>(
        this.originalHost + `/api/entity`, entity, httpOptions).pipe(
        catchError(this.handleError<any>('saveUser')));
    } else {
      return this.http.post<Entity | Message[]>(
        this.originalHost + `/api/entity`, entity, httpOptions).pipe(
        catchError(this.handleError<any>('save')));
    }
  }

  delete(entityGUID: string): Observable<null | Message[]> {
    return this.http.delete<null | Message[]>(this.originalHost + `/api/entity/instance/` + entityGUID, httpOptions).pipe(
      catchError(this.handleError<any>('delete'))
    );
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      if (error.status === 401) {
        this.messageService.addMessage('EXCEPTION', 'NOT_AUTHENTICATED_OR_SESSION_EXPIRED', messageType.Exception);
      } else {
        this.messageService.addMessage('EXCEPTION', 'GENERIC', messageType.Exception, operation, error.message);
      }

      this.router.navigate(['errors']);
      console.error(operation, error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
