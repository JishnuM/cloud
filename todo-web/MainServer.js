import CloudContext from '../aven-cloud/CloudContext';
import createCloudClient from '../aven-cloud/createCloudClient';
import CloudAuth from '../aven-cloud-auth/CloudAuth';
import createMemoryDataSource from '../aven-cloud/createMemoryDataSource';
import WebServer from '../aven-web/WebServer';
import SMSAgent from '../aven-sms-agent-twilio/SMSAgent';
import EmailAgent from '../aven-email-agent-sendgrid/EmailAgent';
import SMSAuthMethod from '../aven-cloud-auth-sms/SMSAuthMethod';
import EmailAuthMethod from '../aven-cloud-auth-email/EmailAuthMethod';

import App from './App';

const runServer = async () => {
  console.log('☁️ Starting Cloud 💨');

  const dataSource = await createMemoryDataSource({
    domain: 'todo.aven.cloud',
  });

  const emailAgent = EmailAgent({
    defaultFromEmail: 'Aven Todos <support@aven.io>',
    config: {
      sendgridAPIKey: process.env.SENDGRID_API_KEY,
    },
  });

  const emailAuthMethod = EmailAuthMethod({
    agent: emailAgent,
  });

  const smsAgent = SMSAgent({
    defaultFromNumber: process.env.TWILIO_FROM_NUMBER,
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    },
  });

  const smsAuthMethod = SMSAuthMethod({
    agent: smsAgent,
    getMessage: (authCode, verifyInfo, accountId) => {
      return `Todos App Auth Code: ${authCode}`;
    },
  });
  const authSource = CloudAuth({
    dataSource,
    methods: [smsAuthMethod, emailAuthMethod],
  });
  const client = createCloudClient({
    authSource,
    domain: 'todo.aven.cloud',
  });

  const getEnv = c => process.env[c];
  const serverListenLocation = getEnv('PORT');
  const context = new Map();
  context.set(CloudContext, client);
  const webService = await WebServer({
    App,
    context,
    dataSource: authSource,
    serverListenLocation,
  });
  console.log('☁️️ Web Ready 🕸');

  return {
    close: async () => {
      await webService.close();
      await dataSource.close();
    },
  };
};

export default runServer;
