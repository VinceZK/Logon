import { Component, OnInit } from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AttributeBase, AttributeControlService, Entity, EntityService, RelationMeta, Relationship, UiMapperService} from 'jor-angular';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {DialogService} from '../../dialog.service';
import {IdentityService} from '../../identity.service';
import {Message, MessageService} from 'ui-message-angular';
import {switchMap} from 'rxjs/operators';
import {forkJoin, Observable, of} from 'rxjs';
import {existingProfileValidator} from '../../async-validators';
import {Authorization} from '../../identity';

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.css']
})
export class ProfileDetailComponent implements OnInit {
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
            this.entityService.getRelationMetaOfEntity('authProfile'),
            this._createNewEntity()
          ]);
        } else {
          this.isNewMode = false;
          return forkJoin([
            this.entityService.getRelationMetaOfEntity('authProfile'),
            this.identityService.getAuthProfileDetail(params.get('profileName'))
          ]);
        }
      })
    ).subscribe( data => {
      this.relationMetas = data[0] as RelationMeta[];
      this.attrCtrls = this.attributeControlService.toAttributeControl(
        this.relationMetas.find( relationMeta => relationMeta.RELATION_ID === 'authProfile').ATTRIBUTES);
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

    const profileNameCtrl = this.mainForm.get('PROFILE_NAME') as FormControl;
    profileNameCtrl.clearAsyncValidators();

    this.mainForm.markAsPristine();
    // Replace the URL from change to display
    window.history.replaceState({}, '', `/profiles/${profileNameCtrl.value};action=display`);
  }

  _switch2EditMode(): void {
    this.readonly = false;

    const profileNameCtrl = this.mainForm.get('PROFILE_NAME') as FormControl;
    if (this.isNewMode) {
      profileNameCtrl.setAsyncValidators(
        existingProfileValidator(this.identityService, this.messageService));
    }

    // Replace the URL from to display
    if (this.action === 'display') {this.action = 'change'; }
    window.history.replaceState({}, '', `/profiles/${profileNameCtrl.value};action=` + this.action);
  }

  _createNewEntity(): Observable<Entity> {
    const profileDetail = new Entity();
    profileDetail.ENTITY_ID = 'authProfile';
    profileDetail['authProfile'] = [
      { PROFILE_NAME: '', DESC: '', CREATED_BY: '', CREATE_TIME: '', CHANGED_BY: '', CHANGE_TIME: '' }
    ];
    profileDetail['relationships'] = [];
    return of(profileDetail);
  }

  _generateMainForm(data: Entity): void {
    this.mainForm = this.fb.group({
      PROFILE_NAME: [data['authProfile'][0]['PROFILE_NAME'], [Validators.required]],
      DESC: [data['authProfile'][0]['DESC']],
      admin: this.fb.group({
        CREATED_BY: [data['authProfile'][0]['CREATED_BY']],
        CREATE_TIME: [data['authProfile'][0]['CREATE_TIME']],
        CHANGED_BY: [data['authProfile'][0]['CHANGED_BY']],
        CHANGE_TIME: [data['authProfile'][0]['CHANGE_TIME']]
      })
    });
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.mainForm.addControl('authObjects',
      this.fb.array(parsedRelationship.authObjects.map( authObject => this.fb.group( authObject ))));
    this.originalValue = this.mainForm.getRawValue();
  }

  _parseRelationships( relationships: Relationship[] ): any {
    const parsedRelationship = {
      authObjects : []
    };
    if (!relationships) { return parsedRelationship; }
    relationships.forEach( relationship => {
      switch (relationship.RELATIONSHIP_ID) {
        case 'rs_auth_profile_object':
          __parseAuthObjects(relationship);
          break;
        default:
        // Do nothing.
      }
    });
    return parsedRelationship;

    function __parseAuthObjects(relationship: Relationship): void {
      relationship.values.forEach(value => {
        const authorization = value['AUTH_VALUE'] ? <Authorization>JSON.parse(value['AUTH_VALUE']) : null;
        const status = authorization ?
          Object.values(authorization.AuthFieldValue).findIndex(authValue => !authValue) !== -1 ?
            'yellow' : 'green' : 'red';
        parsedRelationship.authObjects.push({
          CHECKED: '',
          COLLAPSED: false,
          NODE_ID: value['RELATIONSHIP_INSTANCE_GUID'],
          STATUS: status,
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          auth_object_INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          AUTH_VALUE: value['AUTH_VALUE'],
          OBJ_NAME: value['PARTNER_INSTANCES'][0]['authObject'][0]['OBJ_NAME'],
          DESC: value['PARTNER_INSTANCES'][0]['authObject'][0]['DESC'],
          ROW_TYPE: 'OBJECT',
          FIELD_NAME: '',
          DATA_ELEMENT: '',
        });

        const authObjectFields = value['PARTNER_INSTANCES'][0]['relationships'][0];
        authObjectFields.values.forEach(value2 => {
          const authFieldName = value2['PARTNER_INSTANCES'][0]['authField'][0]['FIELD_NAME'];
          parsedRelationship.authObjects.push({
            CHECKED: '',
            COLLAPSED: false,
            NODE_ID: value['RELATIONSHIP_INSTANCE_GUID'],
            STATUS: authorization && authorization.AuthFieldValue && authorization.AuthFieldValue[authFieldName] ?
              authorization.AuthFieldValue[authFieldName].length > 0 ? 'green' : 'red' : 'red',
            RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
            auth_object_INSTANCE_GUID: '',
            AUTH_VALUE: authorization && authorization.AuthFieldValue[authFieldName]
              && JSON.stringify(authorization.AuthFieldValue[authFieldName], null, ' '),
            OBJ_NAME: value['PARTNER_INSTANCES'][0]['authObject'][0]['OBJ_NAME'],
            DESC: '',
            ROW_TYPE: 'FIELD',
            FIELD_NAME: authFieldName,
            DATA_ELEMENT: value2['PARTNER_INSTANCES'][0]['authField'][0]['DATA_ELEMENT'],
          });
        });
      });
    }
  }

  _resetValue(data: Entity): void {
    this.originalValue = {
      PROFILE_NAME: data['authProfile'][0]['PROFILE_NAME'],
      DESC: data['authProfile'][0]['DESC'],
      admin: {
        CREATED_BY: data['authProfile'][0]['CREATED_BY'],
        CREATE_TIME: data['authProfile'][0]['CREATE_TIME'],
        CHANGED_BY: data['authProfile'][0]['CHANGED_BY'],
        CHANGE_TIME: data['authProfile'][0]['CHANGE_TIME']
      }
    };
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.originalValue['authObjects'] = parsedRelationship.authObjects;
    this.originalValue['roles'] = parsedRelationship.roles;
    this.mainForm.reset(this.originalValue);
  }

  save() {
    this.messageService.clearMessages();
    if (this._composeChanges()) {
      this.identityService.save(<Entity>this.changedValue).subscribe( data => {
        this.changedValue = {};
        if ('INSTANCE_GUID' in data) {
          const profileName = data['authProfile'][0]['PROFILE_NAME'];
          this.instanceGUID = data['INSTANCE_GUID'];
          this.isNewMode = false;
          this.identityService.getAuthProfileDetail(profileName).subscribe(instance => {
            if ('ENTITY_ID' in instance) {
              this._switch2DisplayMode();
              this._resetValue(<Entity>instance);
            } else {
              const errorMessages = <Message[]>instance;
              errorMessages.forEach( msg => this.messageService.add(msg));
            }
          });
          this.messageService.reportMessage('AUTH_PROFILE', 'SAVED', 'S', profileName);
        } else {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
        }
      });
    }
  }

  _composeChanges() {
    if (this.mainForm.invalid) {
      this.messageService.reportMessage('AUTH_PROFILE', 'INVALID', 'E');
      return false;
    }

    if (this.mainForm.dirty === false) {
      this.messageService.reportMessage('GENERAL', 'NO_CHANGE', 'W');
      return false;
    }

    this.changedValue['ENTITY_ID'] = 'authProfile';
    this.changedValue['INSTANCE_GUID'] = this.instanceGUID;

    if (this.isNewMode) {
      this.changedValue['authProfile'] = {
        action: 'add', PROFILE_NAME: this.mainForm.get('PROFILE_NAME').value,
        CREATED_BY: this.identityService.Session.USER_ID, CREATE_TIME: this.identityService.CurrentTime,
        CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
    } else {
      this.changedValue['authProfile'] = {
        action: 'update', CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
    }

    if (this.mainForm.get('DESC').dirty) {
      this.changedValue['authProfile']['DESC'] = this.mainForm.get('DESC').value;
    }

    const authObjectFormArray = this.mainForm.get('authObjects') as FormArray;
    const relationship = this.identityService.composeAuthChanges(authObjectFormArray,
      this.originalValue['appAuthObjects'], 'rs_auth_profile_object');
    if (relationship) { this.changedValue['relationships'] = [relationship]; }

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
