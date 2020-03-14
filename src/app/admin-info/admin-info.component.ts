import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {AttributeBase, AttributeControlService, RelationMeta} from 'jor-angular';

@Component({
  selector: 'app-admin-info',
  templateUrl: './admin-info.component.html',
  styleUrls: ['./admin-info.component.css']
})
export class AdminInfoComponent implements OnInit {
  @Input() mainForm: FormGroup;
  @Input() relationMetas: RelationMeta[];
  @Input() adminRelation: string;
  private attrCtrls: AttributeBase[];
  adminForm: FormGroup;

  constructor(private attributeControlService: AttributeControlService) { }

  ngOnInit() {
    this.adminForm = this.mainForm.get('admin') as FormGroup;
    this.attrCtrls = this.attributeControlService.toAttributeControl(
      this.relationMetas.find( relationMeta => relationMeta.RELATION_ID === this.adminRelation).ATTRIBUTES);
  }

  getAttrCtrlFromID(fieldName: string): AttributeBase {
    return this.attrCtrls.find( attrCtrl => attrCtrl.name === fieldName);
  }

}
