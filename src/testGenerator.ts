import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

export class TestGenerator {
    private static readonly defaultTemplate = `import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import \${componentName} from '\${componentPath}';

describe('\${componentName}', () => {
    it('should render successfully', () => {
        render(<\${componentName} />);
        expect(screen).toBeTruthy();
    });
});`;

    public static async generateTest(uri: vscode.Uri) {
        const config = vscode.workspace.getConfiguration('testFileGenerator');
        const extension = config.get<string>('testFileExtension') || 'test.tsx';
        const testPath = config.get<string>('testFilePath') || '__tests__';
        const templateValue = config.get('testTemplate');
        const template = typeof templateValue === 'string' ? templateValue : this.defaultTemplate;

        const sourceFile = uri.fsPath;
        const sourceDir = path.dirname(sourceFile);
        const fileName = path.basename(sourceFile, path.extname(sourceFile));
        const componentName = this.getExportedComponentName(sourceFile);

        // Create test directory if it doesn't exist
        const testDir = path.join(sourceDir, testPath);
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        const testFile = path.join(testDir, `${fileName}.${extension}`);
        
        // Generate import path without extension
        const relativePath = path.relative(testDir, sourceFile)
            .replace(/\\/g, '/')
            .replace(/\.[^/.]+$/, ''); // Remove file extension
        
        const componentPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;

        const testContent = this.generateTestContent(template, {
            fileName,
            componentName,
            componentPath
        });

        fs.writeFileSync(testFile, testContent);
        const testFileUri = vscode.Uri.file(testFile);
        await vscode.window.showTextDocument(testFileUri);
    }

    private static getExportedComponentName(filePath: string): string {
        const source = fs.readFileSync(filePath, 'utf-8');
        const sourceFile = ts.createSourceFile(
            filePath,
            source,
            ts.ScriptTarget.Latest,
            true
        );

        let exportedName = '';

        function visit(node: ts.Node) {
            if (ts.isExportAssignment(node) && node.isExportEquals === undefined) {
                if (ts.isIdentifier(node.expression)) {
                    exportedName = node.expression.text;
                }
            }
            if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
                if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
                    node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) {
                    exportedName = node.name?.text || '';
                }
            }
            ts.forEachChild(node, visit);
        }

        visit(sourceFile);
        
        if (!exportedName) {
            // Fallback to filename if no export found
            exportedName = path.parse(filePath).name;
        }
        
        return exportedName;
    }

    private static generateTestContent(template: string, variables: Record<string, string>): string {
        return Object.entries(variables).reduce((result, [key, value]) => {
            return result.replace(new RegExp(`\\$\{${key}\}`, 'g'), value);
        }, template);
    }
}