import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CreditCard,
  ChevronRight,
  Calendar,
  Wallet,
} from "lucide-react-native";

import { useCustomers } from "../../src/hooks/useCustomers";
import { useActiveLoans } from "../../src/hooks/useLoans";
import { useTheme } from "../../src/hooks/useTheme";
import { Select } from "../../src/components/ui/Select";
import { Card } from "../../src/components/ui/Card";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { LoadingSkeleton } from "../../src/components/ui/Loading";
import type { LoanListEntry } from "../../src/types";

function formatAmount(v?: number) {
  if (v == null) return "—";
  return "Rs. " + Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function SelectLoanForPaymentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: customers = [], isLoading: cusLoading } = useCustomers();
  const { data: activeLoans = [], isLoading: loansLoading } = useActiveLoans();
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const customerOptions = useMemo(
    () =>
      customers.map((c: any) => ({
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

  const isLoading = cusLoading || loansLoading;

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
            Select customer and loan
          </Text>
        </View>
        <View style={[styles.headerIconBox, { backgroundColor: "#DCFCE7" }]}>
          <CreditCard size={18} color="#16A34A" />
        </View>
      </View>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Customer Selection */}
          <Card style={styles.selectCard}>
            <Select
              label="Select Customer"
              placeholder="Search customer..."
              options={customerOptions}
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              searchable
            />
          </Card>

          {/* Loans list */}
          {selectedCustomer ? (
            customerLoans.length === 0 ? (
              <EmptyState
                title="No active loans"
                description="This customer has no active loans to make payment for"
              />
            ) : (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Active Loans — select to pay
                </Text>
                {customerLoans.map((loan: LoanListEntry) => (
                  <TouchableOpacity
                    key={loan._id}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(payments)/new?loanId=${loan._id}`)}
                    style={styles.loanItem}
                  >
                    <Card style={styles.loanCard}>
                      <View style={styles.loanRow}>
                        <View style={[styles.loanIcon, { backgroundColor: colors.primaryLight }]}>
                          <Wallet size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.loanNumber, { color: colors.text }]}>
                            {loan.loanNumber}
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
                        <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                          <Text style={[styles.loanAmountLabel, { color: colors.textTertiary }]}>
                            Principal
                          </Text>
                          <Text style={[styles.loanAmountValue, { color: colors.success }]}>
                            {formatAmount(loan.principalAmount)}
                          </Text>
                        </View>
                        <ChevronRight size={16} color={colors.textTertiary} />
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ) : (
            <EmptyState
              title="Select a customer"
              description="Choose a customer above to see their active loans"
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12 },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  selectCard: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  loanItem: { marginBottom: 8 },
  loanCard: { marginBottom: 0 },
  loanRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loanIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  loanNumber: { fontSize: 14, fontWeight: "700" },
  loanMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  loanDate: { fontSize: 11 },
  loanAmountLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  loanAmountValue: { fontSize: 14, fontWeight: "700", marginTop: 1 },
});
