# First Fault

First Fault helps ESP-IDF developers find the first recognized compiler error, linker error, or runtime failure. Paste output from `idf.py build` or `idf.py monitor` to see the diagnostic, its position in the log, and the source location when available. A built-in next check helps even without a model.

With Firebase configured, **Explain error** sends bounded diagnostic data through Firebase AI Logic. Hybrid mode prefers Gemini Nano in Chrome and falls back to a cloud model when the local model is unavailable. The response label comes from the SDK. For runtime failures, Gemini receives the available decoded frames, build metadata and optional build context, then proposes a change to try and a way to verify it. The parser owns all location fields.

## Run locally

Use Node.js 22.12+ or 24 and npm. In the project directory run:

```sh
npm ci
npm test
npm run dev
```

Open the local URL printed by Vite. The sample logs and paste workflow work without a Firebase project. For a deployable static build run `npm run build` and serve the resulting `dist/` over HTTPS. Run `npm run preview` to inspect that build locally.

## Connect Gemini

1. Register a web app in your Firebase project. Enable Firebase AI Logic with the Gemini Developer API backend. Keep App Check enforcement enabled.
2. Copy `.env.example` to `.env.local` and set the web app's Firebase API key, project ID and app ID. These are browser configuration values. Keep service-account credentials and Gemini API keys out of the frontend.
3. For local development set `VITE_LOCAL_APPCHECK_DEBUG=true`. Restart Vite, open the app and register the browser-generated debug token under **App Check → Apps → Manage debug tokens**. Keep that token private. For a deployment, register the app and served domain with reCAPTCHA Enterprise and supply the **public** site key at build time.
4. For on-device testing use eligible desktop Chrome. Follow Google's Prompt API setup for your Chrome version and allow the model download to finish. Set **On-device only** and select **Explain error**. Check the returned source label. With a working network and a browser without a local model, repeat in **On-device + cloud fallback** and check for **Cloud**.

[Firebase hybrid web setup](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) · [Inference modes and source reporting](https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options) · [Chrome device requirements](https://developer.chrome.com/docs/ai/get-started)

## Expected sample results

| Sample | First diagnostic | Expected source |
| --- | --- | --- |
| Missing header | Compiler cannot open `sensor_bus.h` | `main/main.c`, line 8, column 10 |
| Unresolved symbol | Linker cannot resolve `sensor_bus_init` | `/workspace/main/main.c`, line 24 |
| Memory overflow | IRAM region exceeds capacity by 288 bytes | Unreported |
| Successful build | No recognized diagnostic | — |
| LoadProhibited panic | Invalid memory read with fault address `0x00000000` | `/workspace/main/sensor_bus.c`, line 47 |
| Task watchdog | Task watchdog timeout with the logged running task | `/workspace/main/sensor.c`, line 84 |

The parser scans emitted lines in order. Parallel builds can interleave diagnostics. For runtime failures, it uses explicit source positions or decoded backtrace frames in the monitor output. For an address-only trace, run IDF Monitor with the ELF that matches the flashed build, then paste the decoded output. Add relevant board settings, `sdkconfig` entries or source snippets in **Build context**. A “No recognized build or runtime failure” result can also mean that the output is incomplete. [IDF Monitor address decoding](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/tools/idf-monitor.html#automatic-address-decoding)

## Hackathon demo

Open the [public demo](https://brabema.github.io/first-fault/), select **Missing header**, and click **Explain error** with **On-device + cloud fallback** selected. In a browser where the local model is unavailable, a successful response shows **Cloud · Gemini**. The hosted demo uses reCAPTCHA Enterprise for App Check.

The [demo video script](DEMO-SCRIPT.md) shows the same Missing header sample running with Gemini Nano in desktop Chrome and with automatic cloud fallback. The [project description](SUBMISSION.md) summarizes both verified runs.

License: MIT.
