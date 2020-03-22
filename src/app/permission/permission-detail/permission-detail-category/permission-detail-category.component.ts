import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {IdentityService} from '../../../identity.service';
import {Attribute, AttributeBase, AttributeControlService, EntityService, SearchHelpComponent} from 'jor-angular';
import {Message, MessageService} from 'ui-message-angular';
import {AuthValueComponent} from '../../../authorization/auth-value/auth-value.component';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-permission-detail-category',
  templateUrl: './permission-detail-category.component.html',
  styleUrls: ['./permission-detail-category.component.css']
})
export class PermissionDetailCategoryComponent implements OnInit {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  categoryFormArray: FormArray;
  newCategoryForm: FormGroup;
  isCategoryModalShown = false;
  selectAll = false;
  categoryAttr: AttributeBase;

  get displayCategoryModal() {return this.isCategoryModalShown ? 'block' : 'none'; }

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
    this.categoryFormArray = <FormArray>this.mainForm.get('categories');
    this.categoryFormArray.controls.forEach( ctrl => {
      if ( ctrl.get('ROW_TYPE').value === 'app') { ctrl.get('CHECKED').disable(); }
    });
  }

  checkAll(): void {
    this.categoryFormArray.controls.forEach( appCategoryCtrl => appCategoryCtrl.get('CHECKED').setValue(!this.selectAll));
    this.selectAll = !this.selectAll;
  }

  checkCategory(idx: number): void {
    const currentCategoryCtrl = this.categoryFormArray.at(idx);
    this.categoryFormArray.controls.forEach( (categoryCtrl, index) => {
      if (index <= idx) { return; }
      if (categoryCtrl.get('category.ID').value === currentCategoryCtrl.get('category.ID').value) {
        categoryCtrl.get('CHECKED').setValue(!currentCategoryCtrl.get('CHECKED').value);
      }
    });
  }

  add(): void {
    this.newCategoryForm = this.fb.group({
      CHECKED: '',
      COLLAPSED: false,
      ROW_TYPE: 'category',
      RELATIONSHIP_INSTANCE_GUID: '',
      app_category_INSTANCE_GUID: '',
      auth_profile_INSTANCE_GUID: '',
      ORDER: '',
      category: this.fb.group({
        ID: '',
        NAME: '',
        ICON: ''
      })
    });
    if (!this.categoryAttr) {
      this.entityService.getElementMeta('CATEGORY_ID')
        .subscribe(elementMeta => {
          const attribute = <Attribute>elementMeta;
          attribute.ATTR_GUID = elementMeta.ELEMENT_ID;
          attribute.ATTR_NAME = elementMeta.ELEMENT_ID;
          attribute.DATA_ELEMENT = elementMeta.ELEMENT_ID;
          this.categoryAttr = this.attributeControlService.toSingleAttributeControl(attribute);
          this.categoryAttr.name = 'ID';
        });
    }
    this.isCategoryModalShown = true;
  }

  closeCategoryModal(): void {
    this.isCategoryModalShown = false;
  }

  confirm(): void {
    const categoryID = this.newCategoryForm.get('category.ID').value;
    this.identityService.getAppCategoryDetail(categoryID)
      .subscribe( data => {
        if ('ENTITY_ID' in data) {
          this.newCategoryForm.get('app_category_INSTANCE_GUID').setValue(data['INSTANCE_GUID']);
          this.newCategoryForm.get('category.ID').setValue(data['r_app_category'][0]['ID']);
          this.newCategoryForm.get('category.NAME').setValue(data['r_app_category'][0]['NAME']);
          this.newCategoryForm.get('category.ICON').setValue(data['r_app_category'][0]['ICON']);
          this.newCategoryForm.markAsDirty();
          this.categoryFormArray.push(this.newCategoryForm);
          const appRelationship = data['relationships'].find(relationship => relationship.RELATIONSHIP_ID === 'rs_app_category');
          const appGUIDs = [];
          appRelationship.values.forEach( value => {
            this.categoryFormArray.push(this.fb.group({
              CHECKED: [{value: '', disabled: true}],
              COLLAPSED: false,
              ROW_TYPE: 'app',
              RELATIONSHIP_INSTANCE_GUID: '',
              app_category_INSTANCE_GUID: '',
              auth_profile_INSTANCE_GUID: '',
              ORDER: value['ORDER'],
              category: this.fb.group({
                ID: data['r_app_category'][0]['ID'],
                NAME: value['PARTNER_INSTANCES'][0]['app'][0]['NAME'],
                ICON: data['r_app_category'][0]['ICON']
              }),
              app: this.fb.group({
                APP_ID: value['PARTNER_INSTANCES'][0]['app'][0]['APP_ID'],
                NAME: value['PARTNER_INSTANCES'][0]['app'][0]['NAME']
              })
            }));
            appGUIDs.push(value['PARTNER_INSTANCES'][0]['INSTANCE_GUID']);
          });
          this._generateProfile(appGUIDs);
        } else {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
          this.newCategoryForm.setErrors({message: 'Category contains errors'});
        }
        this.isCategoryModalShown = false;
      });
  }

  _generateProfile(appGUIDs: Array<string>): void {
    const profileCtrl = this.fb.group({
      PROFILE_NAME: uuid().toUpperCase().replace(/-/g, ''),
      DESC: this.mainForm.get('NAME').value + ` / ` + this.newCategoryForm.get('category.ID').value,
      CHANGE_TIME: 'just now'
    });
    this.newCategoryForm.addControl('profile', profileCtrl);
    const operations = appGUIDs.map( appGUID => {
      return {
        action: 'getInstancePieceByGUID',
        instance: {INSTANCE_GUID: appGUID,
          RELATIONSHIPS: [{ RELATIONSHIP_ID: 'rs_app_auth',
            PARTNER_ENTITY_PIECES: {
              RELATIONS: ['authObject'],
              RELATIONSHIPS: [{RELATIONSHIP_ID: 'rs_auth_object_field',
                PARTNER_ENTITY_PIECES: {RELATIONS: ['authField']}}]}}]}
      };
    });
    this.identityService.orchestrate(operations).subscribe( data => {
      let authorizations = [];
      data.forEach( operation => {
        if (operation.errs) {
          const errorMessages = <Message[]>data;
          errorMessages.forEach( msg => this.messageService.add(msg));
          profileCtrl.setErrors({message: 'Profile contains errors'});
        } else {
          const rsAuthorization = operation.result.instance.relationships[0];
          if (rsAuthorization) {
            rsAuthorization.values.forEach( value => value.RELATIONSHIP_INSTANCE_GUID = '');
            authorizations = authorizations.concat(
              this.identityService.parseProfileAuthObject(rsAuthorization));
          }
        }
      });
      if (!profileCtrl.hasError('message')) {
        const authFormArray = this.fb.array(authorizations.map(authorization => this.fb.group(authorization)));
        authFormArray.controls.forEach( ctrl => ctrl.markAsDirty());
        profileCtrl.addControl('authorizations', authFormArray);
      }
    });
  }

  delete(): void {
    let index = this.categoryFormArray.controls.findIndex( appCategoryCtrl => appCategoryCtrl.get('CHECKED').value);
    while ( index !== -1) {
      this.categoryFormArray.removeAt(index);
      this.categoryFormArray.markAsDirty();
      index = this.categoryFormArray.controls.findIndex( appCategoryCtrl => appCategoryCtrl.get('CHECKED').value);
    }
  }

  enterConfirm($event): void {
    if ($event.keyCode === 13 ) {
      this.confirm();
    }
  }
  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    const afterExportFn = function (context: any, rowIDx: number) {
      return () => context.onChangeCategory(rowIDx);
    }(this, rowID).bind(this);

    this.searchHelpComponent.openSearchHelpModalByEntity('category', 'r_app_category',
      exportObject, this.readonly, null, null, afterExportFn);
  }

  expendCollapse(idx: number): void {
    const currentCtrl = this.categoryFormArray.at(idx);
    const parentNode = currentCtrl.get('category.ID').value;
    this.categoryFormArray.controls.forEach( categoryCtrl => {
      if (categoryCtrl.get('category.ID').value === parentNode ) {
        categoryCtrl.get('COLLAPSED').setValue(!categoryCtrl.get('COLLAPSED').value);
      }
    });
  }
}
