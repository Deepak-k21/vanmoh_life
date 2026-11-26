import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

// Loads the Vanmoh website inside Expo Go.
// By default it uses the website preview server running on the same computer as `npm start`
// (port 8080). Set "extra.webUrl" in app.json to point at a deployed URL instead.
function resolveUrl() {
  const configured = Constants.expoConfig?.extra?.webUrl;
  if (configured) return configured;
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0] || 'localhost';
  return `http://${host}:8080/#sign-in`;
}

export default function App() {
  const url = useMemo(resolveUrl, []);
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#f3f4ef" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.title}>Can't reach the Vanmoh preview</Text>
          <Text style={styles.body}>
            Make sure `npm start` is running in the mobile folder and your phone is on the same Wi‑Fi as the computer.
          </Text>
          <Text style={styles.url}>{url}</Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => { setError(null); setLoading(true); webRef.current?.reload(); }}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: url }}
          style={styles.web}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => setError(e.nativeEvent.description || 'Network error')}
          onHttpError={(e) => setError(`HTTP ${e.nativeEvent.statusCode}`)}
        />
      )}
      {loading && !error && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color="#0f1419" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f4ef' },
  web: { flex: 1, backgroundColor: '#f3f4ef' },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4ef' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f1419', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: '#6c737c', textAlign: 'center' },
  url: { fontSize: 12, color: '#0f1419', opacity: 0.6 },
  button: { marginTop: 8, backgroundColor: '#0f1419', paddingHorizontal: 26, paddingVertical: 14, borderRadius: 16 },
  buttonPressed: { transform: [{ translateY: 2 }], opacity: 0.9 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
