import { Component, OnInit } from '@angular/core';
import {AppCategoryList, AuthObjList} from '../../identity';
import {IdentityService} from '../../identity.service';
import {Message, MessageService, messageType} from 'ui-message-angular';
import {Router} from '@angular/router';

@Component({
  selector: 'app-app-category-list',
  templateUrl: './app-category-list.component.html',
  styleUrls: ['./app-category-list.component.css']
})
export class AppCategoryListComponent implements OnInit {
  appCategoryID: string;
  appCategoryName: string;
  appCategories: AppCategoryList[];
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
    this.appCategories = [];
    this.appCategoryID = this.appCategoryID ? this.appCategoryID.trim() : '';
    this.appCategoryName = this.appCategoryName ? this.appCategoryName.trim() : '';
    this.identityService.searchAppCategories(this.appCategoryID, this.appCategoryName).subscribe(
      data => {
        if (!data[0]) {
          this.messageService.reportMessage('GENERAL', 'EMPTY_LIST', messageType.Warning);
        } else if (data[0]['msgCat']) {
          const messages = <Message[]>data;
          messages.forEach( msg => this.messageService.add(msg));
        } else {
          this.appCategories = <AppCategoryList[]>data;
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
    this.router.navigate(['app-categories', '/', {action: 'new'}]);
  }

  display(appCategoryID: string): void {
    this.router.navigate(['app-categories', appCategoryID, {action: 'display'}]);
  }

  change(appCategoryID: string): void {
    this.router.navigate(['app-categories', appCategoryID, {action: 'change'}]);
  }

  delete(appCategoryID: string): void {
    this.toBeDeletedInstance = appCategoryID;
    this.showDeletionConfirmation = true;
  }

  cancelDeletion(): void {
    this.showDeletionConfirmation = false;
  }

  confirmDeletion(): void {
    const toBeDeletedInstanceGUID = this.appCategories.find(
      ele => ele.ID === this.toBeDeletedInstance).INSTANCE_GUID;
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
