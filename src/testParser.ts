import * as ts from 'typescript';
import * as fs from 'fs';

export class TestParser {
    static getExportedComponentName(filePath: string): string {
        const source = fs.readFileSync(filePath, 'utf-8');
        const sourceFile = ts.createSourceFile(
            filePath,
            source,
            ts.ScriptTarget.Latest,
            true
        );

        let exportedName = '';
        
        function visit(node: ts.Node) {
            if (ts.isExportDeclaration(node)) {
                const exportClause = node.exportClause;
                if (exportClause && ts.isNamedExports(exportClause)) {
                    exportedName = exportClause.elements[0]?.name.text || '';
                }
            }
            if (ts.isExportAssignment(node)) {
                if (ts.isIdentifier(node.expression)) {
                    exportedName = node.expression.text;
                }
            }
            if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
                if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
                    exportedName = node.name?.text || '';
                }
            }
            ts.forEachChild(node, visit);
        }

        visit(sourceFile);
        return exportedName;
    }
}