import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { db } from '../config/firebase';
import { Colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useColorScheme } from '../hooks/use-color-scheme';
import { CustomDrawerContent } from './index';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Participant Screens
import AttendanceQRScreen from '../screens/participant/AttendanceQRScreen';
import ParticipantHackathonDetailScreen from '../screens/participant/HackathonDetailScreen';
import MyHackathonsScreen from '../screens/participant/MyHackathonsScreen';
import NotificationsScreen from '../screens/participant/NotificationsScreen';
import ParticipantDashboardScreen from '../screens/participant/ParticipantDashboardScreen';
import SubmissionDetailScreen from '../screens/participant/SubmissionDetailScreen';
import TeamViewScreen from '../screens/participant/TeamViewScreen';
// Team registration screen with approval flow
import HackathonRegistrationScreen from '../screens/participant/HackathonRegistrationScreen';

// Judge Screens

import AIAnalysisScreen from '../screens/judge/AIAnalysisScreen';
import EvaluationScreen from '../screens/judge/EvaluationScreen';
import JudgeAssignedTeamsScreen from '../screens/judge/JudgeAssignedTeamsScreen';
import JudgeHackathonDetailScreen from '../screens/judge/JudgeHackathonDetailScreen';
import JudgeNotificationsScreen from '../screens/judge/JudgeNotificationsScreen';
import JudgeMyHackathonsScreen from '../screens/judge/MyHackathonsScreen';
import TeamEvaluationScreen from '../screens/judge/TeamEvaluationScreen';

// Organizer Screens
import AddHackathonScreen from '../screens/organizer/AddHackathonScreen';
import AssignJudgeScreen from '../screens/organizer/AssignJudgeScreen';
import AttendanceListScreen from '../screens/organizer/AttendanceListScreen';
import HackathonDetailScreen from '../screens/organizer/HackathonDetailScreen';
import InviteJudgesScreen from '../screens/organizer/InviteJudgesScreen';
import OrganizerDashboardScreen from '../screens/organizer/OrganizerDashboardScreen';
import QRScannerScreen from '../screens/organizer/QRScannerScreen';
import SubmissionManagementScreen from '../screens/organizer/SubmissionManagementScreen';
import SubmittedIdeasScreen from '../screens/organizer/SubmittedIdeasScreen';
import TeamListScreen from '../screens/organizer/TeamListScreen';
import YourHackathonsScreen from '../screens/organizer/YourHackathonsScreen';

// Common Screens
import ProfileScreen from '../screens/ProfileScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

