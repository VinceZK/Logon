import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {Operator, Option, SelectOption} from '../permssion';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {Attribute, AttributeBase, AttributeControlService, EntityService} from 'jor-angular';

@Component({
  selector: 'app-auth-value',
  templateUrl: './auth-value.component.html',
  styleUrls: ['./auth-value.component.css']
})
export class AuthValueComponent implements OnInit, OnChanges {
  @Input() authFieldValueForm: FormGroup;
  @Input() readonly: boolean;
  tabStrip = 1;
  fieldName: string;
  singleValueArray: FormArray;
  selectOptionArray: FormArray;
  attrCtrl: AttributeBase;
  highAttrCtrl: AttributeBase;
  fullPermission: boolean;

  constructor(private fb: FormBuilder,
              private entityService: EntityService,
              private attributeControlService: AttributeControlService) { }

  ngOnInit() {
  }

  ngOnChanges(): void {
    if (!this.authFieldValueForm) { return; }
    if (this.singleValueArray) { this.singleValueArray.clear(); }
    if (this.selectOptionArray) { this.selectOptionArray.clear(); }
    this.fullPermission = false;
    this.attrCtrl = null;
    this.tabStrip = 1;
    const authValues = this.authFieldValueForm.get('DEFAULT_AUTH_VALUE').value;
    this.entityService.getElementMeta(this.authFieldValueForm.get('DATA_ELEMENT').value)
      .subscribe( attrCtrl => {
        const attribute = <Attribute>attrCtrl;
        attribute.ATTR_GUID = attrCtrl.ELEMENT_ID;
        attribute.ATTR_NAME = attrCtrl.ELEMENT_ID;
        attribute.DATA_ELEMENT = attrCtrl.ELEMENT_ID;
        this.attrCtrl = this.attributeControlService.toSingleAttributeControl(attribute);
        this.attrCtrl.name = 'Low';
        this.highAttrCtrl = this.attributeControlService.toSingleAttributeControl(attribute);
        this.highAttrCtrl.name = 'High';
      } );

    this.fieldName = this.authFieldValueForm.get('FIELD_NAME').value;
    if (!authValues || !JSON.parse(authValues)) {
        this.singleValueArray = this.fb.array([this.fb.group({Low: ''})]);
        this.selectOptionArray = this.fb.array([this.fb.group({
          Operator: [{value: Operator.Between, disabled: this.readonly}],
          Option: [{value: Option.Include, disabled: this.readonly}], Low: '', High: ''})]);
    } else {
      const authValueArray = JSON.parse(authValues);
      if (authValueArray === '*') {
        this._setFullPermission(true);
      } else {
        const singleValues = [];
        const selectOptions = [];
        authValueArray.forEach(authValue => {
          if (typeof authValue === 'string') {
            singleValues.push(this.fb.group({Low: authValue}));
          } else {
            selectOptions.push(this.fb.group({
              Operator: [{value: authValue['Operator'], disabled: this.readonly}],
              Option: [{value: authValue['Option'], disabled: this.readonly}],
              Low: authValue['Low'],
              High: authValue['High']
            }));
          }
        });
        if (singleValues.length > 0 ) {
          this.singleValueArray = this.fb.array(singleValues);
          this.tabStrip = 1;
        } else {
          this.singleValueArray = this.fb.array([this.fb.group({Low: ''})]);
          this.tabStrip = 2;
        }

        if (selectOptions.length > 0) {
          this.selectOptionArray = this.fb.array(selectOptions)
        } else {
          this.selectOptionArray = this.fb.array([this.fb.group({
            Operator: [{value: Operator.Between, disabled: this.readonly}],
            Option: [{value: Option.Include, disabled: this.readonly}], Low: '', High: ''})]);
          this.tabStrip = 1;
        }
      }
    }
  }

  switchTabStrip(tabStripID: number): void {
    this.tabStrip = tabStripID;
  }

  generateAuthValue(): void {
    if (!this.singleValueArray.dirty && !this.selectOptionArray.dirty) { return; }
    const authValues = [];
    if (this.singleValueArray.dirty) {
      this.singleValueArray.controls.forEach( singleValueCtrl => {
        const singleValue = singleValueCtrl.get('Low').value;
        if (singleValue && authValues.findIndex( value => value === singleValue) === -1) {
          authValues.push(singleValue);
        }
      });
    }
    if (this.selectOptionArray.dirty) {
      this.selectOptionArray.controls.forEach( selectOptionCtrl => {
        const selectOption = <SelectOption>selectOptionCtrl.value;
        if (selectOption.Low) {
          if (selectOption.Operator === Operator.Between &&
            selectOption.Low >= selectOption.High) {
            selectOptionCtrl.get('Low').setErrors({message: 'Low value is larger or equal to high value'});
          } else {
            authValues.push(selectOption);
          }
        }
      });
    }
    if (authValues.length === 0) {
      this.authFieldValueForm.get('DEFAULT_AUTH_VALUE').setValue('');
      this.authFieldValueForm.get('STATUS').setValue('red');
    } else {
      this.authFieldValueForm.get('DEFAULT_AUTH_VALUE').setValue(JSON.stringify(authValues, null, ' '));
      this.authFieldValueForm.get('STATUS').setValue('green');
    }
    this.authFieldValueForm.get('DEFAULT_AUTH_VALUE').markAsDirty();
  }

  checkFullPermission(): void {
    this._setFullPermission(!this.fullPermission);
  }

  _setFullPermission(isFull: boolean): void {
    this.fullPermission = isFull;
    this.authFieldValueForm.get('STATUS').setValue(isFull ? 'green' : 'red');
    this.authFieldValueForm.get('DEFAULT_AUTH_VALUE').setValue(isFull ? '"*"' : '');
    if (isFull) {
      this.singleValueArray = this.fb.array([]);
      this.selectOptionArray = this.fb.array([]);
    } else {
      this.singleValueArray = this.fb.array([this.fb.group({Low: ''})]);
      this.selectOptionArray = this.fb.array([this.fb.group({
        Operator: Operator.Between, Option: Option.Include,
        Low: '', High: ''})]);
    }
  }
}
