import { getRunKey, login, stopProxy } from './epicenter';

export const stop = async () => {
  const token = await login();
  console.log('Logged in ✓');

  const runKey = await getRunKey(token);
  console.log('Run key retrieved ✓', `(${runKey})`);

  await stopProxy(token)(runKey);
  console.log('Active proxy stopped ✓');
};

if (require.main === module) stop();
