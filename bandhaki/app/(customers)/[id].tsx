import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  Edit,
  FileText,
  AlertTriangle,
} from 'lucide-react-native';

import { getCustomerById } from '../../src/api/endpoints';
import { useTheme } from '../../src/hooks/useTheme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import type { Customer } from '../../src/types';

export default function CustomerDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: customer,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !customer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorCenter}>
          <AlertTriangle size={40} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Customer Not Found</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Customer Details</Text>
        <TouchableOpacity
          onPress={() => router.push(`/(customers)/update/${id}`)}
          style={[styles.editBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <Edit size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Profile Card */}
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarLarge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarLargeText, { color: colors.primary }]}>
                {customer.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.customerName, { color: colors.text }]}>{customer.name}</Text>
              <Text style={[styles.customerSince, { color: colors.textTertiary }]}>
                Customer since {new Date(customer.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Contact Info */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>

          {customer.phone && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#EFF6FF' }]}>
                <Phone size={16} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{customer.phone}</Text>
              </View>
            </View>
          )}

          {customer.address && (
            <>
              {customer.phone && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#F0FDF4' }]}>
                  <MapPin size={16} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Address</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{customer.address}</Text>
                </View>
              </View>
            </>
          )}

          {customer.idProof && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#F5F3FF' }]}>
                  <CreditCard size={16} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>ID Proof</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{customer.idProof}</Text>
                </View>
              </View>
            </>
          )}

          {!customer.phone && !customer.address && !customer.idProof && (
            <Text style={[styles.noInfoText, { color: colors.textTertiary }]}>
              No contact information available
            </Text>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="View Loans"
            variant="primary"
            fullWidth
            size="lg"
            onPress={() =>
              router.push({
                pathname: '/(bandhaki)/customer-loans',
                params: { customerId: id, name: customer.name },
              })
            }
            icon={<FileText size={18} color="#fff" />}
          />

          <Button
            title="Edit Customer"
            variant="outline"
            fullWidth
            onPress={() => router.push(`/(customers)/update/${id}`)}
            icon={<Edit size={16} color={colors.text} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  editBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: { fontSize: 22, fontWeight: '800' },
  customerName: { fontSize: 18, fontWeight: '700' },
  customerSince: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  noInfoText: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  actions: { gap: 10, marginBottom: 16 },
});
