import { initializeApp } from "firebase/app";
import { CustomProvider, initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, InferenceSource } from "firebase/ai";
import { diagnosticPrompt } from "./prompt.js";

export function createExplainer(env, useDebugAppCheck) {
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID
  });
  if (useDebugAppCheck) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  // The SDK exchanges its browser-generated token in debug mode. The custom
  // provider satisfies the SDK's provider interface without loading reCAPTCHA.
  const provider = useDebugAppCheck
    ? new CustomProvider({ getToken: async () => { throw new Error("App Check debug mode is inactive."); } })
    : new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY);
  initializeAppCheck(app, {
    provider,
    isTokenAutoRefreshEnabled: !useDebugAppCheck
  });
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const modes = {
    hybrid: InferenceMode.PREFER_ON_DEVICE, device: InferenceMode.ONLY_ON_DEVICE, cloud: InferenceMode.ONLY_IN_CLOUD
  };
  const models = new Map();
  return async function explain(diagnostic, mode, buildContext) {
    if (!models.has(mode)) models.set(mode, getGenerativeModel(ai, { mode: modes[mode] }));
    const model = models.get(mode);
    if (mode !== "cloud") {
      const initialization = model.initializeDeviceModel();
      if (mode === "device") await initialization;
      else void initialization.catch(() => { /* The SDK chooses the cloud fallback. */ });
    }
    const { response } = await model.generateContent(diagnosticPrompt(diagnostic, buildContext));
    const answer = response.text().trim();
    if (!answer) throw new Error("The model returned no explanation.");
    const labels = { [InferenceSource.ON_DEVICE]: "On-device", [InferenceSource.IN_CLOUD]: "Cloud" };
    return (labels[response.inferenceSource] ?? "Source unreported") + " · Gemini\n" + answer;
  };
}
