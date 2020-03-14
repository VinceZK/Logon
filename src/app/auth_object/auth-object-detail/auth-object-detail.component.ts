import { Component, OnInit } from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AttributeBase, AttributeControlService, Entity, EntityService, RelationMeta, Relationship, UiMapperService} from 'jor-angular';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {DialogService} from '../../dialog.service';
import {IdentityService} from '../../identity.service';
import {Message, MessageService} from 'ui-message-angular';
import {switchMap} from 'rxjs/operators';
import {forkJoin, Observable, of} from 'rxjs';
import {existingAuthObjectValidator} from '../../async-validators';

@Component({
  selector: 'app-auth-object-detail',
  templateUrl: './auth-object-detail.component.html',
  styleUrls: ['./auth-object-detail.component.css']
})
export class AuthObjectDetailComponent implements OnInit {
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
            this.entityService.getRelationMetaOfEntity('authObject'),
            this._createNewEntity()
          ]);
        } else {
          this.isNewMode = false;
          return forkJoin([
            this.entityService.getRelationMetaOfEntity('authObject'),
            this.identityService.getAuthObjectDetail(params.get('authObjName'))
          ]);
        }
      })
    ).subscribe( data => {
      this.relationMetas = data[0] as RelationMeta[];
      this.attrCtrls = this.attributeControlService.toAttributeControl(
        this.relationMetas.find( relationMeta => relationMeta.RELATION_ID === 'authObject').ATTRIBUTES);
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

    const appIDCtrl = this.mainForm.get('OBJ_NAME') as FormControl;
    appIDCtrl.clearAsyncValidators();

    const authFieldArray = this.mainForm.get('authFields') as FormArray;
    let lastIndex = authFieldArray.length - 1;
    while (lastIndex >= 0) {
      const authFieldGroup = authFieldArray.at(lastIndex);
      if (authFieldGroup.invalid || !authFieldGroup.value.FIELD_NAME) {
        authFieldArray.removeAt(lastIndex);
      }
      lastIndex--;
    }

    this.mainForm.markAsPristine();
    // Replace the URL from change to display
    window.history.replaceState({}, '', `/auth-objects/${appIDCtrl.value};action=display`);
  }

  _switch2EditMode(): void {
    this.readonly = false;

    const authObjCtrl = this.mainForm.get('OBJ_NAME') as FormControl;
    if (this.isNewMode) {
      authObjCtrl.setAsyncValidators(
        existingAuthObjectValidator(this.identityService, this.messageService));
    }

    const appCategoryArray = this.mainForm.get('authFields') as FormArray;
    appCategoryArray.push( this.fb.group({
      FIELD_NAME: [''],
      DATA_ELEMENT: [''],
      auth_field_INSTANCE_GUID: [''],
      RELATIONSHIP_INSTANCE_GUID: ['']
    }));

    // Replace the URL from to display
    if (this.action === 'display') {this.action = 'change'; }
    window.history.replaceState({}, '', `/auth-objects/${authObjCtrl.value};action=` + this.action);
  }

  _createNewEntity(): Observable<Entity> {
    const authObjectDetail = new Entity();
    authObjectDetail.ENTITY_ID = 'authObject';
    authObjectDetail['authObject'] = [
      { OBJ_NAME: '', DESC: '', CREATED_BY: '', CREATE_TIME: '', CHANGED_BY: '', CHANGE_TIME: '' }
    ];
    authObjectDetail['relationships'] = [];
    return of(authObjectDetail);
  }

  _generateMainForm(data: Entity): void {
    this.mainForm = this.fb.group({
      OBJ_NAME: [data['authObject'][0]['OBJ_NAME'], [Validators.required]],
      DESC: [data['authObject'][0]['DESC']],
      admin: this.fb.group({
        CREATED_BY: [data['authObject'][0]['CREATED_BY']],
        CREATE_TIME: [data['authObject'][0]['CREATE_TIME']],
        CHANGED_BY: [data['authObject'][0]['CHANGED_BY']],
        CHANGE_TIME: [data['authObject'][0]['CHANGE_TIME']]
      })
    });
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.mainForm.addControl('authFields',
      this.fb.array(parsedRelationship.authFields.map( authField => this.fb.group( authField ))));
    this.originalValue = this.mainForm.getRawValue();
  }

  _parseRelationships( relationships: Relationship[] ): any {
    const parsedRelationship = {
      authFields : []
    };
    if (!relationships) { return parsedRelationship; }
    relationships.forEach( relationship => {
      switch (relationship.RELATIONSHIP_ID) {
        case 'rs_auth_object_field':
          __parseAuthField(relationship);
          break;
        default:
        // Do nothing.
      }
    });
    return parsedRelationship;

    function __parseAuthField( relationship: Relationship): void {
      relationship.values.forEach( value => {
        parsedRelationship.authFields.push({
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          auth_field_INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          FIELD_NAME: value['PARTNER_INSTANCES'][0]['authField'][0]['FIELD_NAME'],
          DATA_ELEMENT: value['PARTNER_INSTANCES'][0]['authField'][0]['DATA_ELEMENT']
        });
      });
    }
  }

  _resetValue(data: Entity): void {
    this.originalValue = {
      OBJ_NAME: data['authObject'][0]['OBJ_NAME'],
      DESC: data['authObject'][0]['DESC'],
      admin: {
        CREATED_BY: data['authObject'][0]['CREATED_BY'],
        CREATE_TIME: data['authObject'][0]['CREATE_TIME'],
        CHANGED_BY: data['authObject'][0]['CHANGED_BY'],
        CHANGE_TIME: data['authObject'][0]['CHANGE_TIME']
      }
    };
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.originalValue['authFields'] = parsedRelationship.authFields;
    this.mainForm.reset(this.originalValue);
  }

  save() {
    this.messageService.clearMessages();
    if (this._composeChanges()) {
      this.identityService.save(<Entity>this.changedValue).subscribe( data => {
        this.changedValue = {};
        if ('INSTANCE_GUID' in data) {
          const authObjName = data['authObject'][0]['OBJ_NAME'];
          this.instanceGUID = data['INSTANCE_GUID'];
          this.isNewMode = false;
          this.identityService.getAuthObjectDetail(authObjName).subscribe(instance => {
            if ('ENTITY_ID' in instance) {
              this._switch2DisplayMode();
              this._resetValue(<Entity>instance);
            } else {
              const errorMessages = <Message[]>instance;
              errorMessages.forEach( msg => this.messageService.add(msg));
            }
          });
          this.messageService.reportMessage('AUTH_OBJECT', 'SAVED', 'S', authObjName);
        } else {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
        }
      });
    }
  }

  _composeChanges() {
    if (this.mainForm.invalid) {
      this.messageService.reportMessage('AUTH_OBJECT', 'INVALID', 'E');
      return false;
    }

    if (this.mainForm.dirty === false) {
      this.messageService.reportMessage('GENERAL', 'NO_CHANGE', 'W');
      return false;
    }

    this.changedValue['ENTITY_ID'] = 'authObject';
    this.changedValue['INSTANCE_GUID'] = this.instanceGUID;

    if (this.isNewMode) {
      this.changedValue['authObject'] = {
        action: 'add', OBJ_NAME: this.mainForm.get('OBJ_NAME').value,
        CREATED_BY: this.identityService.Session.USER_ID, CREATE_TIME: this.identityService.CurrentTime,
        CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
    } else {
      this.changedValue['authObject'] = {
        action: 'update', CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
    }

    if (this.mainForm.get('DESC').dirty) {
      this.changedValue['authObject']['DESC'] = this.mainForm.get('DESC').value;
    }

    const authFieldFormArray = this.mainForm.get('authFields') as FormArray;
    const relationship = this.uiMapperService.composeChangedRelationship(
      'rs_auth_object_field',
      [{ENTITY_ID: 'authField', ROLE_ID: 'auth_field'}],
      authFieldFormArray,
      this.originalValue['authFields'],
      ['FIELD_NAME', 'DATA_ELEMENT']);

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
