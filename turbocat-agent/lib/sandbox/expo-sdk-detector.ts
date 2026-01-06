/**
 * Expo SDK Module Detection & Suggestions
 * Phase 4: Mobile Development - Task 4.3
 *
 * Detects feature requests requiring Expo SDK modules and provides
 * installation instructions, permissions, and usage guidance.
 */

export interface ExpoModuleSuggestion {
  moduleName: string
  npmPackage: string
  description: string
  keywords: string[]
  permissions: string[]
  permissionRationale: string
  appJsonConfig: string
  installCommand: string
  usage: string
  expoGoCompatible: boolean
  expoGoWarning?: string
  docsUrl: string
}

export interface DetectionResult {
  detected: boolean
  modules: ExpoModuleSuggestion[]
  aiSuggestion: string
}

/**
 * Expo SDK Module Catalog
 * Maps module names to complete suggestion information
 */
const EXPO_SDK_CATALOG: Record<string, Omit<ExpoModuleSuggestion, 'installCommand'>> = {
  'expo-camera': {
    moduleName: 'expo-camera',
    npmPackage: 'expo-camera',
    description: 'Access device camera for taking photos and recording videos',
    keywords: ['camera', 'take photo', 'take picture', 'capture', 'video recording'],
    permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
    permissionRationale: 'This app needs camera access to take photos and record videos.',
    appJsonConfig: `{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Allow $(PRODUCT_NAME) to access your camera.",
        "NSMicrophoneUsageDescription": "Allow $(PRODUCT_NAME) to access your microphone."
      }
    },
    "android": {
      "permissions": ["CAMERA", "RECORD_AUDIO"]
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera.",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone.",
          "recordAudioAndroid": true
        }
      ]
    ]
  }
}`,
    usage: `import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View>
        <Text>We need camera permission</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <CameraView style={{ flex: 1 }}>
      {/* Your camera UI */}
    </CameraView>
  );
}`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/camera/',
  },

  'expo-location': {
    moduleName: 'expo-location',
    npmPackage: 'expo-location',
    description: 'Access device location services (GPS, geolocation)',
    keywords: ['location', 'gps', 'geolocation', 'coordinates', 'latitude', 'longitude', 'maps', 'position'],
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
    ],
    permissionRationale: 'This app needs location access to show your current position.',
    appJsonConfig: `{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Allow $(PRODUCT_NAME) to use your location.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Allow $(PRODUCT_NAME) to use your location."
      }
    },
    "android": {
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "FOREGROUND_SERVICE"]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location.",
          "locationAlwaysPermission": "Allow $(PRODUCT_NAME) to use your location.",
          "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location.",
          "isIosBackgroundLocationEnabled": true,
          "isAndroidBackgroundLocationEnabled": true
        }
      ]
    ]
  }
}`,
    usage: `import * as Location from 'expo-location';

async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    alert('Permission denied');
    return;
  }

  const location = await Location.getCurrentPositionAsync({});
  console.log(location.coords.latitude, location.coords.longitude);
}`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/location/',
  },

  'expo-notifications': {
    moduleName: 'expo-notifications',
    npmPackage: 'expo-notifications',
    description: 'Send and receive push notifications',
    keywords: ['notification', 'push', 'alert', 'message', 'notify', 'push notification'],
    permissions: ['android.permission.POST_NOTIFICATIONS'],
    permissionRationale: 'This app needs notification permission to send you updates.',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}`,
    usage: `import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permission
const { status } = await Notifications.requestPermissionsAsync();

// Schedule notification
await Notifications.scheduleNotificationAsync({
  content: {
    title: "You've got mail! 📬",
    body: 'Here is the notification body',
  },
  trigger: { seconds: 2 },
});`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/notifications/',
  },

  'expo-image-picker': {
    moduleName: 'expo-image-picker',
    npmPackage: 'expo-image-picker',
    description: 'Choose images or videos from device gallery or camera',
    keywords: ['image picker', 'photo picker', 'gallery', 'choose photo', 'select image', 'upload photo', 'choose image'],
    permissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.CAMERA'],
    permissionRationale: 'This app needs access to your photo library and camera.',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera."
        }
      ]
    ]
  }
}`,
    usage: `import * as ImagePicker from 'expo-image-picker';

async function pickImage() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    alert('Permission denied');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    console.log(result.assets[0].uri);
  }
}`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/imagepicker/',
  },

  'expo-file-system': {
    moduleName: 'expo-file-system',
    npmPackage: 'expo-file-system',
    description: 'Read, write, and manage files on the device filesystem',
    keywords: ['file', 'filesystem', 'storage', 'save file', 'read file', 'download', 'upload'],
    permissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    permissionRationale: 'This app needs storage access to save and read files.',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      [
        "expo-file-system"
      ]
    ]
  }
}`,
    usage: `import * as FileSystem from 'expo-file-system';

