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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';
import { Input, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../utils/helpers';

type Props = { navigation: NativeStackNavigationProp<any> };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!validateEmail(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      let msg = 'Failed to sign in. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again later.';
      } else if (err.message) {
        msg = err.message;
      }
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Ionicons name="flash" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.title}>Nexus</Text>
            <Text style={styles.subtitle}>Connect · Share · Message</Text>
          </View>

          <View style={styles.card}>
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              icon="lock-closed-outline"
              error={errors.password}
            />
            <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Create account</Text>
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
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.primary },
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
