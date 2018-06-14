import {AutofillMonitor} from '@angular/cdk/text-field';
import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {User} from '../user';
import {LogonService} from '../logon.service';
import {Message, MessageService} from 'ui-message/dist/message';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit, OnDestroy {
  @ViewChild('inputUserID', {read: ElementRef}) inputUserID: ElementRef;
  @ViewChild('inputPassword', {read: ElementRef}) inputPassword: ElementRef;

  user: User = new User;
  isWaiting = false;

  constructor(@Inject(DOCUMENT)
              private document: any,
              private autofill: AutofillMonitor,
              private logonService: LogonService,
              private messageService: MessageService) { }

  ngOnInit() {
    this.autofill.monitor(this.inputUserID.nativeElement);
    this.autofill.monitor(this.inputPassword.nativeElement);
  }

  ngOnDestroy() {
    this.autofill.stopMonitoring(this.inputUserID.nativeElement);
    this.autofill.stopMonitoring(this.inputPassword.nativeElement);
  }

  logon(): void {
    this.isWaiting = true;
    this.logonService.logon(this.user.userid, this.user.password).subscribe(
      data => {
        this.isWaiting = false;
        if (data.err) {
          this.messageService.report(<Message>data.err);
        } else {
          this.user = data.user;
          this.document.location.href = 'http://localhost:3001/dashboard';
        }
      }
    );
  }
}