// Write file
const fileUri = FileSystem.documentDirectory + 'data.txt';
await FileSystem.writeAsStringAsync(fileUri, 'Hello, world!');

// Read file
const content = await FileSystem.readAsStringAsync(fileUri);

// Download file
const downloadResult = await FileSystem.downloadAsync(
  'https://example.com/file.pdf',
  FileSystem.documentDirectory + 'file.pdf'
);`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/filesystem/',
  },

  'expo-document-picker': {
    moduleName: 'expo-document-picker',
    npmPackage: 'expo-document-picker',
    description: 'Choose documents and files from device storage',
    keywords: ['file', 'upload', 'document', 'picker', 'choose file', 'select document'],
    permissions: ['android.permission.READ_EXTERNAL_STORAGE'],
    permissionRationale: 'This app needs storage access to choose files.',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      ["expo-document-picker"]
    ]
  }
}`,
    usage: `import * as DocumentPicker from 'expo-document-picker';

async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (!result.canceled) {
    console.log(result.assets[0].uri);
    console.log(result.assets[0].name);
  }
}`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/document-picker/',
  },

  'expo-contacts': {
    moduleName: 'expo-contacts',
    npmPackage: 'expo-contacts',
    description: 'Access device contacts',
    keywords: ['contact', 'contacts', 'phonebook', 'address book'],
    permissions: ['android.permission.READ_CONTACTS'],
    permissionRationale: 'This app needs contacts access to connect with your friends.',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      [
        "expo-contacts",
        {
          "contactsPermission": "Allow $(PRODUCT_NAME) to access your contacts."
        }
      ]
    ]
  }
}`,
    usage: `import * as Contacts from 'expo-contacts';

async function getContacts() {
  const { status } = await Contacts.requestPermissionsAsync();

  if (status !== 'granted') {
    alert('Permission denied');
    return;
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
  });

  console.log(data);
}`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/contacts/',
  },

  'expo-media-library': {
    moduleName: 'expo-media-library',
    npmPackage: 'expo-media-library',
    description: 'Access and save media files (photos, videos) to device gallery',
    keywords: ['media', 'gallery', 'album', 'save photo', 'camera roll', 'photo library'],
    permissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.ACCESS_MEDIA_LOCATION',
    ],
    permissionRationale: 'This app needs media library access to save photos.',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
          "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos.",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ]
  }
}`,
    usage: `import * as MediaLibrary from 'expo-media-library';

async function saveToGallery(uri: string) {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== 'granted') {
    alert('Permission denied');
    return;
  }

  await MediaLibrary.saveToLibraryAsync(uri);
  alert('Saved to gallery!');
}`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/media-library/',
  },

  'expo-barcode-scanner': {
    moduleName: 'expo-barcode-scanner',
    npmPackage: 'expo-barcode-scanner',
    description: 'Scan barcodes and QR codes',
    keywords: ['barcode', 'qr code', 'scan', 'scanner', 'qr'],
    permissions: ['android.permission.CAMERA'],
    permissionRationale: 'This app needs camera access to scan barcodes.',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access camera to scan barcodes."
        }
      ]
    ]
  }
}`,
    usage: `import { BarcodeScannerView, useCameraPermissions } from 'expo-camera';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarcodeScanned = ({ type, data }: any) => {
    alert(\`Barcode type: \${type}, data: \${data}\`);
  };

  if (!permission?.granted) {
    return <Button onPress={requestPermission} title="Grant Permission" />;
  }

  return (
    <BarcodeScannerView
      onBarcodeScanned={handleBarcodeScanned}
      style={{ flex: 1 }}
    />
  );
}`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/camera/#barcode-scanning',
  },

  'expo-auth-session': {
    moduleName: 'expo-auth-session',
    npmPackage: 'expo-auth-session',
    description: 'OAuth authentication and browser-based authentication flows',
    keywords: ['oauth', 'sso', 'social login', 'google login', 'facebook login'],
    permissions: [],
    permissionRationale: '',
    appJsonConfig: `{
  "expo": {
    "scheme": "myapp"
  }
}`,
    usage: `import * as AuthSession from 'expo-auth-session';

const discovery = {
  authorizationEndpoint: 'https://example.com/oauth/authorize',
  tokenEndpoint: 'https://example.com/oauth/token',
};

const [request, response, promptAsync] = AuthSession.useAuthRequest(
  {
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    scopes: ['openid', 'profile'],
  },
  discovery
);

// Trigger auth
await promptAsync();`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/auth-session/',
  },

  'expo-secure-store': {
    moduleName: 'expo-secure-store',
    npmPackage: 'expo-secure-store',
    description: 'Securely store sensitive data (tokens, passwords) using device keychain',
    keywords: ['secure store', 'secure storage', 'keychain', 'store token', 'store credentials', 'sensitive data', 'encrypted storage'],
    permissions: [],
    permissionRationale: '',
    appJsonConfig: `{
  "expo": {
    "plugins": [
      ["expo-secure-store"]
    ]
  }
}`,
    usage: `import * as SecureStore from 'expo-secure-store';

// Save
await SecureStore.setItemAsync('authToken', 'your-secret-token');

// Retrieve
const token = await SecureStore.getItemAsync('authToken');

// Delete
await SecureStore.deleteItemAsync('authToken');`,
    expoGoCompatible: true,
    docsUrl: 'https://docs.expo.dev/versions/latest/sdk/securestore/',
  },
}

