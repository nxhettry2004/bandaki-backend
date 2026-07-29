import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomerFormSchema, type CustomerFormSchemaType } from '../schema/FormSchema';
import { createCustomer } from '../api/endpoints';
import { useTheme } from '../hooks/useTheme';
import type { Customer } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface QuickAddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export function QuickAddCustomerModal({ visible, onClose, onCreated }: QuickAddCustomerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormSchemaType>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: { name: '', phone: '', address: '', idProof: '' },
  });

  const handleClose = () => {
    reset({ name: '', phone: '', address: '', idProof: '' });
    onClose();
  };

  const onSubmit = async (data: CustomerFormSchemaType) => {
    setLoading(true);
    try {
      const result = await createCustomer(data);
      if (result.success && result.data) {
        Toast.show({ type: 'success', text1: 'Customer added' });
        reset({ name: '', phone: '', address: '', idProof: '' });
        onCreated(result.data);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: result.message || 'Failed to add customer' });
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
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.overlay,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Quick Add Customer</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

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

          <Button
            title="Add Customer"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 4 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
});
