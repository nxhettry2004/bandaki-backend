import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { SetupPasswordSchema, type SetupPasswordSchemaType } from '../../src/schema/FormSchema';
import { validateSetupToken, setupPassword } from '../../src/api/endpoints';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { LoadingScreen } from '../../src/components/ui/Loading';

export default function SetupPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [email, setEmail] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupPasswordSchemaType>({
    resolver: zodResolver(SetupPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidating(false);
    }
  }, [token]);

  async function validateToken() {
    try {
      const result = await validateSetupToken(token!);
      if (result.success) {
        setTokenValid(true);
        setEmail(result.email || '');
      } else {
        Toast.show({ type: 'error', text1: 'Invalid Token', text2: result.message });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to validate token' });
    } finally {
      setValidating(false);
    }
  }

  const onSubmit = async (data: SetupPasswordSchemaType) => {
    setLoading(true);
    try {
      const result = await setupPassword(data);
      if (result.success) {
        Toast.show({ type: 'success', text1: 'Password set successfully!' });
        router.replace('/(auth)/login');
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: result.message });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return <LoadingScreen message="Validating token..." />;
  }

  if (!tokenValid) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorTitle, { color: colors.error }]}>Invalid Token</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            The setup link is invalid or expired. Please request a new invitation.
          </Text>
          <Button
            title="Go to Login"
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.brandContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Set Your Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Setting up password for {email}
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                required
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry
                required
              />
            )}
          />

          <Button
            title="Set Password"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  formCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
