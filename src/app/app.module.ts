import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {RouterModule, Routes} from '@angular/router';
import {LogonComponent, LandingPageComponent} from 'ui-logon-angular';
import {LogonModule} from 'ui-logon-angular';
import {environment} from '../environments/environment';

const appRoutes: Routes = [
  {
    path: '', component: LogonComponent,
    data: {
      title: 'Logon Portal (DH001/Dark1234)', userLabel: 'User ID', pwdLabel: 'Password', btnLabel: 'Sign In',
      redirectPath: environment.redirectPath, redirectUrl: environment.redirectUrl, host: environment.host
    }
  },
  { path: 'landing', component: LandingPageComponent },
  { path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LogonModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
