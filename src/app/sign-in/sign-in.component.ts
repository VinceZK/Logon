import {AutofillMonitor} from '@angular/cdk/text-field';
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {User} from '../user';
import {LogonService} from '../logon.service';
import {Message, MessageService, messageType} from 'ui-message/dist/message';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit, OnDestroy {
  @ViewChild('inputUserID', {read: ElementRef}) inputUserID: ElementRef;
  @ViewChild('inputPassword', {read: ElementRef}) inputPassword: ElementRef;

  user: User = new User;

  constructor(private autofill: AutofillMonitor,
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
    this.logonService.logon(this.user.userid, this.user.password).subscribe(
      data => {
        if (data.msgCat) {
          this.messageService.reportMessage(<Message>data);
        } else if (data.userid) {
          this.user = data;
        } else {
          // TODO this.messageService.report('GEN_ERROR');
        }
      }
    );
  }
}
