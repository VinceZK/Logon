import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
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

  constructor() { }

  @ViewChild(SearchHelpComponent, { static: true })
  private searchHelpComponent: SearchHelpComponent;

  ngOnInit() {
    this.appCategoryFormArray = this.mainForm.get('appCategories') as FormArray;
  }

  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    const afterExportFn = function (context: any, rowIDx: number) {
      return () => context.onChangeKey(rowIDx);
    }(this, rowID).bind(this);

    this.searchHelpComponent.openSearchHelpModalByEntity('category', 'r_app_category',
      exportObject, true, null, null, afterExportFn);
  }
}
