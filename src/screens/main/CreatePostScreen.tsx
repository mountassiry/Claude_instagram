import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, MAX_CAPTION_LENGTH } from '../../config/constants';
import { Button, UserTagPicker } from '../../components';
import { usePosts } from '../../hooks/usePosts';
import { isVideo } from '../../utils/helpers';
import { UserTag } from '../../types';

type CreatePostScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(false);

  const { createPost } = usePosts();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const handlePost = async () => {
    if (!mediaUri) {
      Alert.alert('No Media', 'Please select a photo or video to share.');
      return;
    }

    setLoading(true);
    try {
      await createPost(mediaUri, mediaType, caption.trim(), tags);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearMedia = () => {
    setMediaUri(null);
    setCaption('');
    setTags([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <Button
            title="Share"
            onPress={handlePost}
            loading={loading}
            disabled={!mediaUri}
            size="small"
          />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {mediaUri ? (
            <View style={styles.mediaContainer}>
              {mediaType === 'image' ? (
                <>
                  <UserTagPicker
                    imageUri={mediaUri}
                    tags={tags}
                    onTagsChange={setTags}
                    editable
                  />
                </>
              ) : (
                <Video
                  source={{ uri: mediaUri }}
                  style={styles.media}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls
                />
              )}
              <TouchableOpacity style={styles.clearButton} onPress={clearMedia}>
                <Ionicons name="close-circle" size={30} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Share a moment</Text>
              <Text style={styles.pickerSubtitle}>
                Select a photo or video from your library or take a new one
              </Text>
              <View style={styles.pickerButtons}>
                <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
                  <Ionicons name="images" size={40} color={COLORS.primary} />
                  <Text style={styles.pickerButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={40} color={COLORS.primary} />
                  <Text style={styles.pickerButtonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mediaUri && (
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption..."
                placeholderTextColor={COLORS.textLight}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={MAX_CAPTION_LENGTH}
              />
              <Text style={styles.charCount}>
                {caption.length}/{MAX_CAPTION_LENGTH}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  mediaContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.border,
  },
  clearButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  pickerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  pickerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  pickerButton: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
  },
  pickerButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  captionContainer: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  captionInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: SPACING.sm,
  },
});