function ParticipantDrawer() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.email) return;

        // Count all pending notifications (not just team invitations)
        const q = query(
            collection(db, 'notifications'),
            where('invitedEmail', '==', user.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Count pending team invitations and other unread notifications
            let count = 0;
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                // Team invitations: count pending status
                if (data.type === 'team_invitation' && data.status === 'pending') {
                    count++;
                }
                // Other notifications: count if not read
                else if (data.type !== 'team_invitation' && !data.read) {
                    count++;
                }
            });
            setUnreadCount(count);
        });

        return unsubscribe;
    }, [user]);

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 20,
                },
                drawerActiveBackgroundColor: colors.primary + '15',
                drawerActiveTintColor: colors.primary,
                drawerInactiveTintColor: colors.icon,
                drawerLabelStyle: {
                    fontSize: 15,
                    fontWeight: '600',
                    marginLeft: -8,
                },
                drawerItemStyle: {
                    borderRadius: 12,
                    paddingVertical: 4,
                },
                drawerStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Drawer.Screen
                name="ParticipantDashboard"
                component={ParticipantDashboardScreen}
                options={{
                    title: 'Discover',
                    drawerLabel: 'Discover Hackathons',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="rocket" size={size + 2} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="MyHackathons"
                component={MyHackathonsScreen}
                options={{
                    title: 'My Hackathons',
                    drawerLabel: 'My Hackathons',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="bookmark" size={size + 2} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    title: 'Notifications',
                    drawerLabel: 'Notifications',
                    drawerIcon: ({ color, size }) => (
                        <View style={{ position: 'relative' }}>
                            <Ionicons name="notifications" size={size + 2} color={color} />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'My Profile',
                    drawerLabel: 'My Profile',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size + 2} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}

function JudgeDrawer() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 20,
                },
                drawerActiveBackgroundColor: colors.primary + '15',
                drawerActiveTintColor: colors.primary,
                drawerInactiveTintColor: colors.icon,
                drawerLabelStyle: {
                    fontSize: 15,
                    fontWeight: '600',
                    marginLeft: -8,
                },
                drawerItemStyle: {
                    borderRadius: 12,
                    paddingVertical: 4,
                },
                drawerStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Drawer.Screen
                name="JudgeMyHackathons"
                component={JudgeMyHackathonsScreen}
                options={{
                    title: 'My Hackathons',
                    drawerLabel: 'My Hackathons',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="trophy" size={size + 2} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="JudgeNotifications"
                component={JudgeNotificationsScreen}
                options={{
                    title: 'Notifications',
                    drawerLabel: 'Notifications',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="notifications" size={size + 2} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'My Profile',
                    drawerLabel: 'My Profile',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size + 2} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}

function OrganizerDrawer() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 20,
                },
                drawerActiveBackgroundColor: colors.primary + '15',
                drawerActiveTintColor: colors.primary,
                drawerInactiveTintColor: colors.icon,
                drawerLabelStyle: {
                    fontSize: 15,
                    fontWeight: '600',
                    marginLeft: -8,
                },
                drawerItemStyle: {
                    borderRadius: 12,
                    paddingVertical: 4,
                },
                drawerStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Drawer.Screen
                name="OrganizerDashboard"
                component={OrganizerDashboardScreen}
                options={{
                    title: 'Dashboard',
                    drawerLabel: 'Dashboard',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="grid" size={size + 2} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="YourHackathons"
                component={YourHackathonsScreen}
                options={{
                    title: 'Your Hackathons',
                    drawerLabel: 'Your Hackathons',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="trophy" size={size + 2} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'My Profile',
                    drawerLabel: 'My Profile',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size + 2} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}

function ParticipantStack() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="ParticipantDrawer"
                component={ParticipantDrawer}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SubmissionDetail"
                component={SubmissionDetailScreen}
                options={{ title: 'Submission Details' }}
            />
            <Stack.Screen
                name="HackathonDetail"
                component={ParticipantHackathonDetailScreen}
                options={{ title: 'Hackathon Details' }}
            />
            <Stack.Screen
                name="HackathonRegistration"
                component={HackathonRegistrationScreen}
                options={{ title: 'Register for Hackathon' }}
            />
            <Stack.Screen
                name="TeamView"
                component={TeamViewScreen}
                options={{ title: 'Team Details' }}
            />
            <Stack.Screen
                name="AttendanceQR"
                component={AttendanceQRScreen}
                options={{ title: 'Attendance QR Code' }}
            />
        </Stack.Navigator>
    );
}

function JudgeStack() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="JudgeDrawer"
                component={JudgeDrawer}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="JudgeHackathonDetail"
                component={JudgeHackathonDetailScreen}
                options={{ title: 'Hackathon Details' }}
            />
            <Stack.Screen
                name="EvaluationScreen"
                component={EvaluationScreen}
                options={{ title: 'Evaluate Submission' }}
            />
            <Stack.Screen
                name="JudgeAssignedTeams"
                component={JudgeAssignedTeamsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TeamEvaluation"
                component={TeamEvaluationScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AIAnalysis"
                component={AIAnalysisScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

function OrganizerStack() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="OrganizerDrawer"
                component={OrganizerDrawer}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SubmissionManagement"
                component={SubmissionManagementScreen}
                options={{ title: 'Manage Submission' }}
            />
            <Stack.Screen
                name="AddHackathon"
                component={AddHackathonScreen}
                options={{ title: 'Create Hackathon' }}
            />
            <Stack.Screen
                name="HackathonDetail"
                component={HackathonDetailScreen}
                options={{ title: 'Hackathon Details' }}
            />
            <Stack.Screen
                name="InviteJudges"
                component={InviteJudgesScreen}
                options={{ title: 'Invite Judges' }}
            />
            <Stack.Screen
                name="SubmittedIdeas"
                component={SubmittedIdeasScreen}
                options={{ title: 'Submitted Ideas' }}
            />
            <Stack.Screen
                name="TeamList"
                component={TeamListScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AssignJudge"
                component={AssignJudgeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="QRScanner"
                component={QRScannerScreen}
                options={{ title: 'Scan QR Code' }}
            />
            <Stack.Screen
                name="AttendanceList"
                component={AttendanceListScreen}
                options={{ title: 'Attendance List' }}
            />
        </Stack.Navigator>
    );
}

function AppNavigator() {
    const { user, loading } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return <AuthNavigator />;
    }

    // Role-based navigation
    switch (user.role) {
        case 'participant':
            return <ParticipantStack />;
        case 'judge':
            return <JudgeStack />;
        case 'organizer':
            return <OrganizerStack />;
        default:
            return <AuthNavigator />;
    }
}

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <NavigationContainerWrapper />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

function NavigationContainerWrapper() {
    const { user } = useAuth();

    return (
        <NavigationContainer key={user?.uid ?? 'logged-out'}>
            <AppNavigator />
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: 'red',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
