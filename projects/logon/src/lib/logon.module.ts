import { NgModule } from '@angular/core';
import { LogonComponent } from './logon.component';
import {CommonModule} from '@angular/common';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {MessageModule} from 'ui-message-angular';
import { LandingPageComponent } from './landing-page/landing-page.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MessageModule
  ],
  declarations: [LogonComponent, LandingPageComponent],
  exports: [LogonComponent]
})
export class LogonModule { }
