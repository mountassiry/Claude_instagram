/**
 * SetupScreen — first-time identity creation.
 *
 * Replaces Login/Register. No server round-trip.
 * Generates a cryptographic keypair entirely on-device.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIdentity } from '../../contexts/IdentityContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';

export function SetupScreen() {
  const { setupIdentity } = useIdentity();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'name' | 'bio'>('name');

  const handleNext = () => {
    if (!displayName.trim()) {
      Alert.alert('Name required', 'Please enter a display name to continue.');
      return;
    }
    setStep('bio');
  };

  const handleCreate = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    try {
      await setupIdentity(displayName.trim(), bio.trim());
    } catch (err) {
      Alert.alert('Error', 'Failed to create identity. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>Nexus</Text>
            <Text style={styles.tagline}>Encrypted · Peer-to-Peer · Private</Text>
          </View>

          {/* Steps */}
          {step === 'name' && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>Choose your name</Text>
              <Text style={styles.stepDesc}>
                This is how your contacts will see you. No email or password needed —
                your identity is secured by cryptographic keys generated on your device.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Display name"
                placeholderTextColor={COLORS.textLight}
                value={displayName}
                onChangeText={setDisplayName}
                autoFocus
                maxLength={50}
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}

          {step === 'bio' && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>About you (optional)</Text>
              <Text style={styles.stepDesc}>
                Add a short bio so your contacts know who you are.
              </Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Short bio..."
                placeholderTextColor={COLORS.textLight}
                value={bio}
                onChangeText={setBio}
                autoFocus
                maxLength={150}
                multiline
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="key" size={18} color={COLORS.white} />
                    <Text style={styles.buttonText}>Generate My Keys & Start</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('name')}>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Privacy notice */}
          <View style={styles.notice}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.noticeText}>
              Your private keys never leave this device. All messages are end-to-end encrypted.
              No accounts, no passwords, no cloud storage.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.primary },
  tagline: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stepTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  stepDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  bioInput: { height: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  backBtn: { alignItems: 'center', marginTop: SPACING.md },
  backText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.success}10`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  noticeText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, lineHeight: 18 },
});
