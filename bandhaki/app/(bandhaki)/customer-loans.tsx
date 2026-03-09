import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Wallet,
  User,
  ArrowUpRight,
  Calendar,
  ChevronRight,
} from "lucide-react-native";

import { getBandhakiByCustomer } from "../../src/api/endpoints";
import { useTheme } from "../../src/hooks/useTheme";
import { StatusBadge } from "../../src/components/ui/StatusBadge";
import { EmptyState } from "../../src/components/ui/EmptyState";
import type { DetailedLoanEntry } from "../../src/types";
import { StatusBar } from "expo-status-bar";

function formatAmount(value?: number) {
  if (value === null || value === undefined) return "—";
  return (
    "Rs. " +
    Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

export default function CustomerLoansScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { customerId, name } = useLocalSearchParams<{
    customerId: string;
    name?: string;
  }>();

  const {
    data: loansData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["customerLoans", customerId],
    queryFn: () => getBandhakiByCustomer(customerId!),
    enabled: !!customerId,
  });

  const loans: DetailedLoanEntry[] = loansData?.loans || [];

  const goToLoan = (id: string) => {
    router.push(`/(bandhaki)/${id}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <View style={styles.bannerLabelRow}>
              <Wallet size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bannerLabel}>LOAN PORTFOLIO</Text>
            </View>
            <Text style={styles.bannerTitle}>Customer Bandhaki</Text>
            <View style={styles.customerChip}>
              <User size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.customerChipText}>{name || "Unknown"}</Text>
            </View>
          </View>

          <View style={styles.statBox}>
            <ArrowUpRight size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statLabel}>Total Loans</Text>
            <Text style={styles.statValue}>{loans.length}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : loans.length === 0 ? (
        <EmptyState
          //   icon={AlertTriangle}
          title="No Bandhaki Loans Found"
          description="This customer has no loans yet"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bandhaki Items
          </Text>

          {loans.map((loan) => (
            <TouchableOpacity
              key={loan._id}
              style={[
                styles.loanCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => goToLoan(loan._id)}
              activeOpacity={0.7}
            >
              {/* Top: Loan # + Status */}
              <View style={styles.loanTop}>
                <View
                  style={[
                    styles.loanNumBadge,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.loanNumText, { color: colors.primary }]}>
                    #{loan.loanNumber}
                  </Text>
                </View>
                <StatusBadge status={loan.status} />
              </View>

              {/* Amount Grid */}
              <View style={styles.amountRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.amountLabel, { color: colors.textTertiary }]}
                  >
                    Principal
                  </Text>
                  <Text style={[styles.amountVal, { color: "#1D4ED8" }]}>
                    {formatAmount(loan.principalAmount)}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={[styles.amountLabel, { color: colors.textTertiary }]}
                  >
                    Outstanding
                  </Text>
                  <Text style={[styles.amountVal, { color: "#DC2626" }]}>
                    {formatAmount(loan.outstandingPrincipal)}
                  </Text>
                </View>
              </View>

              <View style={styles.amountRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.amountLabel, { color: colors.textTertiary }]}
                  >
                    Interest Due
                  </Text>
                  <Text style={[styles.amountVal, { color: "#EA580C" }]}>
                    {formatAmount(
                      loan.calculatedInterest + (loan.outstandingInterest || 0),
                    )}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={[styles.amountLabel, { color: colors.textTertiary }]}
                  >
                    Total Due
                  </Text>
                  <Text style={[styles.amountVal, { color: "#D97706" }]}>
                    {formatAmount(loan.totalDue)}
                  </Text>
                </View>
              </View>

              {/* Bottom: Date + Rate */}
              <View
                style={[styles.loanBottom, { borderTopColor: colors.border }]}
              >
                <View style={styles.metaRow}>
                  <Calendar size={13} color={colors.textTertiary} />
                  <Text
                    style={[styles.metaText, { color: colors.textTertiary }]}
                  >
                    {new Date(loan.loanDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.metaText,
                      { color: colors.textTertiary, marginLeft: 8 },
                    ]}
                  >
                    {loan.interestRate}% • {loan.interestType}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBanner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, marginBottom: 12 },
  bannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bannerLeft: { flex: 1 },
  bannerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 10,
  },
  customerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  customerChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  statBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  statValue: { fontSize: 26, fontWeight: "800", color: "#fff" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  loanCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  loanTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  loanNumBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  loanNumText: { fontSize: 12, fontWeight: "600", fontFamily: "monospace" },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountVal: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  loanBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12 },
});
