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
  private violationDataByTypeSubject$ = new ReplaySubject<
    ViolationDataType | undefined
  >(1);
  private violationDataByClusterSubject$ = new ReplaySubject<
    TrustedTypesViolationCluster[] | undefined
  >(1);
  private violationDataByDefaultPoliciesSubject$ = new ReplaySubject<
    DefaultPolicyData | undefined
  >(1);

  /**
   * An Observable that emits violation data by type.
   */
  violationDataByType$: Observable<ViolationDataType | undefined> =
    this.violationDataByTypeSubject$.asObservable();

  /**
   * An Observable that emits violation data by cluster.
   */
  violationDataByCluster$: Observable<
    TrustedTypesViolationCluster[] | undefined
  > = this.violationDataByClusterSubject$.asObservable();

  /**
   * An Observable that emits violation data by default policies.
   */
  violationDataByDefaultPolicies$: Observable<DefaultPolicyData | undefined> =
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
    | ViolationDataType
    | TrustedTypesViolationCluster[]
    | DefaultPolicyData
    | undefined
  > {
    const message: Message = {
      type: messageType,
      inspectedTabId: chrome.devtools.inspectedWindow.tabId,
    };
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (e) {
      // TODO: Do not remove this, it should happen infrequently enough and
      // we want to see what happened if this catch triggers.
      debugger;
      alert(
        `Failed to communicate with service worker: ${e}.\nPlease refres the page.`,
      );
      return;
    }
  }

  /**
   * A little bit of extra type safety. Check service_worker.ts to make sure
   * this is still up-to-date.
   * @returns
   */
  private async listViolationsByTypeFromLocalStorage(): Promise<
    ViolationDataType | undefined
  > {
    const res = await this.getViolationDataFromLocalStorage(
      'listViolationsByType',
    );
    if (!res) {
      return res;
    }
    return res as ViolationDataType;
  }

  /**
   * A little bit of extra type safety. Check service_worker.ts to make sure
   * this is still up-to-date.
   * @returns
   */
  private async listViolationsByClusterFromLocalStorage(): Promise<
    TrustedTypesViolationCluster[] | undefined
  > {
    const res = await this.getViolationDataFromLocalStorage(
      'listViolationsByCluster',
    );
    if (!res) {
      return res;
    }
    return res as TrustedTypesViolationCluster[];
  }

  /**
   * A little bit of extra type safety. Check service_worker.ts to make sure
   * this is still up-to-date.
   * @returns
   */
  private async defaultPoliciesFromLocalStorage(): Promise<
    DefaultPolicyData | undefined
  > {
    const res = await this.getViolationDataFromLocalStorage('defaultPolicies');
    if (!res) {
      return res;
    }
    return res as DefaultPolicyData;
  }
}
