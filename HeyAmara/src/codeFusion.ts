import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { llm } from './llm';
import { logger } from './telemetry';

export interface CodeDiagnostic {
  file: string;
  line: number;
  message: string;
  code: number;
  severity: string;
}

export interface CodeFix {
  diagnostic: CodeDiagnostic;
  suggestion: string;
  confidence: number;
}

export class CodeFusionEngine {
  private compilerOptions: ts.CompilerOptions;

  constructor(rootDir: string = process.cwd()) {
    const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, 'tsconfig.json');
    if (!configPath) {
      this.compilerOptions = {
        noEmit: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
      };
    } else {
      const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
      const { options } = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath));
      this.compilerOptions = options;
    }
  }

  analyzeFile(filePath: string): CodeDiagnostic[] {
    const program = ts.createProgram([filePath], this.compilerOptions);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const result: CodeDiagnostic[] = [];

    for (const diagnostic of diagnostics) {
      if (diagnostic.file && diagnostic.start) {
        const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        result.push({
          file: diagnostic.file.fileName,
          line: line + 1,
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          code: diagnostic.code,
          severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
        });
      }
    }

    return result;
  }

  async suggestFix(filePath: string, diagnostics: CodeDiagnostic[]): Promise<CodeFix[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fixes: CodeFix[] = [];

    for (const diag of diagnostics) {
      const prompt = `
      You are an expert TypeScript developer.
      Analyze this error in file: ${filePath} at line ${diag.line}.
      Error code: ${diag.code}
      Message: ${diag.message}
      
      Source Code Context:
      \`\`\`typescript
      ${this.getContext(content, diag.line)}
      \`\`\`
      
      Provide a corrected code snippet to fix this error. 
      Return ONLY the corrected code block.
      `;

      try {
        const response = await llm.ask('You are a code repair agent.', prompt);
        let suggestion = response.content.trim();
        // Strip markdown blocks if present
        if (suggestion.startsWith('```')) {
          suggestion = suggestion.replace(/^```(typescript|ts)?\n/, '').replace(/\n```$/, '');
        }

        fixes.push({
          diagnostic: diag,
          suggestion,
          confidence: 0.85, // Placeholder confidence from LLM
        });
      } catch (error) {
        logger.error({ error, file: filePath }, 'CodeFusion fix generation failed');
      }
    }

    return fixes;
  }

  private getContext(content: string, line: number, window = 5): string {
    const lines = content.split('\n');
    const start = Math.max(0, line - window - 1);
    const end = Math.min(lines.length, line + window);
    return lines.slice(start, end).join('\n');
  }
}

export const codeFusion = new CodeFusionEngine();
