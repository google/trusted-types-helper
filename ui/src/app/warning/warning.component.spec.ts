/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WarningComponent } from './warning.component';
import { DefaultPolicyWarning } from '../../../../common/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('WarningComponent', () => {
  let component: WarningComponent;
  let fixture: ComponentFixture<WarningComponent>;
  let snackBar: MatSnackBar;
  const warning = (message: string) => {
    return {
      message: message,
      isSuccess: true,
      date: Date.now(),
    } as DefaultPolicyWarning;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarningComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(WarningComponent);
    component = fixture.componentInstance;
    // This is the same instance injected into the component constructor
    snackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the correct message when defaultPolicyWarning is set', () => {
    const message = 'This is a warning message.';
    fixture.componentRef.setInput('defaultPolicyWarning', warning(message));
    fixture.detectChanges();

    expect(component.message()).toBe(message);
  });

  it('should show "No message yet." when defaultPolicyWarning is undefined', () => {
    fixture.componentRef.setInput('defaultPolicyWarning', undefined);
    fixture.detectChanges();

    expect(component.message()).toBe('No message yet.');
  });

  it('should display the snackbar when defaultPolicyWarning is updated', () => {
    spyOn(snackBar, 'open');

    const message = 'This is a warning message.';
    fixture.componentRef.setInput('defaultPolicyWarning', warning(message));
    fixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(message, 'Close');
  });
});
