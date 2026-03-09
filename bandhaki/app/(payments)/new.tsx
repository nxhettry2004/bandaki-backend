import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react-native';

import { BandhakiPaymentSchema, type BandhakiPaymentSchemaType } from '../../src/schema/FormSchema';
import { getBandhakiById, createPayment } from '../../src/api/endpoints';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Select } from '../../src/components/ui/Select';

function formatAmount(value?: number) {
  if (value === null || value === undefined) return '—';
  return (
    'Rs. ' +
    Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  );
}

export default function NewPaymentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch loan details so we can show context
  const { data: loanData, isLoading: loanLoading } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => getBandhakiById(loanId!),
    enabled: !!loanId,
  });

  const loan = loanData?.entry;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BandhakiPaymentSchemaType>({
    resolver: zodResolver(BandhakiPaymentSchema),
    defaultValues: {
      bandhaki: loanId || '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      interestComponent: 0,
      principalComponent: 0,
      paymentMethod: 'cash',
      notes: '',
    },
  });

  const paymentDate = watch('paymentDate');
  const amount = watch('amount');

  // Auto-calculate interest & principal components based on payment priority
  useEffect(() => {
    if (loan && amount > 0) {
      const outstandingInterest = loan.outstandingInterest || 0;
      const calculatedInterest = loan.calculatedInterest || 0;
      const totalInterestDue = outstandingInterest + calculatedInterest;

      let interestPortion = 0;
      let principalPortion = 0;

      if (amount <= totalInterestDue) {
        // Payment only covers interest
        interestPortion = amount;
        principalPortion = 0;
      } else {
        // Payment covers all interest + some principal
        interestPortion = totalInterestDue;
        principalPortion = amount - totalInterestDue;
      }

      setValue('interestComponent', Math.round(interestPortion * 100) / 100);
      setValue('principalComponent', Math.round(principalPortion * 100) / 100);
    }
  }, [amount, loan, setValue]);

  const onSubmit = async (data: BandhakiPaymentSchemaType) => {
    setLoading(true);
    try {
      const result = await createPayment({
        bandhaki: loanId!,
        paymentDate: data.paymentDate,
        amount: data.amount,
        interestComponent: data.interestComponent ?? 0,
        principalComponent: data.principalComponent ?? 0,
        paymentMethod: data.paymentMethod,
        notes: data.notes || '',
      });

      if (result.success) {
        Toast.show({ type: 'success', text1: 'Payment recorded successfully!' });
        queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
        queryClient.invalidateQueries({ queryKey: ['payments', loanId] });
        queryClient.invalidateQueries({ queryKey: ['loans'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
        router.back();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to record payment',
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Record Payment</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {loan ? `Loan #${loan.loanNumber}` : 'Loading...'}
          </Text>
        </View>
        <View style={[styles.headerIconBox, { backgroundColor: '#DCFCE7' }]}>
          <CreditCard size={18} color="#16A34A" />
        </View>
      </View>

      {loanLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Loan Summary */}
          {loan && (
            <Card style={{ marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Loan Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Customer</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {loan.customerName}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
                    Outstanding Principal
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                    {formatAmount(loan.outstandingPrincipal)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
                    Interest Due
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#EA580C' }]}>
                    {formatAmount(loan.calculatedInterest + (loan.outstandingInterest || 0))}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Total Due</Text>
                  <Text style={[styles.summaryValue, { color: '#D97706' }]}>
                    {formatAmount(loan.totalDue)}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Payment Priority Info */}
          <View style={[styles.infoBar, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <AlertCircle size={16} color="#1D4ED8" />
            <Text style={[styles.infoBarText, { color: '#1E40AF' }]}>
              Payment is allocated: Outstanding interest → Current interest → Principal
            </Text>
          </View>

          {/* Payment Date */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              Payment Date <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>{paymentDate}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <View>
                {Platform.OS === 'web' ? (
                  <Input
                    value={paymentDate}
                    onChangeText={(text) => setValue('paymentDate', text)}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  (() => {
                    const DateTimePicker = require('@react-native-community/datetimepicker').default;
                    return (
                      <DateTimePicker
                        value={new Date(paymentDate || Date.now())}
                        mode="date"
                        display="default"
                        onChange={(_: any, date?: Date) => {
                          setShowDatePicker(Platform.OS === 'ios');
                          if (date) setValue('paymentDate', date.toISOString().split('T')[0]);
                        }}
                      />
                    );
                  })()
                )}
              </View>
            )}
          </View>

          {/* Amount */}
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Payment Amount (Rs.)"
                placeholder="Enter payment amount"
                value={value ? String(value) : ''}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                keyboardType="numeric"
                error={errors.amount?.message}
                required
              />
            )}
          />

          {/* Auto-calculated breakdown */}
          {amount > 0 && (
            <Card variant="success" style={{ marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { color: '#166534' }]}>Payment Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={{ fontSize: 13, color: '#15803D' }}>Interest Component:</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#166534' }}>
                  {formatAmount(watch('interestComponent'))}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={{ fontSize: 13, color: '#15803D' }}>Principal Component:</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#166534' }}>
                  {formatAmount(watch('principalComponent'))}
                </Text>
              </View>
            </Card>
          )}

          {/* Payment Method */}
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: { value, onChange } }) => (
              <Select
                label="Payment Method"
                options={[
                  { label: 'Cash', value: 'cash' },
                  { label: 'Bank Transfer', value: 'bank_transfer' },
                  { label: 'Cheque', value: 'cheque' },
                  { label: 'Other', value: 'other' },
                ]}
                value={value}
                onValueChange={onChange}
                error={errors.paymentMethod?.message}
                required
              />
            )}
          />

          {/* Notes */}
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Notes (optional)"
                placeholder="Add any notes about this payment"
                value={value || ''}
                onChangeText={onChange}
                multiline
              />
            )}
          />

          {/* Submit */}
          <Button
            title="Record Payment"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 24, marginBottom: 16 }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  summaryGrid: { gap: 10 },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBarText: { fontSize: 12, flex: 1, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  dateBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: { fontSize: 15 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
});
