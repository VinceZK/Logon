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

  constructor(private fb: FormBuilder,
              private entityService: EntityService,
              private attributeControlService: AttributeControlService) { }

  ngOnInit() {
  }

  ngOnChanges(): void {
    if (!this.authFieldValueForm) { return; }
    if (this.singleValueArray) { this.singleValueArray.clear(); }
    if (this.selectOptionArray) { this.selectOptionArray.clear(); }
    this.attrCtrl = null;
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
    if (!authValues) {
        this.singleValueArray = this.fb.array([this.fb.group({Low: ''})]);
        this.selectOptionArray = this.fb.array([this.fb.group({
          Operator: [{value: Operator.Between, disabled: this.readonly}],
          Option: [{value: Option.Include, disabled: this.readonly}], Low: '', High: ''})]);
    } else {
      const authValueArray = JSON.parse(authValues);
      if (authValueArray === '*') {
        this.singleValueArray = this.fb.array([this.fb.group({Low: '*'})]);
        this.selectOptionArray = this.fb.array([this.fb.group({
          Operator: [{value: Operator.Between, disabled: this.readonly}],
          Option: [{value: Option.Include, disabled: this.readonly}], Low: '', High: ''})]);
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
        this.singleValueArray = singleValues.length > 0 ? this.fb.array(singleValues) :
          this.fb.array([this.fb.group({Low: ''})]);
        this.selectOptionArray = selectOptions.length > 0 ?  this.fb.array(selectOptions) :
          this.fb.array([this.fb.group({
            Operator: [{value: Operator.Between, disabled: this.readonly}],
            Option: [{value: Option.Include, disabled: this.readonly}], Low: '', High: ''})]);
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
    this.authFieldValueForm.get('DEFAULT_AUTH_VALUE').setValue(JSON.stringify(authValues, null, ' '));
    this.authFieldValueForm.get('DEFAULT_AUTH_VALUE').markAsDirty();
  }
}
