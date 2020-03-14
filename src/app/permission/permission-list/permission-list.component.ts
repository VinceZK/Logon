import { Component, OnInit } from '@angular/core';
import {PermissionList} from '../../permssion';
import {Message, MessageService, messageType} from 'ui-message-angular';
import {IdentityService} from '../../identity.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-permission-list',
  templateUrl: './permission-list.component.html',
  styleUrls: ['./permission-list.component.css']
})
export class PermissionListComponent implements OnInit {
  permissionName: string;
  permissionDesc: string;
  permissions: PermissionList[];
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
    this.permissions = [];
    this.permissionName = this.permissionName ? this.permissionName.trim() : '';
    this.permissionDesc = this.permissionDesc ? this.permissionDesc.trim() : '';
    this.identityService.searchPermissions(this.permissionName, this.permissionDesc).subscribe(
      data => {
        if (!data[0]) {
          this.messageService.reportMessage('GENERAL', 'EMPTY_LIST', messageType.Warning);
        } else if (data[0]['msgCat']) {
          const messages = <Message[]>data;
          messages.forEach( msg => this.messageService.add(msg));
        } else {
          this.permissions = <PermissionList[]>data;
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
    this.router.navigate(['permissions', '/', {action: 'new'}]);
  }

  display(permissionName: string): void {
    this.router.navigate(['permissions', permissionName, {action: 'display'}]);
  }

  change(permissionName: string): void {
    this.router.navigate(['permissions', permissionName, {action: 'change'}]);
  }

  delete(permissionName: string): void {
    this.toBeDeletedInstance = permissionName;
    this.showDeletionConfirmation = true;
  }

  cancelDeletion(): void {
    this.showDeletionConfirmation = false;
  }

  confirmDeletion(): void {
    const toBeDeletedPermissionGUID = this.permissions.find(
      ele => ele.NAME === this.toBeDeletedInstance).INSTANCE_GUID;
    this.identityService.delete(toBeDeletedPermissionGUID).subscribe( errorMsg => {
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
