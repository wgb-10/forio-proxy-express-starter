import archiver from 'archiver';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PassThrough } from 'stream';

/**
 * Creates a zip archive of the project files and returns it as a File instance
 * Includes src directory, production node_modules, package.json, and package-lock.json
 */
export async function createZipFile(): Promise<File> {
  // Create and get the zip as a buffer
  const buffer = await createZipBuffer();

  // Create a File object from the buffer
  return new File([buffer], 'deployment.zip', {
    type: 'application/zip',
    lastModified: Date.now(),
  });
}

const ignoreExtension = [
  'mp4',
  'wmv',
  'mov',
  'exe',
  'dll',
  'com',
  'bat',
  'bin',
  'cmd',
  'command',
  'cpl',
  'gadget',
  'job',
  'msi',
  'mst',
  'msp',
  'ps1',
  'sct',
  'shb',
  'ws',
  'wsf',
  'sh',
  'jsp',
  'php',
  'pl',
  'asp',
  'aspx',
  'shtml',
  'mdl',
].map((ext) => `**/*.${ext}`);

/**
 * Creates a temp directory with production dependencies installed
 * Returns the path to the temp directory
 */
function createTempWithProdDependencies(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-'));

  fs.copyFileSync('package.json', path.join(tempDir, 'package.json'));
  fs.copyFileSync('package-lock.json', path.join(tempDir, 'package-lock.json'));

  console.log('Installing production dependencies ⌛');
  try {
    execSync('npm ci --omit=dev', { cwd: tempDir });
    console.log('Production dependencies installed ✓');
  } catch (error: any) {
    cleanupTempDir(tempDir);
    throw new Error(`npm ci failed: ${error.message}`);
  }

  return tempDir;
}

/**
 * Creates a zip archive of the project files and returns it as a Buffer
 */
export async function createZipBuffer(): Promise<Buffer> {
  const tempDir = createTempWithProdDependencies();

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });
    const memStream = new PassThrough();

    memStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    memStream.on('end', async () => {
      await cleanupTempDir(tempDir);
      resolve(Buffer.concat(chunks));
    });

    archive.on('warning', (err: any) => {
      if (err.code !== 'ENOENT') reject(err);
      else console.warn(err);
    });

    archive.on('error', async (err: any) => {
      await cleanupTempDir(tempDir);
      reject(err);
    });

    archive.pipe(memStream);

    archive.directory('src/', '/');
    archive.glob('**', {
      ignore: ignoreExtension.concat(['package.json', 'package-lock.json']),
      cwd: tempDir,
    });
    archive.file('package.json', { name: 'package.json' });
    archive.file('package-lock.json', { name: 'package-lock.json' });

    archive.finalize();
  });
}

// Cleanup helper
async function cleanupTempDir(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('Cleaned up temporary directory ✓');
  } catch (error) {
    console.warn('Failed to clean up temporary directory:', error);
  }
}
