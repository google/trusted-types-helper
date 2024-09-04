import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { ViolationComponent } from '../violation/violation.component';
import { Highlight } from 'ngx-highlightjs';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DefaultPolicyData } from '../../../../common/default-policies';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-default-policy',
  standalone: true,
  imports: [Highlight, NgIf, MatCardModule],
  templateUrl: './default-policies.html',
  styleUrl: './default-policies.css',
})
export class DefaultPolicyComponent implements OnInit {
  @Input()
  defaultPolicies: DefaultPolicyData = {
    HTML: {
      tags: [],
      attrs: [],
      violationFragment: [],
      allowlist: [],
    },
    Script: [],
    URL: [],
  };

  code: string = ''; // result to display in string

  // build a string to look like an array: '[a, b, c]'
  buildAllowlist(allowlist: Array<String | undefined>): String {
    if (allowlist) {
      const list = allowlist.map((item) => `'${item}'`).join(', ');
      return `${list}`;
    }
    return '';
  }

  ngOnInit() {
    console.log('default policy page is loaded!');
    if (this.defaultPolicies) {
      console.log(
        'default policies in its component: ' +
          JSON.stringify(this.defaultPolicies),
      );

      // list of allowed HTML tags
      let tags;
      if (this.defaultPolicies.HTML && this.defaultPolicies.HTML.tags) {
        tags = this.buildAllowlist(this.defaultPolicies.HTML.tags);
      } else {
        tags = '';
      }
      let attr;
      if (this.defaultPolicies.HTML && this.defaultPolicies.HTML.attrs) {
        attr = this.buildAllowlist(this.defaultPolicies.HTML.attrs);
      } else {
        attr = '';
      }
      let allowlist;
      if (this.defaultPolicies.HTML && this.defaultPolicies.HTML.allowlist) {
        allowlist = this.buildAllowlist(this.defaultPolicies.HTML.allowlist);
      } else {
        allowlist = '';
      }

      var temp = [];
      temp.push(
        // dompurify
        `\n`, // to fix intentation
        `const urlAllowlist = [${this.buildAllowlist(this.defaultPolicies.URL)}];`,
        `const scriptAllowlist = [${this.buildAllowlist(this.defaultPolicies.Script)}];`,
        `const htmlAllowlist = [${allowlist}];`,
        `window.trustedTypes.createPolicy(\'default\', {`,
        `        createScriptURL: (input) => {`,
        `                if (urlAllowlist.some(allowlist => input.startsWith(allowlist))) {`,
        `                        return input;`,
        `                } else {`,
        `                        return null;`,
        `                }`,
        `        },\n`,
        `        createScript: (input) => {`,
        `                if (scriptAllowlist.includes(input)) {`,
        `                        return input;`,
        `                } else {`,
        `                        return null;`,
        `                }`,
        `        },\n`,
        `        createHTML: (input) => {`,
        `               if (htmlAllowlist.includes(input)) {`,
        `                         return input;`,
        `               else {`,
        `                         return DOMPurify.sanitize(input, {ADD_TAGS: [${tags}], ADD_ATTR: [${attr}]);`,
        `               }`,
        `        },\n});`,
      );
      this.code = temp.join('\n');
    }
  }

  ngOnChanges() {}
}
