const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build');

function patchFile(relativePath, search, replace) {
  const filePath = path.join(basePath, relativePath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(search)) {
      content = content.replace(search, replace);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-notifications] Patched: ${relativePath}`);
    } else {
      console.log(`[patch-notifications] Already patched or pattern not found in: ${relativePath}`);
    }
  } else {
    console.log(`[patch-notifications] File not found: ${relativePath}`);
  }
}

// 1. Patch warnOfExpoGoPushUsage to prevent fatal throw
patchFile(
  'warnOfExpoGoPushUsage.js',
  'throw new Error(message);',
  'didWarn = true; console.warn(message);'
);

// 2. Patch TopicSubscriptionModule.android.js to make ExpoTopicSubscriptionModule optional
patchFile(
  'TopicSubscriptionModule.android.js',
  "export default requireNativeModule('ExpoTopicSubscriptionModule');",
  "import { requireOptionalNativeModule } from 'expo-modules-core';\nexport default requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? { subscribeToTopicAsync: async () => null, unsubscribeFromTopicAsync: async () => null };"
);

// 3. Patch PushTokenManager.native.js to make ExpoPushTokenManager optional
patchFile(
  'PushTokenManager.native.js',
  "export default requireNativeModule('ExpoPushTokenManager');",
  "import { requireOptionalNativeModule } from 'expo-modules-core';\nexport default requireOptionalNativeModule('ExpoPushTokenManager') ?? { getDevicePushTokenAsync: async () => null, addListener: () => ({ remove: () => {} }), removeListeners: () => {} };"
);

// 4. Patch ServerRegistrationModule.native.js to make NotificationsServerRegistrationModule optional
patchFile(
  'ServerRegistrationModule.native.js',
  "export default requireNativeModule('NotificationsServerRegistrationModule');",
  "import { requireOptionalNativeModule } from 'expo-modules-core';\nexport default requireOptionalNativeModule('NotificationsServerRegistrationModule') ?? { getRegistrationInfoAsync: async () => null, setRegistrationInfoAsync: async () => {}, addListener: () => ({ remove: () => {} }), removeListeners: () => {} };"
);

// 5. Patch BackgroundNotificationTasksModule.native.js
patchFile(
  'BackgroundNotificationTasksModule.native.js',
  "export default requireNativeModule('ExpoBackgroundNotificationTasksModule');",
  "import { requireOptionalNativeModule } from 'expo-modules-core';\nexport default requireOptionalNativeModule('ExpoBackgroundNotificationTasksModule') ?? {};"
);
