import { Component, OnInit } from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AttributeBase, AttributeControlService, Entity, EntityService, RelationMeta, Relationship, UiMapperService} from 'jor-angular';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {DialogService} from '../../dialog.service';
import {IdentityService} from '../../identity.service';
import {Message, MessageService} from 'ui-message-angular';
import {switchMap} from 'rxjs/operators';
import {forkJoin, Observable, of} from 'rxjs';
import {existingAppCategoryValidator} from '../../async-validators';

@Component({
  selector: 'app-app-category-detail',
  templateUrl: './app-category-detail.component.html',
  styleUrls: ['./app-category-detail.component.css']
})
export class AppCategoryDetailComponent implements OnInit {
  mainForm: FormGroup;
  relationMetas: RelationMeta[];
  attrCtrls: AttributeBase[];
  readonly = true;
  isNewMode = false;
  action: string;
  instanceGUID: string;
  originalValue = {};
  changedValue = {};
  tabStrip = 1;

  constructor(private fb: FormBuilder,
              private route: ActivatedRoute,
              private router: Router,
              private dialogService: DialogService,
              private identityService: IdentityService,
              private attributeControlService: AttributeControlService,
              private entityService: EntityService,
              private uiMapperService: UiMapperService,
              private messageService: MessageService) {
  }

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        this.action = params.get('action');
        if (this.action === 'new') {
          this.isNewMode = true;
          return forkJoin([
            this.entityService.getRelationMetaOfEntity('category'),
            this._createNewEntity()
          ]);
        } else {
          this.isNewMode = false;
          return forkJoin([
            this.entityService.getRelationMetaOfEntity('category'),
            this.identityService.getAppCategoryDetail(params.get('appCategory'))
          ]);
        }
      })
    ).subscribe( data => {
      this.relationMetas = data[0] as RelationMeta[];
      this.attrCtrls = this.attributeControlService.toAttributeControl(
        this.relationMetas.find( relationMeta => relationMeta.RELATION_ID === 'r_app_category').ATTRIBUTES);
      if ('ENTITY_ID' in data[1]) {
        this.instanceGUID = data[1]['INSTANCE_GUID'];
        this._generateMainForm(<Entity>data[1]);
        if (this.isNewMode || this.action === 'change') {
          this._switch2EditMode();
        } else {
          this._switch2DisplayMode();
        }
      } else {
        const errorMessages = <Message[]>data[1];
        errorMessages.forEach( msg => this.messageService.add(msg));
      }
    });
  }

  getAttrCtrlFromID(fieldName: string): AttributeBase {
    return this.attrCtrls.find( attrCtrl => attrCtrl.name === fieldName);
  }

  switchTabStrip(tabStripID: number): void {
    this.tabStrip = tabStripID;
  }

  switchEditDisplay(): void {
    if (this.readonly ) {
      this._switch2EditMode();
    } else {
      if (this.mainForm.dirty) {
        this.dialogService.confirm('Discard changes?').subscribe(confirm => {
          if (confirm) {
            this.mainForm.reset(this.originalValue);
            this._switch2DisplayMode();
          }
        });
      } else {
        this._switch2DisplayMode();
      }
    }
    this.messageService.clearMessages();
  }

  _switch2DisplayMode(): void {
    this.readonly = true;

    const appCategoryIDCtrl = this.mainForm.get('ID') as FormControl;
    appCategoryIDCtrl.clearAsyncValidators();

    const appArray = this.mainForm.get('apps') as FormArray;
    let lastIndex = appArray.length - 1;
    while (lastIndex >= 0) {
      const appGroup = appArray.at(lastIndex);
      if (appGroup.invalid || !appGroup.value.APP_ID) {
        appArray.removeAt(lastIndex);
      }
      lastIndex--;
    }

    this.mainForm.markAsPristine();
    // Replace the URL from change to display
    window.history.replaceState({}, '', `/app-categories/${appCategoryIDCtrl.value};action=display`);
  }

  _switch2EditMode(): void {
    this.readonly = false;

    const appCategoryIDCtrl = this.mainForm.get('ID') as FormControl;
    if (this.isNewMode) {
      appCategoryIDCtrl.setAsyncValidators(
        existingAppCategoryValidator(this.identityService, this.messageService));
    }

    const appArray = this.mainForm.get('apps') as FormArray;
    appArray.push( this.fb.group({
      APP_ID: [''],
      NAME: [''],
      ORDER: [0],
      portal_app_INSTANCE_GUID: [''],
      RELATIONSHIP_INSTANCE_GUID: ['']
    }));

    // Replace the URL from to display
    if (this.action === 'display') {this.action = 'change'; }
    window.history.replaceState({}, '', `/app-categories/${appCategoryIDCtrl.value};action=` + this.action);
  }

  _createNewEntity(): Observable<Entity> {
    const appCategoryDetail = new Entity();
    appCategoryDetail.ENTITY_ID = 'category';
    appCategoryDetail['category'] = [
      { NAME: '', TYPE: 'APP', CREATED_BY: '', CREATE_TIME: '', CHANGED_BY: '', CHANGE_TIME: '' }
    ];
    appCategoryDetail['r_app_category'] = [
      { ID: '', NAME: '', ICON: '' }
    ];
    appCategoryDetail['relationships'] = [];
    return of(appCategoryDetail);
  }

  _generateMainForm(data: Entity): void {
    this.mainForm = this.fb.group({
      ID: [data['r_app_category'][0]['ID'], [Validators.required]],
      NAME: [data['r_app_category'][0]['NAME']],
      ICON: [data['r_app_category'][0]['ICON']],
      admin: this.fb.group({
        CREATED_BY: [data['category'][0]['CREATED_BY']],
        CREATE_TIME: [data['category'][0]['CREATE_TIME']],
        CHANGED_BY: [data['category'][0]['CHANGED_BY']],
        CHANGE_TIME: [data['category'][0]['CHANGE_TIME']]
      })
    });
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.mainForm.addControl('apps',
      this.fb.array(parsedRelationship.apps.map( app => this.fb.group( app ))));
    this.mainForm.addControl('roles',
      this.fb.array(parsedRelationship.roles.map( role => this.fb.group( role ))));
    this.originalValue = this.mainForm.getRawValue();
  }

  _parseRelationships( relationships: Relationship[] ): any {
    const parsedRelationship = {
      apps : [],
      roles: []
    };
    if (!relationships) { return parsedRelationship; }
    relationships.forEach( relationship => {
      switch (relationship.RELATIONSHIP_ID) {
        case 'rs_app_category':
          __parseApp(relationship);
          break;
        case 'rs_role_category_profile':
          __parseSystemRole(relationship);
          break;
        default:
        // Do nothing.
      }
    });
    return parsedRelationship;

    function __parseApp( relationship: Relationship): void {
      relationship.values.forEach( value => {
        parsedRelationship.apps.push({
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          portal_app_INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          APP_ID: value['PARTNER_INSTANCES'][0]['app'][0]['APP_ID'],
          NAME: value['PARTNER_INSTANCES'][0]['app'][0]['NAME'],
          ORDER: value['ORDER']
        });
      });
    }

    function __parseSystemRole( relationship: Relationship): void {
      relationship.values.forEach( value => {
        const permission = value['PARTNER_INSTANCES'].find( partner => partner.ENTITY_ID === 'permission');
        parsedRelationship.roles.push({
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          system_role_INSTANCE_GUID: permission.INSTANCE_GUID,
          NAME: permission.r_role[0].NAME,
          DESCRIPTION: permission.r_role[0].DESCRIPTION,
          ORDER: value['ORDER']
        });
      });
    }
  }

  _resetValue(data: Entity): void {
    this.originalValue = {
      ID: data['r_app_category'][0]['ID'],
      NAME: data['r_app_category'][0]['NAME'],
      ICON: data['r_app_category'][0]['ICON'],
      admin: {
        CREATED_BY: data['category'][0]['CREATED_BY'],
        CREATE_TIME: data['category'][0]['CREATE_TIME'],
        CHANGED_BY: data['category'][0]['CHANGED_BY'],
        CHANGE_TIME: data['category'][0]['CHANGE_TIME']
      }
    };
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.originalValue['apps'] = parsedRelationship.apps;
    this.originalValue['roles'] = parsedRelationship.roles;
    this.mainForm.reset(this.originalValue);
  }

  save() {
    this.messageService.clearMessages();
    if (this._composeChanges()) {
      this.identityService.save(<Entity>this.changedValue).subscribe( data => {
        this.changedValue = {};
        if ('INSTANCE_GUID' in data) {
          const appCategoryID = data['r_app_category'][0]['ID'];
          this.instanceGUID = data['INSTANCE_GUID'];
          this.isNewMode = false;
          this.identityService.getAppCategoryDetail(appCategoryID).subscribe(instance => {
            if ('ENTITY_ID' in instance) {
              this._switch2DisplayMode();
              this._resetValue(<Entity>instance);
            } else {
              const errorMessages = <Message[]>instance;
              errorMessages.forEach( msg => this.messageService.add(msg));
            }
          });
          this.messageService.reportMessage('APP_CATEGORY', 'SAVED', 'S', appCategoryID);
        } else {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
        }
      });
    }
  }

  _composeChanges() {
    if (this.mainForm.invalid) {
      this.messageService.reportMessage('APP_CATEGORY', 'INVALID', 'E');
      return false;
    }

    if (this.mainForm.dirty === false) {
      this.messageService.reportMessage('GENERAL', 'NO_CHANGE', 'W');
      return false;
    }

    this.changedValue['ENTITY_ID'] = 'category';
    this.changedValue['INSTANCE_GUID'] = this.instanceGUID;

    if (this.isNewMode) {
      this.changedValue['category'] = {
        action: 'add', TYPE: 'APP',
        CREATED_BY: this.identityService.Session.USER_ID, CREATE_TIME: this.identityService.CurrentTime,
        CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime
      };
      this.changedValue['r_app_category'] = { action: 'add', ID: this.mainForm.get('ID').value };
    } else {
      this.changedValue['category'] = {
        action: 'update', CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
      this.changedValue['r_app_category'] = { action: 'update', ID: this.mainForm.get('ID').value};
    }

    if (this.mainForm.get('NAME').dirty) {
      this.changedValue['category']['NAME'] = this.mainForm.get('NAME').value;
      this.changedValue['r_app_category']['NAME'] = this.mainForm.get('NAME').value;
    }

    if (this.mainForm.get('ICON').dirty) {
      this.changedValue['r_app_category']['ICON'] = this.mainForm.get('ICON').value;
    }

    const appFormArray = this.mainForm.get('apps') as FormArray;
    const relationship = this.uiMapperService.composeChangedRelationship(
      'rs_app_category',
      [{ENTITY_ID: 'app', ROLE_ID: 'portal_app'}],
      appFormArray,
      this.originalValue['apps'],
      ['APP_ID', 'NAME']);

    if (relationship) {this.changedValue['relationships'] = [relationship]; }

    return true;
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.isNewMode || (this.mainForm && this.mainForm.dirty)) {
      return this.dialogService.confirm('Discard changes?');
    } else {
      return true;
    }
  }
}
