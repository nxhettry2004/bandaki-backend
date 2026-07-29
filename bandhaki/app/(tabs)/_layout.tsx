import React, { useState, useRef, useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  Platform,
  useColorScheme,
} from "react-native";
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCircle,
  Plus,
  Wallet,
  Landmark,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../src/constants/colors";
import { ScreenErrorBoundary } from "../../src/components/ScreenErrorBoundary";

// expo-router renders this instead of crashing when a tab screen throws.
export { ScreenErrorBoundary as ErrorBoundary };

function FABPopup({
  visible,
  colors,
  onPayment,
  onBandhaki,
  onClose,
  popupBottom,
}: {
  visible: boolean;
  colors: (typeof Colors)["light"];
  onPayment: () => void;
  onBandhaki: () => void;
  onClose: () => void;
  popupBottom: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* Popup */}
      <Animated.View
        style={[
          styles.popupContainer,
          {
            opacity,
            transform: [{ translateY }],
            bottom: popupBottom,
            left: '50%' ,
            marginLeft: -110,
          },
        ]}
      >
        <View style={[styles.popupCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.popupOption}
            onPress={onPayment}
            activeOpacity={0.7}
          >
            <View style={[styles.popupIconBg, { backgroundColor: "#DCFCE7" }]}>
              <Wallet size={18} color="#16A34A" />
            </View>
            <View>
              <Text style={[styles.popupLabel, { color: colors.text }]}>
                Payment
              </Text>
              <Text style={[styles.popupSub, { color: colors.textTertiary }]}>
                Record a payment
              </Text>
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.popupDivider,
              { backgroundColor: colors.borderLight },
            ]}
          />

          <TouchableOpacity
            style={styles.popupOption}
            onPress={onBandhaki}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.popupIconBg,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Landmark size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.popupLabel, { color: colors.text }]}>
                Log Book
              </Text>
              <Text style={[styles.popupSub, { color: colors.textTertiary }]}>
                Create a new loan
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Arrow pointing down to FAB */}
        <View style={styles.popupArrowWrapper}>
          <View
            style={[styles.popupArrow, { backgroundColor: colors.surface }]}
          />
        </View>
      </Animated.View>
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fabOpen, setFabOpen] = useState(false);

  const handlePayment = () => {
    setFabOpen(false);
    router.push("/(payments)/select-loan");
  };

  const handleBandhaki = () => {
    setFabOpen(false);
    router.push("/(bandhaki)/new");
  };

  // The tab bar is 56dp of content sitting on top of the system navigation bar
  // inset. Offset the FAB by that inset so it keeps floating over the tab row on
  // devices with 3-button navigation instead of sinking into the nav bar.
  const fabBottom = insets.bottom + 28;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 4,
            paddingBottom: insets.bottom,
            height: 56 + insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ledger"
          options={{
            title: "Ledger",
            tabBarIcon: ({ color, size }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />

        {/* Hidden placeholder for FAB center slot */}
        <Tabs.Screen
          name="bandhaki"
          options={{
            title: "",
            tabBarButton: () => <View style={{ width: 64 }} />,
          }}
        />

        <Tabs.Screen
          name="customers"
          options={{
            title: "Clients",
            tabBarIcon: ({ color, size }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <UserCircle size={size} color={color} />
            ),
          }}
        />

        {/* Hidden tabs */}
        <Tabs.Screen
          name="calculator"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* FAB Popup */}
      <FABPopup
        visible={fabOpen}
        colors={colors}
        onPayment={handlePayment}
        onBandhaki={handleBandhaki}
        onClose={() => setFabOpen(false)}
        popupBottom={fabBottom + 66}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: "#D97706", bottom: fabBottom, left: '50%', marginLeft: -28 }]}
        onPress={() => setFabOpen((p) => !p)}
        activeOpacity={0.85}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#92400E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  popupContainer: {
    position: "absolute",
    alignItems: "center",
    width: 220,
    zIndex: 99,
  },
  popupCard: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 4,
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  popupArrowWrapper: {
    alignItems: "center",
    marginTop: -1,
  },
  popupArrow: {
    width: 14,
    height: 14,
    transform: [{ rotate: "45deg" }],
    marginTop: -7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  popupOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  popupIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  popupLabel: { fontSize: 14, fontWeight: "600" },
  popupSub: { fontSize: 11, marginTop: 1 },
  popupDivider: { height: 1, marginHorizontal: 14 },
});
