import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {LogonService} from '../logon.service';
import {MessageService} from 'ui-message-angular';
import {QueryObject} from '../user';

@Component({
  selector: 'dk-landing-page',
  templateUrl: './landing-page.component.html'
})
export class LandingPageComponent implements OnInit {
  result: any;

  constructor(private router: Router,
              private messageService: MessageService,
              private logonService: LogonService) { }

  ngOnInit() {
  }

  logout(): void {
    this.logonService.logout().subscribe(
      data => {
        this.router.navigateByUrl('/logon');
      }
    );
  }

  session(): void {
    this.logonService.session().subscribe(
      data => {
        this.result = data;
      }
    );
  }

  query(): void {
    const queryObject = {
      ENTITY_ID: 'person',
      RELATION_ID: 'r_user'
    } as QueryObject;
    this.logonService.query(queryObject).subscribe( data => this.result = data);
  }

  read(): void {
    this.logonService.read('2FBE7490E10F11E8A90957FA46F2CECA').subscribe( data => this.result = data);
  }
}
