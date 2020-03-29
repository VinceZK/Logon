import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {RouteReuseStrategy, RouterModule, Routes} from '@angular/router';
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
import { AuthorizationComponent } from './authorization/authorization.component';
import { AuthValueComponent } from './authorization/auth-value/auth-value.component';
import { AuthValueSinglesComponent } from './authorization/auth-value/auth-value-singles/auth-value-singles.component';
import { AuthValueSeloptsComponent } from './authorization/auth-value/auth-value-selopts/auth-value-selopts.component';
import { AppCategoryListComponent } from './app_category/app-category-list/app-category-list.component';
import { AppCategoryDetailComponent } from './app_category/app-category-detail/app-category-detail.component';
import { AppCategoryDetailAppComponent } from
    './app_category/app-category-detail/app-category-detail-app/app-category-detail-app.component';
import { AppCategoryDetailRoleComponent } from
    './app_category/app-category-detail/app-category-detail-role/app-category-detail-role.component';
import { ProfileListComponent } from './profile/profile-list/profile-list.component';
import { ProfileDetailComponent } from './profile/profile-detail/profile-detail.component';
import { PermissionDetailCategoryComponent } from './permission/permission-detail/permission-detail-category/permission-detail-category.component';
import { PermissionDetailProfileComponent } from './permission/permission-detail/permission-detail-profile/permission-detail-profile.component';
import { PermissionDetailUserComponent } from './permission/permission-detail/permission-detail-user/permission-detail-user.component';
import {UserListComponent} from './user/user-list/user-list.component';
import {UserDetailComponent} from './user/user-detail/user-detail.component';
import {UserBasicComponent} from './user/user-detail/user-basic/user-basic.component';
import {UserPersonalizationComponent} from './user/user-detail/user-personalization/user-personalization.component';
import {UserRoleComponent} from './user/user-detail/user-role/user-role.component';
import {UserEmailComponent} from './user/user-detail/user-email/user-email.component';
import {UserAddressComponent} from './user/user-detail/user-address/user-address.component';
import {CustomReuseStrategy} from './custom.reuse.strategy';

const appRoutes: Routes = [
  {
    path: 'logon', component: LogonComponent,
    data: {
      title: 'Logon Portal (DH001/Dark1234)', userLabel: 'User ID', pwdLabel: 'Password', btnLabel: 'Sign In',
      redirectPath: environment.redirectPath, redirectUrl: environment.redirectUrl, host: environment.originalHost
    }
  },
  { path: 'landing', component: LandingPageComponent },
  { path: 'users', component: UserListComponent},
  { path: 'users/:userID', component: UserDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: 'apps', component: AppListComponent },
  { path: 'apps/:appID', component: AppDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: 'app-categories', component: AppCategoryListComponent },
  { path: 'app-categories/:appCategory', component: AppCategoryDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: 'auth-objects', component: AuthObjectListComponent },
  { path: 'auth-objects/:authObjName', component: AuthObjectDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: 'permissions', component: PermissionListComponent },
  { path: 'permissions/:permissionName', component: PermissionDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: 'profiles', component: ProfileListComponent },
  { path: 'profiles/:profileName', component: ProfileDetailComponent, canDeactivate: [WorkProtectionGuard]},
  { path: '**', redirectTo: 'logon', pathMatch: 'full'}
];

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    UserDetailComponent,
    UserBasicComponent,
    UserPersonalizationComponent,
    UserRoleComponent,
    UserEmailComponent,
    UserAddressComponent,
    AppListComponent,
    AppDetailComponent,
    AppTargetComponent,
    AppCategoriesComponent,
    AuthObjectListComponent,
    AuthObjectDetailComponent,
    AuthObjectFieldComponent,
    AdminInfoComponent,
    AuthorizationComponent,
    AuthValueComponent,
    AuthValueSinglesComponent,
    AuthValueSeloptsComponent,
    AppCategoryListComponent,
    AppCategoryDetailComponent,
    AppCategoryDetailAppComponent,
    AppCategoryDetailRoleComponent,
    ProfileListComponent,
    ProfileDetailComponent,
    PermissionListComponent,
    PermissionDetailComponent,
    PermissionDetailCategoryComponent,
    PermissionDetailProfileComponent,
    PermissionDetailUserComponent
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
  providers: [
    {provide: RouteReuseStrategy, useClass: CustomReuseStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
