# Forio Proxy Starter

Starter code for running an Express server using an Epicenter proxy.

## Configuration

Complete the following required Epicenter configuration.

1. Account: `allowProjectScopedModels`:

   ```bash
   curl --request PATCH \
     --url https://forio.com/api/v3/<account>/<project>/account \
     --header 'authorization: Bearer <token>' \
     --header 'content-type: application/json' \
     --data '{
     "objectType": "team",
     "accountSetting": {
       "allowProjectScopedModels": true
     }
   }'
   ```

   (Note: This anointed field may not be settable by all users. If the request
   is rejected, carry on: the proper setting may already be in place.)

2. Project: `modelFile`

   ```bash
   curl --request PATCH \
     --url forio.com/api/v3/<account>/<project>project \
     --header 'authorization: Bearer <token>' \
     --header 'content-type: application/json' \
     --data '{
     "objectType": "team",
     "modelFile": "index.js"
   }'
   ```

## Deployment

1. Copy `tools/config.example.json` to `tools/config.json` and fill in the
   required fields. Do not commit `config.json`.
2. `npm run deploy`

## Consumption

Once deployed, fetch against
`https://forio.com/proxy/<account>/<project>/<...path>`.

This starter comes with a handler for `GET /`. Requesting `GET /` will return a
simple message indicating that the server is running.

A handler for `POST /completions` would receive requests at
`https://forio.com/proxy/<account>/<project>/completions`, and so on.

## Common use cases

- Authenticate Epicenter with a privileged `secretKey` to perform privileged
  actions:

  ```javascript
  authAdapter
    .login({ secretKey: epicenter.proxyConfig().apiSharedSecret })
    .then((session) => session /* AccountWhoAmI */);
  ```

- Hold secrets on the server and route requests to the proxy.

## Development

### Restarting the proxy

Upon redeploying proxy code, you'll want to restart the process.
`npm run deploy` stops the proxy as part of its flow. You can also
`npm run stop` to do the same. The proxy will restart automatically when a
request is routed to it.

### Logging

Define a `minimumLogLevel` in `src/index.ctx2` to record logs during the proxy
process.

Options for `minimumLogLevel` are, from most to least verbose:

- TRACE
- DEBUG
- INFO
- WARN
- ERROR
- FATAL
- OFF

Use `epicenter.log` in proxy code to log messages:

```javascript
/* First argument categorizes the log (see above),
 * second is the message. Match the message to its severity
 * and be sure minimumLogLevel is set to the appropriate level.
 */
epicenter.log('INFO', `Listening on port ${port}`);
epicenter.log('ERROR', `Error: ${JSON.stringify(err)}`);
```

Run `npm run log` to fetch the proxy log and save it locally to `/logs`.
