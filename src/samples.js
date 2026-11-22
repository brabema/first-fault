export const samples = [
  {
    title: "Missing header",
    log: [
      "$ idf.py build",
      "[169/182] Building C object esp-idf/main/CMakeFiles/__idf_main.dir/main.c.obj",
      "FAILED: esp-idf/main/CMakeFiles/__idf_main.dir/main.c.obj",
      "main/main.c:8:10: fatal error: sensor_bus.h: No such file or directory",
      '    8 | #include "sensor_bus.h"',
      "      |          ^~~~~~~~~~~~~~",
      "compilation terminated.",
      "ninja: build stopped: subcommand failed."
    ].join("\n")
  },
  {
    title: "Unresolved symbol",
    log: [
      "$ idf.py build", "[182/182] Linking CXX executable sensor.elf",
      "FAILED: sensor.elf",
      "xtensa-esp32-elf-ld: esp-idf/main/libmain.a(main.c.obj): in function 'app_main':",
      "/workspace/main/main.c:24: undefined reference to 'sensor_bus_init'",
      "collect2: error: ld returned 1 exit status",
      "ninja: build stopped: subcommand failed."
    ].join("\n")
  },
  {
    title: "Memory overflow",
    log: "$ idf.py build\n[182/182] Linking CXX executable sensor.elf\nxtensa-esp32-elf-ld: region 'iram0_0_seg' overflowed by 288 bytes\ncollect2: error: ld returned 1 exit status"
  },
  {
    title: "Successful build",
    log: "$ idf.py build\n[181/182] Linking CXX executable sensor.elf\n[182/182] Generating binary image from built executable\nProject build complete."
  },
  {
    title: "LoadProhibited panic",
    log: [
      "I (273) app_init: Project name:     sensor_node",
      "I (278) app_init: App version:      1.2.0",
      "I (288) app_init: ESP-IDF:          v5.4.2",
      "E (516) sensor: bus initialization failed: ESP_ERR_TIMEOUT",
      "Guru Meditation Error: Core  0 panic'ed (LoadProhibited). Exception was unhandled.",
      "EXCCAUSE: 0x0000001c  EXCVADDR: 0x00000000",
      "Backtrace: 0x400d12a1:0x3ffb1ee0 0x400d11df:0x3ffb1f00",
      "0x400d12a1: sensor_bus_read at /workspace/main/sensor_bus.c:47",
      "0x400d11df: sensor_task at /workspace/main/main.c:62",
      "Rebooting..."
    ].join("\n"),
    buildContext: "Target: ESP32. The sensor task is created even if sensor_bus_init() returns an error. On an initialization timeout the sensor bus handle remains NULL."
  },
  {
    title: "Task watchdog",
    log: [
      "I (288) app_init: ESP-IDF: v5.4.2",
      "E (8140) task_wdt: Task watchdog got triggered. The following tasks/users did not reset the watchdog in time:",
      "E (8140) task_wdt:  - IDLE0 (CPU 0)",
      "E (8140) task_wdt: Tasks currently running:",
      "E (8140) task_wdt: CPU 0: sensor_task",
      "Backtrace: 0x400d12a1:0x3ffb1ee0",
      "0x400d12a1: poll_sensor at /workspace/main/sensor.c:84"
    ].join("\n")
  }
];
