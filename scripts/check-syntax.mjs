import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() && !["node_modules", ".next", ".git"].includes(e.name)
        ? walk(path.join(dir, e.name))
        : e.isFile()
          ? [path.join(dir, e.name)]
          : [],
    );
let errors = 0,
  files = 0;
for (const filename of walk(".").filter((p) => /\.(ts|tsx)$/.test(p) && !p.endsWith(".d.ts"))) {
  files++;
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  for (const diagnostic of result.diagnostics || [])
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errors++;
      console.error(filename, ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
}
console.log(
  `${files} TypeScript/TSX files parsed; ${errors} syntax errors. This is not full typechecking.`,
);
process.exitCode = errors ? 1 : 0;
