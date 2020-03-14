import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {AttributeBase, AttributeControlService, RelationMeta} from 'jor-angular';

@Component({
  selector: 'app-app-target',
  templateUrl: './app-target.component.html',
  styleUrls: ['./app-target.component.css']
})
export class AppTargetComponent implements OnInit {
  @Input() readonly: boolean;
  @Input() mainForm: FormGroup;
  @Input() relationMetas: RelationMeta[];
  private attrCtrls: AttributeBase[];
  appTargetForm: FormGroup;

  constructor(private attributeControlService: AttributeControlService) { }

  ngOnInit() {
    this.appTargetForm = this.mainForm.get('target') as FormGroup;
    this.attrCtrls = this.attributeControlService.toAttributeControl(
      this.relationMetas.find( relationMeta => relationMeta.RELATION_ID === 'app').ATTRIBUTES);
  }

  getAttrCtrlFromID(fieldName: string): AttributeBase {
    return this.attrCtrls.find( attrCtrl => attrCtrl.name === fieldName);
  }

}
