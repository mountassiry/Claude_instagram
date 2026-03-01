import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { useIdentity } from '../contexts/IdentityContext';
import { COLORS } from '../config/constants';

// Auth
import { SetupScreen } from '../screens/auth/SetupScreen';

// Main screens
import { FeedScreen } from '../screens/main/FeedScreen';
import { CreatePostScreen } from '../screens/main/CreatePostScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { ConversationsScreen } from '../screens/main/ConversationsScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { AddContactScreen } from '../screens/main/AddContactScreen';
import { CommentsScreen } from '../screens/main/CommentsScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: { borderTopColor: COLORS.border },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;
        switch (route.name) {
          case 'Feed':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Messages':
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            break;
          case 'Create':
            iconName = focused ? 'add-circle' : 'add-circle-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'help-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="Messages" component={ConversationsScreen} options={{ tabBarLabel: 'Messages' }} />
    <Tab.Screen name="Create" component={CreatePostScreen} options={{ tabBarLabel: 'Post' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <Stack.Screen name="Chat" component={ChatScreen as any} />
    <Stack.Screen name="AddContact" component={AddContactScreen} options={{ presentation: 'modal' }} />
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <Stack.Screen name="Comments" component={CommentsScreen as any} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { identity, isLoading } = useIdentity();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8FF' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {identity ? <MainStack /> : <SetupScreen />}
    </NavigationContainer>
  );
};
