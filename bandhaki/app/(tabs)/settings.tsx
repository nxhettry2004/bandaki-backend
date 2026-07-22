import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Shield,
  Bell,
  Moon,
  Globe,
  ChevronRight,
} from 'lucide-react-native';

import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { LoadingScreen } from '../../src/components/ui/Loading';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const formatDate = (dateValue?: string) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          Manage your account preferences
        </Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.profileAvatarText}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.username || 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email || 'No email'}
              </Text>
              <Text style={[styles.profileMeta, { color: colors.textTertiary }]}>
                Member since {formatDate(user?.createdAt)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Account Information */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          ACCOUNT INFORMATION
        </Text>
        <Card style={styles.menuCard}>
          <SettingRow
            icon={<User size={16} color={colors.primary} />}
            iconBg={colors.primaryLight}
            label="Username"
            value={user?.username || ''}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingRow
            icon={<Mail size={16} color={colors.info} />}
            iconBg={colors.infoLight}
            label="Email Address"
            value={user?.email || ''}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingRow
            icon={<Calendar size={16} color={colors.success} />}
            iconBg={colors.successLight}
            label="Member Since"
            value={formatDate(user?.createdAt)}
            colors={colors}
          />
        </Card>

        {/* Preferences */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          PREFERENCES
        </Text>
        <Card style={styles.menuCard}>
          <SettingMenuItem
            icon={<Bell size={16} color={colors.purple} />}
            iconBg={colors.purpleLight}
            title="Notifications"
            subtitle="Manage notification preferences"
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingMenuItem
            icon={<Moon size={16} color={colors.textSecondary} />}
            iconBg={colors.surfaceSecondary}
            title="Appearance"
            subtitle="Light or dark theme"
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingMenuItem
            icon={<Globe size={16} color={colors.info} />}
            iconBg={colors.infoLight}
            title="Language & Region"
            subtitle="English (US)"
            colors={colors}
          />
        </Card>

        {/* Security */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          SECURITY
        </Text>
        <Card style={styles.menuCard}>
          <SettingMenuItem
            icon={<Shield size={16} color={colors.error} />}
            iconBg={colors.errorLight}
            title="Change Password"
            subtitle="Update your password"
            colors={colors}
          />
        </Card>

        {/* Logout */}
        <Card style={{ marginTop: 16 }}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            icon={<LogOut size={14} color="#DC2626" style={{ marginRight: 8 }} />}
          />
        </Card>

        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Log Book Gold Ledger • Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  iconBg,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.settingValue, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SettingMenuItem({
  icon,
  iconBg,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  colors: any;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <ChevronRight size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  pageSubtitle: { fontSize: 13, marginTop: 2, marginBottom: 20 },
  profileCard: { marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileMeta: { fontSize: 11, marginTop: 4 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuCard: { marginBottom: 20, padding: 0 },
  divider: { height: 1, marginLeft: 52 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 10 },
  settingValue: { fontSize: 13, fontWeight: '500' },
  menuTitle: { fontSize: 13, fontWeight: '500' },
  menuSubtitle: { fontSize: 10 },
  versionText: { textAlign: 'center', fontSize: 11, marginTop: 16 },
});
