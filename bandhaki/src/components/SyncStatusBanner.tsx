import React from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  CloudOff,
  CloudUpload,
  CloudDownload,
  AlertTriangle,
  Loader,
} from "lucide-react-native";
import { useSyncStatus } from "../sync/syncStatusStore";
import { useTheme } from "../hooks/useTheme";

export function SyncStatusBanner() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isOnline, isSyncing, pendingCount, blockedCount, lastSyncedAt } =
    useSyncStatus();

  const hasPending = pendingCount > 0;
  const hasBlocked = blockedCount > 0;
  // Nothing has ever been pulled: this device is holding only what was typed
  // into it, so point the user at the download action rather than leaving the
  // lists mysteriously empty.
  const needsDownload = !lastSyncedAt && !isSyncing;

  if (isOnline && !hasPending && !hasBlocked && !needsDownload) return null;

  let label = "";
  let icon: React.ReactNode = null;
  let bg = colors.surfaceSecondary;
  let fg = colors.textSecondary;

  if (!isOnline) {
    label = `Offline — ${pendingCount} change${pendingCount === 1 ? "" : "s"} queued`;
    icon = <CloudOff size={14} color={fg} />;
    bg = "#FEF2F2";
    fg = "#991B1B";
  } else if (hasBlocked) {
    label = `${blockedCount} sync issue${blockedCount === 1 ? "" : "s"} — tap to review`;
    icon = <AlertTriangle size={14} color={fg} />;
    bg = "#FFF7ED";
    fg = "#9A3412";
  } else if (isSyncing) {
    label = "Syncing changes…";
    icon = <Loader size={14} color={fg} />;
    bg = "#EFF6FF";
    fg = "#1E40AF";
  } else if (hasPending) {
    label = `${pendingCount} change${pendingCount === 1 ? "" : "s"} queued`;
    icon = <CloudUpload size={14} color={fg} />;
    bg = "#FFFBEB";
    fg = "#92400E";
  } else if (needsDownload) {
    label = "Cloud data not downloaded yet";
    icon = <CloudDownload size={14} color={fg} />;
    bg = "#EFF6FF";
    fg = "#1E40AF";
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: bg }]}
        activeOpacity={0.8}
        onPress={() => {
          if (hasBlocked) router.push("/(sync)/issues");
          else if (needsDownload) router.push("/(tabs)/settings");
        }}
      >
        {isSyncing ? (
          <Loader size={14} color={fg} />
        ) : (
          icon
        )}
        <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </Text>
        {hasBlocked && <Text style={[styles.review, { color: fg }]}>Review →</Text>}
        {!hasBlocked && needsDownload && (
          <Text style={[styles.review, { color: fg }]}>Download →</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 6 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: { fontSize: 12, fontWeight: "600", flex: 1 },
  review: { fontSize: 12, fontWeight: "700" },
});
