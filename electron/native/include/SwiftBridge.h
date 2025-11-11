/**
 * SwiftBridge.h
 * Objective-C header to bridge Swift FnKeyListener to C++/N-API
 */

#import <Foundation/Foundation.h>

@interface SwiftBridge : NSObject

/**
 * Check if the app has Accessibility permissions
 */
+ (BOOL)checkAccessibilityPermissions;

/**
 * Request Accessibility permissions from the user
 */
+ (void)requestAccessibilityPermissions;

/**
 * Open System Settings to Accessibility preferences
 */
+ (void)openAccessibilityPreferences;

/**
 * Start listening for Fn key events
 * Callback receives BOOL indicating if Fn key is pressed (YES) or released (NO)
 * Returns YES if started successfully, NO if failed (e.g., no permissions)
 */
+ (BOOL)startListening:(void (^)(BOOL))callback;

/**
 * Stop listening for Fn key events
 */
+ (void)stopListening;

/**
 * Check if Fn key is currently pressed
 */
+ (BOOL)isPressed;

@end
