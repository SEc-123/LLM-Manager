import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as pythonAst from 'python-ast';
import { Project } from 'typescript';

interface CodeAnalysisResult {
  imports: string[];
  exports: string[];
  functions: {
    name: string;
    params: string[];
    returnType?: string;
    async: boolean;
    generator: boolean;
    loc: { start: { line: number; column: number }; end: { line: number; column: number } };
  }[];
  classes: {
    name: string;
    methods: string[];
    superClass?: string;
    loc: { start: { line: number; column: number }; end: { line: number; column: number } };
  }[];
  variables: {
    name: string;
    kind: 'const' | 'let' | 'var';
    type?: string;
    loc: { start: { line: number; column: number }; end: { line: number; column: number } };
  }[];
}

export class CodeAnalyzer {
  analyzeJavaScript(code: string): CodeAnalysisResult {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators'],
    });

    const result: CodeAnalysisResult = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      variables: [],
    };

    traverse(ast, {
      ImportDeclaration(path) {
        result.imports.push(path.node.source.value);
      },

      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (t.isFunctionDeclaration(path.node.declaration)) {
            result.exports.push(path.node.declaration.id?.name || 'anonymous');
          } else if (t.isVariableDeclaration(path.node.declaration)) {
            path.node.declaration.declarations.forEach((dec) => {
              if (t.isIdentifier(dec.id)) {
                result.exports.push(dec.id.name);
              }
            });
          }
        }
      },

      FunctionDeclaration(path) {
        if (path.node.id) {
          result.functions.push({
            name: path.node.id.name,
            params: path.node.params.map(param => 
              t.isIdentifier(param) ? param.name : 'unknown'
            ),
            async: path.node.async,
            generator: path.node.generator,
            loc: path.node.loc!,
          });
        }
      },

      ClassDeclaration(path) {
        if (path.node.id) {
          const methods = path.node.body.body
            .filter((member): member is t.ClassMethod => t.isClassMethod(member))
            .map(method => t.isIdentifier(method.key) ? method.key.name : 'unknown');

          result.classes.push({
            name: path.node.id.name,
            methods,
            superClass: path.node.superClass && t.isIdentifier(path.node.superClass) 
              ? path.node.superClass.name 
              : undefined,
            loc: path.node.loc!,
          });
        }
      },

      VariableDeclaration(path) {
        path.node.declarations.forEach((dec) => {
          if (t.isIdentifier(dec.id)) {
            result.variables.push({
              name: dec.id.name,
              kind: path.node.kind,
              loc: dec.loc!,
            });
          }
        });
      },
    });

    return result;
  }

  analyzePython(code: string): CodeAnalysisResult {
    const ast = pythonAst.parse(code);
    const result: CodeAnalysisResult = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      variables: [],
    };

    // 遍历 AST
    pythonAst.walk(ast, {
      Import(node) {
        node.names.forEach((name: any) => {
          result.imports.push(name.name);
        });
      },

      ImportFrom(node) {
        result.imports.push(`${node.module || ''}`);
      },

      FunctionDef(node) {
        result.functions.push({
          name: node.name,
          params: node.args.args.map((arg: any) => arg.arg),
          async: node.async,
          generator: false,
          loc: node.loc,
        });
      },

      ClassDef(node) {
        result.classes.push({
          name: node.name,
          methods: node.body
            .filter((item: any) => item.type === 'FunctionDef')
            .map((func: any) => func.name),
          superClass: node.bases[0]?.id?.name,
          loc: node.loc,
        });
      },

      Assign(node) {
        node.targets.forEach((target: any) => {
          if (target.type === 'Name') {
            result.variables.push({
              name: target.id,
              kind: 'var', // Python doesn't have const/let
              loc: target.loc,
            });
          }
        });
      },
    });

    return result;
  }

  analyzeTypeScript(code: string, filePath: string): CodeAnalysisResult {
    const project = new Project();
    const sourceFile = project.createSourceFile(filePath, code);
    
    const result: CodeAnalysisResult = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      variables: [],
    };

    // 分析导入
    sourceFile.getImportDeclarations().forEach(importDec => {
      result.imports.push(importDec.getModuleSpecifierValue());
    });

    // 分析导出
    sourceFile.getExportedDeclarations().forEach((declarations, name) => {
      result.exports.push(name);
    });

    // 分析函数
    sourceFile.getFunctions().forEach(func => {
      result.functions.push({
        name: func.getName() || 'anonymous',
        params: func.getParameters().map(param => param.getName()),
        returnType: func.getReturnType().getText(),
        async: func.isAsync(),
        generator: func.isGenerator(),
        loc: {
          start: sourceFile.getLineAndColumnAtPos(func.getStart()),
          end: sourceFile.getLineAndColumnAtPos(func.getEnd()),
        },
      });
    });

    // 分析类
    sourceFile.getClasses().forEach(cls => {
      result.classes.push({
        name: cls.getName(),
        methods: cls.getMethods().map(method => method.getName()),
        superClass: cls.getBaseClass()?.getName(),
        loc: {
          start: sourceFile.getLineAndColumnAtPos(cls.getStart()),
          end: sourceFile.getLineAndColumnAtPos(cls.getEnd()),
        },
      });
    });

    // 分析变量
    sourceFile.getVariableDeclarations().forEach(varDec => {
      result.variables.push({
        name: varDec.getName(),
        kind: varDec.isConstant() ? 'const' : 'let',
        type: varDec.getType().getText(),
        loc: {
          start: sourceFile.getLineAndColumnAtPos(varDec.getStart()),
          end: sourceFile.getLineAndColumnAtPos(varDec.getEnd()),
        },
      });
    });

    return result;
  }

  formatAnalysisResult(result: CodeAnalysisResult): string {
    let output = '';

    if (result.imports.length > 0) {
      output += 'Imports:\n';
      result.imports.forEach(imp => {
        output += `- ${imp}\n`;
      });
      output += '\n';
    }

    if (result.exports.length > 0) {
      output += 'Exports:\n';
      result.exports.forEach(exp => {
        output += `- ${exp}\n`;
      });
      output += '\n';
    }

    if (result.functions.length > 0) {
      output += 'Functions:\n';
      result.functions.forEach(func => {
        output += `- ${func.async ? 'async ' : ''}${func.generator ? 'generator ' : ''}${func.name}(${func.params.join(', ')})`;
        if (func.returnType) {
          output += `: ${func.returnType}`;
        }
        output += ` [Line: ${func.loc.start.line}]\n`;
      });
      output += '\n';
    }

    if (result.classes.length > 0) {
      output += 'Classes:\n';
      result.classes.forEach(cls => {
        output += `- ${cls.name}${cls.superClass ? ` extends ${cls.superClass}` : ''} [Line: ${cls.loc.start.line}]\n`;
        if (cls.methods.length > 0) {
          output += '  Methods:\n';
          cls.methods.forEach(method => {
            output += `  - ${method}\n`;
          });
        }
      });
      output += '\n';
    }

    if (result.variables.length > 0) {
      output += 'Variables:\n';
      result.variables.forEach(variable => {
        output += `- ${variable.kind} ${variable.name}${variable.type ? `: ${variable.type}` : ''} [Line: ${variable.loc.start.line}]\n`;
      });
    }

    return output;
  }
}