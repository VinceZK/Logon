import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {RouterModule, Routes} from '@angular/router';
import {LogonComponent, LandingPageComponent} from 'ui-logon-angular';
import {LogonModule} from 'ui-logon-angular';
import {environment} from '../environments/environment';
import { PermissionListComponent } from './permission/permission-list/permission-list.component';
import { PermissionDetailComponent } from './permission/permission-detail/permission-detail.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MessageModule} from 'ui-message-angular';
import {WorkProtectionGuard} from './work-protection.guard';
import {JorAngularModule} from 'jor-angular';
import { AppListComponent } from './app/app-list/app-list.component';
import { AppDetailComponent } from './app/app-detail/app-detail.component';
import { AppTargetComponent } from './app/app-detail/app-target/app-target.component';
import { AppCategoriesComponent } from './app/app-detail/app-categories/app-categories.component';
import { AuthObjectListComponent } from './auth_object/auth-object-list/auth-object-list.component';
import { AuthObjectDetailComponent } from './auth_object/auth-object-detail/auth-object-detail.component';
import { AuthObjectFieldComponent } from './auth_object/auth-object-detail/auth-object-field/auth-object-field.component';
import { AdminInfoComponent } from './admin-info/admin-info.component';
import { AppAuthorizationComponent } from './app/app-detail/app-authorization/app-authorization.component';
import { AuthValueComponent } from './auth-value/auth-value.component';
import { AuthValueSinglesComponent } from './auth-value/auth-value-singles/auth-value-singles.component';
import { AuthValueSeloptsComponent } from './auth-value/auth-value-selopts/auth-value-selopts.component';

const appRoutes: Routes = [
  {
    path: 'logon', component: LogonComponent,
    data: {
      title: 'Logon Portal (DH001/Dark1234)', userLabel: 'User ID', pwdLabel: 'Password', btnLabel: 'Sign In',
      redirectPath: environment.redirectPath, redirectUrl: environment.redirectUrl, host: environment.originalHost
    }
  },
  { path: 'landing', component: LandingPageComponent },
  { path: 'apps', component: AppListComponent },
  { path: 'apps/:appID', component: AppDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: 'auth-objects', component: AuthObjectListComponent },
  { path: 'auth-objects/:authObjName', component: AuthObjectDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: 'permissions', component: PermissionListComponent },
  { path: 'permissions/:permissionName', component: PermissionDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: '**', redirectTo: 'auth-objects', pathMatch: 'full'}
];

@NgModule({
  declarations: [
    AppComponent,
    PermissionListComponent,
    PermissionDetailComponent,
    AppListComponent,
    AppDetailComponent,
    AppTargetComponent,
    AppCategoriesComponent,
    AuthObjectListComponent,
    AuthObjectDetailComponent,
    AuthObjectFieldComponent,
    AdminInfoComponent,
    AppAuthorizationComponent,
    AuthValueComponent,
    AuthValueSinglesComponent,
    AuthValueSeloptsComponent
  ],
  imports: [
    BrowserModule,
    LogonModule,
    RouterModule.forRoot(appRoutes),
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    JorAngularModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
