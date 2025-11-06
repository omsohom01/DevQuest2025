import { Ionicons } from '@expo/vector-icons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
    DrawerItemList,
} from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useColorScheme } from '../hooks/use-color-scheme';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { user, logout } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for avatar
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                            console.error('Logout error:', error);
                        }
                    },
                },
            ]
        );
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'participant':
                return 'Participant';
            case 'judge':
                return 'Judge';
            case 'organizer':
                return 'Organizer';
            default:
                return 'User';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'participant':
                return 'person';
            case 'judge':
                return 'medal';
            case 'organizer':
                return 'shield-checkmark';
            default:
                return 'person';
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View
                    style={[
                        styles.avatarContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }]
                        }
                    ]}
                >
                    {user?.profilePicUrl ? (
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: user.profilePicUrl }}
                                style={styles.profileImage}
                            />
                            <View style={styles.statusIndicator} />
                        </View>
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                            <Ionicons name={getRoleIcon(user?.role || 'participant')} size={44} color="#fff" />
                            <View style={styles.statusIndicator} />
                        </View>
                    )}
                </Animated.View>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: scaleAnim.interpolate({ inputRange: [0.9, 1], outputRange: [10, 0] }) }] }}>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Ionicons name={getRoleIcon(user?.role || 'participant')} size={16} color="#fff" />
                        <Text style={styles.roleText}>{getRoleLabel(user?.role || 'participant')}</Text>
                    </View>
                </Animated.View>
            </LinearGradient>

            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.drawerContent}
                style={{ backgroundColor: colors.background }}
                showsVerticalScrollIndicator={false}
            >
                <DrawerItemList {...props} />
            </DrawerContentScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.error + '10' }]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={[colors.error + '15', colors.error + '08']}
                        style={styles.logoutGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="log-out" size={22} color={colors.error} />
                        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.appInfo}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.appBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="sparkles" size={16} color="#fff" />
                        <Text style={styles.appName}>Votum</Text>
                    </LinearGradient>
                    <Text style={[styles.appVersion, { color: colors.icon }]}>Version 1.0.0</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 28,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    imageWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.4)',
        position: 'relative',
    },
    profileImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#4ade80',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 6,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginBottom: 14,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    roleText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    drawerContent: {
        paddingTop: 12,
        paddingHorizontal: 8,
    },
    footer: {
        borderTopWidth: 1,
        padding: 20,
    },
    logoutButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        gap: 10,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
    },
    appInfo: {
        alignItems: 'center',
        paddingTop: 12,
    },
    appBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 6,
        gap: 6,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    appVersion: {
        fontSize: 12,
        fontWeight: '500',
    },
});
