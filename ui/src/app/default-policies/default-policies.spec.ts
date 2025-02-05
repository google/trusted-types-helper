import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultPolicyComponent } from './default-policies.component';
import { HighlightModule, provideHighlightOptions } from 'ngx-highlightjs';
import { NgIf } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatLabel } from '@angular/material/form-field';
import { By } from '@angular/platform-browser';

/**
 * Run a string containing code (in this case, the default policy creator) in a
 * brand new iframe (new document context) to check for any syntax errors.
 *
 * @param jsString Code to execute
 * @returns
 */
function evalInIframe(jsString: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create an iframe
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    // Function to handle messages from the iframe
    const handleMessage = (event: any) => {
      if (event.source === iframe.contentWindow) {
        // Clean up
        window.removeEventListener('message', handleMessage);
        iframe.remove();

        // Resolve or reject based on the message
        if (event.data === 'no errors') {
          resolve();
        } else {
          reject(new Error(event.data));
        }
      }
    };

    // Listen for messages from the iframe
    window.addEventListener('message', handleMessage);

    // Write the code to the iframe with error handling
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(`
      <script>
        try {
          eval(${JSON.stringify(jsString)});
          window.parent.postMessage('no errors', '*'); 
        } catch (error) {
          window.parent.postMessage('error: ' + error.message, '*');
        }
      </script>
    `);
    iframe.contentWindow?.document.close();
  });
}

describe('DefaultPolicyComponent', () => {
  let component: DefaultPolicyComponent;
  let fixture: ComponentFixture<DefaultPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HighlightModule,
        NgIf,
        MatCardModule,
        MatButtonToggleModule,
        MatLabel,
        MatDividerModule,
        DefaultPolicyComponent,
      ],
      providers: [
        provideHighlightOptions({
          coreLibraryLoader: () => import('highlight.js/lib/core'),
          languages: {
            typescript: () => import('highlight.js/lib/languages/typescript'),
            css: () => import('highlight.js/lib/languages/css'),
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultPolicyComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the default policies', async () => {
    // Rather than a direct fixture.componentInstance.defaultPolicies assignment
    // so that ngOnChanges can trigger.
    fixture.componentRef.setInput('defaultPolicies', {
      HTML: {
        tags: ['a', 'b'],
        attrs: ['href', 'src'],
        violationFragment: [],
        allowlist: ['div', 'span'],
      },
      Script: ['script1.js', 'script2.js'],
      URL: ['url1', 'url2'],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    // TODO: Highlight.js is not behaving properly.
    const codeElement = fixture.debugElement.query(By.css('pre'));
    const code = codeElement.nativeElement.textContent;
    expect(code).toContain(`const urlAllowlist = ['url1', 'url2']`);
    expect(code).toContain(
      `const scriptAllowlist = ['script1.js', 'script2.js']`,
    );
    expect(code).toContain(`const htmlAllowlist = ['div', 'span']`);
    expect(code).toContain(
      `DOMPurify.sanitize(input, {ADD_TAGS: ['a', 'b'], ADD_ATTR: ['href', 'src']})`,
    );
    // Is valid JS
    await expectAsync(evalInIframe(code)).toBeResolved();
  });

  it('should change tab size when a button is toggled', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.selectedTabSize()).toBe('2');
    fixture.detectChanges(); // Wait more for stability post Angular 19 update.
    await fixture.whenStable();
    const codeElement = fixture.debugElement.query(By.css('pre'));
    expect(codeElement.nativeElement.textContent).toContain(
      '  createScriptURL: (input) => {',
    );
    // Have to actually focus on the button element for the click to work.
    const tabSize4Button = fixture.debugElement.query(
      By.css('mat-button-toggle[value="4"] button'),
    );
    tabSize4Button.triggerEventHandler('click', null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.selectedTabSize()).toBe('4');
    expect(codeElement.nativeElement.textContent).toContain(
      '    createScriptURL: (input) => {',
    );
    // Is valid JS
    await expectAsync(
      evalInIframe(codeElement.nativeElement.textContent),
    ).toBeResolved();
  });

  it('should set tab size to "tab" when the "Tab" button is clicked', async () => {
    const tabButton = fixture.debugElement.query(
      By.css('mat-button-toggle[value="tab"] button'),
    );
    tabButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.selectedTabSize()).toBe('tab');
    await fixture.whenStable();

    const codeElement = fixture.debugElement.query(By.css('pre'));
    expect(codeElement.nativeElement.textContent).toContain(
      '\tcreateScriptURL: (input) => {',
    );
    // Is valid JS
    await expectAsync(
      evalInIframe(codeElement.nativeElement.textContent),
    ).toBeResolved();
  });

  it('should build the allowlist string correctly', () => {
    expect(component.buildAllowlist([])).toBe('');
    expect(component.buildAllowlist(['a', 'b', 'c'])).toBe(`'a', 'b', 'c'`);
    expect(component.buildAllowlist([undefined, 'a', undefined])).toBe(`'a'`);
  });

  it('should handle empty defaultPolicies', async () => {
    fixture.componentRef.setInput('defaultPolicies', {
      HTML: { tags: [], attrs: [], violationFragment: [], allowlist: [] },
      Script: [],
      URL: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    // Allowlist nothing.
    const codeElement = fixture.debugElement.query(By.css('pre'));
    fixture.detectChanges(); // Wait more for stability post Angular 19 update.
    await fixture.whenStable();
    expect(codeElement.nativeElement.textContent).toContain(
      'const urlAllowlist = [];',
    );
    expect(codeElement.nativeElement.textContent).toContain(
      'const scriptAllowlist = [];',
    );
    expect(codeElement.nativeElement.textContent).toContain(
      'const htmlAllowlist = [];',
    );
    // Is valid JS
    await expectAsync(
      evalInIframe(codeElement.nativeElement.textContent),
    ).toBeResolved();
  });
});
