import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {IdentityService} from '../../../identity.service';
import {SearchHelpComponent} from 'jor-angular';

@Component({
  selector: 'app-app-categories',
  templateUrl: './app-categories.component.html',
  styleUrls: ['./app-categories.component.css']
})
export class AppCategoriesComponent implements OnInit {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  appCategoryFormArray: FormArray;

  constructor(private fb: FormBuilder,
              private identityService: IdentityService) { }

  @ViewChild(SearchHelpComponent, { static: true })
  private searchHelpComponent: SearchHelpComponent;

  ngOnInit() {
    this.appCategoryFormArray = this.mainForm.get('appCategories') as FormArray;
    // Recheck each role since every time the template is initialized, Angular clears the error status.
    if (!this.readonly) {
      this.appCategoryFormArray.controls.forEach( (ctrl, index) => {
        this.onChangeKey(index);
      });
    }
  }

  delete(index: number): void {
    if (index !== this.appCategoryFormArray.length - 1) {
      this.appCategoryFormArray.removeAt(index);
      this.appCategoryFormArray.markAsDirty();
    }
  }

  onChangeKey(index: number): void {
    const currentFormGroup = this.appCategoryFormArray.at(index);
    if (this.isExisting(currentFormGroup)) {
      currentFormGroup.get('ID').setErrors({message: 'Duplicate Category'});
      return;
    }

    if (index === this.appCategoryFormArray.length - 1 && currentFormGroup.value.ID.trim() !== '') {
      // Only work if the last line is not new and empty
      this.appCategoryFormArray.push(
        this.fb.group({
          ID: [''],
          NAME: [''],
          ICON: [''],
          app_category_INSTANCE_GUID: [''],
          RELATIONSHIP_INSTANCE_GUID: ['']
        })
      );
    }

    if (currentFormGroup.value.ID) {
      this.identityService.getCategoryName(currentFormGroup.value.ID).subscribe(data => {
        if (data['msgCat']) {
          currentFormGroup.get('ID').setErrors({message: data['msgShortText']});
        } else {
          currentFormGroup.get('NAME').setValue(data['NAME']);
          currentFormGroup.get('ICON').setValue(data['ICON']);
          currentFormGroup.get('app_category_INSTANCE_GUID').setValue(data['INSTANCE_GUID']);
        }
      });
    }
  }

  isExisting(appCategoryForm: AbstractControl): boolean {
    const existIndex = this.appCategoryFormArray.controls.findIndex(
      category => category.value.ID === appCategoryForm.value.ID && category.pristine && category.value.ID !== '');
    return existIndex !== -1 ;
  }

  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    const afterExportFn = function (context: any, rowIDx: number) {
      return () => context.onChangeCategory(rowIDx);
    }(this, rowID).bind(this);

    this.searchHelpComponent.openSearchHelpModalByEntity('category', 'r_app_category',
      exportObject, this.readonly, null, null, afterExportFn);
  }


}
