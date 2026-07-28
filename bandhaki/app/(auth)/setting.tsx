import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { getApiEndpoint, setApiEndpoint } from '../../src/api/axiosClient';

const OTP_CODE = "5733";
const MAX_ATTEMPTS = 3;
const OTP_ATTEMPTS_KEY = "otp_failed_attempts";

const Setting = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const [endpoint, setEndpoint] = useState<string>("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(true);

  useEffect(() => {
    checkFailedAttempts();
    getApiEndpoint().then(setEndpoint).catch(() => {});
  }, []);

  const checkFailedAttempts = async () => {
    try {
      const attempts = await SecureStore.getItemAsync(OTP_ATTEMPTS_KEY);
      const attemptCount = parseInt(attempts || "0", 10);
      setFailedAttempts(attemptCount);

      if (attemptCount >= MAX_ATTEMPTS) {
        setOtpError("Maximum attempts exceeded. Settings locked.");
      }
    } catch (error) {
      console.error("Error checking attempts:", error);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 4) {
      setOtpError("OTP must be 4 digits");
      return;
    }

    if (failedAttempts >= MAX_ATTEMPTS) {
      setOtpError("Settings locked. Maximum attempts exceeded.");
      return;
    }

    if (otp === OTP_CODE) {
      setIsOtpVerified(true);
      setShowOtpModal(false);
      await SecureStore.deleteItemAsync(OTP_ATTEMPTS_KEY);
      setOtpError("");
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      await SecureStore.setItemAsync(OTP_ATTEMPTS_KEY, newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        setOtpError(`Wrong OTP. Settings locked after ${MAX_ATTEMPTS} attempts.`);
      } else {
        setOtpError(`Wrong OTP. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      setOtp("");
    }
  };

  const handleBackFromOtp = () => {
    router.back();
  };

  if (failedAttempts >= MAX_ATTEMPTS && !isOtpVerified) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.error || "#FF4444" }]}>
              Access Denied
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary, marginBottom: 16 }]}>
              Settings have been locked due to too many incorrect OTP attempts.
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary, marginBottom: 24 }]}>
              Please contact administrator to unlock.
            </Text>
            <Button
              onPress={handleBackFromOtp}
              title="Go Back"
              fullWidth
              size="lg"
              style={{ marginTop: 8, borderRadius: 6 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {!isOtpVerified ? (
          <Modal
            visible={showOtpModal}
            transparent
            animationType="slide"
            onRequestClose={handleBackFromOtp}
          >
            <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Enter OTP
                  </Text>
                  <TouchableOpacity onPress={handleBackFromOtp}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Enter the 4-digit OTP code to access settings
                </Text>

                <Input
                  label="OTP Code"
                  placeholder="0000"
                  maxLength={4}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={otp}
                  onChangeText={(newVal: string) => {
                    setOtp(newVal.replace(/[^0-9]/g, ""));
                    if (otpError) setOtpError("");
                  }}
                  error={otpError}
                />

                <View style={styles.attemptsInfo}>
                  <Text style={[styles.attemptsText, { color: colors.textSecondary }]}>
                    Attempts remaining: {Math.max(0, MAX_ATTEMPTS - failedAttempts)}
                  </Text>
                </View>

                <Button
                  onPress={handleOtpSubmit}
                  title="Verify"
                  fullWidth
                  size="lg"
                  disabled={failedAttempts >= MAX_ATTEMPTS}
                  style={{ marginTop: 16, borderRadius: 6 }}
                />
                <Button
                  onPress={handleBackFromOtp}
                  title="Cancel"
                  fullWidth
                  size="lg"
                  variant="outline"
                  style={{ marginTop: 8, borderRadius: 6 }}
                />
              </View>
            </View>
          </Modal>
        ) : (
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
                onChangeText={(newVal: string) => {
                  setEndpoint(newVal)
                }}
              />

              <Button
                onPress={async () => {
                  await setApiEndpoint(endpoint)
                  router.navigate("/(auth)/login")
                }}
                title="Save"
                fullWidth
                size="lg"
                style={{ marginTop: 8, borderRadius: 6 }}
              />
            </View>
          </ScrollView>
        )}
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  attemptsInfo: {
    marginVertical: 12,
  },
  attemptsText: {
    fontSize: 12,
    fontWeight: "500",
  },
})
