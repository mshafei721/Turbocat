# Getting Started with Mobile Development

This guide will help you create your first mobile app with Turbocat. No previous mobile development experience required!

## What You Will Learn

- How to create a mobile project in Turbocat
- How to preview your app on your phone
- Basic concepts of React Native and Expo

## Prerequisites

Before you begin, you need:

1. **A Turbocat account** - Sign up at turbocat.app if you haven't already
2. **A smartphone** - iPhone or Android phone
3. **Expo Go app** - Free app to preview your mobile apps

### Installing Expo Go

Download the Expo Go app on your phone:

- **iPhone**: Open the App Store, search for "Expo Go", tap Install
- **Android**: Open Google Play Store, search for "Expo Go", tap Install

## Step 1: Select Mobile Platform

When you open Turbocat, you will see a platform selector in the chat area.

1. Look for the dropdown that shows "Web" or "Mobile"
2. Click on it
3. Select "Mobile"

You will see a phone icon appear, confirming you are in mobile mode.

```
+----------------------------------+
|  Platform: [Mobile v]            |
|  +-------+  +----------+         |
|  | Web   |  | Mobile * |         |
|  +-------+  +----------+         |
+----------------------------------+
```

**Important**: Once you start a task, you cannot change the platform. Make sure you have selected "Mobile" before describing your app.

## Step 2: Describe Your App

Now tell Turbocat what you want to build. Be as specific as you can. Here are some examples:

**Simple Example:**
```
Create a mobile app with a hello world screen
```

**Better Example:**
```
Create a mobile app with:
- A home screen that says "Welcome to My App"
- A blue header at the top
- A button that shows an alert when pressed
```

**Detailed Example:**
```
Create a mobile todo app with:
- A list of tasks on the home screen
- An input field to add new tasks
- Ability to mark tasks as complete
- A settings screen accessible from the header
```

## Step 3: Wait for Generation

After you submit your request, Turbocat will:

1. Set up a development container (about 1-2 minutes)
2. Generate your React Native code
3. Start the Metro bundler (the tool that runs your app)
4. Display a QR code

You will see a status indicator showing progress:
- "Starting" - Container is being set up
- "Running" - Your app is ready to preview

## Step 4: Scan the QR Code

When your app is ready, you will see a large QR code on your screen.

**On iPhone:**
1. Open the Camera app
2. Point it at the QR code
3. Tap the notification that appears
4. Your app will open in Expo Go

**On Android:**
1. Open the Expo Go app
2. Tap "Scan QR Code"
3. Point your camera at the QR code
4. Your app will load automatically

## Step 5: See Your App Running!

Your app should now be running on your phone. Try interacting with it:

- Tap buttons
- Scroll through lists
- Navigate between screens

### Hot Reloading

One of the best features of mobile development with Turbocat is hot reloading:

1. Ask Turbocat to make a change (e.g., "Change the button color to green")
2. Watch your phone - the change appears automatically!
3. No need to scan the QR code again

Changes typically appear within 2-5 seconds.

## Understanding Your Code

Turbocat generates React Native code using:

- **React Native**: The framework for building mobile apps
- **Expo**: Tools that make React Native easier to use
- **TypeScript**: A programming language that helps prevent errors
- **NativeWind**: Styling that works like Tailwind CSS

### Example Generated Code

Here is what a simple screen looks like:

```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-gray-900">
          Welcome to My App
        </Text>
        <Text className="mt-2 text-base text-gray-600">
          Built with Turbocat
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

Key things to notice:
- `SafeAreaView` - Keeps content away from the phone's notch and edges
- `View` - A container like a `div` in web development
- `Text` - Displays text (you must use this, not just plain text)
- `className` - Styling using Tailwind-like classes

## Next Steps

Now that you have created your first mobile app:

1. **Try the Todo App Tutorial** - [Build a Todo App](./tutorials/01-todo-app.md)
2. **Explore Components** - [Mobile Component Gallery](./04-component-gallery.md)
3. **Learn about Expo SDK** - Add camera, location, and more to your app
4. **Create a Cross-Platform App** - [Monorepo Guide](./05-monorepo-guide.md)

## Common First-Time Issues

### QR Code Does Not Appear

- Wait 1-2 minutes for the container to start
- Check the status indicator - it should say "Running"
- Try refreshing the page

### Cannot Scan QR Code

- Make sure you have installed Expo Go
- Check that your phone and computer are on the same WiFi network
- Try the manual URL option (shown below the QR code)

### App Shows Error

- Read the error message carefully
- Check the Metro logs at the bottom of the screen
- Ask Turbocat to fix the error: "I see an error: [paste error message]"

---

**Need more help?** See [Troubleshooting Mobile Issues](./06-troubleshooting.md)

**Ready for more?** Try [Building a Camera App](./tutorials/02-camera-app.md)
