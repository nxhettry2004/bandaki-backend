import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableHighlight,
  TouchableOpacity,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";

import {
  LoginFormSchema,
  type LoginFormSchemaType,
} from "../../src/schema/FormSchema";
import { loginApi } from "../../src/api/endpoints";
import { API_URL } from "../../src/api/axiosClient";
import { maybeInitialPull } from "../../src/sync/useSyncTriggers";
import { useTheme } from "../../src/hooks/useTheme";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Eye, EyeOff, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_ATTEMPTS_KEY = "otp_failed_attempts";
const MAX_ATTEMPTS = 3;

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settingsDisabled, setSettingsDisabled] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormSchemaType>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      checkSettingsAccess();
    }, [])
  );

  const checkSettingsAccess = async () => {
    try {
      const attempts = await SecureStore.getItemAsync(OTP_ATTEMPTS_KEY);
      const attemptCount = parseInt(attempts || "0", 10);
      setSettingsDisabled(attemptCount >= MAX_ATTEMPTS);
    } catch (error) {
      console.error("Error checking settings access:", error);
    }
  };

  const handleSettingsPress = () => {
    if (settingsDisabled) {
      Toast.show({
        type: "error",
        text1: "Settings Locked",
        text2: "Maximum OTP attempts exceeded",
      });
      return;
    }
    router.navigate("/(auth)/setting");
  };

  const onSubmit = async (data: LoginFormSchemaType) => {
    setLoading(true);
    try {
      const result = await loginApi(data);
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        Toast.show({ type: "success", text1: "Login successful" });
        // The sync engine mounted before a token existed, so its first-pull
        // attempt was a no-op. Kick it now that this device is authenticated.
        maybeInitialPull();
        router.replace("/(tabs)/dashboard");
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: result.message || "Invalid credentials",
        });
      }
    } catch (error: any) {
      const isNetworkError = !error?.response;

      Toast.show({
        type: "error",
        text1: "Error",
        text2: isNetworkError
          ? `Cannot reach server at ${API_URL}`
          : error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 48,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoCircle]}>
            <Image
              source={require("../../assets/images/noBg.png")}
              style={{ width: 126, height: 126 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Log Book</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gold Loan Ledger Management
          </Text>
        </View>

        {/* Login Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            Sign In 
          </Text>
          <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
            Enter your account credentials to continue
          </Text>

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Username or Email"
                placeholder="Enter your username"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.username?.message}
                autoCapitalize="none"
                autoCorrect={false}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={!showPassword}
                rightIcon={
                  showPassword ? (
                    <EyeOff size={18} color={colors.textTertiary} />
                  ) : (
                    <Eye size={18} color={colors.textTertiary} />
                  )
                }
                onRightIconPress={() => setShowPassword((prev) => !prev)}
                required
              />
            )}
          />

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8, borderRadius: 6 }}
          />
        </View>

        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          Version 1.0.0 • Log Book Gold Ledger
        </Text>

        <TouchableOpacity
          onPress={handleSettingsPress}
          disabled={settingsDisabled}
          style={{position:'absolute' , top:insets.top *1.5, right:20 , padding:10, opacity: settingsDisabled ? 0.4 : 1 }}
        >
            <Settings size={24} color={settingsDisabled ? '#999' : 'black'}/>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingBtn:{
    position:'absolute',
    top:0,
    right:0
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
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
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 32,
  },
});
