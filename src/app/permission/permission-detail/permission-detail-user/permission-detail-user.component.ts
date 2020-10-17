import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {SearchHelpComponent} from 'jor-angular';

@Component({
  selector: 'app-permission-detail-user',
  templateUrl: './permission-detail-user.component.html',
  styleUrls: ['./permission-detail-user.component.css']
})
export class PermissionDetailUserComponent implements OnInit {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  userFormArray: FormArray;

  constructor() { }

  @ViewChild(SearchHelpComponent, { static: true })
  private searchHelpComponent: SearchHelpComponent;

  ngOnInit() {
    this.userFormArray = this.mainForm.get('users') as FormArray;
  }

  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    const afterExportFn = function (context: any, rowIDx: number) {
      return () => context.onChangeKey(rowIDx);
    }(this, rowID).bind(this);

    this.searchHelpComponent.openSearchHelpModalBySearchHelp('USER', 'USER_ID',
      'USER_ID', exportObject, this.readonly, afterExportFn);
  }
}
