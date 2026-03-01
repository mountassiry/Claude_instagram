/**
 * CreatePostScreen — create and broadcast an encrypted post.
 *
 * Post content is encrypted with each contact's public key before being sent.
 * Media is saved to the local file system. Nothing goes to the cloud.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useIdentity } from '../../contexts/IdentityContext';
import { useCreatePost } from '../../hooks/useLocalFeed';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, MAX_CAPTION_LENGTH } from '../../config/constants';

interface Props {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

export function CreatePostScreen({ navigation }: Props) {
  const { identity } = useIdentity();
  const { createPost, creating } = useCreatePost();
  const [caption, setCaption] = useState('');
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [postType, setPostType] = useState<'photo' | 'text'>('photo');

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your photos to share images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setSelectedUris(result.assets.map(a => a.uri));
      setPostType('photo');
    }
  };

  const takePicture = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75 });
    if (!result.canceled) {
      setSelectedUris([result.assets[0].uri]);
      setPostType('photo');
    }
  };

  const removeImage = (uri: string) => {
    setSelectedUris(prev => prev.filter(u => u !== uri));
  };

  const handlePost = async () => {
    if (!identity) return;
    if (postType === 'photo' && selectedUris.length === 0) {
      Alert.alert('Add a photo', 'Please select at least one image to post.');
      return;
    }
    if (postType === 'text' && !caption.trim()) {
      Alert.alert('Empty post', 'Please write something to post.');
      return;
    }

    const result = await createPost(caption, postType === 'photo' ? selectedUris : [], postType);
    if (result) {
      Alert.alert('Posted!', 'Your post has been shared with your contacts.', [
        { text: 'OK', onPress: () => navigation.navigate('Feed') },
      ]);
    } else {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  const canPost = postType === 'text' ? caption.trim().length > 0 : selectedUris.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={navigation.goBack} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!canPost || creating) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!canPost || creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.postBtnText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Type selector */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, postType === 'photo' && styles.typeBtnActive]}
              onPress={() => setPostType('photo')}
            >
              <Ionicons name="image" size={16} color={postType === 'photo' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.typeBtnText, postType === 'photo' && styles.typeBtnTextActive]}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, postType === 'text' && styles.typeBtnActive]}
              onPress={() => { setPostType('text'); setSelectedUris([]); }}
            >
              <Ionicons name="text" size={16} color={postType === 'text' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.typeBtnText, postType === 'text' && styles.typeBtnTextActive]}>Text</Text>
            </TouchableOpacity>
          </View>

          {/* Image picker area */}
          {postType === 'photo' && (
            <View style={styles.mediaSection}>
              {selectedUris.length === 0 ? (
                <View style={styles.mediaPlaceholder}>
                  <TouchableOpacity style={styles.mediaBtn} onPress={pickImages}>
                    <Ionicons name="images" size={28} color={COLORS.primary} />
                    <Text style={styles.mediaBtnText}>Choose from Library</Text>
                  </TouchableOpacity>
                  <View style={styles.mediaDivider}><Text style={styles.mediaDividerText}>or</Text></View>
                  <TouchableOpacity style={styles.mediaBtn} onPress={takePicture}>
                    <Ionicons name="camera" size={28} color={COLORS.primary} />
                    <Text style={styles.mediaBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={selectedUris}
                  horizontal
                  keyExtractor={uri => uri}
                  contentContainerStyle={styles.imageList}
                  renderItem={({ item }) => (
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: item }} style={styles.previewImage} />
                      <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(item)}>
                        <Ionicons name="close-circle" size={22} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  )}
                  ListFooterComponent={
                    selectedUris.length < 5 ? (
                      <TouchableOpacity style={styles.addMoreBtn} onPress={pickImages}>
                        <Ionicons name="add" size={28} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    ) : null
                  }
                />
              )}
            </View>
          )}

          {/* Caption */}
          <View style={styles.captionSection}>
            <TextInput
              style={styles.captionInput}
              placeholder={postType === 'text' ? "What's on your mind?" : "Write a caption..."}
              placeholderTextColor={COLORS.textLight}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={MAX_CAPTION_LENGTH}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{caption.length}/{MAX_CAPTION_LENGTH}</Text>
          </View>

          {/* Encryption notice */}
          <View style={styles.notice}>
            <Ionicons name="lock-closed" size={14} color={COLORS.success} />
            <Text style={styles.noticeText}>
              This post will be encrypted and sent directly to your contacts. Nothing is stored on any server.
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  postBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.round, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, minWidth: 70, alignItems: 'center' },
  postBtnDisabled: { backgroundColor: COLORS.lightGray },
  postBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
  typeRow: { flexDirection: 'row', margin: SPACING.md, gap: SPACING.sm },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  typeBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  typeBtnTextActive: { color: COLORS.primary },
  mediaSection: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  mediaPlaceholder: { borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface },
  mediaBtn: { alignItems: 'center', gap: SPACING.sm },
  mediaBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  mediaDivider: { flexDirection: 'row', alignItems: 'center' },
  mediaDividerText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  imageList: { gap: SPACING.sm, padding: SPACING.sm },
  imageWrapper: { position: 'relative' },
  previewImage: { width: 160, height: 160, borderRadius: BORDER_RADIUS.md },
  removeImage: { position: 'absolute', top: 6, right: 6 },
  addMoreBtn: { width: 160, height: 160, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  captionSection: { marginHorizontal: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  captionInput: { minHeight: 100, fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: 22 },
  charCount: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'right', marginTop: SPACING.sm },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, margin: SPACING.md, backgroundColor: `${COLORS.success}10`, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  noticeText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, lineHeight: 18 },
});
