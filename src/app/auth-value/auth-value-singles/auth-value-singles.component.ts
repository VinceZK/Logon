import {Component, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder} from '@angular/forms';
import {AttributeBase} from 'jor-angular';

@Component({
  selector: 'app-auth-value-singles',
  templateUrl: './auth-value-singles.component.html',
  styleUrls: ['./auth-value-singles.component.css']
})
export class AuthValueSinglesComponent implements OnInit {
  @Input() singleValueArray: FormArray;
  @Input() attrCtrl: AttributeBase;
  @Input() readonly;
  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
  }

  insertValue(idx: number): void {
    this.singleValueArray.insert(idx, this.fb.group({
      Low: ['']
    }));
  }

  deleteValue(idx: number): void {
    if (this.singleValueArray.length === 1 ) {
      this.singleValueArray.at(idx).get('Low').setValue('');
    } else {
      this.singleValueArray.removeAt(idx);
    }
    this.singleValueArray.markAsDirty();
  }
}
