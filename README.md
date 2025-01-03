# Test File Generator

VS Code extension for automatically generating test files for React components.

## Features

- Supports TypeScript/TSX React components
- Configurable test file location and extension
- Customizable test templates through UI
- Default template using React Testing Library
- Auto-detects component name from exports


## Installation

1. Clone the repository:
   ```shell
   git clone https://github.com/cn-cxs/vscode-test-generator.git
   ```
2. Navigate to the project directory:
   ```shell
   cd vscode-test-generator
   ```
3. Install dependencies:
   ```shell
   npm install
   ```
4. Building
```shell
npm run compile
```
5. Packaging
```shell
npm install -g @vscode/vsce
# In project root
vsce package
```
6. Install VSIX file
```shell
# Method 1: VS Code GUI
# 1. Press Ctrl+Shift+P
# 2. Type "Install from VSIX"
# 3. Select the .vsix file

# Method 2: Command line
code --install-extension vscode-test-generator-0.0.1.vsix
```

<!-- ## Installation

1. Install from VS Code Marketplace
2. Search for "React Test Generator"
3. Click Install

## Usage

### Using Context Menu
1. Right-click on a React component file (.tsx/.ts)
2. Select "Generate React Test" from the context menu -->

### Using Command Palette
1. Open your React component file
2. Open Command Palette (Ctrl+Shift+P)
3. Type "Generate React Test"

## Configuration

Open configuration UI:
1. Command Palette (Ctrl+Shift+P)
2. Type "Open Test Generator Configuration"

Settings available:
- `testFileExtension`: Test file extension (test.tsx, spec.tsx, etc.)
- `testFilePath`: Directory for test files (default: `__tests__`)
- `testTemplate`: Customizable test template with variables:
  - `${componentName}`: Name of the React component
  - `${componentPath}`: Relative import path

## Examples

Generated test file structure:
```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComponentName from '../ComponentName';

describe('ComponentName', () => {
    it('should render successfully', () => {
        render(<ComponentName />);
        expect(screen).toBeTruthy();
    });
});
```
## Contributing

Feel free to submit issues or pull requests to improve the extension.

## License

This project is licensed under the MIT License.