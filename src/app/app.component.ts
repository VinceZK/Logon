import { Component } from '@angular/core';
import { EntityService } from 'jor-angular';
import {environment} from '../environments/environment';
import {LogonService} from 'ui-logon-angular';
import {IdentityService} from './identity.service';
import {msgStore} from './msgStore';
import {MessageService} from 'ui-message-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private entityService: EntityService,
              private identityService: IdentityService,
              private messageService: MessageService,
              private logonService: LogonService) {
    this.entityService.setOriginalHost(environment.originalHost);
    this.logonService.setHost(environment.originalHost);
    this.logonService.try_get_session().subscribe( data => {
      this.identityService.setSession( data );
      this.messageService.setMessageStore(msgStore, this.identityService.Session.LANGUAGE);
    });
  }
}
