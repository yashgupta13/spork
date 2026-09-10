import fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  // 1. Fix return types of async functions: change T to Promise<T>
  const funcs = [...sourceFile.getFunctions(), ...sourceFile.getClasses().flatMap(c => c.getMethods())];
  for (const func of funcs) {
    if (func.isAsync()) {
      const returnTypeNode = func.getReturnTypeNode();
      if (returnTypeNode && !returnTypeNode.getText().startsWith('Promise<')) {
        returnTypeNode.replaceWithText(`Promise<${returnTypeNode.getText()}>`);
        changed = true;
      }
    }
  }

  // 2. Fix socket.on async arrow functions
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of calls) {
    const awaitExprs = call.getDescendantsOfKind(SyntaxKind.AwaitExpression);
    if (awaitExprs.length > 0) {
      const arrow = call.getFirstAncestorByKind(SyntaxKind.ArrowFunction);
      if (arrow && !arrow.isAsync()) {
        arrow.setIsAsync(true);
        changed = true;
      }
    }
  }

  // 3. Fix result.changes -> result.rowCount
  const propAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
  for (const prop of propAccesses) {
    if (prop.getName() === 'changes') {
      prop.getNameNode().replaceWithText('rowCount');
      changed = true;
    }
  }

  if (changed) sourceFile.saveSync();
}
