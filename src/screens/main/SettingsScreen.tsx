import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, SIGNALING_SERVER_URL } from '../../config/constants';
import { useIdentity } from '../../contexts/IdentityContext';
import { useMessaging } from '../../contexts/MessagingContext';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
      <Ionicons name={icon} size={22} color={danger ? COLORS.error : COLORS.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />}
  </TouchableOpacity>
);

interface Props {
  navigation: { goBack: () => void };
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { profile, identity, resetIdentity } = useIdentity();
  const { isConnected } = useMessaging();

  const confirmReset = () => {
    Alert.alert(
      'Reset Identity',
      'This will permanently delete your cryptographic keys, contacts, messages, and all local data. This CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset Everything', style: 'destructive', onPress: resetIdentity },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              title={profile?.displayName ?? 'Unknown'}
              subtitle={`Peer ID: ${identity?.peerId?.slice(0, 16)}…`}
              onPress={() => {}}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={isConnected ? 'wifi' : 'wifi-outline'}
              title={isConnected ? 'Connected to relay' : 'Offline'}
              subtitle={SIGNALING_SERVER_URL}
              onPress={() => {}}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="lock-closed-outline"
              title="End-to-End Encrypted"
              subtitle="All messages & posts encrypted with NaCl (XSalsa20-Poly1305)"
              onPress={() => {}}
              showArrow={false}
            />
            <SettingItem
              icon="server-outline"
              title="Zero Cloud Storage"
              subtitle="All data stored locally on this device"
              onPress={() => {}}
              showArrow={false}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="App Version"
              subtitle="Nexus P2P v1.0.0"
              onPress={() => {}}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="trash-outline"
              title="Reset Identity & Wipe All Data"
              subtitle="Permanently deletes your keys and all local data"
              onPress={confirmReset}
              showArrow={false}
              danger
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.text },
  content: { paddingVertical: SPACING.md },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionContent: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  iconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  iconContainerDanger: { backgroundColor: `${COLORS.error}15` },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: FONT_SIZES.md, fontWeight: '500', color: COLORS.text },
  settingTitleDanger: { color: COLORS.error },
  settingSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
});
