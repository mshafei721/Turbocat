# Troubleshooting Mobile Issues

This guide covers common problems you might encounter when developing mobile apps with Turbocat and how to solve them.

## Container & Infrastructure Issues

### Problem: QR Code Does Not Appear

**Symptoms:**
- Container shows "Starting" for more than 3 minutes
- No QR code appears after waiting

**Solutions:**

1. **Wait longer** - Container startup can take 1-2 minutes
   - First time setup is slower than subsequent startups
   - Watch the status indicator for "Running"

2. **Refresh the page**
   - Press Ctrl+R (Windows) or Cmd+R (Mac)
   - Sometimes the UI needs a refresh

3. **Check container status**
   - Look at the Metro status indicator
   - If it says "Error", check the logs

4. **Restart the container**
   - Send a message to Turbocat: "Restart the container"
   - This will restart the Mobile environment

5. **Try a different platform**
   - Sometimes Railway has temporary issues
   - Try again in a few minutes
   - Contact support if the problem persists

---

### Problem: Container Shows Error

**Symptoms:**
- Status shows "Error"
- Red error message in the preview area
- Cannot scan QR code

**Possible Causes & Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Container failed to start" | Docker image issue | Refresh page, restart container |
| "Metro bundler timeout" | Container underpowered | Restart, Railway may need upgrade |
| "Network unreachable" | Network issue | Check WiFi, restart container |
| "Out of memory" | Large project | Reduce project size, split into modules |

**General troubleshooting steps:**

1. Check the error message carefully
2. Look at Metro logs (bottom section) for details
3. Try restarting: "Restart the container"
4. If error persists, take a screenshot and contact support

---

### Problem: Container Keeps Stopping

**Symptoms:**
- Container runs for 10-15 minutes then stops
- Status shows "Stopped"
- QR code disappears

**Solution:**

This is normal behavior for cost optimization. Containers stop after 30 minutes of inactivity to save money.

**To keep it running:**
- Send messages to Turbocat regularly (e.g., make code changes)
- Each interaction resets the idle timer
- The container will restart automatically when needed

---

### Problem: Very Slow Container Startup

**Symptoms:**
- Container takes 5+ minutes to start
- Status stuck on "Starting"

**Solutions:**

