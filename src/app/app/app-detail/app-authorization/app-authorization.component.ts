import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {Attribute, AttributeBase, AttributeControlService, Entity, EntityService, SearchHelpComponent} from 'jor-angular';
import {AuthValueComponent} from '../../../auth-value/auth-value.component';
import {IdentityService} from '../../../identity.service';
import {Message, MessageService} from 'ui-message-angular';

@Component({
  selector: 'app-app-authorization',
  templateUrl: './app-authorization.component.html',
  styleUrls: ['./app-authorization.component.css']
})
export class AppAuthorizationComponent implements OnInit {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  appAuthObjFormArray: FormArray;
  currentAuthFieldValueForm: FormGroup;
  newAuthFieldValueForm: FormGroup;
  isAuthValueModalShown = false;
  isAuthObjectModalShown = false;
  selectAll = false;
  nodeID = 0;
  authObjAttr: AttributeBase;
  get displayAuthValueModal() {return this.isAuthValueModalShown ? 'block' : 'none'; }
  get displayAuthObjectModal() {return this.isAuthObjectModalShown ? 'block' : 'none'; }

  constructor( private fb: FormBuilder,
               private identityService: IdentityService,
               private entityService: EntityService,
               private messageService: MessageService,
               private attributeControlService: AttributeControlService ) { }

  @ViewChild(SearchHelpComponent, { static: true })
  private searchHelpComponent: SearchHelpComponent;
  @ViewChild(AuthValueComponent, { static: true})
  private authValueComponent: AuthValueComponent;

  ngOnInit() {
    this.appAuthObjFormArray = this.mainForm.get('appAuthObjects') as FormArray;
    this.appAuthObjFormArray.controls.forEach( appAuthObjCtrl => {
      if ( appAuthObjCtrl.get('ROW_TYPE').value === 'FIELD' ) {
        appAuthObjCtrl.get('CHECKED').disable();
      }
    });
  }

  checkAll(): void {
    this.appAuthObjFormArray.controls.forEach( authObjCtrl => authObjCtrl.get('CHECKED').setValue(!this.selectAll));
    this.selectAll = !this.selectAll;
  }

  checkAuthObject(idx: number): void {
    const currentAuthObjCtrl = this.appAuthObjFormArray.at(idx);
    this.appAuthObjFormArray.controls.forEach( (authObjCtrl, index) => {
      if (index <= idx) { return; }
      if (authObjCtrl.get('OBJ_NAME').value === currentAuthObjCtrl.get('OBJ_NAME').value) {
        authObjCtrl.get('CHECKED').setValue(!currentAuthObjCtrl.get('CHECKED').value);
      }
    });
  }

  add(): void {
    this.newAuthFieldValueForm = this.fb.group({
      CHECKED: '',
      COLLAPSED: false,
      NODE_ID: ++this.nodeID,
      RELATIONSHIP_INSTANCE_GUID: '',
      auth_object_INSTANCE_GUID: '',
      DEFAULT_AUTH_VALUE: '',
      OBJ_NAME: 'BLOG',
      DESC: '',
      ROW_TYPE: 'OBJECT',
      FIELD_NAME: '',
      DATA_ELEMENT: ''
    });
    if (!this.authObjAttr) {
      this.entityService.getElementMeta('AUTH_OBJ_NAME')
        .subscribe(elementMeta => {
          const attribute = <Attribute>elementMeta;
          attribute.ATTR_GUID = elementMeta.ELEMENT_ID;
          attribute.ATTR_NAME = elementMeta.ELEMENT_ID;
          attribute.DATA_ELEMENT = elementMeta.ELEMENT_ID;
          this.authObjAttr = this.attributeControlService.toSingleAttributeControl(attribute);
          this.authObjAttr.name = 'OBJ_NAME';
        });
    }
    this.isAuthObjectModalShown = true;
  }

  closeAuthObjectModal(): void {
    this.isAuthObjectModalShown = false;
  }

  addAuthObject(): void {
    const authObjName = this.newAuthFieldValueForm.get('OBJ_NAME').value;
    this.identityService.getAuthObjectDetail(authObjName)
      .subscribe( data => {
        if ('ENTITY_ID' in data) {
          this.newAuthFieldValueForm.get('auth_object_INSTANCE_GUID').setValue(data['INSTANCE_GUID']);
          this.newAuthFieldValueForm.get('DESC').setValue(data['authObject'][0]['DESC']);
          this.appAuthObjFormArray.push(this.newAuthFieldValueForm);
          data['relationships'][0].values.forEach( value => {
            this.appAuthObjFormArray.push(this.fb.group({
              CHECKED: [{value: '', disabled: true}],
              COLLAPSED: false,
              NODE_ID: this.nodeID,
              RELATIONSHIP_INSTANCE_GUID: '',
              auth_object_INSTANCE_GUID: value['PARTNER_INSTANCES'][0]['INSTANCE_GUID'],
              DEFAULT_AUTH_VALUE: '',
              OBJ_NAME: authObjName,
              DESC: this.newAuthFieldValueForm.get('DESC').value,
              ROW_TYPE: 'FIELD',
              FIELD_NAME: value['PARTNER_INSTANCES'][0]['authField'][0]['FIELD_NAME'],
              DATA_ELEMENT: value['PARTNER_INSTANCES'][0]['authField'][0]['DATA_ELEMENT']
            }));
          });
        } else {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
        }
        this.isAuthObjectModalShown = false;
      });
  }

  delete(): void {
    let index = this.appAuthObjFormArray.controls.findIndex( authObjCtrl => authObjCtrl.get('CHECKED').value);
    while ( index !== -1) {
      this.appAuthObjFormArray.removeAt(index);
      this.appAuthObjFormArray.markAsDirty();
      index = this.appAuthObjFormArray.controls.findIndex( authObjCtrl => authObjCtrl.get('CHECKED').value);
    }
  }

  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    const afterExportFn = function (context: any, rowIDx: number) {
      return () => context.onChangeCategory(rowIDx);
    }(this, rowID).bind(this);

    this.searchHelpComponent.openSearchHelpModalByEntity('authObject', 'authObject',
      exportObject, this.readonly, null, null, afterExportFn);
  }

  expendCollapse(idx: number): void {
    const currentCtrl = this.appAuthObjFormArray.at(idx);
    const parentNode = currentCtrl.get('NODE_ID').value;
    this.appAuthObjFormArray.controls.forEach( appAuthObjCtrl => {
      if (appAuthObjCtrl.get('NODE_ID').value === parentNode ) {
        appAuthObjCtrl.get('COLLAPSED').setValue(!appAuthObjCtrl.get('COLLAPSED').value);
      }
    });
  }

  openAuthValueModal(idx: number): void {
    this.isAuthValueModalShown = true;
    this.currentAuthFieldValueForm = <FormGroup>this.appAuthObjFormArray.at(idx);
  }

  closeAuthValueModal(): void {
    this.isAuthValueModalShown = false;
  }

  addAuthValue(): void {
    this.authValueComponent.generateAuthValue();
    this.isAuthValueModalShown = false;
  }

}
