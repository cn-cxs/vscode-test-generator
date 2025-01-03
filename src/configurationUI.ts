import * as vscode from 'vscode';

export class ConfigurationUI {
    private static panel: vscode.WebviewPanel | undefined;
    
    private static readonly defaultTemplate = 
`import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import \${componentName} from '\${componentPath}';

describe('\${componentName}', () => {
    it('should render successfully', () => {
        render(<\${componentName} />);
        expect(screen).toBeTruthy();
    });
});`;

    public static show(context: vscode.ExtensionContext) {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'testGeneratorConfig',
            'Test Generator Configuration',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(async message => {
            console.log('Received message:', message);
            try {
                switch (message.command) {
                    case 'saveConfig':
                        await this.saveConfiguration(message.config);
                        await this.panel?.webview.postMessage({ command: 'saveSuccess' });
                        break;
                    case 'getConfig':
                        const config = this.getCurrentConfig();
                        await this.panel?.webview.postMessage({ 
                            command: 'updateConfig', 
                            config: config 
                        });
                        break;
                }
            } catch (error) {
                console.error('Error handling message:', error);
                vscode.window.showErrorMessage(`Failed to save: ${error}`);
            }
        });
    }

    private static getCurrentConfig() {
        const config = vscode.workspace.getConfiguration('testFileGenerator');
        const templateValue = config.get('testTemplate');
        
        // Convert template to string if it's an object
        const template = typeof templateValue === 'string' 
            ? templateValue 
            : this.defaultTemplate;

        return {
            testFileExtension: config.get('testFileExtension') || 'test.tsx',
            testFilePath: config.get('testFilePath') || '__tests__',
            testTemplate: template
        };
    }

    private static async saveConfiguration(config: any) {
        if (!config) {
            throw new Error('Invalid configuration');
        }

        const configuration = vscode.workspace.getConfiguration('testFileGenerator');
        await configuration.update('testFileExtension', config.testFileExtension, true);
        await configuration.update('testFilePath', config.testFilePath, true);
        await configuration.update('testTemplate', config.testTemplate, true);
        
        vscode.window.showInformationMessage('Configuration saved successfully!');
    }

    private static getWebviewContent() {
        const config = this.getCurrentConfig();
        const escapedTemplate = String(config.testTemplate)
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { padding: 20px; font-family: Arial, sans-serif; }
                    .form-group { margin-bottom: 15px; }
                    label { display: block; margin-bottom: 5px; font-weight: bold; }
                    input, select { width: 100%; padding: 8px; }
                    .code-editor { 
                        width: 100%; 
                        height: 400px; 
                        font-family: 'Courier New', monospace;
                        padding: 8px;
                        background: #1e1e1e;
                        color: #d4d4d4;
                        white-space: pre;
                        tab-size: 4;
                    }
                    button { padding: 8px 15px; background: #007acc; color: white; border: none; cursor: pointer; }
                    .save-feedback {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        padding: 10px;
                        background: #4CAF50;
                        color: white;
                        border-radius: 4px;
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div class="form-group">
                    <label>Test File Extension</label>
                    <select id="testFileExtension">
                        <option value="test.tsx">test.tsx</option>
                        <option value="spec.tsx">spec.tsx</option>
                        <option value="test.ts">test.ts</option>
                        <option value="spec.ts">spec.ts</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Test File Path</label>
                    <input type="text" id="testFilePath" />
                </div>
                <div class="form-group">
                    <label>Test Template (Available variables: \${componentName}, \${componentPath})</label>
                    <textarea class="code-editor" id="testTemplate" spellcheck="false"></textarea>
                </div>
                <button onclick="saveConfig()">Save Configuration</button>
                <div id="saveFeedback" class="save-feedback">Configuration Saved!</div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Initialize form
                    document.getElementById('testFileExtension').value = '${config.testFileExtension}';
                    document.getElementById('testFilePath').value = '${config.testFilePath}';
                    document.getElementById('testTemplate').value = \`${escapedTemplate}\`;

                    // Add Ctrl+S handler with capture phase
                    window.addEventListener('keydown', function(e) {
                        console.log('Key pressed:', e.key);
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                            console.log('Ctrl+S detected');
                            e.preventDefault();
                            e.stopPropagation();
                            saveConfig();
                            return false;
                        }
                    }, true);

                    function showSaveFeedback() {
                        const feedback = document.getElementById('saveFeedback');
                        feedback.style.display = 'block';
                        setTimeout(() => {
                            feedback.style.display = 'none';
                        }, 2000);
                    }

                    function saveConfig() {
                        const newConfig = {
                            testFileExtension: document.getElementById('testFileExtension').value,
                            testFilePath: document.getElementById('testFilePath').value,
                            testTemplate: document.getElementById('testTemplate').value
                        };
                        vscode.postMessage({ command: 'saveConfig', config: newConfig });
                        showSaveFeedback();
                    }
                </script>
            </body>
            </html>
        `;
    }
}