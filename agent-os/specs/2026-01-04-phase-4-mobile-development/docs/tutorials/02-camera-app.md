# Build a Camera App with Expo SDK - Tutorial

In this tutorial, you will build a camera app that takes photos and displays them. This teaches you how to use Expo SDK modules for native device features.

**Estimated Time:** 45-60 minutes
**Difficulty:** Intermediate
**Requirements:** Mobile platform selected, Turbocat Mobile Development

## What You Will Build

A camera app with:
- Camera preview screen
- Capture photo button
- View gallery of taken photos
- Delete photos option
- Photos saved on phone
- Permission handling for camera access

## Final Result

```
+----------------------------+      +----------------------------+
|  Camera App         ×  ⊕  |  or  |  Camera App         ×  ⊕  |
+----------------------------+      +----------------------------+
|                            |      | [Photo 1]  [Photo 2]      |
|     [Camera Preview]       |      | [Photo 3]  [Photo 4]      |
|                            |      |                            |
|                            |      |                            |
|        [Capture Photo]     |      |   [Select to delete]      |
+----------------------------+      +----------------------------+
```

## Part 1: Create Basic Camera App

### Step 1: Select Mobile Platform

1. Open [turbocat.app](https://turbocat.app)
2. Sign in
3. Select **Mobile** from platform dropdown

### Step 2: Request Camera App

Type in the chat:

```
Create a camera app with the following:

1. A camera preview screen showing what the device camera sees
2. A "Capture Photo" button at the bottom
3. When button is pressed, take a photo
4. Show a gallery view that displays all taken photos in a grid
5. Navigation between Camera and Gallery screens
6. Use tabs or buttons to switch between views
7. Use Expo SDK (expo-camera) to access the camera
8. Handle camera permissions properly
9. Save photos to the device's local storage
10. Make it look clean and professional
```

### Step 3: Grant Camera Permissions

When Turbocat asks for permissions:

**On your phone:**
1. When you scan the QR code, Expo Go will ask for camera access
2. Tap "Allow" or "Allow While Using"
3. This grants the app permission to use your camera

**Why this is needed:**
- Apps must ask permission before accessing device features
- Users control what apps can access
- This is handled by Turbocat automatically

## Part 2: Preview the App

### Step 1: Scan QR Code

1. Wait for status to show "Running"
2. Scan QR code with Expo Go (or manual URL entry)
3. The app loads on your phone

### Step 2: Grant Camera Permission

When app asks:
1. Read the permission request
2. Tap **Allow** to grant camera access
3. Camera preview should appear

### Step 3: Test Camera

1. **Capture Photo**: Point camera at something and tap "Capture Photo"
2. **View Photo**: Look at the captured image
3. **View Gallery**: Switch to Gallery view
4. **See All Photos**: View all photos you've captured

## Part 3: Enhance the App

Now let's make the app more user-friendly!

### Enhancement 1: Better Camera Controls

Ask Turbocat:
```
Improve the camera controls:
1. Add a button to switch between front and back camera
2. Show which camera is currently active (front/back)
3. Add a flash toggle button (on/off/auto)
4. Show battery level indicator
5. Make buttons larger and easier to tap
```

**What this teaches:**
- How to switch between device cameras
- How to control camera flash
- Responsive button layout

### Enhancement 2: Preview Before Save

Ask Turbocat:
```
Before saving a photo:
1. Show the captured photo in a preview modal
2. Add "Save" and "Retake" buttons
3. Let user retake if they don't like it
4. Only save to gallery when they tap "Save"
```

**What this teaches:**
- How to show modals/dialogs
- How to handle photo decisions

### Enhancement 3: Photo Grid Layout

Ask Turbocat:
```
Improve the gallery:
1. Show photos in a 2-column grid (not a list)
2. Display photo thumbnail with date taken
3. Show number of photos total
4. Add a "Clear Gallery" button to delete all photos
5. Add timestamp to each photo
```

### Enhancement 4: Better Styling

Ask Turbocat:
```
Make the app look more polished:
1. Use a consistent color scheme (blue and white)
2. Add icons for buttons (camera icon, gallery icon, delete icon)
3. Add rounded corners to photos and buttons
4. Use shadows for depth
5. Add nice transitions between screens
```

## Part 4: Add Advanced Features

### Feature 1: Photo Editing

Ask Turbocat:
```
Add basic photo editing:
1. When viewing a photo, show an edit button
2. Allow user to:
   - Add text overlay to the photo
   - Choose text color
   - Position text on photo
3. Save edited version
```

### Feature 2: Filters

Ask Turbocat:
```
Add photo filters:
1. After capturing a photo, show filter options
2. Offer filters: Black & White, Sepia, Grayscale
3. Preview filter before applying
4. Save with selected filter
```

### Feature 3: Photo Sharing

Ask Turbocat:
```
Add share functionality:
1. In gallery, add share button for each photo
2. Let user share to Messages, Email, etc
3. Include creation date in shared photo
```

### Feature 4: Auto-upload

Ask Turbocat:
```
Add cloud backup:
1. Connect to a backend API (like Supabase or Firebase)
2. Automatically backup photos to the cloud
3. Show sync status
4. Restore photos if device storage full
```

## Part 5: Understanding the Code

### How Camera Access Works

Turbocat uses `expo-camera` module:

```typescript
import { Camera, CameraView } from 'expo-camera';

// Camera component shows preview
<CameraView style={styles.camera}>
  {/* Camera content */}
</CameraView>
```

### Permissions System

```typescript
import * as ImagePicker from 'expo-image-picker';

// Request permission
const { status } = await ImagePicker.requestCameraPermissionsAsync();
if (status === 'granted') {
  // User granted permission
}
```

### Storing Photos Locally

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save photo path
await AsyncStorage.setItem('photo_' + Date.now(), photoUri);

// Load photos
const photos = await AsyncStorage.getAllKeys();
```

### Why Expo is Powerful

Expo modules handle:
- **Permissions** - Device asks user automatically
- **Cross-platform** - Same code on iOS and Android
- **Easy API** - Simple functions, no complex setup
- **Works in Expo Go** - Test immediately, no build needed

## Common Customizations

### Change Camera Resolution

Ask Turbocat:
```
Improve photo quality:
1. Capture photos in high resolution (4K if possible)
2. Optimize storage
3. Compress when needed
```

### Add Location Data

Ask Turbocat:
```
Add GPS location to photos:
1. When photo is taken, also record GPS location
2. Show location in photo details
3. Save location with photo
```

### Implement Burst Mode

Ask Turbocat:
```
Add burst photo mode:
1. Hold capture button to take multiple photos
2. Show rapid-fire photos while holding
3. Save all or select best one
```

### Add Video Support

Ask Turbocat:
```
Extend to video recording:
1. Add video recording in addition to photos
2. Show video length
3. Separate gallery sections for photos and videos
4. Add play button for videos
```

## Troubleshooting

### Camera Permission Denied

**Problem:** App asks for permission but camera won't work

**Solution:**
1. Go to phone Settings > Apps > Turbocat > Permissions
2. Enable Camera permission
3. Close and reopen Expo Go
4. Scan QR code again

### Camera Preview Black/Not Loading

**Problem:** Camera shows black screen or nothing

**Solution:**
1. Make sure you granted camera permission
2. Check that your device has a working camera
3. Restart Metro: "Clear cache and restart Metro"
4. Close Expo Go completely and reopen

### Photos Not Saving

**Problem:** Photos disappear after closing app

**Solution:**
1. Make sure `AsyncStorage` is used correctly
2. Check that you have storage permission
3. Tell Turbocat: "Photos aren't saving, please debug storage"

### Performance Issues

**Problem:** App is slow when taking photos

**Solution:**
1. Reduce photo resolution: "Reduce quality to improve speed"
2. Compress before saving
3. Check device has enough storage

## Tips for Success

### 1. Test with Real Camera

- Don't just use the image picker
- Test with your actual device camera
- Different lighting conditions reveal issues

### 2. Handle Edge Cases

- What if device runs out of storage?
- What if camera is in use by another app?
- Ask Turbocat to handle these

### 3. User Feedback

- Show loading indicator while saving
- Show success message after capture
- Explain why permissions are needed

### 4. Privacy First

- Only save photos user explicitly takes
- Don't access photos without permission
- Respect user privacy

### 5. Progressive Enhancement

Build in steps:
1. Basic camera ✅
2. Save photos ✅
3. View gallery ✅
4. Filters/editing
5. Cloud sync

## Expo SDK Modules You Used

This tutorial uses:
- **expo-camera** - Access device camera
- **expo-image-picker** - Pick images from gallery
- **expo-file-system** - Save files locally
- **@react-native-async-storage/async-storage** - Save simple data
- **expo-permissions** - Handle system permissions

## Learn More About Expo

Explore other Expo modules:
- **expo-location** - Get GPS coordinates
- **expo-audio** - Record/play audio
- **expo-video** - Embed and play videos
- **expo-notifications** - Push notifications
- **expo-share** - Share to other apps
- **expo-contacts** - Access contacts
- **expo-barcode-scanner** - Scan barcodes

Ask Turbocat to help integrate any of these!

## Next Steps

- [Add Authentication](./03-authentication.md) - Secure your app
- [Todo App Tutorial](./01-todo-app.md) - Learn state management
- [Component Gallery](../04-component-gallery.md) - UI components
- [Production Guide](../08-deployment-checklist.md) - Deploy your app

## What You Learned

In this tutorial, you learned:
- How to access device features with Expo SDK
- How permissions work on mobile
- How to save and retrieve files
- How to build multi-screen apps
- How to handle real-world edge cases
- Best practices for camera apps

Congratulations! You've learned Expo SDK integration!

---

**Questions?** See [Troubleshooting Guide](../04-troubleshooting.md) or contact support.
