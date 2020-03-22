import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Entity, QueryObject, Relationship, UiMapperService} from 'jor-angular';
import {Router} from '@angular/router';
import {environment} from '../environments/environment';
import {Message, MessageService, messageType} from 'ui-message-angular';
import {msgStore} from './msgStore';
import {AppCategoryList, AppList, AuthObjList, Authorization, AuthProfileList, PermissionList, Session} from './permssion';
import {formatDate} from '@angular/common';
import {AbstractControl, FormArray} from '@angular/forms';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({providedIn: 'root'})
export class IdentityService {
  private originalHost = environment.originalHost;
  private session: Session;

  constructor(private http: HttpClient,
              private messageService: MessageService,
              private uiMapperService: UiMapperService,
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
            RELATIONSHIP_ID: 'rs_role_category_profile',
            PARTNER_ENTITY_PIECES: [
              { ENTITY_ID: 'category',
                piece: { RELATIONS: ['r_app_category'],
                  RELATIONSHIPS: [{RELATIONSHIP_ID: 'rs_app_category',
                    PARTNER_ENTITY_PIECES: { RELATIONS: ['app'] } }]}},
              { ENTITY_ID: 'authProfile',
                piece: { RELATIONS: ['authProfile'],
                  RELATIONSHIPS: [{RELATIONSHIP_ID: 'rs_auth_profile_object',
                    PARTNER_ENTITY_PIECES: { RELATIONS: ['authObject'],
                      RELATIONSHIPS: [{ RELATIONSHIP_ID: 'rs_auth_object_field',
                        PARTNER_ENTITY_PIECES: { RELATIONS: ['authField'] }}]}}]}}
            ]
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

  searchAppCategories(appCategoryID: string, appCategoryName: string): Observable<AppCategoryList[] | Message[]> {
    const queryObject = new QueryObject();
    queryObject.ENTITY_ID = 'category';
    queryObject.RELATION_ID = 'r_app_category';
    queryObject.PROJECTION = [ 'ID', 'NAME', 'ICON',
      {FIELD_NAME: 'CREATED_BY', RELATION_ID: 'category'},
      {FIELD_NAME: 'CREATE_TIME', RELATION_ID: 'category'},
      {FIELD_NAME: 'CHANGED_BY', RELATION_ID: 'category'},
      {FIELD_NAME: 'CHANGE_TIME', RELATION_ID: 'category'} ];
    queryObject.FILTER = [];
    if (appCategoryID) {
      if (appCategoryID.includes('*') || appCategoryID.includes('%')) {
        queryObject.FILTER.push({FIELD_NAME: 'ID', OPERATOR: 'CN', LOW: appCategoryID});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'ID', OPERATOR: 'EQ', LOW: appCategoryID});
      }
    }
    if (appCategoryName) {
      if (appCategoryName.includes('*')) {
        appCategoryName = appCategoryName.replace(/\*/gi, '%');
        queryObject.FILTER.push({FIELD_NAME: 'NAME', OPERATOR: 'CN', LOW: appCategoryName});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'NAME', OPERATOR: 'EQ', LOW: appCategoryName});
      }
    }
    queryObject.FILTER.push({RELATION_ID: 'category', FIELD_NAME: 'TYPE', OPERATOR: 'EQ', LOW: 'APP'});
    queryObject.SORT = ['ID'];
    return this.http.post<any>(this.originalHost + `/api/query`, queryObject, httpOptions).pipe(
      catchError(this.handleError<any>('searchAppCategories')));
  }

  getAppCategoryDetail(appCategoryID: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'r_app_category', ID: appCategoryID},
      piece: {
        RELATIONS: ['category', 'r_app_category'],
        RELATIONSHIPS: [
          {
            RELATIONSHIP_ID: 'rs_app_category',
            PARTNER_ENTITY_PIECES: { RELATIONS: ['app'] }
          },
          {
            RELATIONSHIP_ID: 'rs_system_role_category',
            PARTNER_ENTITY_PIECES: { RELATIONS: ['r_role'] }
          },
        ]
      }
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getAppCategoryDetail')));
  }

  getAppCategoryByID(appCategoryID: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'r_app_category', ID: appCategoryID},
      piece: {RELATIONS: ['r_app_category']}
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getAppCategoryByID')));
  }

  searchAuthProfiles(profileName: string, profileDesc: string): Observable<AuthProfileList[] | Message[]> {
    const queryObject = new QueryObject();
    queryObject.ENTITY_ID = 'authProfile';
    queryObject.RELATION_ID = 'authProfile';
    queryObject.PROJECTION = [ 'PROFILE_NAME', 'DESC', 'CREATED_BY', 'CREATE_TIME', 'CHANGED_BY', 'CHANGE_TIME'];
    queryObject.FILTER = [];
    if (profileName) {
      if (profileName.includes('*') || profileName.includes('%')) {
        queryObject.FILTER.push({FIELD_NAME: 'PROFILE_NAME', OPERATOR: 'CN', LOW: profileName});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'PROFILE_NAME', OPERATOR: 'EQ', LOW: profileName});
      }
    }
    if (profileDesc) {
      if (profileDesc.includes('*')) {
        profileDesc = profileDesc.replace(/\*/gi, '%');
        queryObject.FILTER.push({FIELD_NAME: 'DESC', OPERATOR: 'CN', LOW: profileDesc});
      } else {
        queryObject.FILTER.push({FIELD_NAME: 'DESC', OPERATOR: 'EQ', LOW: profileDesc});
      }
    }
    queryObject.SORT = ['PROFILE_NAME'];
    return this.http.post<any>(this.originalHost + `/api/query`, queryObject, httpOptions).pipe(
      catchError(this.handleError<any>('searchAuthProfiles')));
  }

  getAuthProfileDetail(profileName: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'authProfile', PROFILE_NAME: profileName},
      piece: {
        RELATIONS: ['authProfile'],
        RELATIONSHIPS: [
          {
            RELATIONSHIP_ID: 'rs_auth_profile_object',
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
      catchError(this.handleError<any>('getAuthProfileDetail')));
  }

  getAuthProfileByName(profileName: string): Observable<Entity | Message[]> {
    const pieceObject = {
      ID: { RELATION_ID: 'authProfile', ID: profileName},
      piece: {RELATIONS: ['authProfile']}
    };
    return this.http.post<Entity | Message[]>(
      this.originalHost + `/api/entity/instance/piece`, pieceObject, httpOptions).pipe(
      catchError(this.handleError<any>('getAuthProfileByName')));
  }

  orchestrate(operations: any): any {
    return this.http.post<any>(
      this.originalHost + `/api/entity/orchestrate`, operations, httpOptions).pipe(
      catchError(this.handleError<any>('orchestrate')));
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

  parseProfileAuthObject( relationship: Relationship): any {
    const authorizations = [];
    relationship.values.forEach( value => {
      const authorization = value['AUTH_VALUE'] ?
        <Authorization>JSON.parse(value['AUTH_VALUE']) : null;
      const status = authorization ?
        Object.values(authorization.AuthFieldValue).findIndex( authValue => !authValue ) !== -1 ?
          'yellow' : 'green' : 'red';
      authorizations.push({
        CHECKED: '',
        COLLAPSED: false,
        NODE_ID: value['RELATIONSHIP_INSTANCE_GUID'],
        STATUS: status,
        RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
        auth_object_INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
        AUTH_VALUE: value['AUTH_VALUE'],
        OBJ_NAME: value['PARTNER_INSTANCES'][0]['authObject'][0]['OBJ_NAME'],
        DESC: value['PARTNER_INSTANCES'][0]['authObject'][0]['DESC'],
        ROW_TYPE: 'OBJECT',
        FIELD_NAME: '',
        DATA_ELEMENT: '',
      });

      const authObjectFields = value['PARTNER_INSTANCES'][0]['relationships'][0];
      authObjectFields.values.forEach( value2 => {
        const authFieldName = value2['PARTNER_INSTANCES'][0]['authField'][0]['FIELD_NAME'];
        authorizations.push({
          CHECKED: '',
          COLLAPSED: false,
          NODE_ID: value['RELATIONSHIP_INSTANCE_GUID'],
          STATUS: authorization.AuthFieldValue[authFieldName] ?
            authorization.AuthFieldValue[authFieldName].length > 0 ? 'green' : 'red' : 'red',
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          auth_object_INSTANCE_GUID: '',
          AUTH_VALUE: authorization && authorization.AuthFieldValue[authFieldName]
            && JSON.stringify(authorization.AuthFieldValue[authFieldName], null, ' '),
          OBJ_NAME: value['PARTNER_INSTANCES'][0]['authObject'][0]['OBJ_NAME'],
          DESC: '',
          ROW_TYPE: 'FIELD',
          FIELD_NAME: authFieldName,
          DATA_ELEMENT: value2['PARTNER_INSTANCES'][0]['authField'][0]['DATA_ELEMENT'],
        });
      });
    });
    return authorizations;
  }

  composeAuthChanges( formArray: FormArray, originalValue: any, relationshipID: string): any {
    let authorization;
    let currentAuthObjectCtrl: AbstractControl;
    let isAuthorizationChanged = false;
    formArray.controls.forEach( control => {
      const rowType = control.get('ROW_TYPE').value;
      if (rowType === 'OBJECT') {
        if (currentAuthObjectCtrl && isAuthorizationChanged) {
          currentAuthObjectCtrl.get('AUTH_VALUE').setValue(JSON.stringify(authorization, null, ' '));
          currentAuthObjectCtrl.get('AUTH_VALUE').markAsDirty();
        }
        currentAuthObjectCtrl = control;
        authorization = new Authorization();
        authorization.AuthObject = control.get('OBJ_NAME').value;
        authorization.AuthFieldValue = {};
        isAuthorizationChanged = false;
      } else { // Field
        if (control.dirty) {
          isAuthorizationChanged = true;
          control.markAsPristine();
        }
        authorization.AuthFieldValue[control.get('FIELD_NAME').value] =
          control.get('AUTH_VALUE').value ? JSON.parse(control.get('AUTH_VALUE').value) : null;
      }
    });
    if (currentAuthObjectCtrl && isAuthorizationChanged) {
      currentAuthObjectCtrl.get('AUTH_VALUE').setValue(JSON.stringify(authorization, null, ' '));
      currentAuthObjectCtrl.get('AUTH_VALUE').markAsDirty();
    }
    const originalAuthObjValue = [];
    if ( originalValue ) {
      originalValue.forEach( authObj => {
        if (authObj.ROW_TYPE === 'OBJECT') { originalAuthObjValue.push( authObj ); }
      });
    }

    return this.uiMapperService.composeChangedRelationship(
      relationshipID, [{ENTITY_ID: 'authObject', ROLE_ID: 'auth_object'}],
      formArray, originalAuthObjValue,
      ['CHECKED', 'COLLAPSED', 'NODE_ID', 'OBJ_NAME', 'DESC', 'ROW_TYPE', 'FIELD_NAME', 'DATA_ELEMENT']);
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
