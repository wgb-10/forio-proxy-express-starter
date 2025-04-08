import fs from 'fs';
import path from 'path';
import { downloadFile, getFiles, getRunKey, login } from './epicenter';

export const log = async () => {
  const token = await login();
  console.log('Logged in ✓');

  const [files, runKey] = await Promise.all([
    getFiles(token, 'proxy'),
    getRunKey(token),
  ]);

  const logFile = files
    .filter(
      (file) =>
        file.objectType === 'file' &&
        file.name.startsWith('run') &&
        file.name.endsWith('.log.txt') &&
        file.name.includes(runKey)
    )
    .pop();

  if (!logFile) return console.log('No log file found');

  const blob = await downloadFile(token, 'proxy/'.concat(logFile.name));

  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const logPath = path.join(logsDir, logFile.name);
  fs.writeFileSync(logPath, Buffer.from(await blob.arrayBuffer()));
  return console.log(`Log file saved to: ${logPath}`);
};

if (require.main === module) log();
