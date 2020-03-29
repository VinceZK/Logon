import { Component, OnInit } from '@angular/core';
import {AppList, AuthObjList} from '../../identity';
import {IdentityService} from '../../identity.service';
import {Message, MessageService, messageType} from 'ui-message-angular';
import {Router} from '@angular/router';

@Component({
  selector: 'app-auth-object-list',
  templateUrl: './auth-object-list.component.html',
  styleUrls: ['./auth-object-list.component.css']
})
export class AuthObjectListComponent implements OnInit {
  authObjName: string;
  authObjDesc: string;
  authObjects: AuthObjList[];
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
    this.authObjects = [];
    this.authObjName = this.authObjName ? this.authObjName.trim() : '';
    this.authObjDesc = this.authObjDesc ? this.authObjDesc.trim() : '';
    this.identityService.searchAuthObjects(this.authObjName, this.authObjDesc).subscribe(
      data => {
        if (!data[0]) {
          this.messageService.reportMessage('GENERAL', 'EMPTY_LIST', messageType.Warning);
        } else if (data[0]['msgCat']) {
          const messages = <Message[]>data;
          messages.forEach( msg => this.messageService.add(msg));
        } else {
          this.authObjects = <AuthObjList[]>data;
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
    this.router.navigate(['auth-objects', '/', {action: 'new'}]);
  }

  display(authObjName: string): void {
    this.router.navigate(['auth-objects', authObjName, {action: 'display'}]);
  }

  change(authObjName: string): void {
    this.router.navigate(['auth-objects', authObjName, {action: 'change'}]);
  }

  delete(authObjName: string): void {
    this.toBeDeletedInstance = authObjName;
    this.showDeletionConfirmation = true;
  }

  cancelDeletion(): void {
    this.showDeletionConfirmation = false;
  }

  confirmDeletion(): void {
    const toBeDeletedInstanceGUID = this.authObjects.find(
      ele => ele.OBJ_NAME === this.toBeDeletedInstance).INSTANCE_GUID;
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
