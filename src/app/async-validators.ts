import {IdentityService} from './identity.service';
import {AbstractControl, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {Observable, timer} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {MessageService} from 'ui-message-angular';

export function existingUserNameValidator(identityService: IdentityService,
                                          messageService: MessageService,
                                          userID: string): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return timer(500).pipe(
      switchMap( () => identityService.getUserByUserName(control.value).pipe(
        map(data => {
          if (data['r_user'] && data['r_user'][0]['USER_ID'] !== userID) {
            return {message: messageService.generateMessage('USER', 'USER_NAME_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}

export function existingUserIDValidator(identityService: IdentityService,
                                        messageService: MessageService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return timer(500).pipe(
      switchMap( () => identityService.getUserByUserID(control.value).pipe(
        map(data => {
          if (data['r_user'] && data['r_user'][0]['USER_ID'] === control.value) {
            return {message: messageService.generateMessage('USER', 'USER_ID_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}

export function existingPermissionValidator(identityService: IdentityService,
                                          messageService: MessageService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return timer(500).pipe(
      switchMap( () => identityService.getPermissionByName(control.value).pipe(
        map(data => {
          if (data['r_role'] && data['r_role'][0]['NAME'] === control.value) {
            return {message: messageService.generateMessage('PERMISSION', 'PERMISSION_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}

export function existingAppValidator(identityService: IdentityService,
                                            messageService: MessageService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return timer(500).pipe(
      switchMap( () => identityService.getAppByID(control.value).pipe(
        map(data => {
          if (data['app'] && data['app'][0]['APP_ID'] === control.value) {
            return {message: messageService.generateMessage('APP', 'APP_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}

export function existingAuthObjectValidator(identityService: IdentityService,
                                     messageService: MessageService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return timer(500).pipe(
      switchMap( () => identityService.getAuthObjectByName(control.value).pipe(
        map(data => {
          if (data['authObject'] && data['authObject'][0]['OBJ_NAME'] === control.value) {
            return {message: messageService.generateMessage('AUTH_OBJECT', 'AUTH_OBJECT_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}

export function existingAppCategoryValidator(identityService: IdentityService,
                                            messageService: MessageService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return timer(500).pipe(
      switchMap( () => identityService.getAppCategoryByID(control.value).pipe(
        map(data => {
          if (data['r_app_category'] && data['r_app_category'][0]['ID'] === control.value) {
            return {message: messageService.generateMessage('APP_CATEGORY', 'APP_CATEGORY_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}

export function existingProfileValidator(identityService: IdentityService,
                                             messageService: MessageService): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
    return timer(500).pipe(
      switchMap( () => identityService.getAuthProfileByName(control.value).pipe(
        map(data => {
          if (data['authProfile'] && data['authProfile'][0]['PROFILE_NAME'] === control.value) {
            return {message: messageService.generateMessage('AUTH_PROFILE', 'AUTH_PROFILE_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}
