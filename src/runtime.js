const runtimeHead = /^(?:Guru Meditation Error:|assert failed:|abort\(\) was called|ESP_ERROR_CHECK failed:|(?:[EWI]\s+\(\d+\)\s+)?task_wdt:\s*Task watchdog got triggered\b|(?:\*\*\*ERROR\*\*\*\s*)?A stack overflow in task\b|Brownout detector was triggered\b|CORRUPT HEAP:)/i;
const assertionLocation = /^assert failed:\s+\S+\s+(.+?):(\d+)\s+\(/i;
const errorCheckLocation = /\bfile:\s*"([^"]+)"\s+line\s+(\d+)/i;
const decodedFrame = /^(?:0x[\da-f]+:\s*|\(inlined by\)\s*)(.+?)\s+at\s+(.+?):(\d+)(?:\s+\(discriminator \d+\))?$/i;
const buildInfoLine = /^(?:[IWE]\s+\(\d+\)\s+(?:app_init|cpu_start|boot(?:\.[\w.]+)?):\s*)?(Project name|App version|ESP-IDF|ELF file SHA256|IDF_TARGET|Build type)\s*[:=]\s*(.+)$/i;
const reboot = /^(?:Rebooting\.\.\.|rst:|ESP-ROM:|ets \w{3} )/i;
const firstTraceAddress = /^(?:Backtrace:\s*)?(0x[\da-f]+)(?::0x[\da-f]+)?/i;

export function isRuntimeDiagnostic(line) {
  return runtimeHead.test(line);
}

export function runtimeDiagnostic(lines, index) {
  const evidence = lines[index];
  const build = {};
  for (let i = index - 1; i >= 0; i--) {
    if (reboot.test(lines[i]) || isRuntimeDiagnostic(lines[i])) break;
    const entry = lines[i].match(buildInfoLine);
    if (entry) {
      const key = entry[1].toLowerCase();
      build[key] ??= entry[2].slice(0, 160);
    }
  }

  let location = evidence.match(assertionLocation);
  let backtrace = "";
  let faultAddress = null;
  let task = evidence.match(/\bstack overflow in task\s+(.+?)\s+has been detected/i)?.[1] ?? null;
  const frames = [];
  for (const line of lines.slice(index + 1, index + 81)) {
    if (reboot.test(line) || (isRuntimeDiagnostic(line) && !/^abort\(\) was called/i.test(line))) break;
    location ??= line.match(errorCheckLocation);
    if (!backtrace && /^(?:Backtrace:|Stack trace:)/i.test(line)) backtrace = line.slice(0, 900);
    faultAddress ??= line.match(/\b(?:EXCVADDR|MTVAL)\s*:\s*(0x[\da-f]+)/i)?.[1] ?? null;
    task ??= line.match(/\bCPU\s+\d+:\s*([^\s,]+)/i)?.[1] ?? null;
    const frame = line.match(decodedFrame);
    if (frame && frames.length < 8) {
      frames.push({ function: frame[1], file: frame[2], line: Number(frame[3]) });
    }
  }
  const reportedLocation = location ? { file: location[1], line: Number(location[2]) } : frames[0];
  return {
    stage: "Runtime",
    message: evidence.replace(/^[EWI]\s+\(\d+\)\s+task_wdt:\s*/i, ""),
    file: reportedLocation?.file ?? null,
    line: reportedLocation?.line ?? null,
    column: null,
    core: evidence.match(/\bcore\s+(\d+)/i)?.[1] ?? null,
    task,
    pc: (backtrace.replace(/^Stack trace:\s*/i, "").match(firstTraceAddress) ?? evidence.match(/\bPC\s+(0x[\da-f]+)/i))?.[1] ?? null,
    faultAddress,
    backtrace,
    frames,
    build,
    logLine: index + 1,
    evidence
  };
}

export function runtimeNextCheck(diagnostic) {
  if (diagnostic.pc && !diagnostic.file)
    return "Decode the backtrace with IDF Monitor and the ELF that matches the flashed firmware.";
  if (/LoadProhibited|StoreProhibited|access fault/i.test(diagnostic.message))
    return "Inspect the pointer used at the reported frame. Trace where it is initialized and check its lifetime and bounds.";
  if (/watchdog/i.test(diagnostic.message))
    return "Check the named task or core for work that runs too long. Inspect loops, blocking calls, and critical sections in the backtrace.";
  if (/stack overflow|stack canary/i.test(diagnostic.message))
    return "Measure the task's stack high-water mark and review large local buffers or deep calls before adjusting its stack size.";
  if (/assert failed|ESP_ERROR_CHECK failed/i.test(diagnostic.message))
    return "Inspect the failed condition or return code and handle the failure before continuing through that call path.";
  if (/brownout/i.test(diagnostic.message))
    return "Measure the supply voltage during peak load and check power delivery to the board.";
  if (/CORRUPT HEAP/i.test(diagnostic.message))
    return "Review recent buffer writes and frees, and enable heap integrity checks to narrow down where corruption begins.";
  return "Inspect the first decoded frame and the calls leading up to the panic.";
}
