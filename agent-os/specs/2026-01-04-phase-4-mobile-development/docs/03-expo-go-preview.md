# Expo Go Preview Guide

Expo Go is a free mobile app that lets you preview your React Native apps during development. This guide explains everything you need to know about using Expo Go with Turbocat.

## What is Expo Go?

Expo Go is like a web browser, but for mobile apps:
- You do not need to install your app on your phone
- Changes appear instantly (hot reloading)
- Works on both iPhone and Android
- Free to download and use

## Installing Expo Go

### On iPhone

1. Open the **App Store** app
2. Tap the **Search** tab at the bottom
3. Type "Expo Go" in the search box
4. Tap **Get** next to the Expo Go app
5. Authenticate with Face ID, Touch ID, or your password
6. Wait for the download to complete

### On Android

1. Open the **Google Play Store** app
2. Tap the search bar at the top
3. Type "Expo Go"
4. Tap the Expo Go app in the results
5. Tap **Install**
6. Wait for the download to complete

## Scanning the QR Code

When your mobile project is ready in Turbocat, you will see a QR code.

### On iPhone (iOS 11 and later)

1. Open the **Camera** app
2. Point your camera at the QR code
3. A notification will appear at the top of your screen
4. Tap the notification
5. Expo Go will open and load your app

### On Android

1. Open the **Expo Go** app
2. Tap "Scan QR Code"
3. Point your camera at the QR code
4. Your app will load automatically

### Alternative: Manual Entry

If scanning does not work, you can enter the URL manually:

1. Copy the URL shown below the QR code (it looks like `exp://...`)
2. Open Expo Go
3. Tap "Enter URL manually"
4. Paste the URL
5. Tap "Connect"

## Understanding the Preview

### Loading Screen

When your app first loads, you will see:
1. A white screen with "Building JavaScript bundle" message
2. A progress percentage
3. After a few seconds, your app appears

### Hot Reloading

When you make changes in Turbocat:
1. Your phone shows a brief loading indicator
2. The new code loads automatically
3. Your app updates without losing your place

Example: If you are on the Settings screen and change the Home screen, the Home screen will update but you will stay on Settings.

### Error Screen

If something goes wrong, Expo Go shows a red error screen:

```
+-------------------------------+
|  Error                        |
|                               |
|  SyntaxError: Unexpected      |
|  token (line 25, column 12)   |
|                               |
|  [Dismiss]   [Reload]         |
+-------------------------------+
```

**What to do:**
1. Read the error message
2. Go back to Turbocat
3. Tell Turbocat about the error: "I see this error: [paste error]"
4. Turbocat will fix it
5. The app will reload automatically

### Yellow Warning Box

Yellow boxes show warnings (not errors):

```
+-------------------------------+
|  Warning                      |
|                               |
|  Text strings must be         |
|  rendered within a <Text>     |
|  component                    |
+-------------------------------+
```

**What to do:**
- Warnings do not break your app
- You can dismiss them by tapping
- Fix them when you have time for cleaner code

## Connection Requirements

### Same Network

Your phone and computer must be on the same WiFi network for the fastest experience.

**How to check:**
1. On your phone, go to Settings > WiFi
2. Note the network name
3. On your computer, check your WiFi connection
4. They should match

### Tunnel Mode

If you cannot use the same network, Turbocat uses tunnel mode:
- Your code is sent through Expo's servers
- Works from anywhere with internet
- Slightly slower than direct connection
- Enabled automatically when needed

## Expo Go Limitations

Expo Go is for development only. Some features have limitations:

### What Works in Expo Go

- Camera (expo-camera)
- Location (expo-location)
- Notifications (expo-notifications)
- File picking (expo-image-picker)
- Secure storage (expo-secure-store)
- Most Expo SDK modules

### What Does NOT Work in Expo Go

- Custom native code
- Some third-party native libraries
- Bluetooth (limited)
- Background audio (limited)
- NFC (limited)

If you need these features, you will need to create a "development build" (beyond the scope of this guide).

## Tips for Best Experience

### 1. Shake to Reload

Shake your phone gently to open the Developer Menu:
- Tap "Reload" to reload your app
- Tap "Debug" to open developer tools
- Tap "Stop" to disconnect

### 2. Performance Mode

For smoother performance during development:
1. Shake your phone
2. Tap "Toggle Performance Monitor"
3. See FPS and memory usage

### 3. Clear Cache

If something seems stuck:
1. Close Expo Go completely
2. In Turbocat, click "Restart Metro"
3. Re-scan the QR code

### 4. Multiple Devices

You can preview on multiple phones at once:
- Scan the same QR code on another device
- Both devices will show your app
- Changes update on all devices simultaneously

## Frequently Asked Questions

### Do I need to re-scan the QR code after changes?

No! Changes appear automatically with hot reloading.

### Why is my app loading slowly?

First load takes longer because it downloads all the code. After that, only changes are sent.

### Can I use Expo Go without WiFi?

Yes, if your phone has mobile data. Tunnel mode will be used, which may be slower.

### The QR code disappeared. What do I do?

Click anywhere in the chat to refresh, or send a new message to Turbocat.

### Can I preview my app offline?

No, you need an internet connection during development. The final app can work offline if designed to.

### Why does my app look different on iPhone vs Android?

Some components have platform-specific styling. This is normal. You can use `Platform.select()` to customize.

## Troubleshooting Connection Issues

### "Network request failed"

1. Check your WiFi connection
2. Make sure your phone is not on VPN
3. Disable any firewalls temporarily
4. Try switching to mobile data

### "Could not connect to development server"

1. The container may have stopped - send a message in Turbocat to restart
2. Check if the URL in Expo Go matches the one in Turbocat
3. Try the manual URL entry method

### App Loads But Shows Blank Screen

1. Wait a few seconds - large apps take time to load
2. Check the Metro logs in Turbocat for errors
3. Ask Turbocat: "My app shows a blank screen, please help"

### App Crashes Immediately

1. Check the error message before the crash
2. Look at Metro logs in Turbocat
3. This usually means there is a code error - ask Turbocat to fix it

---

**Next Steps:**
- [Build Your First Mobile App](./tutorials/01-todo-app.md)
- [Explore the Component Gallery](./04-component-gallery.md)
- [Learn About Expo SDK Modules](./tutorials/02-camera-app.md)