/**
 * Detect required Expo SDK modules from user prompt
 */
export function detectRequiredModules(prompt: string): DetectionResult {
  const lowercasePrompt = prompt.toLowerCase()
  const detectedModules = new Map<string, ExpoModuleSuggestion>()

  // Check each module's keywords
  for (const [moduleName, moduleInfo] of Object.entries(EXPO_SDK_CATALOG)) {
    const hasKeyword = moduleInfo.keywords.some(keyword =>
      lowercasePrompt.includes(keyword.toLowerCase())
    )

    if (hasKeyword) {
      detectedModules.set(moduleName, {
        ...moduleInfo,
        installCommand: `npx expo install ${moduleInfo.npmPackage}`,
      })
    }
  }

  const modules = Array.from(detectedModules.values())
  const detected = modules.length > 0

  // Build AI suggestion
  const aiSuggestion = detected ? buildAISuggestion(modules) : ''

  return {
    detected,
    modules,
    aiSuggestion,
  }
}

/**
 * Get detailed suggestion for a specific Expo SDK module
 */
export function getModuleSuggestion(moduleName: string): ExpoModuleSuggestion {
  const moduleInfo = EXPO_SDK_CATALOG[moduleName]

  if (!moduleInfo) {
    // Return minimal info for unknown modules
    return {
      moduleName,
      npmPackage: moduleName,
      description: 'Unknown Expo SDK module',
      keywords: [],
      permissions: [],
      permissionRationale: '',
      appJsonConfig: '{}',
      installCommand: `npx expo install ${moduleName}`,
      usage: '// No usage example available',
      expoGoCompatible: false,
      expoGoWarning: 'This module may not be compatible with Expo Go. You may need to create a development build.',
      docsUrl: 'https://docs.expo.dev',
    }
  }

  return {
    ...moduleInfo,
    installCommand: `npx expo install ${moduleInfo.npmPackage}`,
  }
}

/**
 * Build AI-friendly suggestion text from detected modules
 */
function buildAISuggestion(modules: ExpoModuleSuggestion[]): string {
  if (modules.length === 0) return ''

  let suggestion = 'I detected that you need the following Expo SDK modules:\n\n'

  modules.forEach((module, index) => {
    suggestion += `${index + 1}. **${module.moduleName}** - ${module.description}\n`
    suggestion += `   Install: \`${module.installCommand}\`\n`

    if (module.permissions.length > 0) {
      suggestion += `   Permissions required:\n`
      module.permissions.forEach(permission => {
        suggestion += `   - ${permission}\n`
      })
    }

    if (module.appJsonConfig && module.appJsonConfig !== '{}') {
      suggestion += `\n   Add to app.json:\n`
      suggestion += `   \`\`\`json\n   ${module.appJsonConfig}\n   \`\`\`\n`
    }

    if (!module.expoGoCompatible && module.expoGoWarning) {
      suggestion += `\n   ⚠️ ${module.expoGoWarning}\n`
    }

    suggestion += `\n   Documentation: ${module.docsUrl}\n\n`
  })

  suggestion += '\nI will generate code using these modules and configure the necessary permissions.'

  return suggestion
}
