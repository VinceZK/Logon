import { Component, OnInit } from '@angular/core';
import {IdentityService} from '../../identity.service';
import {Message, MessageService, messageType} from 'ui-message-angular';
import {Router} from '@angular/router';
import {AppList} from '../../identity';

@Component({
  selector: 'app-app-list',
  templateUrl: './app-list.component.html',
  styleUrls: ['./app-list.component.css']
})
export class AppListComponent implements OnInit {
  appID: string;
  appName: string;
  apps: AppList[];
  showDeletionConfirmation = false;
  toBeDeletedInstance: string;

  get displayDeletionConfirmation() {return this.showDeletionConfirmation ? 'block' : 'none'; }

  constructor(private identityService: IdentityService,
              private messageService: MessageService,
              private router: Router) { }

  ngOnInit() {
  }

  search() {
    this.messageService.clearMessages();
    this.apps = [];
    this.appID = this.appID ? this.appID.trim() : '';
    this.appName = this.appName ? this.appName.trim() : '';
    this.identityService.searchApps(this.appID, this.appName).subscribe(
      data => {
        if (!data[0]) {
          this.messageService.reportMessage('GENERAL', 'EMPTY_LIST', messageType.Warning);
        } else if (data[0]['msgCat']) {
          const messages = <Message[]>data;
          messages.forEach( msg => this.messageService.add(msg));
        } else {
          this.apps = <AppList[]>data;
        }
      }
    );
  }

  enterSearch($event): void {
    if ($event.keyCode === 13 ) {
      this.search();
    }
  }

  new(): void {
    this.router.navigate(['apps', '/', {action: 'new'}]);
  }

  display(appID: string): void {
    this.router.navigate(['apps', appID, {action: 'display'}]);
  }

  change(appID: string): void {
    this.router.navigate(['apps', appID, {action: 'change'}]);
  }

  delete(appID: string): void {
    this.toBeDeletedInstance = appID;
    this.showDeletionConfirmation = true;
  }

  cancelDeletion(): void {
    this.showDeletionConfirmation = false;
  }

  confirmDeletion(): void {
    const toBeDeletedInstanceGUID = this.apps.find(
      ele => ele.APP_ID === this.toBeDeletedInstance).INSTANCE_GUID;
    this.identityService.delete(toBeDeletedInstanceGUID).subscribe( errorMsg => {
      this.showDeletionConfirmation = false;
      if (errorMsg) {
        const messages = <Message[]>errorMsg;
        messages.forEach( msg => this.messageService.add(msg));
      } else {
        this.search();
      }
    });
  }
}
