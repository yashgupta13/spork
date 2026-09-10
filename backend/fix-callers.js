import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

let changedFiles = new Set();

// Ensure all calls to dbHelpers methods have 'await'
for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;

  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (let i = calls.length - 1; i >= 0; i--) {
    const call = calls[i];
    const expr = call.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression && expr.getText().startsWith('dbHelpers.')) {
      
      // Make enclosing functions async
      const funcs = [
        call.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration),
        call.getFirstAncestorByKind(SyntaxKind.MethodDeclaration),
        call.getFirstAncestorByKind(SyntaxKind.ArrowFunction),
        call.getFirstAncestorByKind(SyntaxKind.FunctionExpression)
      ];
      
      for (const func of funcs) {
        if (func && !func.isAsync()) {
          func.setIsAsync(true);
          fileChanged = true;
        }
      }

      // Check if it's already awaited
      const parent = call.getParent();
      if (parent && parent.getKind() !== SyntaxKind.AwaitExpression) {
        call.replaceWithText(`(await ${call.getText()})`);
        fileChanged = true;
      }
    }
  }

  // Also fix socket.on arrow functions that might have awaited inside them now
  const socketOnCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of socketOnCalls) {
    if (call.getText().startsWith('socket.on')) {
       const args = call.getArguments();
       for (const arg of args) {
          if (arg.getKind() === SyntaxKind.ArrowFunction && !arg.isAsync()) {
             const awaits = arg.getDescendantsOfKind(SyntaxKind.AwaitExpression);
             if (awaits.length > 0) {
                 arg.setIsAsync(true);
                 fileChanged = true;
             }
          }
       }
    }
  }

  if (fileChanged) {
    sourceFile.saveSync();
    changedFiles.add(sourceFile.getFilePath());
  }
}

console.log("Refactored callers in files:", changedFiles.size);
