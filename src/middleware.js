const epicenterLibs = require('epicenter-libs');

const verify = (epicenterGlobal) => async (req, res, next) => {
  const { Router, Fault } = epicenterLibs;
  const token = req.headers['authorization'];
  try {
    const session = await new Router()
      .withAuthorization(token)
      .get('/verification')
      .then(({ body }) => body);
    if (
      session.accountShortName !==
        epicenterGlobal.proxyConfig().accountShortName ||
      session.projectShortName !==
        epicenterGlobal.proxyConfig().projectShortName
    ) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
  } catch (error) {
    if (error instanceof Fault) {
      const { status, ...e } = error;
      return res.status(status ?? 500).json(e);
    }
    return res
      .status(500)
      .json({ error: 'Internal Server Error', message: String(error) });
  }
};

module.exports = {
  verify,
};
