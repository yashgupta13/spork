import fs from 'fs';
import { Project, SyntaxKind, TypeGuards } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

const dbFile = project.getSourceFile('src/db/index.ts');
let changed = false;

// Fix limit(1).limit(1)
const propAccesses = dbFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
for (const p of propAccesses) {
  const text = p.getText();
  if (text.includes('.limit(1).limit(1)')) {
     p.replaceWithText(text.replace('.limit(1).limit(1)', '.limit(1)'));
     changed = true;
  }
}

// Fix object methods missing Promise return type
const funcs = [
  ...dbFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
  ...dbFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
  ...dbFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
  ...dbFile.getDescendantsOfKind(SyntaxKind.FunctionExpression)
];

for (const func of funcs) {
  if (func.isAsync()) {
    const returnTypeNode = func.getReturnTypeNode();
    if (returnTypeNode && !returnTypeNode.getText().startsWith('Promise<') && !returnTypeNode.getText().startsWith('Promise ')) {
      returnTypeNode.replaceWithText(`Promise<${returnTypeNode.getText()}>`);
      changed = true;
    }
  }
}

if (changed) dbFile.saveSync();

