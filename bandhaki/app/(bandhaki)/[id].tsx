import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  Percent,
  TrendingUp,
  AlertCircle,
  Edit,
  Trash2,
  Image as ImageIcon,
  CreditCard,
} from 'lucide-react-native';

import { getBandhakiById, getPaymentsByBandhaki, deleteBandhaki } from '../../src/api/endpoints';
import { useTheme } from '../../src/hooks/useTheme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import type { DetailedLoanEntry, Payment } from '../../src/types';

function formatAmount(value?: number) {
  if (value === null || value === undefined) return '—';
  try {
    return (
      'Rs. ' +
      Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  } catch {
    return String(value);
  }
}

export default function LoanDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deleting, setDeleting] = useState(false);

  // Fetch loan detail
  const {
    data: loanData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => getBandhakiById(id!),
    enabled: !!id,
  });

  // Fetch payments
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => getPaymentsByBandhaki(id!),
    enabled: !!id,
  });

  const loan: DetailedLoanEntry | null = loanData?.entry || null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Loan',
      'Are you sure you want to delete this loan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteBandhaki(id!);
              if (result.success) {
                Toast.show({ type: 'success', text1: 'Loan deleted successfully' });
                queryClient.invalidateQueries({ queryKey: ['loans'] });
                queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
                queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
                router.back();
              } else {
                Toast.show({ type: 'error', text1: 'Failed to delete', text2: result.message });
              }
            } catch (err: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Something went wrong' });
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
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
          <View style={[styles.errorIcon, { backgroundColor: colors.errorLight || '#FEE2E2' }]}>
            <AlertTriangle size={32} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {loan === null ? 'Loan Not Found' : 'Error Loading Loan'}
          </Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
            {(error as any)?.message || 'Unable to load loan details'}
          </Text>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const totalInterestDue = loan.calculatedInterest + (loan.outstandingInterest || 0);
  const hasOutstandingInterest = (loan.outstandingInterest || 0) > 0;
  const totalDaysSinceLoan = Math.floor(
    (new Date().getTime() - new Date(loan.loanDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Loan Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push(`/(bandhaki)/update/${id}`)}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Edit size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Trash2 size={16} color={colors.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Status & Number Card */}
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.statusRow}>
            <View>
              <Text style={[styles.loanLabel, { color: colors.textTertiary }]}>LOAN NUMBER</Text>
              <Text style={[styles.loanNumber, { color: colors.text }]}>#{loan.loanNumber}</Text>
              <Text style={[styles.customerNameSmall, { color: colors.textSecondary }]}>
                {loan.customerName}
              </Text>
            </View>
            <StatusBadge status={loan.status} />
          </View>
          <StatusBadge status={loan.paymentStatus} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
        </Card>

        {/* Outstanding Interest Alert */}
        {hasOutstandingInterest && (
          <View style={[styles.alertCard, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
            <AlertCircle size={18} color="#EA580C" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.alertTitle, { color: '#9A3412' }]}>
                Outstanding Interest from Previous Payments
              </Text>
              <Text style={[styles.alertDesc, { color: '#C2410C' }]}>
                Outstanding: {formatAmount(loan.outstandingInterest)}
              </Text>
            </View>
          </View>
        )}

        {/* Amount Grid */}
        <View style={styles.amountGrid}>
          <View style={[styles.amountCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[styles.amountCardLabel, { color: '#1D4ED8' }]}>STARTING PRINCIPAL</Text>
            <Text style={[styles.amountCardValue, { color: '#1E3A8A' }]}>
              {formatAmount(loan.principalAmount)}
            </Text>
          </View>
          <View style={[styles.amountCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={[styles.amountCardLabel, { color: '#DC2626' }]}>CURRENT PRINCIPAL</Text>
            <Text style={[styles.amountCardValue, { color: '#991B1B' }]}>
              {formatAmount(loan.outstandingPrincipal)}
            </Text>
          </View>
          <View style={[styles.amountCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Text style={[styles.amountCardLabel, { color: '#16A34A' }]}>TOTAL PAID</Text>
            <Text style={[styles.amountCardValue, { color: '#166534' }]}>
              {formatAmount(loan.paidAmount)}
            </Text>
          </View>
          <View style={[styles.amountCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Text style={[styles.amountCardLabel, { color: '#D97706' }]}>TOTAL DUE</Text>
            <Text style={[styles.amountCardValue, { color: '#92400E' }]}>
              {formatAmount(loan.totalDue)}
            </Text>
          </View>
        </View>

        {/* Interest Breakdown */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Interest Breakdown</Text>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#FFF7ED' }]}>
              <TrendingUp size={18} color="#EA580C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>CURRENT PERIOD INTEREST</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatAmount(loan.calculatedInterest)}
              </Text>
            </View>
          </View>

          {hasOutstandingInterest && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#FEF2F2' }]}>
                  <AlertCircle size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                    OUTSTANDING FROM PREVIOUS
                  </Text>
                  <Text style={[styles.infoValue, { color: '#991B1B' }]}>
                    {formatAmount(loan.outstandingInterest)}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={[styles.totalInterestRow, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.totalInterestLabel, { color: colors.primary }]}>TOTAL INTEREST DUE</Text>
            <Text style={[styles.totalInterestValue, { color: colors.primaryDark || colors.primary }]}>
              {formatAmount(totalInterestDue)}
            </Text>
          </View>
        </Card>

        {/* Loan Information */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Loan Information</Text>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#ECFEFF' }]}>
              <Calendar size={18} color="#0891B2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>LOAN DATE</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{loan.loanDate}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#F5F3FF' }]}>
              <Clock size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>LAST INTEREST PAID DATE</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {loan.lastInterestPaidDate || loan.loanDate}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#EEF2FF' }]}>
              <Text style={{ fontSize: 16 }}>📅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                DAYS SINCE LAST PAYMENT
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{loan.daysSinceLoan} days</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#EFF6FF' }]}>
              <Text style={{ fontSize: 16 }}>🗓️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                TOTAL DAYS SINCE LOAN ISSUED
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{totalDaysSinceLoan} days</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#F5F3FF' }]}>
              <Percent size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>INTEREST RATE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {loan.interestRate}% per month
                </Text>
                <StatusBadge status={loan.interestType} />
              </View>
            </View>
          </View>
        </Card>

        {/* Gold Items / Collateral */}
        {((loan.goldItems && loan.goldItems.length > 0) || (loan.totalValuation && loan.totalValuation > 0)) && (
          <Card style={{ marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Collateral Details</Text>

            {loan.totalValuation && loan.totalValuation > 0 && (
              <View style={[styles.valuationCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20 }}>💎</Text>
                  <View>
                    <Text style={[styles.amountCardLabel, { color: '#D97706' }]}>TOTAL VALUATION</Text>
                    <Text style={[styles.amountCardValue, { color: '#92400E' }]}>
                      {formatAmount(loan.totalValuation)}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: '#D97706' }}>LTV Ratio</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E' }}>
                    {loan.totalValuation > 0
                      ? ((loan.principalAmount / loan.totalValuation) * 100).toFixed(1)
                      : 0}
                    %
                  </Text>
                </View>
              </View>
            )}

            {loan.goldItems && loan.goldItems.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.subLabel, { color: colors.textTertiary }]}>
                  PLEDGED ITEMS ({loan.goldItems.length})
                </Text>
                {loan.goldItems.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.goldItemRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  >
                    <View style={styles.goldItemLeft}>
                      <View style={[styles.goldItemIndex, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400E' }}>{index + 1}</Text>
                      </View>
                      <View>
                        <Text style={[styles.goldItemType, { color: colors.text }]}>{item.itemType}</Text>
                        {item.notes && (
                          <Text style={[styles.goldItemNotes, { color: colors.textTertiary }]}>{item.notes}</Text>
                        )}
                      </View>
                    </View>
                    {item.weight && item.weight > 0 && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.goldWeight, { color: colors.text }]}>{item.weight}g</Text>
                        <Text style={{ fontSize: 10, color: colors.textTertiary }}>weight</Text>
                      </View>
                    )}
                  </View>
                ))}
                {loan.goldItems.some((i) => i.weight && i.weight > 0) && (
                  <View style={[styles.totalWeightRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.subLabel, { color: colors.textTertiary }]}>TOTAL WEIGHT</Text>
                    <Text style={[styles.goldWeight, { color: colors.text }]}>
                      {loan.goldItems.reduce((s, i) => s + (i.weight || 0), 0).toFixed(2)}g
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

        {/* Payment Priority */}
        <Card variant="info" style={{ marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: '#1E3A8A' }]}>💡 Payment Priority</Text>
          <Text style={[styles.priorityItem, { color: '#1E40AF' }]}>
            1. Outstanding interest paid first ({formatAmount(loan.outstandingInterest || 0)})
          </Text>
          <Text style={[styles.priorityItem, { color: '#1E40AF' }]}>
            2. Current period interest paid second ({formatAmount(loan.calculatedInterest)})
          </Text>
          <Text style={[styles.priorityItem, { color: '#1E40AF' }]}>
            3. Remaining reduces principal balance
          </Text>
        </Card>

        {/* Loan Images */}
        {loan.images && loan.images.length > 0 && (
          <Card style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ImageIcon size={16} color={colors.text} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Loan Images ({loan.images.length})
              </Text>
            </View>
            <View style={styles.imageGrid}>
            {loan.images.map((img, index) => (
              <View
                key={index}
                style={[styles.imageItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <Image source={{ uri: img.url }} style={styles.imagePreview} resizeMode="cover" />
                <Text style={[styles.imageItemText, { color: colors.text }]} numberOfLines={1}>
                  📄 {img.name || `Image ${index + 1}`}
                </Text>
              </View>
            ))}
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Record Payment"
            style={{borderRadius: 6}}
            variant="primary"
            fullWidth
            size="lg"
            onPress={() => router.push({ pathname: '/(payments)/new', params: { loanId: id } })}
            icon={<CreditCard size={18} color="#fff" />}
          />
          <Button
            title="Edit Loan"
            style={{borderRadius: 6}}
            variant="outline"
            fullWidth
            onPress={() => router.push(`/(bandhaki)/update/${id}`)}
            icon={<Edit size={16} color={colors.text} />}
          />
        </View>

        {/* Payments List */}
        {payments.length > 0 && (
          <Card style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Payment History ({payments.length})
            </Text>
            {payments.map((payment: Payment, index: number) => (
              <View
                key={payment._id}
                style={[
                  styles.paymentRow,
                  { borderBottomColor: colors.border },
                  index === payments.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentDate, { color: colors.text }]}>
                    {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.paymentMeta, { color: colors.textTertiary }]}>
                    {payment.paymentMethod} • Interest: {formatAmount(payment.interestComponent)}
                    {payment.principalComponent
                      ? ` • Principal: ${formatAmount(payment.principalComponent)}`
                      : ''}
                  </Text>
                  {payment.notes && (
                    <Text style={[styles.paymentNotes, { color: colors.textTertiary }]}>
                      {payment.notes}
                    </Text>
                  )}
                </View>
                <Text style={[styles.paymentAmount, { color: colors.success }]}>
                  {formatAmount(payment.amount)}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
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
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loanLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  loanNumber: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  customerNameSmall: { fontSize: 12, marginTop: 2 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  alertTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  alertDesc: { fontSize: 12 },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amountCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  amountCardLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  amountCardValue: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  totalInterestRow: {
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInterestLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  totalInterestValue: { fontSize: 17, fontWeight: '800' },
  subLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  valuationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goldItemRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goldItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  goldItemIndex: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goldItemType: { fontSize: 14, fontWeight: '600' },
  goldItemNotes: { fontSize: 11, marginTop: 2 },
  goldWeight: { fontSize: 14, fontWeight: '700' },
  totalWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  priorityItem: { fontSize: 12, marginBottom: 6, lineHeight: 18 },
  imageItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 6,
    width: '48%',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imagePreview: {
    width: '100%',
    height: 110,
    borderRadius: 6,
    marginBottom: 8,
  },
  imageItemText: { fontSize: 13 },
  actions: { gap: 10, marginBottom: 16 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  paymentDate: { fontSize: 14, fontWeight: '600' },
  paymentMeta: { fontSize: 11, marginTop: 3, lineHeight: 16 },
  paymentNotes: { fontSize: 11, marginTop: 3, fontStyle: 'italic' },
  paymentAmount: { fontSize: 15, fontWeight: '700' },
});
