import archiver from 'archiver';

/**
 * Creates a zip archive of the project files and returns it as a File instance
 * Includes src directory, node_modules, package.json, and package-lock.json
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

const ignore = [
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
 * Creates a zip archive of the project files and returns it as a Buffer
 */
export async function createZipBuffer(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Create a buffer to store zip data
    const chunks: Buffer[] = [];
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Set up a passthrough stream to collect chunks
    const memStream = new (require('stream').PassThrough)();
    memStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    memStream.on('end', () => resolve(Buffer.concat(chunks)));

    // Pipe archive data to the memory stream
    archive.pipe(memStream);

    // Listen for warnings
    archive.on('warning', (err: any) => {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        reject(err);
      }
    });

    // Listen for errors
    archive.on('error', (err: any) => {
      reject(err);
    });

    // Add the src directory contents to the root of the zip
    archive.directory('src/', '/');

    archive.glob('node_modules/**', {
      ignore,
      cwd: process.cwd(),
    });

    // Add package.json and package-lock.json
    archive.file('package.json', { name: 'package.json' });
    archive.file('package-lock.json', { name: 'package-lock.json' });

    // Finalize the archive (this will trigger the 'end' event)
    archive.finalize();
  });
}
