{
  "targets": [{
    "target_name": "fn_key_addon",
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "conditions": [
      ['OS=="mac"', {
        "sources": [
          "src/fn_key_addon.mm",
          "src/SwiftBridge.m"
        ],
        "libraries": [
          "<(module_root_dir)/build/FnKeyListener.o"
        ],
        "xcode_settings": {
          "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
          "CLANG_CXX_LIBRARY": "libc++",
          "MACOSX_DEPLOYMENT_TARGET": "11.0",
          "OTHER_LDFLAGS": [
            "-framework", "AppKit",
            "-framework", "Carbon",
            "-framework", "Foundation",
            "-L/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/macosx",
            "-lswiftCore",
            "-lswiftAppKit"
          ],
          "OTHER_CFLAGS": [
            "-fobjc-arc"
          ]
        }
      }]
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "include",
      "build"
    ],
    "dependencies": [
      "<!(node -p \"require('node-addon-api').gyp\")"
    ],
    "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
  }]
}
