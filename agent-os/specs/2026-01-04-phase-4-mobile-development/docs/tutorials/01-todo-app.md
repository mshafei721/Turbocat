# Build a Todo App (Mobile) - Tutorial

In this tutorial, you will build a complete mobile todo app using Turbocat. The app will let you add, view, and mark tasks as complete.

**Estimated Time:** 30-45 minutes
**Difficulty:** Beginner
**Requirements:** Mobile platform selected in Turbocat

## What You Will Build

A mobile todo app with:
- A list of todos
- Add button to create new todos
- Check boxes to mark todos as complete
- Delete button to remove todos
- Local storage (todos saved on phone)

## Final Result

```
+----------------------------+
|  My Todo App         ×  ⊕  |
+----------------------------+
| □  Buy groceries           |
| ✓  Walk the dog            |
| □  Finish project          |
|                            |
| [Add New Todo]             |
+----------------------------+
```

## Part 1: Ask Turbocat to Create the App

### Step 1: Open Turbocat

1. Go to [turbocat.app](https://turbocat.app)
2. Sign in with your account
3. You should see the chat interface

### Step 2: Select Mobile Platform

1. Look for the platform selector dropdown (usually at the top)
2. Click on it
3. Select **Mobile**

You should see a phone icon confirming you've selected Mobile.

### Step 3: Ask for Todo App

In the chat, type this request:

```
Create a mobile todo app with the following features:

1. Home screen with a list of todos
2. Each todo shows a checkbox, task name, and delete button
3. Checked todos show a checkmark
4. Input field at the bottom to add new todos
5. Add button next to the input
6. Todos are saved locally on the phone (don't disappear after refresh)
7. Use blue as the primary color for buttons and headers
8. Make it look clean and modern using NativeWind styling
```

### Step 4: Wait for Generation

Turbocat will:
1. Create a Railway container (1-2 minutes)
2. Generate React Native code
3. Start the Metro bundler
4. Display a QR code

Watch for the status indicator to change to "Running".

## Part 2: Preview Your App

### Step 1: Scan the QR Code

When you see the QR code:

**On iPhone:**
1. Open Camera app
2. Point at QR code
3. Tap notification that appears

**On Android:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Point camera at QR code

### Step 2: Test the App

Your todo app should load in Expo Go. Try:
1. **Add a todo**: Type in the input field, tap Add
2. **Check a todo**: Tap the checkbox
3. **Delete a todo**: Tap the delete button
4. **Refresh the phone**: Close and reopen Expo Go, todos should still be there

## Part 3: Customize Your App

Now that the basic app is working, let's customize it!

### Change 1: Different Color Scheme

Ask Turbocat:
```
Change the button colors from blue to purple, and make the completed todos have a gray background
```

**What to expect:**
- Changes appear on your phone in 2-5 seconds
- No need to re-scan QR code
- This is "hot reloading" - a powerful feature!

### Change 2: Add App Icon and Title

Ask Turbocat:
```
Update the app with:
1. A nice header/title that says "My Todos"
2. A subtitle showing how many todos are complete (e.g., "3 of 5 completed")
3. Make the header blue with white text
```

### Change 3: Better Input Design

Ask Turbocat:
```
Make the add-todo input field bigger and easier to use:
1. Use a larger input with padding
2. Add a placeholder text "What needs to be done?"
3. Put the add button on the right side of the input in a row
4. Add a subtle shadow to the input area
```

### Change 4: Empty State Message

Ask Turbocat:
```
When there are no todos, show a friendly message instead of an empty list:
"You have no todos! Add one to get started."

Make the message large and centered on the screen.
```

## Part 4: Add New Features

Now let's add more advanced features!

### Feature 1: Edit Todos

Ask Turbocat:
```
Add the ability to edit a todo by tapping on it:
1. When you tap a todo item, show a modal/dialog
2. The modal has an input field with the current todo text
3. Save button updates the todo
4. Cancel button closes without saving
```

### Feature 2: Categories

Ask Turbocat:
```
Add categories to todos:
1. When adding a todo, let user select a category (Work, Personal, Shopping)
2. Show the category label on each todo
3. Add a filter to show only todos from a selected category
4. Add filter buttons at the top: "All", "Work", "Personal", "Shopping"
```

### Feature 3: Due Dates

Ask Turbocat:
```
Add due dates to todos:
1. When creating a todo, ask for a due date
2. Show the due date on each todo
3. Highlight overdue todos in red
4. Sort todos by due date (soonest first)
```

### Feature 4: Priorities

Ask Turbocat:
```
Add priority levels to todos:
1. When creating a todo, set priority: Low, Medium, High
2. Show priority with a colored dot (red for high, yellow for medium, green for low)
3. Add sorting options: by date, by priority, by completion status
```

## Part 5: Deploy Your App

Once you're happy with your app, you can deploy it!

### Option 1: Share the QR Code

The simplest way to let others test your app:

1. Keep the mobile task open in Turbocat
2. Share a screenshot of the QR code with friends
3. They can scan it and use your app immediately
4. Changes you make appear instantly on their phones

### Option 2: Build for Production

For the App Store or Google Play (advanced):

Ask Turbocat:
```
Help me build this todo app for production:
1. I want to publish to the Apple App Store
2. I want to publish to Google Play Store
3. What steps do I need to take?
```

Turbocat will explain the process (using Expo EAS Build).

## Common Customizations

### Change the App Name

Ask Turbocat:
```
Change the app name from "My Todo App" to "TaskMaster"
```

### Add Dark Mode

Ask Turbocat:
```
Add dark mode to the app:
1. Add a toggle in settings to switch between light and dark
2. Save the preference on the phone
3. Use dark colors (dark gray background, light text)
```

### Change the Font

Ask Turbocat:
```
Use a different font throughout the app. Make it look more modern.
```

## Troubleshooting

### QR Code Doesn't Load

See [Troubleshooting Guide](../04-troubleshooting.md#problem-qr-code-does-not-appear)

### Changes Not Appearing

1. Make sure you're waiting 2-5 seconds
2. Check that status shows "Running"
3. Shake your phone and tap "Reload"
4. Ask Turbocat: "Restart the Metro bundler"

### Crashes When Adding Todo

1. Read the error message
2. Take a screenshot
3. Tell Turbocat: "I got this error when adding a todo: [paste error]"

## Tips for Success

### 1. Start Simple

Don't ask for everything at once. Build in steps:
1. Basic todo list ✅
2. Local storage ✅
3. Edit todos
4. Categories
5. Advanced features

### 2. Use the Code Tab

Click the "Code" tab in Turbocat to see the React Native code. You can learn from it!

### 3. Ask for Improvements

If something isn't quite right:
- "The button colors look wrong" → Fix styling
- "Adding a todo is confusing" → Improve UX
- "The list is too slow" → Performance optimization

### 4. Test on Real Device

Always test on your actual phone, not just previewing. Things look and feel different on real devices.

### 5. Keep it Simple

The most useful apps are often the simplest. Don't try to build everything at once.

## Next Steps

- [Build a Camera App](./02-camera-app.md) - Learn to use device features
- [Add Authentication](./03-authentication.md) - Secure your app
- [Explore Components](../04-component-gallery.md) - Pre-built UI components
- [Deploy Guide](../08-deployment-checklist.md) - Prepare for production

## What You Learned

In this tutorial, you learned:
- How to create a mobile app with Turbocat
- How hot reloading works
- How to customize styling and features
- How to add new features iteratively
- How to test on a real device

Congratulations! You've built a complete mobile app!

---

**Questions?** See [Troubleshooting Guide](../04-troubleshooting.md) or contact support.
