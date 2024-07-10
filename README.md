# trusted-types-helper

## Content script 1:
 * `src/content.js`
 * runs in the main world so that it can inject the default policy into the main page.

## Content script 2:
* `src/listen.js`
* runs in an isolated world
* listens to messages from content.js to pass it along to the service worker.

## Service worker:
* `background/service_worker.ts`
* listens to messages from listen.js and stores violations data
*  It can retrieve violations data when asked by the angular component.

## Angular UI
* will be painted inside the devtools tab
* when it loads it asks the service worker for all the violation data it's seen so far

## To build/run
* Run `npm install` on the top-level directory.
* Navigate to the directory `ui` and run `npm install` again (to install Angular
  dependencies only used for the UI folder).
* There's a package.json at the top level, run `npm run build` there to build the extension

In summary, the commands to build and run are:

```bash
npm install
cd ui
npm install
cd ..
npm run build
```
