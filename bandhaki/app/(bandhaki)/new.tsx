import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { ArrowLeft, Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';

import { BandhakiFormSchema, type BandhakiFormSchemaType } from '../../src/schema/FormSchema';
import { createBandhaki } from '../../src/api/endpoints';
import { uploadImageToCloudinary } from '../../src/api/cloudinary';
import { useCustomers } from '../../src/hooks/useCustomers';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Select } from '../../src/components/ui/Select';
import { QuickAddCustomerModal } from '../../src/components/QuickAddCustomerModal';
import type { LoanImage } from '../../src/types';

export default function NewBandhakiScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: customers = [] } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<LoanImage[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BandhakiFormSchemaType>({
    resolver: zodResolver(BandhakiFormSchema),
    defaultValues: {
      customer: '',
      loanDate: new Date().toISOString().split('T')[0],
      principalAmount: 0,
      interestRate: 2.5,
      interestType: 'simple',
      goldItems: { itemType: '', weight: undefined, notes: '' },
      totalValuation: 0,
      status: 'active',
      paymentStatus: 'pending',
      images: [],
    },
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const loanDate = watch('loanDate');

  const customerOptions = customers.map((c: any) => ({
    label: `${c.name}${c.phone ? ` (${c.phone})` : ''}`,
    value: c._id,
  }));

  const uploadAssets = async (assets: ImagePickerAsset[]) => {
    setUploadingCount(assets.length);
    try {
      const uploaded = await Promise.all(
        assets.map((asset) => uploadImageToCloudinary(asset))
      );
      setImages((prev) => {
        const next = [...prev, ...uploaded];
        setValue('images', next);
        return next;
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: 'Could not upload one or more images. Please try again.',
      });
    } finally {
      setUploadingCount(0);
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    await uploadAssets(result.assets);
  };

  const captureImageFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Camera permission required' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;
    await uploadAssets(result.assets);
  };

  const handleUploadPress = () => {
    Alert.alert('Add Photos', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: captureImageFromCamera },
      { text: 'Choose from Gallery', onPress: pickImageFromGallery },
    ]);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    setValue('images', updated);
  };

  const onSubmit = async (data: BandhakiFormSchemaType) => {
    setLoading(true);
    try {
      const result = await createBandhaki({
        ...data,
        interestType: data.interestType as 'simple' | 'compound',
        goldItems: [data.goldItems],
        images,
      });

      if (result.success) {
        Toast.show({ type: 'success', text1: 'Loan created successfully!' });
        queryClient.invalidateQueries({ queryKey: ['loans'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
        queryClient.invalidateQueries({ queryKey: ['customerLoans'] });
        router.back();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to create loan',
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
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Loan</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Create a new log book entry
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
              addNewLabel="Add New"
              onAddNew={() => setQuickAddVisible(true)}
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

        {/* Images */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Loan Images</Text>

        {/* Upload area */}
        <TouchableOpacity
          style={[
            styles.uploadArea,
            { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
            uploadingCount > 0 && { opacity: 0.6 },
          ]}
          onPress={handleUploadPress}
          activeOpacity={0.7}
          disabled={uploadingCount > 0}
        >
          {uploadingCount > 0 ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />
          ) : (
            <View style={[styles.uploadIconBg, { backgroundColor: colors.primaryLight }]}>
              <Camera size={28} color={colors.primary} />
            </View>
          )}
          <Text style={[styles.uploadTitle, { color: colors.text }]}>
            {uploadingCount > 0
              ? `Uploading ${uploadingCount} photo${uploadingCount > 1 ? 's' : ''}...`
              : images.length > 0
                ? 'Add More Photos'
                : 'Upload Photos'}
          </Text>
          <Text style={[styles.uploadSub, { color: colors.textTertiary }]}>
            Tap to select images of gold items
          </Text>
        </TouchableOpacity>

        {/* Image previews */}
        {images.length > 0 && (
          <View style={styles.imagesRow}>
            {images.map((img, idx) => (
              <View key={idx} style={[styles.imageThumb, { backgroundColor: colors.surfaceSecondary }]}>
                <Image source={{ uri: img.url }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity
                  style={[styles.imageRemoveBtn, { backgroundColor: colors.errorLight }]}
                  onPress={() => removeImage(idx)}
                >
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Submit */}
        <Button
          title="Create Loan Entry"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={uploadingCount > 0}
          fullWidth
          size="lg"
          style={{ marginTop: 24, marginBottom: 16, borderRadius: 6 }}
        />
      </ScrollView>

      <QuickAddCustomerModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onCreated={(customer) => {
          setQuickAddVisible(false);
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          setValue('customer', customer._id);
        }}
      />
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
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: { fontSize: 15, fontWeight: '600' },
  uploadSub: { fontSize: 12, marginTop: 4 },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  imageThumb: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
