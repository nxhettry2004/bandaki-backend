import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PlusCircle,
  FileText,
  Users,
  Calculator,
  RefreshCw,
  LogOut,
  TrendingUp,
  Landmark,
} from "lucide-react-native";

import { useAuth } from "../../src/hooks/useAuth";
import { useDashboard } from "../../src/hooks/useDashboard";
import { useTheme } from "../../src/hooks/useTheme";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { LoadingScreen } from "../../src/components/ui/Loading";
import { StatusBadge } from "../../src/components/ui/StatusBadge";

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const {
    data: dashboardData,
    isLoading,
    refetch,
    isRefetching,
  } = useDashboard();
  const refreshRotation = useRef(new Animated.Value(0)).current;

  const refreshSpin = refreshRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const onRefresh = useCallback(() => {
    Animated.timing(refreshRotation, {
      toValue: 1,
      duration: 550,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      refreshRotation.setValue(0);
    });
    refetch();
  }, [refetch, refreshRotation]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  if (authLoading || isLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View>
              <Text
                style={[styles.welcomeText, { color: colors.textSecondary }]}
              >
                Welcome back,
              </Text>
              <Text style={[styles.username, { color: colors.text }]}>
                {user?.username || "User"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={isRefetching}
            style={[
              styles.refreshBtn,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: refreshSpin }] }}>
              <RefreshCw size={18} color={colors.textSecondary} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { flex: 1, backgroundColor: "#D97706", borderRadius: 16 },
            ]}
          >
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <Users size={20} color="#fff" />
            </View>
            <Text style={[styles.statNumber, { color: "#fff" }]}>
              {dashboardData?.totalCustomers ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: "white" }]}>
              Total Clients
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                flex: 1,
                marginLeft: 12,
                backgroundColor: colors.primary,
                borderRadius: 16,
              },
            ]}
          >
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <TrendingUp size={20} color="#fff" />
            </View>
            <Text style={[styles.statNumber, { color: "#fff" }]}>
              {dashboardData?.activeLoans ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: "#fff" }]}>
              Active Loans
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/(bandhaki)/new")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#DCFCE7" }]}>
              <PlusCircle size={22} color="#16A34A" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              New Loan
            </Text>
            <Text style={[styles.actionSub, { color: colors.textTertiary }]}>
              Create entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/(bandhaki)/all")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#DBEAFE" }]}>
              <FileText size={22} color="#2563EB" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              View Loans
            </Text>
            <Text style={[styles.actionSub, { color: colors.textTertiary }]}>
              All loans
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/(tabs)/customers")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#F3E8FF" }]}>
              <Users size={22} color="#9333EA" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Clients
            </Text>
            <Text style={[styles.actionSub, { color: colors.textTertiary }]}>
              View directory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/(tabs)/calculator")}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FFEDD5" }]}>
              <Calculator size={22} color="#EA580C" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Calculator
            </Text>
            <Text style={[styles.actionSub, { color: colors.textTertiary }]}>
              Estimate interest
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Transactions
        </Text>
        {dashboardData?.recentTransactions &&
        dashboardData.recentTransactions.length > 0 ? (
          dashboardData.recentTransactions.map((loan: any, index: number) => (
            <TouchableOpacity
              key={loan._id || `${loan.loanId || "loan"}-${index}`}
              onPress={() =>
                loan.loanId ? router.push(`/(bandhaki)/${loan.loanId}`) : undefined
              }
              activeOpacity={0.7}
            >
              <Card style={styles.recentCard}>
                <View style={styles.recentRow}>
                  <View style={styles.recentLeft}>
                    <View
                      style={[
                        styles.loanIcon,
                        { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      <Landmark size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.recentLoan, { color: colors.text }]}>
                        {loan.loanNumber || "N/A"}
                      </Text>
                      <Text
                        style={[
                          styles.recentCustomer,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {loan.customer?.name || "Unknown"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={[styles.recentAmount, { color: colors.text }]}>
                      Rs. {loan.principalAmount?.toLocaleString() || "0"}
                    </Text>
                    <StatusBadge status={loan.status || "active"} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Card style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No recent transactions
            </Text>
          </Card>
        )}

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out of Log Book"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            icon={
              <LogOut size={16} color="#DC2626" style={{ marginRight: 8 }} />
            }
          />
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            Version 1.0.0 • Log Book Gold Ledger
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700" },
  welcomeText: { fontSize: 12 },
  username: { fontSize: 17, fontWeight: "700" },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statCard: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: "#92400E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionTitle: { fontSize: 14, fontWeight: "600" },
  actionSub: { fontSize: 11, marginTop: 2 },
  recentCard: { marginBottom: 8 },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  loanIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  recentLoan: { fontSize: 14, fontWeight: "600" },
  recentCustomer: { fontSize: 12 },
  recentRight: { alignItems: "flex-end", gap: 4 },
  recentAmount: { fontSize: 14, fontWeight: "600" },
  emptyText: { fontSize: 14 },
  logoutSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 12,
  },
});
