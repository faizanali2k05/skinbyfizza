# Deployment Guide - SkinByFizza

Complete guide for deploying the SkinByFizza Flutter application to Android and iOS.

## Pre-Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Firestore rules deployed
- [ ] All dependencies installed (`flutter pub get`)
- [ ] No build errors (`flutter analyze`)
- [ ] Tests passing (`flutter test`)
- [ ] Firebase config files in place
- [ ] App icons and splash screens configured
- [ ] Version number updated in `pubspec.yaml`

## Android Deployment

### 1. Update App Configuration

**File:** `android/app/build.gradle.kts`

```kotlin
android {
    namespace = "com.skinbyfizza.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.skinbyfizza.app"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.release
        }
    }
}
```

### 2. Generate Signing Key

```bash
keytool -genkey -v -keystore ~/skinbyfizza-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias skinbyfizza
```

**Save the:**
- Keystore path
- Keystore password
- Key alias
- Key password

### 3. Create Signing Configuration

**File:** `android/key.properties`

```properties
storeFile=~/skinbyfizza-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=skinbyfizza
keyPassword=YOUR_KEY_PASSWORD
```

**⚠️ Don't commit this file to version control!**

### 4. Configure Gradle for Signing

**File:** `android/app/build.gradle.kts`

```kotlin
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}
```

### 5. Build Release APK

```bash
flutter build apk --release
```

**Output:** `build/app/outputs/apk/release/app-release.apk`

### 6. Build App Bundle (for Play Store)

```bash
flutter build appbundle --release
```

**Output:** `build/app/outputs/bundle/release/app-release.aab`

### 7. Upload to Google Play Store

1. Create Google Play Developer account
2. Go to Play Console
3. Create new app: "SkinByFizza"
4. Fill out app details:
   - Screenshots
   - Description
   - Category: Medical
   - Content rating questionnaire
5. Upload `app-release.aab`
6. Fill in pricing and distribution
7. Submit for review

## iOS Deployment

### 1. Update App Configuration

**File:** `ios/Runner/Info.plist`

```xml
<dict>
  <key>CFBundleName</key>
  <string>SkinByFizza</string>
  <key>CFBundleIdentifier</key>
  <string>com.skinbyfizza.app</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
</dict>
```

### 2. Update Podfile (if needed)

**File:** `ios/Podfile`

Ensure minimum deployment target matches Flutter requirements:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
        '$(inherited)',
        'FLUTTER_FLAVOR=production',
      ]
    end
  end
end
```

### 3. Build Release App

```bash
flutter build ios --release
```

### 4. Archive for Upload

```bash
cd ios
xcodebuild -workspace Runner.xcworkspace -scheme Runner -configuration Release -arch arm64 -sdk iphoneos archive -archivePath build/Runner.xcarchive
```

### 5. Create IPA File

```bash
xcodebuild -exportArchive -archivePath build/Runner.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/
```

**File:** `ios/ExportOptions.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
</dict>
</plist>
```

### 6. Upload to App Store

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create new app
3. Fill in app information
4. Upload IPA using Transporter app
5. Add screenshots and descriptions
6. Submit for review

## Monitoring & Analytics

### Firebase Analytics Setup (Optional)

Analytics is included in Firebase, monitor at:
- Firebase Console → Analytics
- View user engagement
- Track feature usage
- Monitor crash reports

### Performance Monitoring

Monitor app performance:
- Open Firebase Console
- Go to Performance
- View startup time, screen rendering, etc.

## Version Updates

When releasing a new version:

### Update Version Number

**File:** `pubspec.yaml`

```yaml
version: 1.0.1+2
# Format: version+buildNumber
```

**Android:** `versionCode` (build number)
**iOS:** `CFBundleVersion` (build number)

### Create Release Notes

```
## Version 1.0.1 (Build 2)

### What's New
- Bug fixes
- Performance improvements
- UI enhancements

### Known Issues
- None

### Minimum Requirements
- Android 5.0+
- iOS 12.0+
```

## Troubleshooting Deployment

### Android Issues

**Error: "Certificate is not trusted"**
- Solution: Re-generate signing certificate with valid dates

**Error: "Invalid application ID"**
- Solution: Use reverse domain notation (com.yourcompany.app)

**Error: "API key required"**
- Solution: Ensure `google-services.json` is in `android/app/`

### iOS Issues

**Error: "Provisioning profile not found"**
- Solution: Create provisioning profile in Apple Developer
- Add device UDID if needed

**Error: "Code signing identity not found"**
- Solution: Check Team ID in Xcode
- Re-generate signing certificate

**Error: "Icon missing or invalid"**
- Solution: Ensure app icon is at least 1024x1024 px

## Security Checklist

Before deploying to production:

- [ ] Firebase rules are in Production Mode
- [ ] No debug prints in release build
- [ ] All API keys are correct
- [ ] No hardcoded secrets in code
- [ ] SSL certificate is valid
- [ ] App signature is trusted
- [ ] All permissions are justified

## Monitoring Post-Launch

After launch, monitor:

1. **Crash Reports**
   - Firebase Console → Crashlytics
   - Fix critical issues immediately

2. **User Feedback**
   - Google Play Store reviews
   - App Store reviews
   - In-app feedback (if implemented)

3. **Performance**
   - Monitor Firebase Performance
   - Check server logs
   - Monitor Firestore usage

4. **Updates**
   - Plan for regular updates
   - Test beta versions
   - Keep Flutter packages updated

## Scaling for Production

### Firestore Optimization

1. **Add indexes** for frequently queried fields
2. **Set up backups** automatically
3. **Monitor Firestore usage** daily
4. **Plan for growth** in data and users

### If exceeding Spark Plan limits:

- **Upgrade to Blaze Plan** (pay-as-you-go)
- **Optimize queries** to reduce reads
- **Implement caching** on client
- **Archive old data** to reduce storage

## Support & Documentation

- [Flutter Deployment](https://docs.flutter.dev/deployment)
- [Google Play Store Guidelines](https://play.google.com/about/storelisting-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Firebase Deployment](https://firebase.google.com/docs/app-check)

## Contact

For deployment issues or questions, consult:
- Flutter documentation
- Firebase documentation
- Platform-specific developer guides

---

**Last Updated:** January 16, 2026
**Deployment Status:** Ready for Production ✅
