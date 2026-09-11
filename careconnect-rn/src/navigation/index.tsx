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
import { Ionicons } from '@react-native-vector-icons/ionicons';

// Template screens
import { NotFound } from './screens/NotFound';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';

// CareConnect screens
import LandingScreen from '../screens/LandingScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';

// Patient screens
import PatientTodayScreen from '../screens/PatientTodayScreen';
import PatientMedicationsScreen from '../screens/PatientMedicationsScreen';
import PatientAppointmentsScreen from '../screens/PatientAppointmentsScreen';
import PatientProfileScreen from '../screens/PatientProfileScreen';

// Caregiver screens
import CaregiverActivityScreen from '../screens/CaregiverActivityScreen';
import CaregiverAppointmentsScreen from '../screens/CaregiverAppointmentsScreen';
import CaregiverMedicationsScreen from '../screens/CaregiverMedicationsScreen';
import CaregiverMedicationFormsScreen from '../screens/CaregiverMedicationFormsScreen';

// Detail screens
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';

// --- Patient Tab Navigator ---
const PatientTabs = createBottomTabNavigator({
  screenOptions: {
    tabBarActiveTintColor: '#1A73E8',
    tabBarInactiveTintColor: '#94A3B8',
    tabBarStyle: { paddingBottom: 4, height: 60 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
  },
  screens: {
    PatientToday: createBottomTabScreen({
      screen: PatientTodayScreen,
      options: {
        title: 'Today',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="today-outline" size={size} color={color} />
        ),
      },
    }),
    PatientMedications: createBottomTabScreen({
      screen: PatientMedicationsScreen,
      options: {
        title: 'Medications',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="medkit-outline" size={size} color={color} />
        ),
      },
    }),
    PatientAppointments: createBottomTabScreen({
      screen: PatientAppointmentsScreen,
      options: {
        title: 'Appointments',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="calendar-outline" size={size} color={color} />
        ),
      },
    }),
    PatientProfile: createBottomTabScreen({
      screen: PatientProfileScreen,
      options: {
        title: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="person-outline" size={size} color={color} />
        ),
      },
    }),
  },
});

// --- Caregiver Tab Navigator (placeholders for now) ---
const CaregiverTabs = createBottomTabNavigator({
  screenOptions: {
    tabBarActiveTintColor: '#14B8A6',
    tabBarInactiveTintColor: '#94A3B8',
    tabBarStyle: { paddingBottom: 4, height: 60 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
  },
  screens: {
    CaregiverPatients: createBottomTabScreen({
      screen: PatientTodayScreen,
      options: {
        title: 'Patients',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="people-outline" size={size} color={color} />
        ),
      },
    }),
    CaregiverMedications: createBottomTabScreen({
      screen: PatientMedicationsScreen,
      options: {
        title: 'Medications',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="medkit-outline" size={size} color={color} />
        ),
      },
    }),
    CaregiverAppointments: createBottomTabScreen({
      screen: PatientAppointmentsScreen,
      options: {
        title: 'Appointments',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="calendar-outline" size={size} color={color} />
        ),
      },
    }),
    CaregiverActivity: createBottomTabScreen({
      screen: PatientProfileScreen,
      options: {
        title: 'Activity',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="pulse-outline" size={size} color={color} />
        ),
      },
    }),
  },
});

// --- Root Stack ---
const RootStack = createNativeStackNavigator({
  screens: {
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
    RoleSelection: createNativeStackScreen({
      screen: RoleSelectionScreen,
      options: { title: 'Select Role' },
    }),
    PatientTabs: createNativeStackScreen({
      screen: PatientTabs,
      options: { headerShown: false },
    }),
    CaregiverTabs: createNativeStackScreen({
      screen: CaregiverTabs,
      options: { headerShown: false },
    }),
    MedicationDetail: createNativeStackScreen({
      screen: MedicationDetailScreen,
      options: { title: 'Medication' },
    }),
    AppointmentDetail: createNativeStackScreen({
      screen: AppointmentDetailScreen,
      options: { title: 'Appointment' },
    }),
    Profile: createNativeStackScreen({
      screen: Profile,
      linking: {
        path: ':user(@[a-zA-Z0-9-_]+)',
        parse: { user: (value: string) => value.replace(/^@/, '') },
        stringify: { user: (value: string) => `@${value}` },
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