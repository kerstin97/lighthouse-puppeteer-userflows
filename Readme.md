# Performance Tests of my bachelor thesis projects with Puppeteer and Lighthouse

There are two scripts, one for the Next.js app and one for the Remix app. Each script runs the performance test 5 times and create the re repots as html,json and csv.
After my bachelor degree, the server will not be available anymore and tests won't work afterwards.

Following steps are in the user-flow:

- Visit homepage
- View all events
- View event detail
- Login
- Create Event
- View My Events

## Run tests

First install dependencies in root
`npm install`

### Run Remix test

`node remix_test_with_lighthouse.js`

### Run Next.js test

`node nextjs_test_with_lighthouse.js`

### Archiv folder

Here are some tests to try out puppeteer as it's own. Also there is a file `lighthouse_userflow_test.js` which is not working due to issues on soft navigation. ([Issue](https://link-url-here.org)https://github.com/GoogleChrome/lighthouse/issues/14573)
