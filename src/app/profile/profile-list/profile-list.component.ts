import { Component, OnInit } from '@angular/core';
import {AuthProfileList} from '../../identity';
import {IdentityService} from '../../identity.service';
import {Message, MessageService, messageType} from 'ui-message-angular';
import {Router} from '@angular/router';

@Component({
  selector: 'app-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.css']
})
export class ProfileListComponent implements OnInit {
  profileName: string;
  profileDesc: string;
  authProfiles: AuthProfileList[];
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
    this.authProfiles = [];
    this.profileName = this.profileName ? this.profileName.trim() : '';
    this.profileDesc = this.profileDesc ? this.profileDesc.trim() : '';
    this.identityService.searchAuthProfiles(this.profileName, this.profileDesc).subscribe(
      data => {
        if (!data[0]) {
          this.messageService.reportMessage('GENERAL', 'EMPTY_LIST', messageType.Warning);
        } else if (data[0]['msgCat']) {
          const messages = <Message[]>data;
          messages.forEach( msg => this.messageService.add(msg));
        } else {
          this.authProfiles = <AuthProfileList[]>data;
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
    this.router.navigate(['profiles', '/', {action: 'new'}]);
  }

  display(profileName: string): void {
    this.router.navigate(['profiles', profileName, {action: 'display'}]);
  }

  change(profileName: string): void {
    this.router.navigate(['profiles', profileName, {action: 'change'}]);
  }

  delete(profileName: string): void {
    this.toBeDeletedInstance = profileName;
    this.showDeletionConfirmation = true;
  }

  cancelDeletion(): void {
    this.showDeletionConfirmation = false;
  }

  confirmDeletion(): void {
    const toBeDeletedInstanceGUID = this.authProfiles.find(
      ele => ele.PROFILE_NAME === this.toBeDeletedInstance).INSTANCE_GUID;
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
