import { firstDiagnostic, nextCheck } from "./parser.js";
import { samples } from "./samples.js";

const $ = id => document.getElementById(id);
const env = import.meta.env;
const useDebugAppCheck = env.DEV && env.VITE_LOCAL_APPCHECK_DEBUG === "true"
  && ["localhost", "127.0.0.1"].includes(location.hostname);
const configured = [env.VITE_FIREBASE_API_KEY, env.VITE_FIREBASE_PROJECT_ID, env.VITE_FIREBASE_APP_ID].every(Boolean)
  && (useDebugAppCheck || Boolean(env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY));
let diagnostic, explain, request = 0;
let setup = configured ? "Connecting to Firebase…" : "Local analysis is ready. Configure Firebase and App Check to enable Gemini.";
function resetExplanation() {
  request++;
  $("ai-output").textContent = setup;
  $("explain").disabled = !(diagnostic && explain);
}
function show(d, emptyText) {
  diagnostic = d;
  const runtime = d?.stage === "Runtime";
  $("empty").hidden = !!d;
  $("empty").textContent = emptyText;
  $("finding").hidden = !d;
  $("stage").textContent = d?.stage ?? "";
  $("runtime-meta").hidden = !runtime;
  $("runtime-details").hidden = !runtime;
  $("context-panel").hidden = !runtime;
  if (d) {
    $("source-line").textContent = (runtime ? "RUNTIME LOG" : "BUILD OUTPUT") + " · LINE " + d.logLine;
    for (const key of ["message", "file", "line", "column", "evidence"]) {
      $(key).textContent = d[key] ?? "Unreported";
    }
    $("check").textContent = nextCheck(d);
  }
  if (runtime) {
    const facts = [
      d.core !== null && "Core " + d.core, d.task && "Logged task " + d.task,
      d.pc && "PC " + d.pc, d.faultAddress && "Fault address " + d.faultAddress
    ].filter(Boolean);
    $("runtime-meta").textContent = facts.join(" · ");
    $("runtime-meta").hidden = facts.length === 0;
    const frames = d.frames.map(frame => `${frame.function} at ${frame.file}:${frame.line}`);
    const build = Object.entries(d.build).map(([key, value]) => `${key}: ${value}`);
    $("runtime-evidence").textContent = [d.backtrace, ...frames, ...build].filter(Boolean).join("\n")
      || "No backtrace or build metadata in this excerpt.";
    $("runtime-details").open = false;
  }
  resetExplanation();
}
function count() {
  const log = $("log").value;
  $("count").textContent = (log ? log.split(/\r\n?|\n/).length : 0) + " lines";
}
function analyze() {
  const log = $("log").value;
  count();
  show(firstDiagnostic(log), log.trim() ? "No recognized build or runtime failure in this output." : "Paste build or monitor output, or choose a sample.");
}
$("sample").add(new Option("Choose a sample", ""));
samples.forEach((sample, i) => $("sample").add(new Option(sample.title, i)));
$("sample").onchange = () => {
  if ($("sample").value === "") return;
  const sample = samples[Number($("sample").value)];
  $("log").value = sample.log;
  $("build-context").value = sample.buildContext ?? "";
  analyze();
};
$("log").oninput = () => {
  if ($("sample").value !== "") $("build-context").value = "";
  $("sample").value = "";
  count();
  show(null, "Run Analyze log to inspect the edited output.");
};
$("analyze").onclick = analyze;
$("mode").onchange = resetExplanation;
$("build-context").oninput = resetExplanation;
$("explain").onclick = async () => {
  if (!diagnostic || !explain) return;
  const current = ++request;
  const mode = $("mode").value;
  $("explain").disabled = true;
  $("ai-output").textContent = mode === "device"
    ? "Waiting for on-device Gemini. The first model download may take several minutes."
    : "Waiting for Gemini…";
  try {
    const result = await explain(diagnostic, mode, $("build-context").value);
    if (current === request) $("ai-output").textContent = result;
  } catch (error) {
    if (current === request) {
      $("ai-output").textContent = mode === "device" && error.code === "AI/api-not-enabled"
        ? "Gemini Nano is unavailable in this browser or on this device. Try an up-to-date desktop Chrome on a compatible device, or select On-device + cloud fallback and click Explain error again."
        : "Gemini could not complete the request. " + (error.message || error.code || "Check model availability and App Check.");
    }
  } finally {
    if (current === request) $("explain").disabled = false;
  }
};
$("sample").value = "0";
$("sample").onchange();
if (configured) {
  import("./ai.js").then(({ createExplainer }) => {
    explain = createExplainer(env, useDebugAppCheck);
    setup = "Ready. Explain error will use the selected inference mode.";
  }).catch(() => {
    setup = "Firebase setup failed. Check the web app configuration and reload.";
  }).finally(resetExplanation);
}
