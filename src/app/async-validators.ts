import {IdentityService} from './identity.service';
import {AbstractControl, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {Observable, timer} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {MessageService} from 'ui-message-angular';

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
            return {message: messageService.generateMessage('authObject', 'AUTH_OBJECT_EXISTS',
                'E', control.value).msgShortText};
          } else {
            return null;
          }
        })
      )));
  };
}
