# Kanakku Mobile Build Guide

This project is now configured as a Capacitor mobile app for Android and iOS.

## What is configured

- Native Capacitor bridge for Android and iOS
- Native splash plugin enabled
- Native status bar styling configured
- Android hardware back button behavior configured
- Keyboard handling optimized for mobile forms
- Native haptic feedback on bottom navigation taps

## Android (Windows or Mac)

1. Build and sync native assets:
   - `npm run android:sync`
2. Build debug APK:
   - `npm run android:apk`
3. APK output:
   - `android/app/build/outputs/apk/debug/app-debug.apk`

## iOS (Mac required)

1. Add iOS platform (already added in this workspace):
   - `npm run ios:add`
2. Build and sync assets:
   - `npm run ios:sync`
3. Open in Xcode:
   - `npm run ios:open`
4. In Xcode:
   - Select a Team in Signing & Capabilities
   - Choose target device/simulator
   - Build and run
   - Archive to export IPA for TestFlight/App Store or personal distribution

## Cross-platform sync

- `npm run mobile:sync`

## Splash screen notes

- Native splash is configured via `capacitor.config.ts`
- Duration and styling are controlled under `plugins.SplashScreen`
- Android and iOS native splash assets are located in:
  - `android/app/src/main/res/**/splash.png`
  - `ios/App/App/Assets.xcassets/Splash.imageset/*`

## Important

- IPA build cannot be generated on Windows; iOS compilation requires Xcode on macOS.
- For production Android release, configure signing and build `assembleRelease`/`bundleRelease`.

## Android Play Store release (signed)

1. Generate upload keystore (one-time):
   - From `android/` run:
   - `keytool -genkeypair -v -keystore app/kanakku-upload-key.jks -alias kanakku-upload -keyalg RSA -keysize 2048 -validity 10000`
2. Create `android/keystore.properties` with:
   - `storeFile=app/kanakku-upload-key.jks`
   - `storePassword=YOUR_STORE_PASSWORD`
   - `keyAlias=kanakku-upload`
   - `keyPassword=YOUR_KEY_PASSWORD`
3. Build signed release artifacts:
   - AAB (Play Store): `npm run android:release:aab`
   - APK (direct install/testing): `npm run android:release:apk`

Release outputs:
- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/outputs/apk/release/app-release.apk`

Security notes:
- `android/keystore.properties` and `android/app/*.jks` are git-ignored.
- Keep keystore/passwords backed up safely. Losing them prevents updates to the same Play Store app.
