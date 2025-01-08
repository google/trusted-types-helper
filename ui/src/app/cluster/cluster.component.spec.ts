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
import { ClusterComponent } from './cluster.component';
import {
  TrustedTypesViolationCluster,
  Violation,
} from '../../../../common/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgIf, NgFor } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Mock ViolationComponent
@Component({
  standalone: true,
  selector: 'app-violation',
  template: '',
})
class MockViolationComponent {}

describe('ClusterComponent', () => {
  let component: ClusterComponent;
  let fixture: ComponentFixture<ClusterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatButtonModule,
        MatBadgeModule,
        MatExpansionModule,
        NgIf,
        NgFor,
        NoopAnimationsModule,
        MockViolationComponent,
        ClusterComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClusterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display cluster root cause', () => {
    const clusterData: TrustedTypesViolationCluster = {
      metadata: {
        rootCause: 'Test Root Cause',
        count: 5,
        firstOccurrence: Date.now(),
        id: 'test-id', // Added missing 'id'
        lastOccurrence: Date.now(), // Added missing 'lastOccurrence'
      },
      clusteredViolations: [],
    };
    component.cluster = clusterData;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('.cluster-root-cause')?.textContent,
    ).toContain('Test Root Cause');
  });

  it('should display first seen date', () => {
    const clusterData: TrustedTypesViolationCluster = {
      metadata: {
        rootCause: 'Test Root Cause',
        count: 5,
        firstOccurrence: Date.now(),
        id: 'test-id', // Added missing 'id'
        lastOccurrence: Date.now(), // Added missing 'lastOccurrence'
      },
      clusteredViolations: [],
    };
    component.cluster = clusterData;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.first-seen')?.textContent).toContain(
      'First seen:',
    );
  });

  it('should toggle violation visibility', () => {
    fixture.detectChanges();
    expect(component.showFirstViolationOnly()).toBeTruthy();
    expect(component.expandOrHideViolationsMessage).toBe('Expand violations');

    component.toggleViolationVisibility();
    fixture.detectChanges();
    expect(component.showFirstViolationOnly()).toBeFalsy();
    expect(component.expandOrHideViolationsMessage).toBe('Hide violations');
  });

  // ... (previous code)

  it('should initially show only the first violation', () => {
    const violation1: Violation = {
      data: 'violation 1 data',
      type: 'HTML',
      timestamp: Date.now(),
      stackTrace: { frames: [] },
      documentUrl: 'http://example.com',
    };
    const violation2: Violation = {
      data: 'violation 2 data',
      type: 'Script',
      timestamp: Date.now(),
      stackTrace: { frames: [] },
      documentUrl: 'http://example.com',
    };
    const clusterData: TrustedTypesViolationCluster = {
      metadata: {
        rootCause: 'Test Root Cause',
        count: 2,
        firstOccurrence: Date.now(),
        id: 'test-id',
        lastOccurrence: Date.now(),
      },
      clusteredViolations: [violation1, violation2],
    };
    component.cluster = clusterData;
    fixture.detectChanges();

    // Check that only the first violation is rendered initially
    const violationComponents =
      fixture.nativeElement.querySelectorAll('app-violation');
    expect(violationComponents.length).toBe(1);
    // You could add further checks to ensure the correct violation is displayed
  });

  it('should show all violations when "Expand violations" is clicked', () => {
    const violation1: Violation = {
      data: 'violation 1 data',
      type: 'HTML',
      timestamp: Date.now(),
      stackTrace: { frames: [] },
      documentUrl: 'http://example.com',
    };
    const violation2: Violation = {
      data: 'violation 2 data',
      type: 'Script',
      timestamp: Date.now(),
      stackTrace: { frames: [] },
      documentUrl: 'http://example.com',
    };
    const clusterData: TrustedTypesViolationCluster = {
      metadata: {
        rootCause: 'Test Root Cause',
        count: 2,
        firstOccurrence: Date.now(),
        id: 'test-id',
        lastOccurrence: Date.now(),
      },
      clusteredViolations: [violation1, violation2],
    };
    component.cluster = clusterData;
    fixture.detectChanges();

    // Click the "Expand violations" button
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    // Check that all violations are now rendered
    const violationComponents =
      fixture.nativeElement.querySelectorAll('app-violation');
    expect(violationComponents.length).toBe(
      clusterData.clusteredViolations.length,
    );
  });

  it('should handle undefined or null cluster input gracefully', () => {
    component.cluster = undefined; // or null
    fixture.detectChanges();

    // Check that the component doesn't throw errors and handles the undefined/null case
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cluster-root-cause')).toBeNull();
    // Add more checks for other elements that should be hidden or display default content
  });

  it('should update "expandOrHideViolationsMessage" correctly', () => {
    fixture.detectChanges();
    expect(component.expandOrHideViolationsMessage).toBe('Expand violations');

    component.toggleViolationVisibility();
    expect(component.expandOrHideViolationsMessage).toBe('Hide violations');

    component.toggleViolationVisibility();
    expect(component.expandOrHideViolationsMessage).toBe('Expand violations');
  });
});
