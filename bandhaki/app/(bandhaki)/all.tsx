import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Search,
} from 'lucide-react-native';

import { useLoans } from '../../src/hooks/useLoans';
import { useTheme } from '../../src/hooks/useTheme';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';
import type { LoanListEntry } from '../../src/types';

export default function AllLoansScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const limit = 15;

  const { data, isLoading, refetch, isRefetching } = useLoans({ page, limit, query });

  const loans = data?.loans || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit };

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setPage(1);
  }, []);

  const goToLoan = (id: string) => {
    router.push(`/(bandhaki)/${id}`);
  };

  const renderLoan = ({ item }: { item: LoanListEntry }) => (
    <TouchableOpacity
      style={[styles.loanCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => goToLoan(item._id)}
      activeOpacity={0.7}
    >
      {/* Top row: loan number + status */}
      <View style={styles.loanCardTop}>
        <View style={[styles.loanNumberBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.loanNumberText, { color: colors.primary }]}>{item.loanNumber}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Middle row: customer + amount */}
      <View style={styles.loanCardMiddle}>
        <View style={styles.customerInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
              {item.customer?.name?.charAt(0) || item.customerName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
              {item.customer?.name || item.customerName || 'Unknown'}
            </Text>
            <Text style={[styles.customerPhone, { color: colors.textTertiary }]}>
              {item.customer?.phone || item.customerPhone || ''}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amountLabel, { color: colors.textTertiary }]}>Principal</Text>
          <Text style={[styles.amountValue, { color: colors.success }]}>
            Rs. {item.principalAmount?.toLocaleString() || '0'}
          </Text>
        </View>
      </View>

      {/* Bottom row: date + payment status */}
      <View style={[styles.loanCardBottom, { borderTopColor: colors.border }]}>
        <View style={styles.loanMeta}>
          <Calendar size={13} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {item.loanDate
              ? new Date(item.loanDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit',
                })
              : '—'}
          </Text>
          <Wallet size={13} color={colors.textTertiary} style={{ marginLeft: 12 }} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {item.paymentStatus}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>All Loans</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {pagination.totalCount} total entries
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(bandhaki)/new')}
        >
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={handleSearch}
          placeholder="Search by name, loan number..."
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : loans.length === 0 ? (
        <EmptyState
        //   icon={Search}
          title="No loans found"
          description={query ? 'Try adjusting your search' : 'Create your first loan to get started'}
          actionLabel={query ? undefined : 'New Loan'}
          onAction={query ? undefined : () => router.push('/(bandhaki)/new')}
        />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item._id}
          renderItem={renderLoan}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={[styles.pageBtn, { opacity: page <= 1 ? 0.3 : 1, backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <ChevronLeft size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageText, { color: colors.textSecondary }]}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </Text>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            style={[styles.pageBtn, { opacity: page >= pagination.totalPages ? 0.3 : 1, backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <ChevronRight size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
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
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 16 },
  loanCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  loanCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  loanNumberText: { fontSize: 12, fontWeight: '600', fontFamily: 'monospace' },
  loanCardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  customerName: { fontSize: 15, fontWeight: '600' },
  customerPhone: { fontSize: 12, marginTop: 2 },
  amountLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  amountValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  loanCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  loanMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageText: { fontSize: 13 },
});
