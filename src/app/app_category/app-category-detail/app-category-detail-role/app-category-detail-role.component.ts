import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {IdentityService} from '../../../identity.service';
import {SearchHelpComponent} from 'jor-angular';

@Component({
  selector: 'app-app-category-detail-role',
  templateUrl: './app-category-detail-role.component.html',
  styleUrls: ['./app-category-detail-role.component.css']
})
export class AppCategoryDetailRoleComponent implements OnInit {
  @Input() mainForm: FormGroup;
  roleFormArray: FormArray;

  constructor(private fb: FormBuilder,
              private identityService: IdentityService) { }

  @ViewChild(SearchHelpComponent, { static: true })
  private searchHelpComponent: SearchHelpComponent;

  ngOnInit() {
    this.roleFormArray = this.mainForm.get('roles') as FormArray;
  }

  onSearchHelp(rowID: number, exportObject: AbstractControl): void {
    this.searchHelpComponent.openSearchHelpModalBySearchHelp('ROLE', 'NAME',
      'NAME', exportObject, true, null);
  }
}
