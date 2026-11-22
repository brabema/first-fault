import { test } from "node:test";
import assert from "node:assert/strict";
import { firstDiagnostic, nextCheck } from "../src/parser.js";
import { diagnosticPrompt } from "../src/prompt.js";
import { samples } from "../src/samples.js";

const cases = [
  [samples[0].title, samples[0].log, ["Compile", "main/main.c", 8, 10, 4]],
  [samples[1].title, samples[1].log, ["Link", "/workspace/main/main.c", 24, null, 5]],
  [samples[2].title, samples[2].log, ["Link", null, null, null, 3]],
  [samples[3].title, samples[3].log, null],
  [samples[4].title, samples[4].log, ["Runtime", "/workspace/main/sensor_bus.c", 47, null, 5]],
  [samples[5].title, samples[5].log, ["Runtime", "/workspace/main/sensor.c", 84, null, 2]],
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

test("panic prompt uses decoded frames and build context", () => {
  const panic = firstDiagnostic(samples[4].log);
  assert.equal(panic.core, "0");
  assert.equal(panic.pc, "0x400d12a1");
  assert.equal(panic.faultAddress, "0x00000000");
  assert.equal(panic.build["esp-idf"], "v5.4.2");
  assert.equal(panic.frames[0].function, "sensor_bus_read");
  const prompt = diagnosticPrompt(panic, samples[4].buildContext);
  assert.match(prompt, /What to change/);
  assert.match(prompt, /sensor_bus_init/);
  assert.match(prompt, /v5\.4\.2/);
  assert.doesNotMatch(prompt, /I \(273\)/);
});

test("raw panic leaves the source blank and stops at a reboot", () => {
  const panic = firstDiagnostic([
    "Guru Meditation Error: Core 0 panic'ed (StoreProhibited).",
    "Backtrace: 0x400d12a1:0x3ffb1ee0",
    "Rebooting...",
    "0x400d12a1: unrelated at /workspace/main/main.c:5"
  ].join("\n"));
  assert.equal(panic.file, null);
  assert.equal(panic.pc, "0x400d12a1");
  assert.deepEqual(panic.frames, []);
  assert.match(nextCheck(panic), /ELF that matches/);
});

test("assert uses the explicit location and keeps its abort backtrace", () => {
  const panic = firstDiagnostic([
    "assert failed: sensor_init C:\\Work\\Board Project\\sensor.c:27 (address != 0)",
    "abort() was called at PC 0x400836f9 on core 0",
    "Backtrace: 0x400836f9:0x3ffb1ee0",
    "0x400836f9: panic_abort at /esp-idf/panic.c:20"
  ].join("\n"));
  assert.equal(panic.file, "C:\\Work\\Board Project\\sensor.c");
  assert.equal(panic.line, 27);
  assert.equal(panic.frames.length, 1);
});

test("build diagnostic prompt stays independent of runtime context", () => {
  const prompt = diagnosticPrompt(firstDiagnostic(samples[0].log), "Unrelated runtime context");
  assert.match(prompt, /sensor_bus\.h/);
  assert.doesNotMatch(prompt, /Unrelated runtime context/);
});
