// src/navigation/index.tsx
import {
  createBottomTabNavigator,
  createBottomTabScreen,
} from '@react-navigation/bottom-tabs';
import { HeaderButton, Text } from '@react-navigation/elements';
import { createStaticNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  createNativeStackScreen,
} from '@react-navigation/native-stack';
import { Image } from 'react-native';
import bell from '../assets/bell.png';
import newspaper from '../assets/newspaper.png';

// Existing template screens (named exports)
import { Home } from './screens/Home';
import { NotFound } from './screens/NotFound';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';
import { Updates } from './screens/Updates';

// CareConnect screens (default exports — no curly braces)
import LandingScreen from '../screens/LandingScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

const HomeTabs = createBottomTabNavigator({
  screens: {
    Home: createBottomTabScreen({
      screen: Home,
      options: {
        title: 'Feed',
        tabBarIcon: ({ color, size }) => (
          <Image
            source={newspaper}
            tintColor={color}
            style={{ width: size, height: size }}
          />
        ),
      },
    }),
    Updates: createBottomTabScreen({
      screen: Updates,
      options: {
        tabBarIcon: ({ color, size }) => (
          <Image
            source={bell}
            tintColor={color}
            style={{ width: size, height: size }}
          />
        ),
      },
    }),
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    // Landing is the first screen — it shows when the app opens
    Landing: createNativeStackScreen({
      screen: LandingScreen,
      options: { headerShown: false },
    }),
    SignIn: createNativeStackScreen({
      screen: SignInScreen,
      options: { title: 'Sign In' },
    }),
    SignUp: createNativeStackScreen({
      screen: SignUpScreen,
      options: { title: 'Sign Up' },
    }),
    HomeTabs: createNativeStackScreen({
      screen: HomeTabs,
      options: { title: 'Home', headerShown: false },
    }),
    Profile: createNativeStackScreen({
      screen: Profile,
      linking: {
        path: ':user(@[a-zA-Z0-9-_]+)',
        parse: {
          user: (value: string) => value.replace(/^@/, ''),
        },
        stringify: {
          user: (value: string) => `@${value}`,
        },
      },
    }),
    Settings: createNativeStackScreen({
      screen: Settings,
      options: ({ navigation }) => ({
        presentation: 'modal',
        headerRight: () => (
          <HeaderButton onPress={navigation.goBack}>
            <Text>Close</Text>
          </HeaderButton>
        ),
      }),
    }),
    NotFound: createNativeStackScreen({
      screen: NotFound,
      options: { title: '404' },
      linking: { path: '*' },
    }),
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackType = typeof RootStack;

declare module '@react-navigation/native' {
  interface RootNavigator extends RootStackType {}
}