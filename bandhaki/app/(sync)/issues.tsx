import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { ArrowLeft, AlertTriangle, RotateCcw, X } from "lucide-react-native";

import {
  getBlocked,
  retry,
  dismiss,
  type OutboxRow,
} from "../../src/db/repositories/outbox.repo";
import { refreshSyncStatus } from "../../src/sync/syncStatusStore";
import { syncNow } from "../../src/sync/orchestrator";
import { useTheme } from "../../src/hooks/useTheme";

function describeRow(row: OutboxRow): string {
  const entity = (row.entityType || "").replace(/_/g, " ");
  const op = row.operation || "";
  const payload = row.payload || {};
  const target =
    payload.name ||
    payload.itemType ||
    (payload.loanNumber ? `Loan #${payload.loanNumber}` : "") ||
    "";
  return `${entity} ${op}${target ? ` — ${target}` : ""}`;
}

export default function SyncIssuesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [rows, setRows] = useState<OutboxRow[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRows(await getBlocked());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const reload = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async (id: number) => {
    setWorking(`retry-${id}`);
    try {
      await retry(id);
      await syncNow("issues-retry");
      await load();
      await refreshSyncStatus();
      Toast.show({ type: "success", text1: "Change queued for retry" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Retry failed", text2: err?.message });
    } finally {
      setWorking(null);
    }
  };

  const handleDismiss = async (id: number) => {
    setWorking(`dismiss-${id}`);
    try {
      await dismiss(id);
      await load();
      await refreshSyncStatus();
    } finally {
      setWorking(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Sync Issues
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />
        }
      >
        {rows === null ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
              <AlertTriangle size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No sync issues
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Changes that failed to sync will appear here so you can retry or dismiss them.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {rows.length} blocked change{rows.length > 1 ? "s" : ""}
            </Text>
            {rows.map((row) => (
              <View
                key={row.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.warnIcon, { backgroundColor: "#FEE2E2" }]}>
                    <AlertTriangle size={16} color={colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {describeRow(row)}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.textTertiary }]}>
                      Attempted {row.attempts}× · #{row.id}
                    </Text>
                  </View>
                </View>

                <View style={[styles.errorBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                    {row.lastError || "Unknown server error"}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
                    disabled={working !== null}
                    onPress={() => handleRetry(row.id)}
                  >
                    {working === `retry-${row.id}` ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <RotateCcw size={14} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>
                          Retry
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary }]}
                    disabled={working !== null}
                    onPress={() => handleDismiss(row.id)}
                  >
                    {working === `dismiss-${row.id}` ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <X size={14} color={colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>
                          Dismiss
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  warnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardMeta: { fontSize: 11, marginTop: 2 },
  errorBox: { borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    flex: 1,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
});
