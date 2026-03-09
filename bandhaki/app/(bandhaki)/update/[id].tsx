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
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';

import { BandhakiFormSchema, type BandhakiFormSchemaType } from '../../../src/schema/FormSchema';
import { getBandhakiById, updateBandhaki, getCustomers } from '../../../src/api/endpoints';
import { useTheme } from '../../../src/hooks/useTheme';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Select } from '../../../src/components/ui/Select';

export default function UpdateBandhakiScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);

  // Fetch existing loan data
  const {
    data: loanData,
    isLoading: loanLoading,
    isError,
  } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => getBandhakiById(id!),
    enabled: !!id,
  });

  // Fetch customers for the select
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const loan = loanData?.entry;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BandhakiFormSchemaType>({
    resolver: zodResolver(BandhakiFormSchema),
    defaultValues: {
      customer: '',
      loanDate: '',
      principalAmount: 0,
      interestRate: 0,
      interestType: 'simple',
      goldItems: { itemType: '', weight: undefined, notes: '' },
      totalValuation: 0,
      status: 'active',
      paymentStatus: 'pending',
      images: [],
    },
  });

  // Populate form when loan data is available
  useEffect(() => {
    if (loan) {
      // Need to extract customer id - loan may have customerName but we need the customer _id
      // The API returns DetailedLoanEntry which has customerName, not customer object
      // We'll try to find the matching customer by name
      const matchedCustomer = customers.find((c: any) => c.name === loan.customerName);

      reset({
        customer: matchedCustomer?._id || '',
        loanDate: loan.loanDate ? loan.loanDate.split('T')[0] : '',
        principalAmount: loan.principalAmount,
        interestRate: loan.interestRate,
        interestType: loan.interestType as 'simple' | 'compound',
        goldItems: loan.goldItems?.[0] || { itemType: '', weight: undefined, notes: '' },
        totalValuation: loan.totalValuation || 0,
        status: loan.status,
        paymentStatus: loan.paymentStatus,
        images: loan.images || [],
      });
    }
  }, [loan, customers, reset]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const loanDate = watch('loanDate');

  const customerOptions = customers.map((c: any) => ({
    label: `${c.name}${c.phone ? ` (${c.phone})` : ''}`,
    value: c._id,
  }));

  const onSubmit = async (data: BandhakiFormSchemaType) => {
    setLoading(true);
    try {
      const result = await updateBandhaki(id!, {
        ...data,
        interestType: data.interestType as 'simple' | 'compound',
      });
      if (result.success) {
        Toast.show({ type: 'success', text1: 'Loan updated successfully!' });
        queryClient.invalidateQueries({ queryKey: ['loans'] });
        queryClient.invalidateQueries({ queryKey: ['loan', id] });
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        router.back();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: result.message || 'Failed to update loan' });
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

  if (loanLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !loan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorCenter}>
          <AlertTriangle size={40} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Loan Not Found</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
            Unable to load loan details
          </Text>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Update Loan</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            #{loan.loanNumber}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Customer Selection */}
        <Controller
          control={control}
          name="customer"
          render={({ field: { value, onChange } }) => (
            <Select
              label="Customer"
              placeholder="Select a customer"
              options={customerOptions}
              value={value}
              onValueChange={onChange}
              error={errors.customer?.message}
              required
              searchable
            />
          )}
        />

        {/* Loan Date */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.label, { color: colors.text }]}>
            Loan Date <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>{loanDate}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <View>
              {Platform.OS === 'web' ? (
                <Input
                  value={loanDate}
                  onChangeText={(text) => setValue('loanDate', text)}
                  placeholder="YYYY-MM-DD"
                />
              ) : (
                (() => {
                  const DateTimePicker = require('@react-native-community/datetimepicker').default;
                  return (
                    <DateTimePicker
                      value={new Date(loanDate || Date.now())}
                      mode="date"
                      display="default"
                      onChange={(_: any, date?: Date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) setValue('loanDate', date.toISOString().split('T')[0]);
                      }}
                    />
                  );
                })()
              )}
            </View>
          )}
          {errors.loanDate && (
            <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
              {errors.loanDate.message}
            </Text>
          )}
        </View>

        {/* Principal Amount */}
        <Controller
          control={control}
          name="principalAmount"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Principal Amount (Rs.)"
              placeholder="Enter amount"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              keyboardType="numeric"
              error={errors.principalAmount?.message}
              required
            />
          )}
        />

        {/* Interest Rate */}
        <Controller
          control={control}
          name="interestRate"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Interest Rate (% per month)"
              placeholder="Enter rate"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              keyboardType="decimal-pad"
              error={errors.interestRate?.message}
              required
            />
          )}
        />

        {/* Interest Type */}
        <Controller
          control={control}
          name="interestType"
          render={({ field: { value, onChange } }) => (
            <Select
              label="Interest Type"
              options={[
                { label: 'Simple Interest', value: 'simple' },
                { label: 'Compound Interest', value: 'compound' },
              ]}
              value={value}
              onValueChange={onChange}
              error={errors.interestType?.message}
              required
            />
          )}
        />

        {/* Status */}
        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <Select
              label="Status"
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Closed', value: 'closed' },
                { label: 'Defaulted', value: 'defaulted' },
              ]}
              value={value}
              onValueChange={onChange}
            />
          )}
        />

        {/* Gold Items */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Gold Items</Text>
        <Card style={{ marginBottom: 16 }}>
          <Controller
            control={control}
            name="goldItems.itemType"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Item Type"
                placeholder="e.g., Gold Ring, Necklace"
                value={value}
                onChangeText={onChange}
                error={errors.goldItems?.itemType?.message}
                required
              />
            )}
          />
          <Controller
            control={control}
            name="goldItems.weight"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Weight (grams)"
                placeholder="Enter weight"
                value={value ? String(value) : ''}
                onChangeText={(text) => onChange(parseFloat(text) || undefined)}
                keyboardType="decimal-pad"
              />
            )}
          />
          <Controller
            control={control}
            name="goldItems.notes"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Notes"
                placeholder="Additional info"
                value={value || ''}
                onChangeText={onChange}
                multiline
              />
            )}
          />
        </Card>

        {/* Total Valuation */}
        <Controller
          control={control}
          name="totalValuation"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Total Valuation (Rs.)"
              placeholder="Enter total valuation"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              keyboardType="numeric"
              error={errors.totalValuation?.message}
            />
          )}
        />

        {/* Submit */}
        <Button
          title="Update Loan Entry"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 24, marginBottom: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  errorDesc: { fontSize: 14, textAlign: 'center' },
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  dateBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: { fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
});
