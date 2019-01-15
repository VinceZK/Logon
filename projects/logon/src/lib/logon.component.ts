import {Component, ElementRef, Inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {AutofillMonitor} from '@angular/cdk/text-field';
import {Message, MessageService} from 'ui-message-angular';
import {User} from './user';
import {LogonService} from './logon.service';

@Component({
  selector: 'dk-logon',
  templateUrl: './logon.component.html',
  styleUrls: ['./logon.component.css']
})
export class LogonComponent implements OnInit, OnDestroy {

  @ViewChild('inputUserID', {read: ElementRef}) inputUserID: ElementRef;
  @ViewChild('inputPassword', {read: ElementRef}) inputPassword: ElementRef;

  user: User = new User;
  isWaiting = false;
  @Input() title = 'Logon Portal';
  @Input() userLabel = 'User ID';
  @Input() pwdLabel = 'Password';
  @Input() btnLabel = 'Logon';
  @Input() redirectUrl = '';
  @Input() redirectPath = '';

  constructor(@Inject(DOCUMENT)
              private document: any,
              private router: Router,
              private route: ActivatedRoute,
              private autofill: AutofillMonitor,
              private logonService: LogonService,
              private messageService: MessageService) { }

  ngOnInit() {
    this.autofill.monitor(this.inputUserID.nativeElement);
    this.autofill.monitor(this.inputPassword.nativeElement);
    if (this.route.snapshot.data['title']) { this.title = this.route.snapshot.data['title']; }
    if (this.route.snapshot.data['userLabel']) { this.userLabel = this.route.snapshot.data['userLabel']; }
    if (this.route.snapshot.data['pwdLabel']) { this.pwdLabel = this.route.snapshot.data['pwdLabel']; }
    if (this.route.snapshot.data['btnLabel']) { this.btnLabel = this.route.snapshot.data['btnLabel']; }
    if (this.route.snapshot.data['redirectUrl']) { this.redirectUrl = this.route.snapshot.data['redirectUrl']; }
    if (this.route.snapshot.data['redirectPath']) { this.redirectPath = this.route.snapshot.data['redirectPath']; }
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
        if (!data) { return; }
        if (data.err) {
          this.messageService.report(<Message>data.err);
        } else {
          this.user.displayName = data.user['DISPLAY_NAME'];
          this.user.userid = data.user['USER_ID'];
          this.user.username = data.user['USER_NAME'];
          this.user.locked = data.user['LOCK'];
          this.user.pwdState = data.user['PWD_STATE'];
          this.user.name = data.user['GIVEN_NAME'];
          if (this.redirectPath) {
            this.router.navigateByUrl(this.redirectPath);
          } else if (this.redirectUrl) {
            this.document.location.href = this.redirectUrl;
          }
        }
      }
    );
  }
}
