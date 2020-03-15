import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder} from '@angular/forms';
import {AttributeBase} from 'jor-angular';
import {Operator, Option} from '../../permssion';

@Component({
  selector: 'app-auth-value-selopts',
  templateUrl: './auth-value-selopts.component.html',
  styleUrls: ['./auth-value-selopts.component.css']
})
export class AuthValueSeloptsComponent implements OnInit {
  @Input() selectOptionArray: FormArray;
  @Input() attrCtrl: AttributeBase;
  @Input() highAttrCtrl: AttributeBase;
  @Input() readonly;
  operatorEnum;
  optionEnum;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.operatorEnum = Object.values(Operator);
    this.optionEnum = Object.values(Option);
  }

  onChangeOperator(idx: number): void {
    const selectOptionCtrl = this.selectOptionArray.at(idx);
    if ( selectOptionCtrl.get('Operator').value === Operator.Between ) {
      selectOptionCtrl.get('High').enable();
    } else {
      selectOptionCtrl.get('High').setValue('');
      selectOptionCtrl.get('High').disable();
    }
  }

  insertValue(idx: number): void {
    this.selectOptionArray.insert(idx, this.fb.group({
      Operator: Operator.Between,
      Option: Option.Include,
      Low: '',
      High: ''
    }));
  }

  deleteValue(idx: number): void {
    if (this.selectOptionArray.length === 1) {
      this.selectOptionArray.at(idx).get('Low').setValue('');
      this.selectOptionArray.at(idx).get('High').setValue('');
    } else {
      this.selectOptionArray.removeAt(idx);
    }
    this.selectOptionArray.markAsDirty();
  }
}
