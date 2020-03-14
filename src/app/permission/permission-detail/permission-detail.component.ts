import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AttributeBase, AttributeControlService, Entity, EntityService, RelationMeta, Relationship, UiMapperService} from 'jor-angular';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {IdentityService} from '../../identity.service';
import {Message, MessageService} from 'ui-message-angular';
import {switchMap} from 'rxjs/operators';
import {forkJoin, Observable, of} from 'rxjs';
import {DialogService} from '../../dialog.service';
import {existingPermissionValidator} from '../../async-validators';

@Component({
  selector: 'app-permission-detail',
  templateUrl: './permission-detail.component.html',
  styleUrls: ['./permission-detail.component.css']
})
export class PermissionDetailComponent implements OnInit {
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
              this.entityService.getRelationMetaOfEntity('permission'),
              this._createNewEntity()
            ]);
        } else {
          this.isNewMode = false;
          return forkJoin([
            this.entityService.getRelationMetaOfEntity('permission'),
            this.identityService.getPermissionDetail(params.get('permissionName'))
          ]);
        }
      })
    ).subscribe( data => {
      this.relationMetas = data[0] as RelationMeta[];
      this.attrCtrls = this.attributeControlService.toAttributeControl(
        this.relationMetas.find( relationMeta => relationMeta.RELATION_ID === 'r_role').ATTRIBUTES);
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
    this._setCheckBoxState();

    const permissionNameCtrl = this.mainForm.get('NAME') as FormControl;
    permissionNameCtrl.clearAsyncValidators();
    // const emailArray = this.mainForm.get('appCategories') as FormArray;
    // let lastIndex = emailArray.length - 1;
    // while (lastIndex >= 0) {
    //   const emailFormGroup = emailArray.at(lastIndex);
    //   if (emailFormGroup.invalid || !emailFormGroup.value.EMAIL) {
    //     emailArray.removeAt(lastIndex);
    //   }
    //   lastIndex--;
    // }
    this.mainForm.markAsPristine();
    // Replace the URL from change to display
    window.history.replaceState({}, '', `/users/${permissionNameCtrl.value};action=display`);
  }

  _switch2EditMode(): void {
    this.readonly = false;
    this._setCheckBoxState();

    const permissionNameCtrl = this.mainForm.get('NAME') as FormControl;
    if (this.isNewMode) {
      permissionNameCtrl.setAsyncValidators(
        existingPermissionValidator(this.identityService, this.messageService));
    }
    // const roleArray = this.userForm.get('userRole') as FormArray;
    // roleArray.push( this.fb.group({
    //   NAME: [''],
    //   DESCRIPTION: [''],
    //   system_role_INSTANCE_GUID: [''],
    //   RELATIONSHIP_INSTANCE_GUID: [''],
    // }));

    // Replace the URL from to display
    if (this.action === 'display') {this.action = 'change'; }
    window.history.replaceState({}, '', `/users/${permissionNameCtrl.value};action=` + this.action);
  }

  _createNewEntity(): Observable<Entity> {
    const permissionDetail = new Entity();
    permissionDetail.ENTITY_ID = 'permission';
    permissionDetail['permission'] = [
      { DESCR: '', CREATED_BY: '', CREATE_TIME: '', CHANGED_BY: '', CHANGE_TIME: '' }
    ];
    permissionDetail['r_role'] = [
      { NAME: '', DESCRIPTION: '' }
    ];
    permissionDetail['relationships'] = [];
    return of(permissionDetail);
  }

  _generateMainForm(data: Entity): void {
    this.mainForm = this.fb.group({
      NAME: [data['r_role'][0]['NAME'], [Validators.required]],
      DESCRIPTION: [data['r_role'][0]['DESCRIPTION']],
      admin: this.fb.group({
        CREATED_BY: [data['permission'][0]['CREATED_BY']],
        CREATE_TIME: [data['permission'][0]['CREATE_TIME']],
        CHANGED_BY: [data['permission'][0]['CHANGED_BY']],
        CHANGE_TIME: [data['permission'][0]['CHANGE_TIME']]
      })
    });
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.mainForm.addControl('appCategories', this.fb.array(
      parsedRelationship.appCategories.map( appCategory => this.fb.group(appCategory))));
    this.mainForm.addControl('profiles', this.fb.array(
      parsedRelationship.profiles.map( profile => this.fb.group(profile))));
    this.mainForm.addControl('users', this.fb.array(
      parsedRelationship.users.map( user => this.fb.group(user))));
    this.originalValue = this.mainForm.getRawValue();
  }

  _parseRelationships( relationships: Relationship[] ): any {
    const parsedRelationship = {
      roleUsers: [],
      appCategories: [],
      profiles: []
    };
    if (!relationships) { return parsedRelationship; }
    relationships.forEach( relationship => {
      switch (relationship.RELATIONSHIP_ID) {
        case 'rs_system_role_category':
          __parseRoleAppCategory(relationship);
          break;
        case 'rs_system_role_profile':
          __parseRoleProfile(relationship);
          break;
        case 'rs_user_role':
          __parseRoleUsers(relationship);
          break;
        default:
        // Do nothing.
      }
    });
    return parsedRelationship;

    function __parseRoleUsers( relationship: Relationship): void {
      relationship.values.forEach( value => {
        parsedRelationship.roleUsers.push( {
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          SYNCED: value['SYNCED'],
          INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          USER_ID: value['PARTNER_INSTANCES'][0]['r_user'][0]['USER_ID'],
          USER_NAME: value['PARTNER_INSTANCES'][0]['r_user'][0]['USER_NAME']
        });
      });
    }

    function __parseRoleAppCategory( relationship: Relationship): void {
      relationship.values.forEach( value => {
        const appCategory = {
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          ORDER: value['ORDER'],
          INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          NAME: value['PARTNER_INSTANCES'][0]['r_app_category'][0]['NAME'],
          ICON: value['PARTNER_INSTANCES'][0]['r_app_category'][0]['ICON'],
          apps: []
        };

        const rsAppCategory = value['PARTNER_INSTANCES'][0]['relationships'][0];
        rsAppCategory.values.forEach( value2 => {
          appCategory.apps.push({
            RELATIONSHIP_INSTANCE_GUID: value2['RELATIONSHIP_INSTANCE_GUID'],
            ORDER: value2['ORDER'],
            INSTANCE_GUID: value2['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
            APP_ID: value2['PARTNER_INSTANCES'][0]['app'][0]['APP_ID'],
            NAME: value2['PARTNER_INSTANCES'][0]['app'][0]['NAME'],
            ROUTE_LINK: value2['PARTNER_INSTANCES'][0]['app'][0]['ROUTE_LINK'],
            IS_EXTERNAL: value2['PARTNER_INSTANCES'][0]['app'][0]['IS_EXTERNAL']
          });
        });
        parsedRelationship.appCategories.push( appCategory );
      });
    }

    function __parseRoleProfile( relationship: Relationship ): void {
      relationship.values.forEach( value => {
        const profile = {
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          PROFILE_NAME: value['PARTNER_INSTANCES'][0]['authProfile'][0]['PROFILE_NAME'],
          DESC: value['PARTNER_INSTANCES'][0]['authProfile'][0]['DESC'],
          CREATED_BY: value['PARTNER_INSTANCES'][0]['authProfile'][0]['CREATED_BY'],
          CREATE_TIME: value['PARTNER_INSTANCES'][0]['authProfile'][0]['CREATE_TIME'],
          CHANGED_BY: value['PARTNER_INSTANCES'][0]['authProfile'][0]['CHANGED_BY'],
          CHANGE_TIME: value['PARTNER_INSTANCES'][0]['authProfile'][0]['CHANGE_TIME'],
          authorizations: []
        };
        const authorizations = value['PARTNER_INSTANCES'][0]['r_authorization'];
        authorizations.forEach( authorization => {
          profile.authorizations.push({
            ID: authorization['ID'],
            VALUE: authorization['VALUE']
          });
        });
        parsedRelationship.profiles.push( profile );
      });
    }
  }

  _resetValue(data: Entity): void {
    this.originalValue = {
      NAME: data['r_role'][0]['NAME'],
      DESCRIPTION: data['r_role'][0]['DESCRIPTION'],
      admin: {
        CREATED_BY: data['permission'][0]['CREATED_BY'],
        CREATE_TIME: data['permission'][0]['CREATE_TIME'],
        CHANGED_BY: data['permission'][0]['CHANGED_BY'],
        CHANGE_TIME: data['permission'][0]['CHANGE_TIME']
      }
    };
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.originalValue['appCategories'] = parsedRelationship.appCategories;
    this.originalValue['profiles'] = parsedRelationship.profiles;
    this.originalValue['users'] = parsedRelationship.users;
    this.mainForm.reset(this.originalValue);
  }

  _setCheckBoxState() {
    // const userPersonalizationForm = this.userForm.get('userPersonalization') as FormGroup;
    // if (this.readonly) {
    //   userPersonalizationForm.get('LANGUAGE').disable();
    // } else {
    //   userPersonalizationForm.get('LANGUAGE').enable();
    // }
  }

  save() {
    this.messageService.clearMessages();
    if (this._composeChangesToUser()) {
      this.identityService.save(<Entity>this.changedValue).subscribe( data => {
        this.changedValue = {};
        if ('INSTANCE_GUID' in data) {
          const permissionName = data['r_role'][0]['NAME'];
          this.instanceGUID = data['INSTANCE_GUID'];
          this.isNewMode = false;
          this.identityService.getPermissionDetail(permissionName).subscribe(instance => {
            if ('ENTITY_ID' in instance) {
              this._switch2DisplayMode();
              this._resetValue(<Entity>instance);
            } else {
              const errorMessages = <Message[]>instance;
              errorMessages.forEach( msg => this.messageService.add(msg));
            }
          });
          this.messageService.reportMessage('PERMISSION', 'SAVED', 'S', permissionName);
        } else {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
        }
      });
    }
  }

  _composeChangesToUser() {
    if (this.mainForm.invalid) {
      this.messageService.reportMessage('PERMISSION', 'INVALID', 'E');
      return false;
    }

    if (this.mainForm.dirty === false) {
      this.messageService.reportMessage('GENERAL', 'NO_CHANGE', 'W');
      return false;
    }

    this.changedValue['ENTITY_ID'] = 'permission';
    this.changedValue['INSTANCE_GUID'] = this.instanceGUID;
    if (this.isNewMode) {
      this.changedValue['permission'] = {
        action: 'add', DESCR: this.mainForm.get('DESCRIPTION'),
        CREATED_BY: 'DH001', CREATE_TIME: '', CHANGE_BY: 'DH001', CHANGED_TIME: ''};
      this.changedValue['r_role'] = {
        action: 'add', NAME: this.mainForm.get('NAME'),
        DESCRIPTION: this.mainForm.get('DESCRIPTION')
      };
    }

    this.changedValue['permission'] = {
      action: 'update', CHANGE_BY: 'DH001', CHANGED_TIME: ''};

    if (this.mainForm.get('DESCRIPTION').dirty) {
      this.changedValue['permission']['DESCR'] = this.mainForm.get('DESCRIPTION');
      this.changedValue['r_role'] = {
        action: 'update',  DESCRIPTION: this.mainForm.get('DESCRIPTION') };
    }

    const appCategoryFormArray = this.mainForm.get('appCategories') as FormArray;
    const relationship = this.uiMapperService.composeChangedRelationship(
      'rs_system_role_category',
      [{ENTITY_ID: 'category', ROLE_ID: 'app_category'}],
      appCategoryFormArray,
      this.originalValue['appCategories'],
      ['NAME', 'ICON', 'apps']);

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
