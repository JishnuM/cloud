import { startWebClient } from '@aven/web-browser';
import App from './StageApp';
import {
  createBrowserNetworkSource,
  createBrowserClient,
} from '@aven/cloud-browser';
import { CloudContext } from '@aven/cloud';
import * as appConfig from './app.json';

window.videojs = require('videojs-record');

const networkSource = createBrowserNetworkSource({
  authority: null, // this means to inherit from the server
  useSSL: null,
});

const client = createBrowserClient({
  source: networkSource,
  domain: appConfig.domain,
});

const context = new Map();

context.set(CloudContext, client);

startWebClient(App, context);