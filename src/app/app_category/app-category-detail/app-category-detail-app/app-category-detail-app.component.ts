import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {IdentityService} from '../../../identity.service';
import {SearchHelpComponent} from 'jor-angular';

@Component({
  selector: 'app-app-category-detail-app',
  templateUrl: './app-category-detail-app.component.html',
  styleUrls: ['./app-category-detail-app.component.css']
})
export class AppCategoryDetailAppComponent implements OnInit {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  appFormArray: FormArray;

  constructor(private fb: FormBuilder,
              private identityService: IdentityService) { }

  @ViewChild(SearchHelpComponent, { static: true })
  private searchHelpComponent: SearchHelpComponent;

  ngOnInit() {
    this.appFormArray = this.mainForm.get('apps') as FormArray;
    // Recheck each role since every time the template is initialized, Angular clears the error status.
    if (!this.readonly) {
      this.appFormArray.controls.forEach( (ctrl, index) => {
        this.onChangeKey(index);
      });
    }
  }

  delete(index: number): void {
    if (index !== this.appFormArray.length - 1) {
      this.appFormArray.removeAt(index);
      this.appFormArray.markAsDirty();
    }
  }

  onChangeKey(index: number): void {
    const currentFormGroup = this.appFormArray.at(index);
    if (this.isExisting(currentFormGroup)) {
      currentFormGroup.get('APP_ID').setErrors({message: 'Duplicate Apps'});
      return;
    }

    if (index === this.appFormArray.length - 1 && currentFormGroup.value.APP_ID.trim() !== '') {
      // Only work if the last line is not new and empty
      this.appFormArray.push(
        this.fb.group({
          APP_ID: [''],
          NAME: [''],
          ORDER: [0],
          portal_app_INSTANCE_GUID: [''],
          RELATIONSHIP_INSTANCE_GUID: ['']
        })
      );
    }

    if (currentFormGroup.value.APP_ID) {
      this.identityService.getAppByID(currentFormGroup.value.APP_ID).subscribe(data => {
        if (data[0] && data[0]['msgCat']) {
          currentFormGroup.get('APP_ID').setErrors({message: data[0]['msgShortText']});
        } else {
          currentFormGroup.get('NAME').setValue(data['app'][0]['NAME']);
          currentFormGroup.get('portal_app_INSTANCE_GUID').setValue(data['INSTANCE_GUID']);
        }
      });
    }
  }

  isExisting(appForm: AbstractControl): boolean {
    const existIndex = this.appFormArray.controls.findIndex(
      app => app.value.APP_ID === appForm.value.APP_ID
        && app.get('APP_ID').pristine && app.value.APP_ID !== '');
    return existIndex !== -1 ;
  }

  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    const afterExportFn = function (context: any, rowIDx: number) {
      return () => context.onChangeKey(rowIDx);
    }(this, rowID).bind(this);

    this.searchHelpComponent.openSearchHelpModalByEntity('app', 'app',
      exportObject, this.readonly, 'APP_ID', null, afterExportFn);
  }
}
