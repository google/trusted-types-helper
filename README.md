# trusted-types-helper

## Content script 1:

- `src/content.js`
- runs in the main world so that it can inject the default policy into the main page.

## Content script 2:

- `src/listen.js`
- runs in an isolated world
- listens to messages from content.js to pass it along to the service worker.

## Service worker:

- `background/service_worker.ts`
- listens to messages from listen.js and stores violations data
- It can retrieve violations data when asked by the angular component.

## Angular UI

- will be painted inside the devtools tab
- when it loads it asks the service worker for all the violation data it's seen so far

## To build/run

- Run `npm install` on the top-level directory.
- Navigate to the directory `ui` and run `npm install` again (to install Angular
  dependencies only used for the UI folder).
- There's a package.json at the top level, run `npm run build` there to build the extension

In summary, the commands to build and run are:

```bash
npm install
cd ui
npm install
cd ..
npm run build
```

### Formatting

In the `.vscode/extensions.json`, we recommend the `prettier-vscode` extension. Prettier can also be run as a NPM script:

```bash
npm run format
```

and will automatically run as a part of `npm run build`.

## To test

**Please run the steps above for build/run before attempting to run tests.**

There are multiple levels of tests present in this directory, namely:

- Angular component tests for testing the UI
- Integration tests for loading the full extension in a Chromium window

### Angular tests

These are managed by the `ng` CLI.

```bash
cd ui
npm run test
```

Alternatively, from the top-level of this repo, you can run:

```bash
npm run test:ng
```

The test files are in the same directory as the components (for example, `src/app/app.component.spec.ts`).

### Integration tests

```bash
npm run test
```

This will rebuild the codebase and then run the integration tests.

These are run by [Jest with Puppeteer](https://jestjs.io/docs/puppeteer) using [ts-jest](https://jestjs.io/docs/getting-started#via-ts-jest) and [jest-dev-server](https://www.npmjs.com/package/jest-dev-server) and following [testing Chrome extensions](https://developer.chrome.com/docs/extensions/how-to/test/puppeteer). To run them, please run `npm run test` at the top-level directory. Debugging can be started in VS Code with the [JavaScript Debug Terminal](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_javascript-debug-terminal) where you can run either `npm run test` for all tests or a specific test like `npx jest test/ -t "headers"` (where you can specify the specific test for the tool to run).

#### Test Page

The files `test_page.html` and `test_server.js` contain a very simple webapp that can serve a HTML response with Trusted Types headers/meta tags based on the URL query parameter. Please set it to `?header=true` or `?meta=true` to activate this feature. This server can be run with `npm run test-page` at the top-level directory, and it is already integrated in to the Playwright setup at `playwright.config.ts`. During the integration tests, [jest-dev-server](https://www.npmjs.com/package/jest-dev-server) manages the setup and teardown of this page.
