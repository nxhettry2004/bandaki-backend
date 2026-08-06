import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { ArrowLeft, AlertTriangle } from "lucide-react-native";

import {
  CustomerFormSchema,
  type CustomerFormSchemaType,
} from "../../../src/schema/FormSchema";
import {
  getCustomerById,
  updateCustomerLocal,
} from "../../../src/db/repositories/customers.repo";
import { useSyncMutation } from "../../../src/hooks/useSyncMutation";
import { useTheme } from "../../../src/hooks/useTheme";
import { Input } from "../../../src/components/ui/Input";
import { Button } from "../../../src/components/ui/Button";

export default function UpdateCustomerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: customer,
    isLoading: customerLoading,
    isError,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormSchemaType>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      idProof: "",
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone || "",
        address: customer.address || "",
        idProof: customer.idProof || "",
      });
    }
  }, [customer, reset]);

  const updateCustomer = useSyncMutation(
    (data: CustomerFormSchemaType) => updateCustomerLocal(id!, data)
  );

  const onSubmit = async (data: CustomerFormSchemaType) => {
    try {
      await updateCustomer.mutateAsync(data);
      Toast.show({
        type: "success",
        text1: "Customer updated",
        text2: "Will sync to server when online",
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Something went wrong",
      });
    }
  };

  if (customerLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !customer) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorCenter}>
          <AlertTriangle size={40} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Customer Not Found
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Customer
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {customer.name}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Full Name"
              placeholder="Enter customer name"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={value || ""}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Address"
              placeholder="Enter address"
              value={value || ""}
              onChangeText={onChange}
              multiline
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="idProof"
          render={({ field: { onChange, value } }) => (
            <Input
              label="ID Proof Number"
              placeholder="Citizenship number or other ID"
              value={value || ""}
              onChangeText={onChange}
              error={errors.idProof?.message}
            />
          )}
        />

        <Button
          title="Update Customer"
          onPress={handleSubmit(onSubmit)}
          loading={updateCustomer.isPending}
          fullWidth
          size="lg"
          style={{ marginTop: 24, borderRadius: 6 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorTitle: { fontSize: 18, fontWeight: "600", marginTop: 12 },
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
  scrollContent: { padding: 16, paddingBottom: 40 },
});
