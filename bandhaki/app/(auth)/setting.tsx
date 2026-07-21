import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

 const Setting = () => {
  const { colors } = useTheme();
    const router = useRouter();
  
  const [endpoint , setEndpoint] = useState<string>("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              Settings
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
              Configure your application
            </Text>

            <Input
              label="API Endpoint"
              placeholder="http://192.168.1.100:5000"
              autoCapitalize="none"
              autoCorrect={false}
              value={endpoint}
              onChangeText={(newVal:string) => {
                    setEndpoint(newVal)
              }}
            />

            <Button
                onPress={async () => {
                    await SecureStore.setItem("API_ENDPOINT" , endpoint)
                    router.navigate("/(auth)/login")
                }}
              title="Save"
              fullWidth
              size="lg"
              style={{ marginTop: 8, borderRadius: 6 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Setting

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
})
