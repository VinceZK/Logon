import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {RouterModule, Routes} from '@angular/router';
import {LogonComponent, LandingPageComponent} from 'ui-logon-angular';
import {LogonModule} from 'ui-logon-angular';

const appRoutes: Routes = [
  { path: 'landing', component: LandingPageComponent },
  {
    path: 'logon', component: LogonComponent,
    data: {
      title: 'Logon Portal', userLabel: 'User ID', pwdLabel: 'Password', btnLabel: 'Sign In',
      redirectPath: 'landing', redirectUrl: ''
    }
  },
  { path: '**', redirectTo: 'logon', pathMatch: 'full'}
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
