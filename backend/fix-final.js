import fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

// Fix routes/device.ts result.sent
let dFile = project.getSourceFile('src/routes/device.ts');
let dText = dFile.getFullText();
dText = dText.replace('const result = socketManager.send(clientId, CMD.EXEC_SHELL', 'const result = await socketManager.send(clientId, CMD.EXEC_SHELL');
fs.writeFileSync('src/routes/device.ts', dText);

// Fix routes/files.ts result.sent
let fFile = project.getSourceFile('src/routes/files.ts');
let fText = fFile.getFullText();
fText = fText.replace('const result = socketManager.send(clientId, CMD.SEND_FILE', 'const result = await socketManager.send(clientId, CMD.SEND_FILE');
fs.writeFileSync('src/routes/files.ts', fText);

// Fix auth/index.ts buildAuth
let aFile = project.getSourceFile('src/auth/index.ts');
let aFunc = aFile.getFunction('buildAuth');
if (aFunc) {
  aFunc.setIsAsync(true);
  aFile.saveSync();
}

// Fix index.ts buildAuth caller
let idxFile = project.getSourceFile('src/index.ts');
let idxText = idxFile.getFullText();
idxText = idxText.replace('const auth = buildAuth();', 'const auth = await buildAuth();');
fs.writeFileSync('src/index.ts', idxText);