1. **Check Railway status**
   - Visit [Railway Status Page](https://status.railway.app)
   - There might be ongoing incidents

2. **Try again in 5 minutes**
   - Railway might be pulling the Docker image for the first time
   - Subsequent startups are faster

3. **Check your project size**
   - Very large projects slow down startup
   - If over 500MB, consider splitting into multiple modules

4. **Check internet speed**
   - Slow upload speed will slow container startup
   - A minimum of 5 Mbps is recommended

---

## QR Code & Expo Go Issues

### Problem: Cannot Scan QR Code with Expo Go

**Symptoms:**
- Expo Go app doesn't launch when scanning QR code
- Camera app scans it but nothing happens
- "Cannot connect" error in Expo Go

**Solutions:**

#### On iPhone:

1. **Check Expo Go is installed**
   - Open App Store, search for "Expo Go"
   - Should show version number, not "Get"

2. **Try Camera app method**
   - Open Camera app
   - Point at QR code
   - Tap notification that appears
   - Should open Expo Go automatically

3. **Use manual entry**
   - Copy the Expo URL (under the QR code, looks like `exp://...`)
   - Open Expo Go app
   - Tap "Scan QR code"
   - Tap "Enter URL manually" at the bottom
   - Paste the URL and tap "Connect"

#### On Android:

1. **Check Expo Go is installed**
   - Open Google Play Store
   - Search for "Expo Go"
   - Should show "Open" button, not "Install"

2. **Use Expo Go's scanner**
   - Open Expo Go app
   - Tap "Scan QR Code" button
   - Point camera at QR code
   - App should load automatically

3. **Manual entry**
   - Copy the Expo URL
   - Open Expo Go
   - Tap the menu button (≡)
   - Tap "Enter URL manually"
   - Paste the URL

---

### Problem: Phone and Computer Not on Same Network

**Symptoms:**
- QR code scans but doesn't connect
- "Network request failed" in Expo Go
- "Could not connect to development server"

**Diagnosis:**
- On your phone: Settings > WiFi > note the network name
- On your computer: Check which WiFi you're connected to
- They should match

**Solution:**

1. **Connect to same WiFi**
   - Disconnect from other networks
   - Connect to the same WiFi network as your computer
   - Most reliable option

2. **Use tunnel mode (backup)**
   - If you cannot use same network, tunnel mode activates automatically
   - Slightly slower but works from anywhere
   - Turbocat uses `exp://` URLs for tunnel mode

3. **Check for VPN**
   - VPNs can block connections
   - Disable VPN temporarily during development
   - Re-enable after you're done

---

### Problem: App Loads But Shows Blank Screen

**Symptoms:**
- QR code connects
- App starts loading
- Shows blank screen indefinitely
- No error message

**Solutions:**

1. **Wait longer**
   - Large apps can take 20+ seconds to load on first run
   - Wait for the screen to fully render

2. **Check Metro logs**
   - Look at the logs at the bottom of Turbocat
   - Search for "ERROR" or "error"
   - Take a screenshot of the error if found

3. **Restart Metro**
   - In Turbocat, send: "Restart Metro bundler"
   - Wait for it to restart
   - Shake your phone and tap "Reload"

4. **Ask for help**
   - Take a screenshot of Metro logs
   - Tell Turbocat: "My app shows a blank screen, here are the logs: [paste logs]"

---

### Problem: App Crashes on Load

**Symptoms:**
- Expo Go shows crash screen
- Quick flash of the app then crashes
- Red error banner

**Solutions:**

1. **Read the error message**
   - Expo shows the error before crash
   - Look for "SyntaxError", "ReferenceError", "TypeError", etc.
   - Note the line number and component name

2. **Tell Turbocat about the error**
   - "I see this error when loading: [paste full error]"
   - Include the line number if shown

3. **Check the Metro logs**
   - Turbocat shows Metro logs at the bottom
   - Look for the same error
   - Copy the full error stack trace

4. **Common crash causes:**
   - Missing import statement
   - Component not exported
   - Undefined variable
   - Syntax error in JSX

---

## Code & Development Issues

### Problem: Hot Reload Not Working

**Symptoms:**
- Make a change in Turbocat
- Change doesn't appear on phone
- Have to restart app manually
- Shake > Reload takes 30+ seconds

**Solutions:**

1. **Check Metro status**
   - Should say "Running" in the status area
   - If "Error", fix the error first

2. **Restart Metro bundler**
   - In Turbocat: "Clear cache and restart Metro"
   - On phone: Shake and tap "Reload"
   - Changes should now appear faster

3. **Check file syntax**
   - If changes break syntax, Metro waits for fixes
   - Fix syntax errors in Turbocat
   - Metro will restart automatically

4. **Check logs for errors**
   - Metro logs show why reload might be slow
   - Look for warnings about missing modules
   - Tell Turbocat about any errors

---

### Problem: "Module not found" Error

**Symptoms:**
- Red error: "Cannot find module 'react-native-gesture-handler'"
- Or "Cannot find module 'expo-camera'" etc.

**Cause:**
- You requested a feature that uses a module
- The module wasn't installed or configured properly

**Solution:**

1. **Tell Turbocat about it**
   - "I need to use [module name], please add it to the project"
   - Example: "I need expo-camera to take photos"

2. **Turbocat will:**
   - Add the module to package.json
   - Restart Metro bundler
   - Update your code to use the module

3. **Wait for Metro restart**
   - This takes 30-60 seconds
   - Be patient - Metro is reinstalling packages

---

### Problem: Feature Not Working on Your Platform

**Symptoms:**
- Camera doesn't work on Android but works on iPhone
- Contacts not accessible
- Location permission denied

**Possible Causes:**

1. **Permissions not configured**
   - Many features need phone permissions
   - Permissions are set in `app.json`
   - When Turbocat adds a feature, it adds permissions

2. **Expo Go limitation**
   - Some features don't work in Expo Go
   - Example: Bluetooth, custom native code
   - Check [Expo Go Limitations](./03-expo-go-preview.md#expo-go-limitations)

3. **Platform-specific code needed**
   - Some APIs work differently on iOS vs Android
   - Use `Platform.select()` to handle differences

**Solution:**

1. **Check app.json permissions**
   - Look at the permissions array
   - Tell Turbocat: "The [feature] isn't working, can you check the permissions in app.json?"

2. **Test on both platforms**
   - If you have both iPhone and Android, test on both
   - Report which one fails

3. **Ask for platform-specific code**
   - "This feature needs to work differently on iOS vs Android"
   - Turbocat can use `Platform.select()` to handle it

---

### Problem: Performance is Slow

**Symptoms:**
- App lags when scrolling lists
- Takes 5+ seconds to navigate between screens
- App feels sluggish overall

**Solutions:**

1. **Profile the app**
   - Shake your phone
   - Tap "Toggle Performance Monitor"
   - Watch FPS (should be 60)
   - Watch memory usage

2. **Reduce list size**
   - Large lists (1000+ items) lag
   - Use pagination or infinite scroll
   - Tell Turbocat: "Can you optimize the list for performance?"

3. **Check for heavy rendering**
   - Images that are too large
   - Complex animations
   - Too many components on screen

4. **Restart and clear cache**
   - In Turbocat: "Clear cache and restart Metro"
   - Close Expo Go
   - Scan QR code again

---

## Styling & UI Issues

### Problem: Styling Looks Wrong on Device

**Symptoms:**
- Buttons too small/large
- Text too small/large
- Colors look different
- Layout doesn't match preview

**Common Causes:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Text tiny on Android | Font size mismatch | Use larger text-lg or text-xl |
| Buttons unreachable | SafeAreaView issue | Check SafeAreaView wrapping |
| Colors different | Display settings | Check phone display settings |
| Layout broken | Flexbox issue | Check flex properties in code |

**Solutions:**

1. **Check NativeWind classes**
   - Mobile uses different sizing than web
   - Use `text-base` or larger (not `text-xs`)
   - Use `h-12` or larger for buttons (not `h-8`)

2. **Test on multiple devices**
   - If possible, test on both iPhone and Android
   - Different phones have different screen sizes
   - Use responsive classes: `w-full`, `flex-1`, etc.

3. **Ask Turbocat for help**
   - Describe what looks wrong
   - Tell which device (iPhone/Android, specific model if known)
   - Ask for responsive design

---

### Problem: "Text strings must be rendered within a <Text> component"

**Symptoms:**
- Yellow warning box appears
- Warning says: "Text strings must be rendered within a <Text> component"
- App still works

**Cause:**
- You have text content outside a `<Text>` component
- React Native requires this

**Example of wrong code:**
```typescript
<View>Hello World</View>  // Wrong!
```

**Example of correct code:**
```typescript
<View>
  <Text>Hello World</Text>  // Correct!
</View>
```

**Solution:**
- Tell Turbocat: "Fix the warning about text strings"
- Turbocat will wrap loose text in `<Text>` components

---

## Network & Connection Issues

### Problem: "Network request failed"

**Symptoms:**
- Error appears when app starts
- Cannot fetch data from your API
- Works on other networks but not yours

**Possible Causes:**

1. **WiFi blocking**
   - Corporate network or public WiFi might block
   - Try different WiFi if available

2. **VPN issues**
   - VPN on phone interferes with connection
   - Disable VPN temporarily

3. **Firewall blocking**
   - Computer firewall might block tunnel traffic
   - Temporarily disable firewall to test

4. **API server unavailable**
   - If your app needs an API, check the server is running

**Solutions:**

1. **Try different network**
   - Switch to mobile data (if needed, for testing)
   - Try a different WiFi network

2. **Disable VPN**
   - Phone Settings > VPN
   - Toggle off temporarily

3. **Check API endpoint**
   - If using an API, verify it's accessible
   - Test the API URL in browser

4. **Use localhost:**
   - If your API is on your computer:
   - Use your computer's IP address (not localhost)
   - Example: `http://192.168.1.100:3000`

---

### Problem: "Could not connect to development server"

**Symptoms:**
- Expo Go shows "Could not connect to development server"
- QR code won't load
- Manual URL entry doesn't work

**Possible Causes:**

1. **Container stopped**
   - After 30 minutes of inactivity
   - Status might show "Stopped"

2. **URL no longer valid**
   - Container restarted
   - New URL generated but old one cached

3. **Network changed**
   - Connected to different WiFi
   - Lost internet connection

**Solutions:**

1. **Restart the container**
   - In Turbocat: "Restart the container"
   - Wait for "Running" status
   - New QR code will appear

2. **Clear Expo Go cache**
   - Close Expo Go app
   - Wait 5 seconds
   - Re-open and try scanning again

3. **Check your network**
   - Make sure you have WiFi or mobile data
   - If WiFi, verify you're on same network as computer

4. **Restart Expo Go**
   - Force close Expo Go app
   - Disconnect container in Turbocat
   - Reconnect and scan QR code again

---

## Getting Help

### When to Contact Support

Contact Turbocat support if:

1. **Container will not start after 5 minutes**
   - Try restarting once
   - If still fails, contact support

2. **Repeated crashes with cryptic errors**
   - Provide error message
   - Provide Metro logs
   - Provide your code if possible

3. **Performance issues**
   - Very slow startup (>3 minutes)
   - Constant crashes
   - Hot reload not working at all

4. **Network issues that don't resolve**
   - Tested on different networks
   - Still cannot connect

### How to Report Issues

**Provide helpful information:**

1. **Screenshot of the error**
   - Error message clearly visible
   - Include Metro logs if available

2. **What you were trying to do**
   - "I was creating a camera app when..."
   - "After making change X, the error appeared"

3. **What platform and device**
   - iPhone XS or Samsung Galaxy S21
   - iOS 17.2 or Android 13

4. **What you've already tried**
   - "I restarted the container"
   - "I cleared the cache"
   - "I tried on WiFi and mobile data"

5. **Metro logs**
   - Copy the bottom logs section
   - Paste into the support request

---

## FAQ

### Why is my bill higher than expected?

Check [Cost Monitoring Guide](./07-cost-monitoring.md) for details on costs and optimization.

### Do I need to pay for each container?

Railway charges for all active containers. Containers that stop (idle timeout) don't charge.

### Can I use custom native modules?

Not in Expo Go. You need a development build or Expo development client.

### Why does my app work different on iPhone vs Android?

Some React Native components behave differently. Use `Platform.select()` for platform-specific code.

### How do I export my app to the App Store/Google Play?

This is beyond Turbocat's scope. You'll need to use Expo's EAS Build service or native tools.

### Can I see the generated code?

Yes! Look at the "Code" tab in Turbocat to see the React Native code generated for your app.

---

**Can't find your issue?** Contact support at support@turbocat.app or check the FAQ in each guide.
