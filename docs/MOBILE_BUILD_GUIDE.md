# 📱 Kanakku — Mobile Build Guide
## Android APK / AAB + iOS IPA (Capacitor 8)

> **Primary delivery:** Native Android + iOS. PWA is secondary.  
> **App ID:** `com.kanakku.personal` | **Version:** 1.0.0 (versionCode 1)

---

## ✅ Pre-flight: What You Need

| Tool | Version | Windows | Mac |
|---|---|---|---|
| Node.js | ≥ 18 | ✅ | ✅ |
| npm | ≥ 9 | ✅ | ✅ |
| Java JDK | 17 or 21 | ✅ | ✅ |
| Android Studio | Hedgehog+ | ✅ | ✅ |
| Android SDK | API 36 (compile), API 24 (min) | ✅ | ✅ |
| Xcode | 15+ | ❌ | ✅ only |
| CocoaPods | ≥ 1.14 | ❌ | ✅ only |

> **iOS builds are Mac-only.** You cannot build an IPA on Windows.

### Set JAVA_HOME (Windows)

```powershell
# Typically from Android Studio's bundled JBR:
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

---

## 📦 Step 1 — Build the Web Bundle

All native builds start here. This compiles the React app into `dist/`.

```sh
npm run build
```

Expected output:
```
✓ 3903 modules transformed.
✓ built in 14.82s
dist/assets/index-xxxxx.js   ~1.6 MB
dist/assets/index-xxxxx.css  ~95 KB
```

> Capacitor's `webDir: "dist"` in `capacitor.config.ts` points here.

---

## 🤖 Android Builds

### Quick Debug APK (for USB device testing)

```sh
# Sync web bundle into Android project
npx cap sync android

# Build debug APK
npm run android:apk
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected device:
```sh
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Signed Release APK (for direct tester distribution)

```sh
npm run android:release:apk
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

**Share with testers:** Send via WhatsApp, Google Drive, or Firebase App Distribution.  
Testers must enable **Install from unknown sources** in Android settings.

---

### Signed Release AAB (Google Play Store)

```sh
npm run android:release:aab
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

Upload this `.aab` file to **Google Play Console → Internal testing → Production**.

---

### Build both APK + AAB in one command

```sh
npm run android:release:all
```

---

### Open Android Studio

```sh
npm run android:open
```

Then use **Build → Build Bundle(s)/APK(s)** or the **Run ▶** button inside Android Studio.

---

## 🔐 Signing Configuration

The keystore is already created and configured:

| Property | Value |
|---|---|
| Keystore file | `android/app/kanakku-upload-key.jks` |
| Alias | `kanakku-upload` |
| Store password | `Kanakku2026Upload` |
| Key password | `Kanakku2026Upload` |
| Config file | `android/keystore.properties` |

`keystore.properties` content (already set correctly):
```properties
storeFile=kanakku-upload-key.jks
storePassword=Kanakku2026Upload
keyAlias=kanakku-upload
keyPassword=Kanakku2026Upload
```

> ⚠️ **Both the `.jks` file and `keystore.properties` are git-ignored.**  
> Back them up to a USB drive or encrypted cloud storage.  
> **Losing the keystore = you can never update the same Play Store listing.**

---

## 🍎 iOS Builds (Mac Only)

### 1. Sync the iOS project

```bash
npm run build
npm run ios:sync
```

### 2. Open Xcode

```bash
npm run ios:open
# or: npx cap open ios
```

### 3. Configure signing in Xcode

1. Select the **App** target → **Signing & Capabilities** tab
2. Choose your **Team** (Apple Developer account — free or paid)
3. Set **Bundle Identifier**: `com.kanakku.personal`
4. Xcode will auto-manage provisioning profiles

### 4. Run on device or simulator

- Select your device/simulator from the top toolbar
- Press **▶ Run**

### 5. TestFlight (beta distribution)

1. `Product → Archive` in Xcode
2. Organizer opens → **Distribute App**
3. Choose **TestFlight & App Store Connect**
4. Upload → visit [App Store Connect](https://appstoreconnect.apple.com)
5. Add testers under **TestFlight → Internal Testing**
6. Testers install the **TestFlight** app and receive a one-tap invite link

---

## 🔄 Development Workflow (iterating quickly)

```sh
# After making code changes:
npm run build                      # rebuild web bundle
npx cap sync android               # copy to Android project
# Then in Android Studio: Sync & Run, or:
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

