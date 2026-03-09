import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';

/**
 * Checks for OTA updates on mount and reloads the app if one is available.
 * No-ops in development builds where updates aren't applicable.
 */
export function useAppUpdates() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();

  // Reload as soon as the update is fully downloaded
  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  // Fetch update in the background when first available
  useEffect(() => {
    if (!Updates.isEnabled) return;

    async function checkAndFetch() {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          Toast.show({
            type: 'info',
            text1: 'Update available',
            text2: 'Downloading update in the background…',
            visibilityTime: 3000,
          });
          await Updates.fetchUpdateAsync();
        }
      } catch {
        // Silently ignore — network errors, dev builds, etc.
      }
    }

    checkAndFetch();
  }, []);

  return { isUpdateAvailable };
}
