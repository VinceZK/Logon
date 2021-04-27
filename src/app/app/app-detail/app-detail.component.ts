import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AttributeBase, AttributeControlService, Entity, EntityService, RelationMeta, Relationship, UiMapperService} from 'jor-angular';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {DialogService} from '../../dialog.service';
import {IdentityService} from '../../identity.service';
import {Message, MessageService} from 'ui-message-angular';
import {switchMap} from 'rxjs/operators';
import {forkJoin, Observable, of} from 'rxjs';
import {existingAppValidator} from '../../async-validators';
import {Authorization} from '../../identity';

@Component({
  selector: 'app-app-detail',
  templateUrl: './app-detail.component.html',
  styleUrls: ['./app-detail.component.css']
})
export class AppDetailComponent implements OnInit {
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
            this.entityService.getRelationMetaOfEntity('app'),
            this._createNewEntity()
          ]);
        } else {
          this.isNewMode = false;
          return forkJoin([
            this.entityService.getRelationMetaOfEntity('app'),
            this.identityService.getAppDetail(params.get('appID'))
          ]);
        }
      })
    ).subscribe( data => {
      this.relationMetas = data[0] as RelationMeta[];
      this.attrCtrls = this.attributeControlService.toAttributeControl(
        this.relationMetas.find( relationMeta => relationMeta.RELATION_ID === 'app').ATTRIBUTES);
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
    this.router.navigate(['apps']);
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

    const appIDCtrl = this.mainForm.get('APP_ID') as FormControl;
    appIDCtrl.clearAsyncValidators();

    const appCategoryArray = this.mainForm.get('appCategories') as FormArray;
    let lastIndex = appCategoryArray.length - 1;
    while (lastIndex >= 0) {
      const appCategoryGroup = appCategoryArray.at(lastIndex);
      if (appCategoryGroup.invalid || !appCategoryGroup.value.ID) {
        appCategoryArray.removeAt(lastIndex);
      }
      lastIndex--;
    }

    this.mainForm.markAsPristine();
    // Replace the URL from change to display
    window.history.replaceState({}, '', `/apps/${appIDCtrl.value};action=display`);
  }

  _switch2EditMode(): void {
    this.readonly = false;
    this._setCheckBoxState();

    const appIDCtrl = this.mainForm.get('APP_ID') as FormControl;
    if (this.isNewMode) {
      appIDCtrl.setAsyncValidators(
        existingAppValidator(this.identityService, this.messageService));
    }

    // Replace the URL from to display
    if (this.action === 'display') {this.action = 'change'; }
    window.history.replaceState({}, '', `/apps/${appIDCtrl.value};action=` + this.action);
  }

  _createNewEntity(): Observable<Entity> {
    const appDetail = new Entity();
    appDetail.ENTITY_ID = 'app';
    appDetail['app'] = [
      { APP_ID: '', NAME: '', ROUTE_LINK: '', IS_EXTERNAL: '', CREATED_BY: '', CREATE_TIME: '', CHANGED_BY: '', CHANGE_TIME: '' }
    ];
    appDetail['relationships'] = [];
    return of(appDetail);
  }

  _generateMainForm(data: Entity): void {
    this.mainForm = this.fb.group({
      APP_ID: [data['app'][0]['APP_ID'], [Validators.required]],
      NAME: [data['app'][0]['NAME']],
      target: this.fb.group({
        ROUTE_LINK: [data['app'][0]['ROUTE_LINK']],
        IS_EXTERNAL: [data['app'][0]['IS_EXTERNAL']]
      }),
      admin: this.fb.group({
        CREATED_BY: [data['app'][0]['CREATED_BY']],
        CREATE_TIME: [data['app'][0]['CREATE_TIME']],
        CHANGED_BY: [data['app'][0]['CHANGED_BY']],
        CHANGE_TIME: [data['app'][0]['CHANGE_TIME']]
      })
    });
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.mainForm.addControl('appCategories',
      this.fb.array(parsedRelationship.appCategories.map( appCategory => this.fb.group( appCategory))));
    this.mainForm.addControl('appAuthObjects',
      this.fb.array(parsedRelationship.appAuthObjects.map( appAuthObject => this.fb.group( appAuthObject))));
    this.originalValue = this.mainForm.getRawValue();
  }

  _parseRelationships( relationships: Relationship[] ): any {
    const parsedRelationship = {
      appCategories: [],
      appAuthObjects: []
    };
    if (!relationships) { return parsedRelationship; }
    relationships.forEach( relationship => {
      switch (relationship.RELATIONSHIP_ID) {
        case 'rs_app_category':
          __parseAppCategory(relationship);
          break;
        case 'rs_app_auth':
          parsedRelationship.appAuthObjects = this.identityService.parseProfileAuthObject(relationship);
          break;
        default:
        // Do nothing.
      }
    });
    return parsedRelationship;

    function __parseAppCategory( relationship: Relationship): void {
      relationship.values.forEach( value => {
        parsedRelationship.appCategories.push({
          RELATIONSHIP_INSTANCE_GUID: value['RELATIONSHIP_INSTANCE_GUID'],
          ORDER: value['ORDER'],
          app_category_INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
          ID: value['PARTNER_INSTANCES'][0]['r_app_category'][0]['ID'],
          NAME: value['PARTNER_INSTANCES'][0]['r_app_category'][0]['NAME'],
          ICON: value['PARTNER_INSTANCES'][0]['r_app_category'][0]['ICON']
        });
      });
    }

    function __parseAppAuthObject( relationship: Relationship): void {
      relationship.values.forEach( value => {
        const authorization = value['AUTH_VALUE'] ?
          <Authorization>JSON.parse(value['AUTH_VALUE']) : null;
        const status = authorization ?
          Object.values(authorization.AuthFieldValue).findIndex( authValue => !authValue ) !== -1 ?
            'yellow' : 'green' : 'red';
        parsedRelationship.appAuthObjects.push({
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
        authObjectFields.values.forEach( value2 => {
          const authFieldName = value2['PARTNER_INSTANCES'][0]['authField'][0]['FIELD_NAME'];
          parsedRelationship.appAuthObjects.push({
            CHECKED: '',
            COLLAPSED: false,
            NODE_ID: value['RELATIONSHIP_INSTANCE_GUID'],
            STATUS: authorization.AuthFieldValue[authFieldName] ?
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
      APP_ID: data['app'][0]['APP_ID'],
      NAME: data['app'][0]['NAME'],
      target: {
        ROUTE_LINK: data['app'][0]['ROUTE_LINK'],
        IS_EXTERNAL: data['app'][0]['IS_EXTERNAL']
      },
      admin: {
        CREATED_BY: data['app'][0]['CREATED_BY'],
        CREATE_TIME: data['app'][0]['CREATE_TIME'],
        CHANGED_BY: data['app'][0]['CHANGED_BY'],
        CHANGE_TIME: data['app'][0]['CHANGE_TIME']
      }
    };
    const parsedRelationship = this._parseRelationships( data['relationships'] );
    this.originalValue['appCategories'] = parsedRelationship.appCategories;
    this.originalValue['appAuthObjects'] = parsedRelationship.appAuthObjects;
    this.mainForm.reset(this.originalValue);
  }

  _setCheckBoxState() {
    if (this.readonly) {
      this.mainForm.get('target.IS_EXTERNAL').disable();
    } else {
      this.mainForm.get('target.IS_EXTERNAL').enable();
    }
  }

  save() {
    this.messageService.clearMessages();
    if (this._composeChanges()) {
      this.identityService.save(<Entity>this.changedValue).subscribe( data => {
        this.changedValue = {};
        if ('INSTANCE_GUID' in data) {
          const appID = data['app'][0]['APP_ID'];
          this.instanceGUID = data['INSTANCE_GUID'];
          this.isNewMode = false;
          this.identityService.getAppDetail(appID).subscribe(instance => {
            if ('ENTITY_ID' in instance) {
              this._switch2DisplayMode();
              this._resetValue(<Entity>instance);
            } else {
              const errorMessages = <Message[]>instance;
              errorMessages.forEach( msg => this.messageService.add(msg));
            }
          });
          this.messageService.reportMessage('APP', 'SAVED', 'S', appID);
        } else {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
        }
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

    this.changedValue['ENTITY_ID'] = 'app';
    this.changedValue['INSTANCE_GUID'] = this.instanceGUID;

    if (this.isNewMode) {
      this.changedValue['app'] = {
        action: 'add', APP_ID: this.mainForm.get('APP_ID').value,
        CREATED_BY: this.identityService.Session.USER_ID, CREATE_TIME: this.identityService.CurrentTime,
        CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
    } else {
      this.changedValue['app'] = {
        action: 'update', CHANGED_BY: this.identityService.Session.USER_ID, CHANGE_TIME: this.identityService.CurrentTime};
    }

    if (this.mainForm.get('NAME').dirty) {
      this.changedValue['app']['NAME'] = this.mainForm.get('NAME').value;
    }
    if (this.mainForm.get('target.ROUTE_LINK').dirty) {
      this.changedValue['app']['ROUTE_LINK'] = this.mainForm.get('target.ROUTE_LINK').value;
    }
    if (this.mainForm.get('target.IS_EXTERNAL').dirty) {
      this.changedValue['app']['IS_EXTERNAL'] = this.mainForm.get('target.IS_EXTERNAL').value;
    }

    const appAuthObjFormArray = this.mainForm.get('appAuthObjects') as FormArray;
    const relationship = this.identityService.composeAuthChanges(appAuthObjFormArray,
      this.originalValue['appAuthObjects'], 'rs_app_auth');
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
