import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

// Fallback used until the user saves an endpoint in Settings.
// Set `extra.apiUrl` in app.json so release builds don't fall back to a LAN IP.
// NOTE: Android release builds block cleartext traffic, so a real production
// value must be https://.
const DEFAULT_URL = extra.apiUrl || 'http://192.168.1.105:5000';

export default DEFAULT_URL;

// Change backend URL and perform below command to change backend URL for app
// cd bandhaki && eas update --branch preview --platform android --message "Update backend URL"

// backend/src/scripts  ---> seed superadmin and tenant from here
