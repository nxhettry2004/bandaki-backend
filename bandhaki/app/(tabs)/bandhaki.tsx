import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PlusCircle,
  Landmark,
  ChevronRight,
} from "lucide-react-native";

import { useCustomers } from "../../src/hooks/useCustomers";
import { useTheme } from "../../src/hooks/useTheme";
import { SearchBar } from "../../src/components/ui/SearchBar";
import { Card } from "../../src/components/ui/Card";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { LoadingSkeleton } from "../../src/components/ui/Loading";
import type { Customer } from "../../src/types";

export default function BandhakiTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    data: customers = [],
    isLoading,
    refetch,
    isRefetching,
  } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = searchQuery
    ? customers.filter(
        (c: Customer) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.includes(searchQuery),
      )
    : customers;

  const handleCustomerPress = (customer: Customer) => {
    router.push(
      `/(bandhaki)/customer-loans?customerId=${customer._id}&customerName=${encodeURIComponent(customer.name)}`,
    );
  };

  const renderCustomer = useCallback(
    ({ item }: { item: Customer }) => (
      <TouchableOpacity
        onPress={() => handleCustomerPress(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.customerCard}>
          <View style={styles.customerRow}>
            <View
              style={[
                styles.customerAvatar,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text
                style={[styles.customerName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.phone && (
                <Text
                  style={[
                    styles.customerPhone,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.phone}
                </Text>
              )}
            </View>
            <ChevronRight size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </TouchableOpacity>
    ),
    [colors],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titleLight}>Bandhaki</Text>
          <Text style={styles.subtitleLight}>
            Select a customer to view loans
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(bandhaki)/all")}
          >
            <Landmark size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: "#FFFFFF" }]}
            onPress={() => router.push("/(bandhaki)/new")}
          >
            <PlusCircle size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search customers..."
        />
      </View>

      {/* List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item._id}
          renderItem={renderCustomer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No customers found"
              description={
                searchQuery
                  ? "Try a different search term"
                  : "Add your first customer to get started"
              }
              actionLabel={searchQuery ? undefined : "Add Customer"}
              onAction={
                searchQuery ? undefined : () => router.push("/(customers)/new")
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "800" },
  titleLight: { fontSize: 24, fontWeight: "800", color: "#000" },
  subtitle: { fontSize: 13, marginTop: 2 },
  subtitleLight: { fontSize: 13, marginTop: 2, color: "#888" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  customerCard: { marginBottom: 8 },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 18, fontWeight: "700" },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: "600" },
  customerPhone: { fontSize: 13, marginTop: 2 },
});
