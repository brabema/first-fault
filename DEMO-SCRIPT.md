# First Fault demo video script

**Target runtime** 2:25, including holds on both inference source labels. Record the interface in action with English narration.

## 0:00–0:15 · Show the build failure

**On screen** Start in desktop Chrome with First Fault open and **Missing header** selected. Point to the final Ninja line in the build log.

**Narration** “When an ESP-IDF build stops, the last line may only say that a command failed. First Fault helps firmware developers find the first compiler or linker error they can act on.”

## 0:15–0:42 · Verify the source location

**On screen** Click **Analyze log**. Show `sensor_bus.h: No such file or directory`, `main/main.c`, line **8**, and column **10**. Expand **Show matching log line** and point from the raw diagnostic to the source location.

**Narration** “Here the compiler cannot find sensor bus dot H. The parser reads the log and points to main dot C, line eight, column ten. I can verify that location against the original line before asking Gemini for an explanation.”

## 0:42–1:22 · Run Gemini Nano on-device

**On screen** In desktop Chrome with Gemini Nano already downloaded, select **On-device only** and click **Explain error**. Keep the selected mode and the real **On-device · Gemini** result in the frame for four seconds. Highlight the suggestion about include paths.

**Narration** “Now I’ll ask for a plain-English explanation. In on-device-only mode, Firebase AI Logic uses Gemini Nano in Chrome. The response says On-device, and the suggested check is to verify the header and the compiler’s include paths.”

## 1:22–2:00 · Show automatic cloud fallback

**On screen** Switch to the browser session where the local model is unavailable. Keep **Missing header** selected and show the same location. Select **On-device + cloud fallback**, click **Explain error**, and hold the actual **Cloud · Gemini** result for four seconds. Highlight the suggestion to check the component’s `INCLUDE_DIRS`.

**Narration** “This browser session has no local model. I’m using the same sample and choosing on-device with cloud fallback. Firebase AI Logic routes the request to the cloud automatically, and the response source now says Cloud. Gemini suggests checking whether the header exists and whether its directory is listed in the component’s CMake configuration.”

## 2:00–2:25 · Explain what travels and how to try it

**On screen** Keep the diagnostic and the explanation visible. Finish on the repository’s README once the public link is available.

**Narration** “Gemini receives the build stage and a short diagnostic message. The source location comes from the build log, and App Check protects the Firebase endpoint. The repository includes sample logs, expected results, and instructions for running both paths.”

## Recording notes

- Warm up Gemini Nano in desktop Chrome before recording. Capture a fresh request and its actual result. If you trim the wait, preserve the click, the selected mode, and the source label from that request.
- Use the browser session that returned **Cloud · Gemini** in the verified fallback test. Keep **On-device + cloud fallback** visible so viewers can see that the mode is hybrid.
- Record the synthetic sample preloaded in First Fault. Keep developer consoles, App Check debug tokens, and account details outside the capture.
- Export at or below 3:00 and make the English video public on YouTube before adding its link to Devpost. [Official submission requirements](https://firebasehybridaihackathon.devpost.com/rules)
