import AvenServer from '../aven-web/Server';

import App from './Website';

export async function startServer() {
  const server = await AvenServer(App);
  return server;
}