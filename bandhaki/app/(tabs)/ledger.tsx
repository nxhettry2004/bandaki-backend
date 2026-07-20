import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText,
  ChevronRight,
  Calendar,
  TrendingUp,
  Wallet,
  RotateCcw,
} from "lucide-react-native";

import { useCustomers } from "../../src/hooks/useCustomers";
import { useActiveLoans } from "../../src/hooks/useLoans";
import { useTheme } from "../../src/hooks/useTheme";
import { Select } from "../../src/components/ui/Select";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { LoadingSkeleton } from "../../src/components/ui/Loading";
import type { LoanListEntry } from "../../src/types";

function formatAmount(v?: number) {
  if (v == null) return "—";
  return "Rs. " + Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function LedgerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: customers = [], isLoading: cusLoading } = useCustomers();
  const { data: activeLoans = [], isLoading: loansLoading, refetch, isRefetching } = useActiveLoans();
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showLedger, setShowLedger] = useState(false);

  const customerOptions = useMemo(
    () => customers.map((c: any) => ({
      label: `${c.name}${c.phone ? ` (${c.phone})` : ""}`,
      value: c._id,
    })),
    [customers],
  );

  const customerLoans = useMemo(() => {
    if (!selectedCustomer) return [];
    return activeLoans.filter(
      (loan: LoanListEntry) => loan.customer?._id === selectedCustomer,
    );
  }, [activeLoans, selectedCustomer]);

  const selectedCustomerName = useMemo(() => {
    const c = customers.find((c: any) => c._id === selectedCustomer);
    return c?.name || "";
  }, [customers, selectedCustomer]);

  const totalPrincipal = useMemo(
    () => customerLoans.reduce((sum: number, l: LoanListEntry) => sum + (l.principalAmount || 0), 0),
    [customerLoans],
  );

  const handleGenerate = () => {
    if (!selectedCustomer) return;
    setShowLedger(true);
  };

  const goToLoan = (id: string) => {
    router.push(`/(bandhaki)/${id}`);
  };

  const isLoading = cusLoading || loansLoading;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Ledger</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              View customer loan ledger
            </Text>
          </View>
          {(selectedCustomer || showLedger) && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => {
                setSelectedCustomer("");
                setShowLedger(false);
              }}
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color={colors.textSecondary} />
              <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Customer Selection */}
            <Card style={styles.selectCard}>
              <Select
                label="Select Customer"
                placeholder="Search and select customer..."
                options={customerOptions}
                value={selectedCustomer}
                onValueChange={(v) => {
                  setSelectedCustomer(v);
                  setShowLedger(false);
                }}
                searchable
              />
              <Button
                title="Generate Ledger"
                onPress={handleGenerate}
                fullWidth
                size="md"
                style={{ marginTop: 12,borderRadius: 6 }}
                disabled={!selectedCustomer}
                icon={<FileText size={16} color="#fff" style={{ marginRight: 6 }} />}
              />
            </Card>

            {/* Ledger Results */}
            {showLedger && selectedCustomer && (
              <View style={styles.ledgerSection}>
                {/* Summary Card */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/(bandhaki)/customer-loans?customerId=${selectedCustomer}&customerName=${encodeURIComponent(selectedCustomerName)}`,
                    )
                  }
                >
                  <Card style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                      <View style={[styles.ledgerIcon, { backgroundColor: colors.primaryLight }]}>
                        <FileText size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.summaryName, { color: colors.text }]}>
                          {selectedCustomerName}
                        </Text>
                        <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
                          {customerLoans.length} active loan{customerLoans.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.textTertiary} />
                    </View>

                    <View style={[styles.summaryDivider, { backgroundColor: colors.borderLight }]} />

                    <View style={styles.summaryStats}>
                      <View style={styles.summaryStatItem}>
                        <Wallet size={14} color={colors.primary} />
                        <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                          Total Principal
                        </Text>
                        <Text style={[styles.summaryStatValue, { color: colors.primary }]}>
                          {formatAmount(totalPrincipal)}
                        </Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <TrendingUp size={14} color={colors.success} />
                        <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                          Active Loans
                        </Text>
                        <Text style={[styles.summaryStatValue, { color: colors.success }]}>
                          {customerLoans.length}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>

                {/* Individual Loans List */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Loan Entries
                </Text>
                {customerLoans.length === 0 ? (
                  <EmptyState
                    title="No active loans"
                    description="This customer has no active loans"
                  />
                ) : (
                  customerLoans.map((loan: LoanListEntry) => (
                    <TouchableOpacity
                      key={loan._id}
                      activeOpacity={0.75}
                      onPress={() => goToLoan(loan._id)}
                      style={styles.loanItem}
                    >
                      <Card style={styles.loanCard}>
                        <View style={styles.loanRow}>
                          <View style={[styles.loanBadge, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[styles.loanBadgeText, { color: colors.primary }]}>
                              {loan.loanNumber}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.loanAmount, { color: colors.text }]}>
                              {formatAmount(loan.principalAmount)}
                            </Text>
                            <View style={styles.loanMetaRow}>
                              <Calendar size={11} color={colors.textTertiary} />
                              <Text style={[styles.loanDate, { color: colors.textTertiary }]}>
                                {loan.loanDate
                                  ? new Date(loan.loanDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "2-digit",
                                    })
                                  : "—"}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.statusChip,
                              {
                                backgroundColor:
                                  loan.status === "active"
                                    ? colors.successLight
                                    : colors.errorLight,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color:
                                    loan.status === "active"
                                      ? colors.success
                                      : colors.error,
                                },
                              ]}
                            >
                              {loan.status}
                            </Text>
                          </View>
                          <ChevronRight size={16} color={colors.textTertiary} />
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearBtnText: { fontSize: 13, fontWeight: "500" },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 2 },
  selectCard: { marginBottom: 20 },
  ledgerSection: { marginTop: 4 },
  summaryCard: { marginBottom: 20 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  ledgerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryName: { fontSize: 17, fontWeight: "700" },
  summaryMeta: { fontSize: 12, marginTop: 2 },
  summaryDivider: { height: 1, marginVertical: 14 },
  summaryStats: { flexDirection: "row", gap: 16 },
  summaryStatItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryStatLabel: { fontSize: 11 },
  summaryStatValue: { fontSize: 18, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  loanItem: { marginBottom: 8 },
  loanCard: { marginBottom: 0 },
  loanRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loanBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  loanBadgeText: { fontSize: 11, fontWeight: "600", fontFamily: "monospace" },
  loanAmount: { fontSize: 15, fontWeight: "700" },
  loanMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  loanDate: { fontSize: 11 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
});
