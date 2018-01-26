const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const outputPath = path.join(__dirname, '..', 'dist');
const outputArtifact = path.join(outputPath, 'handler.zip');
const handlerPath = path.join(outputPath, 'handler.js');

const output = fs.createWriteStream(outputArtifact);
const archive = archiver('zip', {
  zlib: { level: 9 }, // Sets the compression level.
});

archive.pipe(output);

console.log(`Archiving ${handlerPath}`);
archive.append(fs.readFileSync(handlerPath), { name: 'handler.js' });

console.log(`Archiving ${nodeModulesPath}`);
archive.directory(nodeModulesPath, 'node_modules');
archive.finalize();

