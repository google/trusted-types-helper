import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  from,
  interval,
  merge,
  Observable,
  ReplaySubject,
  Subject,
} from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import {
  Message,
  TrustedTypesViolationCluster,
  ViolationDataType,
} from '../../../../../common/common';
import { DefaultPolicyData } from '../../../../../common/default-policies';

type CompatibleMessageTypes =
  | 'listViolationsByType'
  | 'listViolationsByCluster'
  | 'defaultPolicies';

/**
 * A service that manages fetching and refreshing violation data from local storage.
 */
@Injectable({ providedIn: 'root' })
export class ViolationDataService {
  private refreshByType$ = new Subject<void>();
  private refreshByCluster$ = new Subject<void>();
  private refreshByDefaultPolicies$ = new Subject<void>();

  private refreshIntervalSubject$ = new BehaviorSubject<number>(10_000); // Default to 10 seconds

  /**
   * An Observable that emits the current refresh interval in milliseconds.
   */
  refreshInterval$: Observable<number> =
    this.refreshIntervalSubject$.asObservable();

  // We are exposing Observables in the API of this service, but we need to
  // back them up with ReplaySubject so that they will be "hot"-- as in, these
  // will keep running in the background regardless of subscriptions.
  private violationDataByTypeSubject$ = new ReplaySubject<ViolationDataType>(1);
  private violationDataByClusterSubject$ = new ReplaySubject<
    TrustedTypesViolationCluster[]
  >(1);
  private violationDataByDefaultPoliciesSubject$ =
    new ReplaySubject<DefaultPolicyData>(1);

  /**
   * An Observable that emits violation data by type.
   */
  violationDataByType$: Observable<ViolationDataType> =
    this.violationDataByTypeSubject$.asObservable();

  /**
   * An Observable that emits violation data by cluster.
   */
  violationDataByCluster$: Observable<TrustedTypesViolationCluster[]> =
    this.violationDataByClusterSubject$.asObservable();

  /**
   * An Observable that emits violation data by default policies.
   */
  violationDataByDefaultPolicies$: Observable<DefaultPolicyData> =
    this.violationDataByDefaultPoliciesSubject$.asObservable();

  constructor() {
    // Create refresh triggers that combine Subjects and dynamic intervals
    const refreshByTypeTrigger$ = merge(
      this.refreshByType$.pipe(
        tap((_) => console.log(`Refresh type by clicking`)),
      ),
      this.refreshIntervalSubject$.pipe(
        switchMap((ms) => interval(ms)),
        tap((n) =>
          console.log(`Refresh type by timer (${n}) at ${Date.now()}`),
        ),
      ),
    ).pipe(
      // Debugging
      tap((x) =>
        console.log(`Refresh triggered, either by click or timer: ${x}`),
      ),
      finalize(() => console.log('refreshByTypeTrigger$ completed')),
    );
    const refreshByClusterTrigger$ = merge(
      this.refreshByCluster$,
      this.refreshIntervalSubject$.pipe(switchMap((ms) => interval(ms))),
    );
    const refreshByDefaultPoliciesTrigger$ = merge(
      this.refreshByDefaultPolicies$,
      this.refreshIntervalSubject$.pipe(switchMap((ms) => interval(ms))),
    );

    refreshByTypeTrigger$
      .pipe(
        tap((_) => console.log(`Triggered refresh type`)),
        switchMap(() => from(this.listViolationsByTypeFromLocalStorage())),
        tap((x) =>
          console.log(`Got refresh type value: ${JSON.stringify(x).length}`),
        ),
      )
      .subscribe(this.violationDataByTypeSubject$);

    refreshByClusterTrigger$
      .pipe(
        switchMap(() => from(this.listViolationsByClusterFromLocalStorage())),
      )
      .subscribe(this.violationDataByClusterSubject$);

    refreshByDefaultPoliciesTrigger$
      .pipe(switchMap(() => from(this.defaultPoliciesFromLocalStorage())))
      .subscribe(this.violationDataByDefaultPoliciesSubject$);
  }

  /**
   * Refreshes the violation data by type.
   */
  refreshDataByType() {
    console.log(`Calling refreshDataByType() from violation-data.service.ts`);
    this.refreshByType$.next();
  }

  /**
   * Refreshes the violation data by cluster.
   */
  refreshDataByCluster() {
    this.refreshByCluster$.next();
  }

  /**
   * Refreshes the violation data by default policies.
   */
  refreshDataByDefaultPolicies() {
    this.refreshByDefaultPolicies$.next();
  }

  /**
   * Sets the refresh interval for all violation data streams.
   * @param intervalMs The new refresh interval in milliseconds.
   */
  setRefreshInterval(intervalMs: number) {
    this.refreshIntervalSubject$.next(intervalMs);
  }

  /**
   * Fetches violation data from local storage based on the given message type.
   * @param messageType The type of message to send to local storage.
   * @returns A Promise that resolves with the violation data.
   */
  private async getViolationDataFromLocalStorage(
    messageType: CompatibleMessageTypes,
  ): Promise<
    ViolationDataType | TrustedTypesViolationCluster[] | DefaultPolicyData
  > {
    const message: Message = {
      type: messageType,
      inspectedTabId: chrome.devtools.inspectedWindow.tabId,
    };
    const response = await chrome.runtime.sendMessage(message);
    return response;
  }

  /**
   * A little bit of extra type safety. Check service_worker.ts to make sure
   * this is still up-to-date.
   * @returns
   */
  private async listViolationsByTypeFromLocalStorage(): Promise<ViolationDataType> {
    const res = await this.getViolationDataFromLocalStorage(
      'listViolationsByType',
    );
    return res as ViolationDataType;
  }

  /**
   * A little bit of extra type safety. Check service_worker.ts to make sure
   * this is still up-to-date.
   * @returns
   */
  private async listViolationsByClusterFromLocalStorage(): Promise<
    TrustedTypesViolationCluster[]
  > {
    const res = await this.getViolationDataFromLocalStorage(
      'listViolationsByCluster',
    );
    return res as TrustedTypesViolationCluster[];
  }

  /**
   * A little bit of extra type safety. Check service_worker.ts to make sure
   * this is still up-to-date.
   * @returns
   */
  private async defaultPoliciesFromLocalStorage(): Promise<DefaultPolicyData> {
    const res = await this.getViolationDataFromLocalStorage('defaultPolicies');
    return res as DefaultPolicyData;
  }
}