For hot changes without a full rebuild (if Capacitor live-reload is configured):
```sh
npx cap run android --livereload --external
```

---

## 📱 App Configuration Reference

| Property | Value |
|---|---|
| App name | Kanakku |
| Package name | `com.kanakku.personal` |
| Version name | `1.0.0` |
| Version code | `1` (increment for each Play Store update) |
| Min Android SDK | API 24 (Android 7.0) |
| Target SDK | API 36 (Android 16) |
| iOS Bundle ID | `com.kanakku.personal` |
| Capacitor | `8.3.0` |

### Capacitor Plugins

| Plugin | Version | Purpose |
|---|---|---|
| `@capacitor/app` | 8.1.0 | Back button, app lifecycle |
| `@capacitor/haptics` | 8.0.2 | Vibration on nav taps |
| `@capacitor/keyboard` | 8.0.2 | Keyboard resize, dark style |
| `@capacitor/splash-screen` | 8.0.1 | Native splash (1200ms, `#0b0b11`) |
| `@capacitor/status-bar` | 8.0.2 | Dark status bar, no overlay |

### Android Permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 🐛 Troubleshooting

### "SDK location not found" error

```powershell
# Create android/local.properties:
echo "sdk.dir=C:\Users\Easwar\AppData\Local\Android\Sdk" | Out-File android\local.properties -Encoding utf8
```

### "JAVA_HOME not set"

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

### "Keystore not found" build failure

Check that `android/keystore.properties` has `storeFile=kanakku-upload-key.jks`  
(NOT `storeFile=app/kanakku-upload-key.jks` — that causes a double `app/app/` path bug)

### White screen after install

```sh
npm run build         # must run before cap sync
npx cap sync android
# Then rebuild the APK
```

### Capacitor plugins not working

```sh
npx cap sync android
# Reinstall APK fresh (don't just update)
```

### Build fails with Gradle errors

In Android Studio:
1. **File → Sync Project with Gradle Files**
2. **Build → Clean Project**
3. **Build → Rebuild Project**

---

## 📋 Release Checklist

### Android

```
[ ] npm run build                          (clean production web build)
[ ] npx cap sync android                   (copy web assets to Android project)
[ ] Increment versionCode in android/app/build.gradle  (must go UP for each Play Store release)
[ ] npm run android:release:aab            (signed AAB for Play Store)
[ ] Test app-release.apk on a real device before uploading AAB
[ ] Upload .aab to Google Play Console → Internal testing
[ ] Promote to Production after testing
```

### iOS (Mac required)

```
[ ] npm run build
[ ] npx cap sync ios
[ ] Open Xcode → verify signing team and bundle ID
[ ] Product → Archive → Distribute → TestFlight
[ ] Add internal testers in App Store Connect
[ ] Test via TestFlight app (testers need the invite email)
[ ] Submit for App Store review when ready
```

---

## 🚀 Quick Command Reference

```sh
# --- Web ---
npm run build                  # production bundle
npm run dev                    # dev server (localhost:8080)

# --- Android ---
npm run android:sync           # build + sync to Android
npm run android:apk            # debug APK
npm run android:release:apk    # signed release APK  ← share with testers
npm run android:release:aab    # signed AAB          ← Play Store upload
npm run android:release:all    # both APK + AAB
npm run android:open           # open Android Studio

# --- iOS (Mac) ---
npm run ios:sync               # build + sync to iOS
npm run ios:open               # open Xcode

# --- Both platforms ---
npm run mobile:sync            # build + sync Android + iOS
```
