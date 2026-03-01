import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';
import { Input, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePassword, validateUsername } from '../../utils/helpers';

type Props = { navigation: NativeStackNavigationProp<any> };

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp } = useAuth();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!displayName.trim() || displayName.trim().length < 2) e.displayName = 'Name must be at least 2 characters';
    const uv = validateUsername(username);
    if (!uv.valid) e.username = uv.message;
    if (!validateEmail(email)) e.email = 'Enter a valid email';
    const pv = validatePassword(password);
    if (!pv.valid) e.password = pv.message;
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, displayName.trim(), username.trim().toLowerCase());
    } catch (err: any) {
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists';
      else if (err.message) msg = err.message;
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Nexus today</Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Full Name"
              placeholder="Your display name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              icon="person-outline"
              error={errors.displayName}
            />
            <Input
              label="Username"
              placeholder="@username"
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              autoCapitalize="none"
              icon="at-outline"
              error={errors.username}
            />
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              isPassword
              icon="lock-closed-outline"
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              icon="lock-closed-outline"
              error={errors.confirmPassword}
            />
            <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  btn: { marginTop: SPACING.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  footerText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  link: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: '700' },
});
