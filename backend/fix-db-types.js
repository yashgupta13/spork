import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const dbFile = project.getSourceFile('src/db/index.ts');

let changed = false;

// 1. Fix .limit(1).limit(1) mistake if any
const propAccesses = dbFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
for (const p of propAccesses) {
  if (p.getText().includes('.limit(1).limit(1)')) {
    p.replaceWithText(p.getText().replace('.limit(1).limit(1)', '.limit(1)'));
    changed = true;
  }
}

// 2. Fix result.changes -> result.rowCount
const propAccesses2 = dbFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
for (const p of propAccesses2) {
  if (p.getName() === 'changes') {
    p.getNameNode().replaceWithText('rowCount');
    changed = true;
  }
}

// 3. Fix return types
const funcs = [
  ...dbFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
  ...dbFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
  ...dbFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
  ...dbFile.getDescendantsOfKind(SyntaxKind.FunctionExpression)
];

for (const func of funcs) {
  if (func.isAsync()) {
    const returnTypeNode = func.getReturnTypeNode();
    if (returnTypeNode) {
      const typeText = returnTypeNode.getText();
      if (!typeText.startsWith('Promise<') && !typeText.startsWith('Promise ')) {
        returnTypeNode.replaceWithText(`Promise<${typeText}>`);
        changed = true;
      }
    }
  }
}

if (changed) dbFile.saveSync();
