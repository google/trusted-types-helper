import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { Highlight } from 'ngx-highlightjs';
import { NgIf } from '@angular/common';
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { DefaultPolicyData } from '../../../../common/default-policies';
import { MatLabel } from '@angular/material/form-field';

@Component({
  selector: 'app-default-policy',
  standalone: true,
  imports: [
    Highlight,
    NgIf,
    MatCardModule,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatLabel,
    MatDividerModule,
  ],
  templateUrl: './default-policies.html',
  styleUrl: './default-policies.css',
})
export class DefaultPolicyComponent implements OnChanges {
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
  selectedTabSize = signal('2');
  code = signal('');
  formattedCode = computed(() => {
    const selectedTabSizeValue = this.selectedTabSize();
    const codeValue = this.code();
    if (selectedTabSizeValue === 'tab') {
      return codeValue;
    }
    const tabSize = parseInt(this.selectedTabSize(), 10);
    const spaces = ' '.repeat(tabSize);
    return codeValue.replace(/\t/g, spaces);
  });

  // build a string to look like an array: '[a, b, c]'
  buildAllowlist(allowlist: Array<String | undefined>): String {
    if (allowlist) {
      const list = allowlist
        .filter((item) => item !== undefined)
        .map((item) => `'${item}'`)
        .join(', ');
      return `${list}`;
    }
    return '';
  }

  constructor() {
    this.generateDefaultPolicy();
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.generateDefaultPolicy();
  }

  private generateDefaultPolicy() {
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

      const temp = [
        // TODO: a statement to import dompurify if needed.
        `const urlAllowlist = [${this.buildAllowlist(this.defaultPolicies.URL)}];`,
        `const scriptAllowlist = [${this.buildAllowlist(this.defaultPolicies.Script)}];`,
        `const htmlAllowlist = [${allowlist}];`,
        `window.trustedTypes.createPolicy(\'default\', {`,
        `\tcreateScriptURL: (input) => {`,
        `\t\tif (urlAllowlist.some(allowlist => input.startsWith(allowlist))) {`,
        `\t\t\treturn input;`,
        `\t\t} else {`,
        `\t\t\treturn null;`,
        `\t\t}`,
        `\t},\n`,
        `\tcreateScript: (input) => {`,
        `\t\tif (scriptAllowlist.includes(input)) {`,
        `\t\t\treturn input;`,
        `\t\t} else {`,
        `\t\t\treturn null;`,
        `\t\t}`,
        `\t},\n`,
        `\tcreateHTML: (input) => {`,
        `\t\tif (htmlAllowlist.includes(input)) {`,
        `\t\t\treturn input;`,
        `\t\t} else {`,
        `\t\t\treturn DOMPurify.sanitize(input, {ADD_TAGS: [${tags}], ADD_ATTR: [${attr}]});`,
        `\t\t}`,
        `\t},\n});`,
      ];
      this.code.set(temp.join('\n'));
    }
  }
}
