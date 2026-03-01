/**
 * AddContactScreen — dual-purpose QR code screen.
 *
 * Tab 1: Shows YOUR QR code (your public keys + display name) for others to scan.
 * Tab 2: Scans another person's QR code to add them as a contact.
 *
 * No server involved — public keys are exchanged purely device-to-device via QR.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIdentity } from '../../contexts/IdentityContext';
import { useContacts } from '../../hooks/useContacts';
import { exportPublicKeys } from '../../crypto/keys';
import { QRContactData } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';

type Tab = 'show' | 'scan';

interface Props {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
}

export function AddContactScreen({ navigation }: Props) {
  const { identity, profile } = useIdentity();
  const { addContactFromQR } = useContacts();
  const [tab, setTab] = useState<Tab>('show');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [adding, setAdding] = useState(false);

  // Build our own QR data
  const myQRData: QRContactData | null = identity && profile
    ? {
        v: 1,
        pid: identity.peerId,
        spk: exportPublicKeys(identity).signingPublicKey,
        epk: exportPublicKeys(identity).encryptionPublicKey,
        name: profile.displayName,
        bio: profile.bio || undefined,
      }
    : null;

  const myQRString = myQRData ? JSON.stringify(myQRData) : '';

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || adding) return;
    setScanned(true);

    try {
      const parsed: QRContactData = JSON.parse(data);
      if (!parsed.v || !parsed.pid || !parsed.spk || !parsed.epk || !parsed.name) {
        Alert.alert('Invalid QR', 'This QR code is not a valid Nexus contact.');
        setScanned(false);
        return;
      }
      if (parsed.pid === identity?.peerId) {
        Alert.alert("That's you!", 'You cannot add yourself as a contact.');
        setScanned(false);
        return;
      }

      setAdding(true);
      await addContactFromQR(parsed);

      Alert.alert(
        '✓ Contact added',
        `${parsed.name} has been added to your contacts.`,
        [{ text: 'Message them', onPress: () => navigation.navigate('Contacts') },
         { text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Error', 'Could not read this QR code. Make sure it\'s a Nexus QR code.');
      setScanned(false);
    } finally {
      setAdding(false);
    }
  };

  const shareMyQR = async () => {
    try {
      await Share.share({ message: `Add me on Nexus!\n\n${myQRString}` });
    } catch { /* user cancelled */ }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Contact</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'show' && styles.tabActive]}
          onPress={() => setTab('show')}
        >
          <Ionicons name="qr-code" size={18} color={tab === 'show' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, tab === 'show' && styles.tabTextActive]}>My Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'scan' && styles.tabActive]}
          onPress={async () => {
            if (!permission?.granted) await requestPermission();
            setTab('scan');
            setScanned(false);
          }}
        >
          <Ionicons name="scan" size={18} color={tab === 'scan' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, tab === 'scan' && styles.tabTextActive]}>Scan Code</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'show' && (
        <ScrollView contentContainerStyle={styles.showContent}>
          <Text style={styles.showTitle}>Share your QR code</Text>
          <Text style={styles.showDesc}>
            Let your contact scan this to add you. It only contains your public keys — completely safe to share.
          </Text>
          {myQRData && (
            <View style={styles.qrWrapper}>
              <QRCode
                value={myQRString}
                size={220}
                color={COLORS.darkGray}
                backgroundColor={COLORS.white}
              />
            </View>
          )}
          <Text style={styles.peerIdLabel}>Your Peer ID</Text>
          <Text style={styles.peerId} numberOfLines={1} ellipsizeMode="middle">
            {identity?.peerId}
          </Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareMyQR}>
            <Ionicons name="share-social" size={18} color={COLORS.white} />
            <Text style={styles.shareBtnText}>Share via text / link</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {tab === 'scan' && (
        <View style={styles.scanContent}>
          {!permission?.granted ? (
            <View style={styles.permBox}>
              <Ionicons name="camera" size={48} color={COLORS.textSecondary} />
              <Text style={styles.permText}>Camera permission is needed to scan QR codes.</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={requestPermission}>
                <Text style={styles.shareBtnText}>Allow Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleScan}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
              </View>
              <Text style={styles.scanHint}>Point at a Nexus QR code</Text>
              {adding && (
                <View style={styles.addingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.addingText}>Adding contact...</Text>
                </View>
              )}
              {scanned && !adding && (
                <TouchableOpacity
                  style={styles.rescanBtn}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.rescanText}>Scan again</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  tabs: { flexDirection: 'row', margin: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  tabActive: { backgroundColor: `${COLORS.primary}15` },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  showContent: { padding: SPACING.lg, alignItems: 'center' },
  showTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  showDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
  qrWrapper: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: SPACING.lg },
  peerIdLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  peerId: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontFamily: 'monospace', marginTop: 4, marginBottom: SPACING.xl, maxWidth: 280 },
  shareBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.round },
  shareBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  scanContent: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  scanFrame: { width: 220, height: 220, borderWidth: 3, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg },
  scanHint: { position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 10 },
  addingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  addingText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  rescanBtn: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  rescanText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round },
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  permText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
