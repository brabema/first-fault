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
  }
];
