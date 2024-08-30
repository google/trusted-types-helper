import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { ViolationComponent } from '../violation/violation.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DefaultPolicyData, ViolationType } from '../../../../common/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-default-policy',
  standalone: true,
  imports: [NgIf, MatCardModule],
  templateUrl: './default-policies.html',
  styleUrl: './default-policies.css',
})
export class DefaultPolicyComponent implements OnInit {
  @Input()
  defaultPolicies: DefaultPolicyData | undefined = undefined;
  allowedUrl: String | undefined = undefined;
  allowedScript: String | undefined = undefined;
  allowedAngular: String | undefined = undefined;

  // maybe use an array and use 'join("")' to "build res string"
  code = '';

  buildAllowlist(type: ViolationType, allowlist: Array<String>): String {
    if (allowlist) {
      const list = allowlist.map((item) => `'${item}'`).join(', ');
      return `const ${type.toLowerCase() + 'Allowlist'} = [${list}];\n`;
    }
    return '';
  }

  generateDefaultPolicies() {}

  ngOnInit() {
    console.log('default policy page!');
    if (this.defaultPolicies) {
      console.log(this.defaultPolicies);
      this.code += this.buildAllowlist('URL', this.defaultPolicies.URL);
      this.code += this.buildAllowlist('Script', this.defaultPolicies.Script);
      this.code += this.buildAllowlist('HTML', this.defaultPolicies.HTML);
      this.code += `window.trustedTypes.createPolicy(\'default\', {\n`;
      this.code += `\tcreateScriptURL: (input) => {
          \t\tif (urlAllowlist.some(allowlist => input.startsWith(allowlist))) {
          \t\t\treturn input;
          \t\t} else {
          \t\t\treturn null;
          \t\t}
          \t},\n`;
      this.code += `\tcreateScript: (input) => {
          \t\tif (scriptAllowlist.includes(input)) {
          \t\t\treturn input;
          \t\t} else {
          \t\t\treturn null;
          \t\t}
          \t},\n`;
      this.code += `\tcreateHTML: (input) => {
          \t\tif (angularScript.includes(input)) {
          \t\t\treturn input;
          \t\t} else {
          \t\t\treturn null;
          \t\t}
          \t},\n`;
      this.code += `});`;
    }
  }

  ngOnChanges() {}
}
