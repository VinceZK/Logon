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
  operations = [];
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

  return2List(): void {
    this.router.navigate(['permissions']);
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

    const permissionNameCtrl = this.mainForm.get('NAME') as FormControl;
    permissionNameCtrl.clearAsyncValidators();

    this.mainForm.markAsPristine();
    // Replace the URL from change to display
    window.history.replaceState({}, '', `/permissions/${permissionNameCtrl.value};action=display`);
  }

  _switch2EditMode(): void {
    this.readonly = false;

    const permissionNameCtrl = this.mainForm.get('NAME') as FormControl;
    if (this.isNewMode) {
      permissionNameCtrl.setAsyncValidators(
        existingPermissionValidator(this.identityService, this.messageService));
    }

    // Replace the URL from to display
    if (this.action === 'display') {this.action = 'change'; }
    window.history.replaceState({}, '', `/permissions/${permissionNameCtrl.value};action=` + this.action);
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
    this.mainForm.addControl('categories', this.fb.array(
      parsedRelationship.categories.map( category => {
        const categoryCtrl =  this.fb.group({
          CHECKED: category.CHECKED,
          COLLAPSED: category.COLLAPSED,
          ROW_TYPE: category.ROW_TYPE,
          RELATIONSHIP_INSTANCE_GUID: category.RELATIONSHIP_INSTANCE_GUID,
          app_category_INSTANCE_GUID: category.app_category_INSTANCE_GUID,
          auth_profile_INSTANCE_GUID: category.auth_profile_INSTANCE_GUID,
          ORDER: category.ORDER
        });

        categoryCtrl.addControl('category', this.fb.group({
          ID: category.category.ID,
          NAME: category.category.NAME,
          ICON: category.category.ICON
          }));

        if (category.profile) {
          categoryCtrl.addControl('profile', this.fb.group({
            PROFILE_NAME: category.profile.PROFILE_NAME,
            DESC: category.profile.DESC,
            CHANGE_TIME: category.profile.CHANGE_TIME,
            authorizations: category.profile.authorizations ?
              this.fb.array(category.profile.authorizations.map( authorization => this.fb.group(authorization) )) : ''
          }));
        }

        if (category.app) {
          categoryCtrl.addControl('app', this.fb.group({
            APP_ID: category.app.APP_ID,
            NAME: category.app.NAME
          }));
        }

        return categoryCtrl;
      })));
    this.mainForm.addControl('users', this.fb.array(
      parsedRelationship.users.map( user => this.fb.group(user))));
    this.originalValue = this.mainForm.getRawValue();
  }

  _parseRelationships( relationships: Relationship[] ): any {
    const parsedRelationship = {
      users: [],
      categories: []
    };
    if (!relationships) { return parsedRelationship; }
    relationships.forEach( relationship => {
      switch (relationship.RELATIONSHIP_ID) {
        case 'rs_role_category_profile':
          __parseRoleCategoryProfile(relationship, this);
          break;
        case 'rs_user_role':
          __parseRoleUsers(relationship);
          break;
        default:
        // Do nothing.
      }
    });
    return parsedRelationship;

    function __parseRoleCategoryProfile( relationship: Relationship, context: any): void {
      const categories = relationship.values.sort( (a, b) => a.ORDER - b.ORDER);
      categories.forEach( value => {
        const appCategoryInstance = value.PARTNER_INSTANCES.find(
          partnerInstance => partnerInstance.ROLE_ID === 'app_category');
        const authProfileInstance = value.PARTNER_INSTANCES.find(
          partnerInstance => partnerInstance.ROLE_ID === 'auth_profile');
        parsedRelationship.categories.push({
          CHECKED: '',
          COLLAPSED: false,
          ROW_TYPE: 'category',
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          app_category_INSTANCE_GUID: appCategoryInstance.INSTANCE_GUID,
          auth_profile_INSTANCE_GUID: authProfileInstance.INSTANCE_GUID,
          ORDER: value['ORDER'],
          category: {
            ID: appCategoryInstance['r_app_category'][0]['ID'],
            NAME: appCategoryInstance['r_app_category'][0]['NAME'],
            ICON: appCategoryInstance['r_app_category'][0]['ICON']
          },
          profile: {
            PROFILE_NAME: authProfileInstance['authProfile'][0]['PROFILE_NAME'],
            DESC: authProfileInstance['authProfile'][0]['DESC'],
            CHANGE_TIME: authProfileInstance['authProfile'][0]['CHANGE_TIME'],
            authorizations: context.identityService.parseProfileAuthObject(authProfileInstance.relationships[0])
          }
        });
        const rsAppCategory = appCategoryInstance['relationships'][0];
        rsAppCategory.values.forEach( value2 => {
          parsedRelationship.categories.push({
            CHECKED: '',
            COLLAPSED: false,
            ROW_TYPE: 'app',
            RELATIONSHIP_INSTANCE_GUID: value2['RELATIONSHIP_INSTANCE_GUID'],
            app_category_INSTANCE_GUID: '',
            auth_profile_INSTANCE_GUID: '',
            ORDER: value2['ORDER'],
            category: {
              ID: appCategoryInstance['r_app_category'][0]['ID'],
              NAME: appCategoryInstance['r_app_category'][0]['NAME'],
              ICON: appCategoryInstance['r_app_category'][0]['ICON']
            },
            app: {
              APP_ID: value2['PARTNER_INSTANCES'][0]['app'][0]['APP_ID'],
              NAME: value2['PARTNER_INSTANCES'][0]['app'][0]['NAME'],
            }
          });
        });
      });
    }

    function __parseRoleUsers( relationship: Relationship): void {
      relationship.values.forEach( value => {
        parsedRelationship.users.push( {
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          SYNCED: value['SYNCED'],
          INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          USER_ID: value['PARTNER_INSTANCES'][0]['r_user'][0]['USER_ID'],
          USER_NAME: value['PARTNER_INSTANCES'][0]['r_user'][0]['USER_NAME']
        });
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
    this.originalValue['categories'] = parsedRelationship.categories;
    this.originalValue['users'] = parsedRelationship.users;
    this.mainForm.reset(this.originalValue);
  }

  save() {
    this.messageService.clearMessages();
    if (this._composeChanges()) {
      console.log(this.operations);
      this.identityService.orchestrate(this.operations).subscribe( results => {
        this.operations = [];
        results.forEach( result => {
          if (result.msgType) {
            this.messageService.add(<Message>result);
          } else if (result.instance && result.instance.ENTITY_ID === 'permission') {
            this.instanceGUID = result.instance.INSTANCE_GUID;
            this.isNewMode = false;
            const permissionName = this.mainForm.get('NAME').value;
            this.identityService.getPermissionDetail(permissionName).subscribe(instance => {
              if ('ENTITY_ID' in instance) {
                this._switch2DisplayMode();
                // this._resetValue(<Entity>instance);
                this._generateMainForm(<Entity>instance);
              } else {
                const errorMessages = <Message[]>instance;
                errorMessages.forEach( msg => this.messageService.add(msg));
              }
            });
            this.messageService.reportMessage('PERMISSION', 'SAVED', 'S', permissionName);
          }
        });
      });
    }
  }

  _composeChanges() {
    if (this.mainForm.invalid) {
      this.messageService.reportMessage('PERMISSION', 'INVALID', 'E');
      return false;
    }

    if (this.mainForm.dirty === false) {
      this.messageService.reportMessage('GENERAL', 'NO_CHANGE', 'W');
      return false;
    }

    const changedValue = {};
    changedValue['ENTITY_ID'] = 'permission';
    changedValue['INSTANCE_GUID'] = this.instanceGUID;
    if (this.isNewMode) {
      changedValue['permission'] = {
        action: 'add', DESCR: this.mainForm.get('DESCRIPTION'),
        CREATED_BY: this.identityService.Session.USER_ID, CREATE_TIME: this.identityService.CurrentTime,
        CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
      changedValue['r_role'] = {
        action: 'add', NAME: this.mainForm.get('NAME'),
        DESCRIPTION: this.mainForm.get('DESCRIPTION')
      };
    }

    changedValue['permission'] = {
      action: 'update', CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};

    if (this.mainForm.get('DESCRIPTION').dirty) {
      changedValue['permission']['DESCR'] = this.mainForm.get('DESCRIPTION');
      changedValue['r_role'] = {
        action: 'update',  DESCRIPTION: this.mainForm.get('DESCRIPTION') };
    }

    const categoryFormArray = this.mainForm.get('categories') as FormArray;
    categoryFormArray.controls.forEach( ctrl => {
      if (ctrl.get('ROW_TYPE').value === 'category') {
        if (ctrl.get('RELATIONSHIP_INSTANCE_GUID').value) { // Change an existing profile
          if (ctrl.get('profile.authorizations').pristine) { return; }
          const originalProfile = this.originalValue['categories'].find(
            category => category.RELATIONSHIP_INSTANCE_GUID === ctrl.get('RELATIONSHIP_INSTANCE_GUID').value);
          this.operations.push({
            action: 'changeInstance', noCommit: true,
            instance: {
              ENTITY_ID: 'authProfile',
              INSTANCE_GUID: ctrl.get('auth_profile_INSTANCE_GUID').value,
              authProfile: {action: 'update', CHANGED_BY: this.identityService.Session.USER_ID,
                CHANGE_TIME: this.identityService.CurrentTime},
              relationships: [
                this.identityService.composeAuthChanges(<FormArray>ctrl.get('profile.authorizations'),
                  originalProfile.authorizations, 'rs_auth_profile_object')
              ]}
          });
        } else { // Add a new profile
          this.operations.push({
            action: 'createInstance', noCommit: true,
            instance: {
              ENTITY_ID: 'authProfile',
              INSTANCE_GUID: ctrl.get('auth_profile_INSTANCE_GUID').value,
              authProfile: {action: 'add', PROFILE_NAME: ctrl.get('profile.PROFILE_NAME').value,
                DESC: ctrl.get('profile.DESC').value,
                CREATED_BY: this.identityService.Session.USER_ID, CREATE_TIME: this.identityService.CurrentTime,
                CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime},
              relationships: [
                this.identityService.composeAuthChanges(<FormArray>ctrl.get('profile.authorizations'),
                  [], 'rs_auth_profile_object')
              ]
            }
          });
        }
      } else { // ROW_TYPE = app
        ctrl.markAsPristine({onlySelf: true});
      }
    });

    changedValue['relationships'] = [];
    const rsCategory = this.uiMapperService.composeChangedRelationship(
      'rs_role_category_profile',
      [
        {ENTITY_ID: 'category', ROLE_ID: 'app_category'},
        {ENTITY_ID: 'authProfile', ROLE_ID: 'auth_profile'}],
      categoryFormArray,
      this.originalValue['categories'].filter( category => category.ROW_TYPE === 'category'),
      ['CHECKED', 'COLLAPSED', 'ROW_TYPE', 'category', 'profile', 'app']);

    const newCategoryIndex = [];
    if (rsCategory) {
      rsCategory['values'].forEach( (value, index) => {
        if (value.PARTNER_INSTANCES) {
          value.PARTNER_INSTANCES[1].NO_EXISTING_CHECK = true;
          newCategoryIndex.push(index);
        }
      });
      changedValue['relationships'].push(rsCategory);
    }

    const newProfilesIndex = [];
    this.operations.forEach( (operation, index) => {
      if (operation.action === 'createInstance') { newProfilesIndex.push(index); }
    });
    this.operations.push({
      action: this.isNewMode ? 'createInstance' : 'changeInstance', noCommit: true,
      replacements: newProfilesIndex.map( (idx, index) => {
        return {
          movePath: [idx, 'result', 'instance', 'INSTANCE_GUID'],
            toPath: ['relationships', 0, 'values', newCategoryIndex[index], 'PARTNER_INSTANCES', 1, 'INSTANCE_GUID']
        };
      }),
      instance: changedValue
    });

    // Find the deleted categories, and also trigger the deletion of the corresponding profiles
    this.originalValue['categories'].forEach( category => {
      if (category.ROW_TYPE === 'app') { return; }
      const idx = categoryFormArray.controls.findIndex(
        ctrl => ctrl.get('RELATIONSHIP_INSTANCE_GUID').value === category.RELATIONSHIP_INSTANCE_GUID);
      if (idx === -1) {
        this.operations.push({
          action: 'softDeleteInstanceByGUID',
          instance: {INSTANCE_GUID: category.auth_profile_INSTANCE_GUID}
        });
        this.operations.push({
          action: 'hardDeleteByGUID',
          instance: {INSTANCE_GUID: category.auth_profile_INSTANCE_GUID}
        });
      }
    });

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
