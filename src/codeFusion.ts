import * as ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { llm } from './llm';
import { logger } from './telemetry';

export interface CodeDiagnostic {
  file: string;
  line: number;
  character: number;
  message: string;
  code: string | number;
  severity: 'error' | 'warning' | 'info';
}

export interface FixSuggestion {
  filePath: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
}

export class CodeFusionEngine {
  private compilerOptions: ts.CompilerOptions;

  constructor() {
    this.compilerOptions = {
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      strict: true,
    };
  }

  analyzeFile(filePath: string): CodeDiagnostic[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const program = ts.createProgram([filePath], this.compilerOptions);
    const sourceFile = program.getSourceFile(filePath);
    
    if (!sourceFile) {
      throw new Error(`Could not load source file: ${filePath}`);
    }

    const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
    const results: CodeDiagnostic[] = [];

    diagnostics.forEach(diagnostic => {
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        
        results.push({
          file: diagnostic.file.fileName,
          line: line + 1,
          character: character + 1,
          message: message,
          code: diagnostic.code,
          severity: this.mapSeverity(diagnostic.category)
        });
      }
    });

    return results;
  }

  async suggestFix(filePath: string, diagnostics: CodeDiagnostic[]): Promise<FixSuggestion | null> {
    if (diagnostics.length === 0) return null;

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const errorList = diagnostics.map(d => 
        `- Line ${d.line}: ${d.message} (Code: ${d.code})`
      ).join('\n');

      const systemPrompt = `You are a senior TypeScript engineer. Analyze the following code and the reported errors.
Provide a corrected version of the code that fixes the errors.
Output your response in JSON format with the following structure:
{
  "explanation": "Brief explanation of the fix",
  "fixedCode": "The complete fixed code block"
}
Do not include markdown formatting or backticks in the JSON content values.`;

      const userPrompt = `FILE: ${filePath}
CONTENT:
${fileContent}

ERRORS:
${errorList}

Please provide the fix.`;

      const response = await llm.ask(systemPrompt, userPrompt);
      
      try {
        const result = JSON.parse(response.content);
        return {
          filePath,
          originalCode: fileContent,
          suggestedCode: result.fixedCode,
          explanation: result.explanation
        };
      } catch (parseError) {
        logger.error({ parseError, content: response.content }, 'Failed to parse LLM response for fix suggestion');
        return null;
      }

    } catch (error) {
      logger.error({ error }, 'Error generating fix suggestion');
      return null;
    }
  }

  private mapSeverity(category: ts.DiagnosticCategory): 'error' | 'warning' | 'info' {
    switch (category) {
      case ts.DiagnosticCategory.Error: return 'error';
      case ts.DiagnosticCategory.Warning: return 'warning';
      case ts.DiagnosticCategory.Message: return 'info';
      case ts.DiagnosticCategory.Suggestion: return 'info';
      default: return 'error';
    }
  }
}

export const codeFusion = new CodeFusionEngine();
