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
  $("empty").hidden = !!d;
  $("empty").textContent = emptyText;
  $("finding").hidden = !d;
  $("stage").textContent = d?.stage ?? "";
  if (d) {
    $("source-line").textContent = "BUILD OUTPUT · LINE " + d.logLine;
    for (const key of ["message", "file", "line", "column", "evidence"]) {
      $(key).textContent = d[key] ?? "Unreported";
    }
    $("check").textContent = nextCheck(d);
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
  show(firstDiagnostic(log), log.trim() ? "No recognized compiler or linker diagnostic in this output." : "Paste a build log or choose a sample.");
}
$("sample").add(new Option("Choose a sample", ""));
samples.forEach((sample, i) => $("sample").add(new Option(sample.title, i)));
$("sample").onchange = () => {
  if ($("sample").value === "") return;
  $("log").value = samples[Number($("sample").value)].log;
  analyze();
};
$("log").oninput = () => {
  $("sample").value = "";
  count();
  show(null, "Run Analyze log to inspect the edited output.");
};
$("analyze").onclick = analyze;
$("mode").onchange = resetExplanation;
$("explain").onclick = async () => {
  if (!diagnostic || !explain) return;
  const current = ++request;
  $("explain").disabled = true;
  $("ai-output").textContent = "Waiting for Gemini…";
  try {
    const result = await explain(diagnostic, $("mode").value);
    if (current === request) $("ai-output").textContent = result;
  } catch (error) {
    if (current === request) $("ai-output").textContent = "Gemini could not complete the request. " + (error.message || error.code || "Check model availability and App Check.");
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
