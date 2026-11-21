import { test } from "node:test";
import assert from "node:assert/strict";
import { firstDiagnostic } from "../src/parser.js";
import { samples } from "../src/samples.js";

const cases = [
  [samples[0].title, samples[0].log, ["Compile", "main/main.c", 8, 10, 4]],
  [samples[1].title, samples[1].log, ["Link", "/workspace/main/main.c", 24, null, 5]],
  [samples[2].title, samples[2].log, ["Link", null, null, null, 3]],
  [samples[3].title, samples[3].log, null],
  ["Windows path and ANSI", "note: previous declaration\r\n\x1b[31mC:\\My Project\\app.cpp:41: error: expected ';'\x1b[0m", ["Compile", "C:\\My Project\\app.cpp", 41, null, 2]],
  ["Warnings before cascade", "main.c:1:2: warning: unused\nmain.c:11:3: error: undeclared\nmain.c:12:2: error: cascading", ["Compile", "main.c", 11, 3, 2]],
  ["Object offset", "foo.a(main.c.obj):(.text.app_main+0x24): undefined reference to 'f'", ["Link", null, null, null, 1]],
  ["Driver without a source", "riscv32-esp-elf-gcc.exe: fatal error: no input files", ["Compile", null, null, null, 1]],
  ["Linker warning", "xtensa-esp32-elf-ld: warning: executable segment", null],
  ["Archive with a source path", "riscv32-esp-elf-ld: main.a(foo.obj):C:\\Work\\foo.c:19: undefined reference to 'f'", ["Link", "C:\\Work\\foo.c", 19, null, 1]],
  ["Build summary only", "FAILED: main.elf\ncollect2: error: ld returned 1 exit status\nninja: build stopped: subcommand failed.", null],
  ["Blank input", "", null]
];
for (const [name, log, expected] of cases) {
  test(name, () => {
    const d = firstDiagnostic(log);
    assert.deepEqual(d && [d.stage, d.file, d.line, d.column, d.logLine], expected);
    if (d) assert.ok(d.evidence.includes(d.message));
  });
}
