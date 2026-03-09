import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { ArrowLeft, UserPlus } from 'lucide-react-native';

import { CustomerFormSchema, type CustomerFormSchemaType } from '../../src/schema/FormSchema';
import { createCustomer } from '../../src/api/endpoints';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function NewCustomerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormSchemaType>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      idProof: '',
    },
  });

  const onSubmit = async (data: CustomerFormSchemaType) => {
    setLoading(true);
    try {
      const result = await createCustomer(data);
      if (result.success) {
        Toast.show({ type: 'success', text1: 'Customer created successfully!' });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        router.back();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to create customer',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Customer</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Add a new client to the system
          </Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
          <UserPlus size={18} color={colors.primary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Full Name"
              placeholder="Enter customer name"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={value || ''}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Address"
              placeholder="Enter address"
              value={value || ''}
              onChangeText={onChange}
              multiline
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="idProof"
          render={({ field: { onChange, value } }) => (
            <Input
              label="ID Proof Number"
              placeholder="Citizenship number or other ID"
              value={value || ''}
              onChangeText={onChange}
              error={errors.idProof?.message}
            />
          )}
        />

        <Button
          title="Create Customer"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
});
