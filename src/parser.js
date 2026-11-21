const position = /^(.*?):(\d+)(?::(\d+))?:\s*(.*)$/;
const linkerPrefix = /^(?:.*[\\/])?(?:[\w.+-]+-)?(?:ld(?:\.bfd|\.lld)?|lld)(?:\.exe)?:\s*/i;
const linkerMessage = /^(?:undefined reference to\b|multiple definition of\b|cannot find\b|cannot open\b|region\b.*overflowed by\b|section\b.*will not fit\b|relocation truncated\b)/i;
const noPosition = { file: null, line: null, column: null };

function parseLine(text) {
  const linker = linkerPrefix.test(text);
  const body = linker ? text.replace(linkerPrefix, "").replace(/^error:\s*/i, "") : text;
  const source = body.replace(/^.*(?:\.a\([^)]*\)|\.(?:obj|o)):\s*(?=.+?:\d+:)/i, "");
  const location = source.match(position);
  if (location) {
    const [, file, line, column, detail] = location;
    const compiler = /^(?:fatal )?error:\s*(.+)$/i.exec(detail);
    if (compiler || linkerMessage.test(detail)) {
      return {
        stage: compiler ? "Compile" : "Link",
        message: compiler ? compiler[1] : detail,
        file, line: Number(line), column: column ? Number(column) : null
      };
    }
  }
  // Archive members and section offsets identify objects, not source lines.
  const object = body.match(/^.*(?:\.(?:o|obj)|\.a\([^)]*\)):(?:\([^)]*\):)?\s*(.+)$/i);
  if (linkerMessage.test(object?.[1] ?? body)) {
    return { stage: "Link", message: object?.[1] ?? body, ...noPosition };
  }
  if (linker && !/\b(?:warning|note):|(?:^|:\s*)in function\b|^\s*$/i.test(body)) {
    return { stage: "Link", message: body, ...noPosition };
  }
  const driver = text.match(/^(?:.*[\\/])?(?:(?:[\w.+-]+-)?(?:gcc|g\+\+)|cc1(?:plus)?)(?:\.exe)?:\s*(?:fatal )?error:\s*(.+)$/);
  return driver ? { stage: "Compile", message: driver[1], ...noPosition } : null;
}

export function firstDiagnostic(log) {
  const lines = log.split(/\r\n?|\n/);
  for (const [index, raw] of lines.entries()) {
    const evidence = raw.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").trim();
    const diagnostic = parseLine(evidence);
    if (diagnostic) return { ...diagnostic, logLine: index + 1, evidence };
  }
  return null;
}

export function nextCheck({ stage, message }) {
  if (/no such file or directory|file not found/i.test(message))
    return "Check which component provides the missing file and whether the consuming component declares that dependency in CMakeLists.txt.";
  if (/undefined reference/i.test(message))
    return "Find the symbol definition and check that its source file is compiled into a component linked by this target.";
  if (/multiple definition/i.test(message))
    return "Locate both definitions and check which source file should own the symbol.";
  if (/overflowed|will not fit/i.test(message))
    return "Open the linker map and inspect the largest sections allocated to the named memory region.";
  if (/undeclared|not declared/i.test(message))
    return "Check where the identifier is declared and whether that declaration is visible at the reported use.";
  return stage === "Compile"
    ? "Inspect the reported expression and the statement immediately before it."
    : "Inspect the link command and map file for the object, library or memory region named in the diagnostic.";
}
