# First Fault

**Platform** Web (Chrome)

## Short description

Find the first build error or runtime failure in an ESP-IDF log and get a concrete next check, with Gemini Nano on-device and automatic cloud fallback through Firebase AI Logic.

## Project description

When an ESP-IDF build fails, the final Ninja message often tells you only that a command failed. First Fault helps firmware developers find the earlier diagnostic they can act on. Paste the terminal output and the browser highlights the first recognized compiler or linker error, shows the original log line, and extracts the source file, line, and column when the toolchain supplies them. A built-in next check is available as soon as the log is analyzed.

Select **Explain error** for a plain-English explanation and a suggested next check. First Fault sends the build stage and a bounded diagnostic message to Firebase AI Logic. Hybrid mode prefers Gemini Nano in desktop Chrome and uses the Gemini Developer API in the cloud when a compatible local model is unavailable. The app displays the inference source reported by the SDK. Firebase App Check is enforced for the cloud endpoint.

Paste ESP-IDF serial output to investigate runtime failures such as a Guru Meditation panic, a watchdog timeout or a failed assertion. First Fault extracts the available build metadata and decoded backtrace. An optional build context field lets you add relevant settings or source. Gemini uses that evidence to suggest a change and how to verify it. For example, the **LoadProhibited panic** sample pairs a fault at address zero with build context that says the sensor task starts even when bus initialization fails.

We verified both routes with the same **Missing header** sample. The parser found the missing `sensor_bus.h` header at `main/main.c`, line 8, column 10. Desktop Chrome returned **On-device · Gemini** in **On-device only** mode. A browser session without the local model returned **Cloud · Gemini** in **On-device + cloud fallback** mode. Both runs pointed to checking the header and the compiler’s include paths. The repository includes six sample logs and automated tests with expected locations.
