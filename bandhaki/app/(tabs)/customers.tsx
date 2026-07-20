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
import { PlusCircle, ChevronRight, Phone, MapPin } from "lucide-react-native";

import { useCustomers } from "../../src/hooks/useCustomers";
import { useTheme } from "../../src/hooks/useTheme";
import { SearchBar } from "../../src/components/ui/SearchBar";
import { Card } from "../../src/components/ui/Card";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { LoadingSkeleton } from "../../src/components/ui/Loading";
import type { Customer } from "../../src/types";

export default function CustomersTab() {
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
          c.phone?.includes(searchQuery) ||
          c.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : customers;

  const renderCustomer = useCallback(
    ({ item }: { item: Customer }) => (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => router.push(`/(customers)/${item._id}`)}
        style={styles.customerPressable}
      >
        <Card style={styles.customerCard}>
          <View style={styles.cardRow}>
            <View
              style={[styles.avatar, { backgroundColor: colors.purpleLight }]}
            >
              <Text style={[styles.avatarText, { color: colors.purple }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text
                style={[styles.name, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.phone && (
                <View style={styles.infoRow}>
                  <Phone size={12} color={colors.textTertiary} />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    {item.phone}
                  </Text>
                </View>
              )}
              {item.address && (
                <View style={styles.infoRow}>
                  <MapPin size={12} color={colors.textTertiary} />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.address}
                  </Text>
                </View>
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
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Customers</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {customers.length} total customers
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(customers)/new")}
          activeOpacity={0.8}
        >
          <PlusCircle size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, phone, address..."
        />
      </View>

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
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  customerPressable: {
    marginBottom: 8,
  },
  customerCard: { marginBottom: 0 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700" },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  infoText: { fontSize: 12 },
});
