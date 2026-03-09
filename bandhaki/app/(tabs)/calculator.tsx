import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calculator as CalcIcon } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useTheme } from "../../src/hooks/useTheme";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("2.5");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showResults, setShowResults] = useState(false);

  const [simpleInterest, setSimpleInterest] = useState(0);
  const [compoundInterest, setCompoundInterest] = useState(0);
  const [totalAmountSimple, setTotalAmountSimple] = useState(0);
  const [totalAmountCompound, setTotalAmountCompound] = useState(0);
  const [timePeriod, setTimePeriod] = useState(0);
  const [daysDiff, setDaysDiff] = useState(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const calculateInterest = () => {
    setErrors({});
    setShowResults(false);

    const validationErrors: Record<string, string> = {};
    const principal = parseFloat(principalAmount);
    const rate = parseFloat(interestRate);

    if (!principalAmount || isNaN(principal) || principal <= 0) {
      validationErrors.principal = "Enter a valid principal amount";
    }
    if (!interestRate || isNaN(rate) || rate <= 0) {
      validationErrors.rate = "Enter a valid interest rate";
    }
    if (endDate <= startDate) {
      validationErrors.dates = "End date must be after start date";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = timeDiff / (1000 * 3600 * 24);
    const months = days / 30;

    setTimePeriod(months);
    setDaysDiff(days);

    // Simple Interest (Monthly)
    const si = (principal * rate * months) / 100;
    setSimpleInterest(si);
    setTotalAmountSimple(principal + si);

    // Compound Interest (Monthly)
    const compoundAmount = principal * Math.pow(1 + rate / 100, months);
    const ci = compoundAmount - principal;
    setCompoundInterest(ci);
    setTotalAmountCompound(compoundAmount);

    setShowResults(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const clearCalculator = () => {
    setPrincipalAmount("");
    setInterestRate("2.5");
    setStartDate(new Date());
    setEndDate(new Date());
    setShowResults(false);
    setSimpleInterest(0);
    setCompoundInterest(0);
    setTotalAmountSimple(0);
    setTotalAmountCompound(0);
    setTimePeriod(0);
    setDaysDiff(0);
    setErrors({});
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Interest Calculator
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Calculate simple and compound interest
          </Text>
        </View>

        <Card>
          {/* Principal */}
          <Input
            label="Principal Amount (Rs.)"
            placeholder="Enter principal amount"
            value={principalAmount}
            onChangeText={setPrincipalAmount}
            keyboardType="numeric"
            error={errors.principal}
            required
          />

          {/* Interest Rate */}
          <Input
            label="Interest Rate (% per month)"
            placeholder="Enter interest rate"
            value={interestRate}
            onChangeText={setInterestRate}
            keyboardType="decimal-pad"
            error={errors.rate}
            required
          />

          {/* Start Date */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              Start Date *
            </Text>
            <Button
              title={formatDate(startDate)}
              onPress={() => setShowStartPicker(true)}
              variant="outline"
              fullWidth
            />
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  setShowStartPicker(Platform.OS === "ios");
                  if (date) setStartDate(date);
                }}
              />
            )}
          </View>

          {/* End Date */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              End Date *
            </Text>
            <Button
              title={formatDate(endDate)}
              onPress={() => setShowEndPicker(true)}
              variant="outline"
              fullWidth
            />
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  setShowEndPicker(Platform.OS === "ios");
                  if (date) setEndDate(date);
                }}
              />
            )}
            {errors.dates && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.dates}
              </Text>
            )}
          </View>

          <View style={styles.actionRow}>
            <Button
              title="Calculate Interest"
              onPress={calculateInterest}
              fullWidth
              style={{ borderRadius: 6 }}
              size="lg"
              icon={<CalcIcon size={18} color="#FFF" />}
            />
            <Button
              title="Clear"
              onPress={clearCalculator}
              variant="outline"
              fullWidth
              style={{ borderRadius: 6 }}
              size="lg"
            />
          </View>
        </Card>

        {/* Results */}
        {showResults && timePeriod > 0 && (
          <View style={styles.results}>
            <Card variant="info" style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text
                  style={[styles.resultLabel, { color: colors.textSecondary }]}
                >
                  Time Period
                </Text>
                <Text style={[styles.resultValue, { color: colors.info }]}>
                  {timePeriod.toFixed(2)} months ({Math.round(daysDiff)} days)
                </Text>
              </View>
            </Card>

            <Card variant="success" style={styles.resultCard}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                Simple Interest (Monthly)
              </Text>
              <View style={styles.resultRow}>
                <Text
                  style={[styles.resultLabel, { color: colors.textSecondary }]}
                >
                  Interest Amount
                </Text>
                <Text style={[styles.resultValue, { color: colors.success }]}>
                  Rs. {simpleInterest.toFixed(2)}
                </Text>
              </View>
              <View
                style={[
                  styles.resultRow,
                  styles.resultRowBordered,
                  { borderTopColor: colors.successBorder },
                ]}
              >
                <Text
                  style={[
                    styles.resultLabel,
                    { color: colors.text, fontWeight: "500" },
                  ]}
                >
                  Total Amount
                </Text>
                <Text style={[styles.resultValueLg, { color: colors.success }]}>
                  Rs. {totalAmountSimple.toFixed(2)}
                </Text>
              </View>
            </Card>

            <Card variant="purple" style={styles.resultCard}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                Compound Interest (Monthly)
              </Text>
              <View style={styles.resultRow}>
                <Text
                  style={[styles.resultLabel, { color: colors.textSecondary }]}
                >
                  Interest Amount
                </Text>
                <Text style={[styles.resultValue, { color: colors.purple }]}>
                  Rs. {compoundInterest.toFixed(2)}
                </Text>
              </View>
              <View
                style={[
                  styles.resultRow,
                  styles.resultRowBordered,
                  { borderTopColor: colors.purpleBorder },
                ]}
              >
                <Text
                  style={[
                    styles.resultLabel,
                    { color: colors.text, fontWeight: "500" },
                  ]}
                >
                  Total Amount
                </Text>
                <Text style={[styles.resultValueLg, { color: colors.purple }]}>
                  Rs. {totalAmountCompound.toFixed(2)}
                </Text>
              </View>
            </Card>

            <Card style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text
                  style={[styles.resultLabel, { color: colors.textSecondary }]}
                >
                  Difference (Compound - Simple)
                </Text>
                <Text style={[styles.resultValue, { color: colors.primary }]}>
                  Rs. {(compoundInterest - simpleInterest).toFixed(2)}
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  errorText: { fontSize: 12, marginTop: 4 },
  actionRow: {
    flexDirection: "column",
    gap: 10,
  },
  results: { marginTop: 16, gap: 12 },
  resultCard: { padding: 16 },
  resultTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultRowBordered: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  resultLabel: { fontSize: 13 },
  resultValue: { fontSize: 16, fontWeight: "700" },
  resultValueLg: { fontSize: 18, fontWeight: "800" },
});
