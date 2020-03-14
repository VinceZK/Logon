import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {IdentityService} from '../../../identity.service';
import {SearchHelpComponent} from 'jor-angular';

@Component({
  selector: 'app-auth-object-field',
  templateUrl: './auth-object-field.component.html',
  styleUrls: ['./auth-object-field.component.css']
})
export class AuthObjectFieldComponent implements OnInit {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  authFieldFormArray: FormArray;

  constructor(private fb: FormBuilder,
              private identityService: IdentityService) { }

  @ViewChild(SearchHelpComponent, { static: true })
  private searchHelpComponent: SearchHelpComponent;

  ngOnInit() {
    this.authFieldFormArray = this.mainForm.get('authFields') as FormArray;
    // Recheck each role since every time the template is initialized, Angular clears the error status.
    if (!this.readonly) {
      this.authFieldFormArray.controls.forEach( (ctrl, index) => {
        this.onChangeKey(index);
      });
    }
  }

  delete(index: number): void {
    if (index !== this.authFieldFormArray.length - 1) {
      this.authFieldFormArray.removeAt(index);
      this.authFieldFormArray.markAsDirty();
    }
  }

  onChangeKey(index: number): void {
    const currentFormGroup = this.authFieldFormArray.at(index);
    if (this.isExisting(currentFormGroup)) {
      currentFormGroup.get('FIELD_NAME').setErrors({message: 'Duplicate Authorization Field'});
      return;
    }

    if (index === this.authFieldFormArray.length - 1 && currentFormGroup.value.FIELD_NAME.trim() !== '') {
      // Only work if the last line is not new and empty
      this.authFieldFormArray.push(
        this.fb.group({
          FIELD_NAME: [''],
          DATA_ELEMENT: [''],
          auth_field_INSTANCE_GUID: [''],
          RELATIONSHIP_INSTANCE_GUID: ['']
        })
      );
    }

    if (currentFormGroup.value.FIELD_NAME) {
      this.identityService.getAuthFieldInfo(currentFormGroup.value.FIELD_NAME).subscribe(data => {
        if (data['msgCat']) {
          currentFormGroup.get('FIELD_NAME').setErrors({message: data['msgShortText']});
        } else {
          currentFormGroup.get('DATA_ELEMENT').setValue(data['DATA_ELEMENT']);
          currentFormGroup.get('auth_field_INSTANCE_GUID').setValue(data['INSTANCE_GUID']);
        }
      });
    }
  }

  isExisting(authFieldForm: AbstractControl): boolean {
    const existIndex = this.authFieldFormArray.controls.findIndex(
      authField => authField.value.FIELD_NAME === authFieldForm.value.FIELD_NAME
        && authField.pristine && authField.value.FIELD_NAME !== '');
    return existIndex !== -1 ;
  }

  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    const afterExportFn = function (context: any, rowIDx: number) {
      return () => context.onChangeAuthField(rowIDx);
    }(this, rowID).bind(this);

    this.searchHelpComponent.openSearchHelpModalByEntity('authField', 'authField',
      exportObject, this.readonly, null, null, afterExportFn);
  }

}
