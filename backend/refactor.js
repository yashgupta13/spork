import fs from 'fs';
import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

let changedFiles = new Set();

function processFile(sourceFile) {
  let fileChanged = false;

  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (let i = calls.length - 1; i >= 0; i--) {
    const call = calls[i];
    const propAccess = call.getExpressionIfKind(SyntaxKind.PropertyAccessExpression);
    if (!propAccess) continue;
    
    const name = propAccess.getName();
    if (!['get', 'all', 'run'].includes(name)) continue;

    const caller = propAccess.getExpression();
    const callerText = caller.getText();
    const isDbCall = callerText.includes('d.') || callerText.includes('getDb()') || callerText.includes('from(') || callerText.includes('where(') || callerText.includes('set(') || callerText.includes('values(') || callerText.includes('orderBy(') || callerText.includes('groupBy(') || callerText.includes('onConflictDoUpdate(');
    
    if (isDbCall) {
      // Find enclosing function before replacing
      const func = call.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) || 
                   call.getFirstAncestorByKind(SyntaxKind.MethodDeclaration) ||
                   call.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ||
                   call.getFirstAncestorByKind(SyntaxKind.FunctionExpression);
                   
      if (name === 'get') {
        call.replaceWithText(`(await ${callerText}.limit(1))[0]`);
      } else if (name === 'all') {
        call.replaceWithText(`(await ${callerText})`);
      } else if (name === 'run') {
        call.replaceWithText(`await ${callerText}`);
      }
      fileChanged = true;
      
      if (func && !func.isAsync()) {
        func.setIsAsync(true);
      }
    }
  }

  if (fileChanged) {
    sourceFile.saveSync();
    changedFiles.add(sourceFile.getFilePath());
  }
}

for (const sourceFile of project.getSourceFiles()) {
  processFile(sourceFile);
}

console.log("Refactored files:", changedFiles.size);
