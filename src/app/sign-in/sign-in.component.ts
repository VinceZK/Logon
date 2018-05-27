import { AutofillMonitor } from '@angular/cdk/text-field';
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { User } from '../user';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit, OnDestroy {
  @ViewChild('inputEmail', {read: ElementRef}) inputEmail: ElementRef;
  @ViewChild('inputPassword', {read: ElementRef}) inputPassword: ElementRef;

  user: User = new User;

  constructor(private autofill: AutofillMonitor) { }

  ngOnInit() {
    this.autofill.monitor(this.inputEmail.nativeElement);
    this.autofill.monitor(this.inputPassword.nativeElement);
  }

  ngOnDestroy() {
    this.autofill.stopMonitoring(this.inputEmail.nativeElement);
    this.autofill.stopMonitoring(this.inputPassword.nativeElement);
  }
}
