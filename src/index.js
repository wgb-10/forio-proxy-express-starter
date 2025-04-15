const express = require('express');
const cors = require('cors');
const epicenterLibs = require('epicenter-libs');
const { config } = epicenterLibs;
const { verify } = require('./middleware');

const app = express();

app.use(
  cors({
    origin: /https?:\/\/localhost:8888/,
  })
);

app.use(express.json());

try {
  const proxyConfig = epicenter.proxyConfig();
  config.setContext({
    apiProtocol: proxyConfig.apiScheme,
    apiHost: proxyConfig.apiHost,
    accountShortName: proxyConfig.accountShortName,
    projectShortName: proxyConfig.projectShortName,
  });
} catch (e) {
  // No injected epicenter === local dev
  if (e instanceof ReferenceError) {
    const envJson = require('./env.json');
    const env = Object.assign({}, envJson, process.env);

    config.setContext({
      apiProtocol: 'https',
      apiHost: env.API_HOST,
      accountShortName: env.ACCOUNT_SHORT_NAME,
      projectShortName: env.PROJECT_SHORT_NAME,
    });
    epicenter = {
      proxyConfig: () => ({
        externalPort: 80,
        apiSharedSecret: env.API_SHARED_SECRET,
        ...config,
      }),
      log: console.log,
    };
    /**
     * The epicenter-libs on client are configured to route proxy requests to
     * `/proxy/${accountShortName}/${projectShortName}`. From the perspective of the production
     * proxy server, this is where the root path starts, which means the string
     * `/proxy/${accountShortName}/${projectShortName}` isn't part of any wildcard route matches.
     *
     * On the local server, whose root path actually is '/', we remove this prefix from the request url
     * so that wildcards match the same paths as in production.
     *
     * For general sim development, use the production proxy server. Use a local server only when the
     * proxy itself is the focus of development.
     */
    app.use((req, res, next) => {
      const proxyPrefix = new RegExp(
        `^/proxy/${config.accountShortName}/${config.projectShortName}`
      );
      req.url = req.url.replace(proxyPrefix, '');
      next();
    });
  }
}

app.get('/', (req, res) => res.status(200).send('Server is running!'));

const completion = async (req, res) => {
  const { prompt } = req.body;

  /* do some work ...
   *
   *
   *
   */

  return res.status(200).json({ data: prompt });
};

app.post('/completion', verify(epicenter), completion);

async function main() {
  const port = epicenter.proxyConfig().externalPort;
  app.listen(port, () => epicenter.log('INFO', `Listening on port ${port}`));
}

main();
