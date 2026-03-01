/**
 * ProfileScreen — local-first profile with QR code identity sharing.
 *
 * Profile data stored in local SQLite. Your posts shown from local DB.
 * Share your QR code to let others add you as a contact.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import { useIdentity } from '../../contexts/IdentityContext';
import { useMyPosts } from '../../hooks/useLocalFeed';
import { exportPublicKeys } from '../../crypto/keys';
import { QRContactData } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';

interface Props {
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
}

export function ProfileScreen({ navigation }: Props) {
  const { identity, profile, updateProfile, resetIdentity } = useIdentity();
  const { posts, loading } = useMyPosts(identity?.peerId ?? '');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.displayName ?? '');
  const [editBio, setEditBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const myQRData: QRContactData | null = identity && profile
    ? (() => {
        const { signingPublicKey, encryptionPublicKey } = exportPublicKeys(identity);
        return {
          v: 1,
          pid: identity.peerId,
          spk: signingPublicKey,
          epk: encryptionPublicKey,
          name: profile.displayName,
          bio: profile.bio || undefined,
        };
      })()
    : null;

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Name required', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    await updateProfile({ displayName: editName.trim(), bio: editBio.trim() });
    setSaving(false);
    setEditing(false);
  };

  const changeAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) {
      await updateProfile({ avatarUri: result.assets[0].uri });
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset Identity',
      'This will delete your cryptographic keys, profile, and all local data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetIdentity },
      ],
    );
  };

  const renderPost = ({ item }: { item: typeof posts[number] }) => (
    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
      {item.mediaUris[0] ? (
        <Image source={{ uri: item.mediaUris[0] }} style={styles.gridImage} />
      ) : (
        <View style={[styles.gridImage, styles.textPost]}>
          <Text style={styles.textPostContent} numberOfLines={3}>{item.caption}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Profile section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={changeAvatar} style={styles.avatarWrapper}>
            {profile?.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{(profile?.displayName ?? '?')[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Display name"
                maxLength={50}
              />
              <TextInput
                style={[styles.editInput, styles.editBio]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Bio..."
                maxLength={150}
                multiline
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveProfile} style={styles.saveBtn} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile?.displayName}</Text>
              {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
              <Text style={styles.peerId} numberOfLines={1} ellipsizeMode="middle">
                {identity?.peerId}
              </Text>
              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.editProfileBtn} onPress={() => { setEditName(profile?.displayName ?? ''); setEditBio(profile?.bio ?? ''); setEditing(true); }}>
                  <Ionicons name="pencil" size={14} color={COLORS.primary} />
                  <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(prev => !prev)}>
                  <Ionicons name="qr-code" size={14} color={COLORS.primary} />
                  <Text style={styles.editProfileBtnText}>{showQR ? 'Hide QR' : 'My QR'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* QR Code */}
        {showQR && myQRData && (
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Share this QR code to let others add you</Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={JSON.stringify(myQRData)}
                size={200}
                color={COLORS.darkGray}
                backgroundColor={COLORS.white}
              />
            </View>
            <View style={styles.encryptNote}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
              <Text style={styles.encryptNoteText}>Contains only your PUBLIC key — safe to share</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Posts grid */}
        {loading ? (
          <ActivityIndicator style={{ margin: SPACING.xl }} color={COLORS.primary} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Ionicons name="camera-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyPostsText}>No posts yet</Text>
            <TouchableOpacity style={styles.createPostBtn} onPress={() => navigation.navigate('Create')}>
              <Text style={styles.createPostBtnText}>Create your first post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={renderPost}
            numColumns={3}
            scrollEnabled={false}
            style={styles.grid}
          />
        )}

        {/* Danger zone */}
        <TouchableOpacity style={styles.resetBtn} onPress={confirmReset}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={styles.resetBtnText}>Reset Identity & Wipe Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  profileSection: { padding: SPACING.md, flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start', backgroundColor: COLORS.surface },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontSize: FONT_SIZES.xxxl, fontWeight: '800' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  profileInfo: { flex: 1 },
  displayName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  bio: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  peerId: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, fontFamily: 'monospace', marginTop: 6, maxWidth: 220 },
  profileActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 5 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 5 },
  editProfileBtnText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  editForm: { flex: 1, gap: SPACING.sm },
  editInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, fontSize: FONT_SIZES.md, color: COLORS.text },
  editBio: { height: 60, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: { flex: 1, alignItems: 'center', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, alignItems: 'center', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
  qrSection: { alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  qrTitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.md, textAlign: 'center' },
  qrWrapper: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  encryptNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md },
  encryptNoteText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  stats: { flexDirection: 'row', padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, justifyContent: 'center' },
  stat: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  statNum: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  grid: { marginTop: StyleSheet.hairlineWidth },
  gridItem: { flex: 1 / 3, aspectRatio: 1, padding: 1 },
  gridImage: { flex: 1, backgroundColor: COLORS.lightGray },
  textPost: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight, padding: SPACING.sm },
  textPostContent: { fontSize: FONT_SIZES.xs, color: COLORS.white, textAlign: 'center' },
  emptyPosts: { alignItems: 'center', padding: SPACING.xl },
  emptyPostsText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.md },
  createPostBtn: { marginTop: SPACING.md, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round },
  createPostBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, margin: SPACING.lg, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.error, justifyContent: 'center' },
  resetBtnText: { color: COLORS.error, fontWeight: '600', fontSize: FONT_SIZES.sm },
});
