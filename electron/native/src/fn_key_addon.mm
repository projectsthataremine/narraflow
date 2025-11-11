/**
 * fn_key_addon.mm
 * N-API wrapper to expose Swift FnKeyListener to JavaScript/Electron
 */

#include <napi.h>
#import "SwiftBridge.h"

class FnKeyAddon : public Napi::ObjectWrap<FnKeyAddon> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    FnKeyAddon(const Napi::CallbackInfo& info);
    ~FnKeyAddon();

private:
    Napi::Value CheckAccessibilityPermissions(const Napi::CallbackInfo& info);
    Napi::Value RequestAccessibilityPermissions(const Napi::CallbackInfo& info);
    Napi::Value OpenAccessibilityPreferences(const Napi::CallbackInfo& info);
    Napi::Value StartListening(const Napi::CallbackInfo& info);
    Napi::Value StopListening(const Napi::CallbackInfo& info);
    Napi::Value IsPressed(const Napi::CallbackInfo& info);

    Napi::ThreadSafeFunction tsfn;
    Napi::Reference<Napi::Function> callbackRef;
};

FnKeyAddon::FnKeyAddon(const Napi::CallbackInfo& info) : ObjectWrap(info) {
    printf("[FnKeyAddon] Initialized\n");
}

FnKeyAddon::~FnKeyAddon() {
    StopListening(Napi::CallbackInfo(Env(), nullptr));
    printf("[FnKeyAddon] Destroyed\n");
}

Napi::Value FnKeyAddon::CheckAccessibilityPermissions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    BOOL hasPermissions = [SwiftBridge checkAccessibilityPermissions];
    return Napi::Boolean::New(env, hasPermissions);
}

Napi::Value FnKeyAddon::RequestAccessibilityPermissions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    [SwiftBridge requestAccessibilityPermissions];
    return env.Null();
}

Napi::Value FnKeyAddon::OpenAccessibilityPreferences(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    [SwiftBridge openAccessibilityPreferences];
    return env.Null();
}

Napi::Value FnKeyAddon::StartListening(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Function callback expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Store the JavaScript callback
    Napi::Function callback = info[0].As<Napi::Function>();

    // Create ThreadSafeFunction for calling JS from native thread
    tsfn = Napi::ThreadSafeFunction::New(
        env,
        callback,
        "FnKeyCallback",
        0,  // Unlimited queue
        1   // One thread
    );

    // Start the Swift listener
    BOOL success = [SwiftBridge startListening:^(BOOL isFnPressed) {
        // Call JavaScript callback from Swift on main thread
        auto callback = [isFnPressed](Napi::Env env, Napi::Function jsCallback) {
            jsCallback.Call({Napi::Boolean::New(env, isFnPressed)});
        };

        // Queue the callback for execution
        napi_status status = this->tsfn.NonBlockingCall(callback);
        if (status != napi_ok) {
            printf("[FnKeyAddon] Failed to call JavaScript callback\n");
        }
    }];

    if (success) {
        printf("[FnKeyAddon] Started listening\n");
    } else {
        printf("[FnKeyAddon] Failed to start listening - check Accessibility permissions\n");
    }

    return Napi::Boolean::New(env, success);
}

Napi::Value FnKeyAddon::StopListening(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    [SwiftBridge stopListening];

    if (tsfn) {
        tsfn.Release();
    }

    printf("[FnKeyAddon] Stopped listening\n");
    return env.Null();
}

Napi::Value FnKeyAddon::IsPressed(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    BOOL isPressed = [SwiftBridge isPressed];
    return Napi::Boolean::New(env, isPressed);
}

Napi::Object FnKeyAddon::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "FnKeyAddon", {
        InstanceMethod("checkAccessibilityPermissions", &FnKeyAddon::CheckAccessibilityPermissions),
        InstanceMethod("requestAccessibilityPermissions", &FnKeyAddon::RequestAccessibilityPermissions),
        InstanceMethod("openAccessibilityPreferences", &FnKeyAddon::OpenAccessibilityPreferences),
        InstanceMethod("startListening", &FnKeyAddon::StartListening),
        InstanceMethod("stopListening", &FnKeyAddon::StopListening),
        InstanceMethod("isPressed", &FnKeyAddon::IsPressed),
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("FnKeyAddon", func);
    return exports;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return FnKeyAddon::Init(env, exports);
}

NODE_API_MODULE(fn_key_addon, Init)
