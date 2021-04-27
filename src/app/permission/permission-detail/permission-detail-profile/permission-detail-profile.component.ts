import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {AbstractControl, Form, FormArray, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-permission-detail-profile',
  templateUrl: './permission-detail-profile.component.html',
  styleUrls: ['./permission-detail-profile.component.css']
})
export class PermissionDetailProfileComponent implements OnInit, OnChanges {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  profileFormArray: FormArray;
  currentProfileFormGroup: FormGroup;

  constructor() { }

  ngOnChanges(): void {
    this.profileFormArray = <FormArray>this.mainForm.get('categories');
    this.onSelect(this.profileFormArray.at(0));
  }

  ngOnInit(): void {
  }

  onSelect(ctrl: AbstractControl): void {
    this.currentProfileFormGroup = <FormGroup>ctrl;
  }
}
