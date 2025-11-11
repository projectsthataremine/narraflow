/**
 * SwiftBridge.m
 * Objective-C implementation to bridge Swift FnKeyListener to C++/N-API
 */

#import "SwiftBridge.h"
#import "Mic2Text-Swift.h"  // Auto-generated Swift header

@implementation SwiftBridge

static FnKeyListener* listener = nil;

+ (BOOL)checkAccessibilityPermissions {
    if (!listener) {
        listener = [[FnKeyListener alloc] init];
    }
    return [listener checkAccessibilityPermissions];
}

+ (void)requestAccessibilityPermissions {
    if (!listener) {
        listener = [[FnKeyListener alloc] init];
    }
    [listener requestAccessibilityPermissions];
}

+ (void)openAccessibilityPreferences {
    if (!listener) {
        listener = [[FnKeyListener alloc] init];
    }
    [listener openAccessibilityPreferences];
}

+ (BOOL)startListening:(void (^)(BOOL))callback {
    if (!listener) {
        listener = [[FnKeyListener alloc] init];
    }
    return [listener startListening:callback];
}

+ (void)stopListening {
    if (listener) {
        [listener stopListening];
    }
}

+ (BOOL)isPressed {
    if (listener) {
        return [listener isPressed];
    }
    return NO;
}

@end
