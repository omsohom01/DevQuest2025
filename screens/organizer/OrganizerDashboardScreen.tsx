import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Hackathon } from '../../types';

export default function OrganizerDashboardScreen({ navigation }: any) {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const headerRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous rotation for icon
        Animated.loop(
            Animated.timing(headerRotate, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = headerRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    useEffect(() => {
        if (!user) return;

        const hackathonsQuery = query(
            collection(db, 'hackathons'),
            where('organizerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(hackathonsQuery, (snapshot) => {
            const hackathonData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    schedule: {
                        registrationStart: data.schedule?.registrationStart?.toDate() || new Date(),
                        registrationEnd: data.schedule?.registrationEnd?.toDate() || new Date(),
                        eventStart: data.schedule?.eventStart?.toDate() || new Date(),
                        eventEnd: data.schedule?.eventEnd?.toDate() || new Date(),
                    },
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                };
            }) as Hackathon[];

            // Sort by event start date
            hackathonData.sort((a, b) => a.schedule.eventStart.getTime() - b.schedule.eventStart.getTime());

            setHackathons(hackathonData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Categorize hackathons
    const now = new Date();
    const upcomingHackathons = hackathons.filter(h => h.schedule.eventStart > now);
    const ongoingHackathons = hackathons.filter(h => h.schedule.eventStart <= now && h.schedule.eventEnd >= now);
    const pastHackathons = hackathons.filter(h => h.schedule.eventEnd < now);

    const HackathonCard = ({ hackathon, statusColor, statusText }: any) => (
        <TouchableOpacity
            style={[styles.hackathonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('HackathonDetail', { hackathonId: hackathon.id })}
        >
            {hackathon.posterUrl ? (
                <Image source={{ uri: hackathon.posterUrl }} style={styles.hackathonPoster} />
            ) : (
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.hackathonPoster}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="trophy" size={40} color="#fff" />
                </LinearGradient>
            )}
            <View style={styles.hackathonInfo}>
                <View style={styles.hackathonHeader}>
                    <Text style={[styles.hackathonTitle, { color: colors.text }]} numberOfLines={2}>
                        {hackathon.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                </View>
                <Text style={[styles.hackathonDescription, { color: colors.icon }]} numberOfLines={2}>
                    {hackathon.description}
                </Text>
                <View style={styles.hackathonMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={16} color={colors.success} />
                        <Text style={[styles.metaText, { color: colors.text }]}>
                            ${hackathon.prizePool.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={16} color={colors.icon} />
                        <Text style={[styles.metaText, { color: colors.icon }]}>
                            {formatDate(hackathon.schedule.eventStart)}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={16} color={colors.icon} />
                        <Text style={[styles.metaText, { color: colors.icon }]}>
                            {hackathon.mode === 'online' ? 'Online' : hackathon.venue}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
        >
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="grid" size={56} color="#fff" />
                </Animated.View>
                <Text style={styles.headerTitle}>Organizer Dashboard</Text>
                <Text style={styles.headerSubtitle}>Manage your hackathons with ease</Text>
            </LinearGradient>

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statsRow}>
                        <LinearGradient
                            colors={[colors.success + 'DD', colors.success]}
                            style={styles.statCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.statIconContainer}>
                                <Ionicons name="play-circle" size={28} color="#fff" />
                            </View>
                            <Text style={styles.statNumber}>{ongoingHackathons.length}</Text>
                            <Text style={styles.statLabel}>Ongoing</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={[colors.secondary + 'DD', colors.secondary]}
                            style={styles.statCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.statIconContainer}>
                                <Ionicons name="time" size={28} color="#fff" />
                            </View>
                            <Text style={styles.statNumber}>{upcomingHackathons.length}</Text>
                            <Text style={styles.statLabel}>Upcoming</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statsRow}>
                        <LinearGradient
                            colors={[colors.primary + 'DD', colors.primary]}
                            style={styles.statCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.statIconContainer}>
                                <Ionicons name="checkmark-circle" size={28} color="#fff" />
                            </View>
                            <Text style={styles.statNumber}>{pastHackathons.length}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={[colors.accent + 'DD', colors.accent]}
                            style={styles.statCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.statIconContainer}>
                                <Ionicons name="trophy" size={28} color="#fff" />
                            </View>
                            <Text style={styles.statNumber}>{hackathons.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Create Hackathon Button */}
                <TouchableOpacity
                    style={styles.createHackathonButton}
                    onPress={() => navigation.navigate('AddHackathon')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.createButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.createButtonContent}>
                            <Ionicons name="add-circle" size={32} color="#fff" />
                            <View>
                                <Text style={styles.createHackathonText}>Create New Hackathon</Text>
                                <Text style={styles.createHackathonSubtext}>Start organizing today</Text>
                            </View>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                {hackathons.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                        <LinearGradient
                            colors={[colors.primary + '20', colors.secondary + '20']}
                            style={styles.emptyIconBg}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="trophy-outline" size={64} color={colors.primary} />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Hackathons Yet</Text>
                        <Text style={[styles.emptyText, { color: colors.icon }]}>
                            Create your first hackathon and start building an amazing community!
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Ongoing Hackathons */}
                        {ongoingHackathons.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIconBg, { backgroundColor: colors.success + '20' }]}>
                                        <Ionicons name="play-circle" size={24} color={colors.success} />
                                    </View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Ongoing ({ongoingHackathons.length})
                                    </Text>
                                </View>
                                {ongoingHackathons.map((hackathon) => (
                                    <HackathonCard
                                        key={hackathon.id}
                                        hackathon={hackathon}
                                        statusColor={colors.success}
                                        statusText="Ongoing"
                                    />
                                ))}
                            </View>
                        )}

                        {/* Upcoming Hackathons */}
                        {upcomingHackathons.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIconBg, { backgroundColor: colors.secondary + '20' }]}>
                                        <Ionicons name="time" size={24} color={colors.secondary} />
                                    </View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Upcoming ({upcomingHackathons.length})
                                    </Text>
                                </View>
                                {upcomingHackathons.map((hackathon) => (
                                    <HackathonCard
                                        key={hackathon.id}
                                        hackathon={hackathon}
                                        statusColor={colors.secondary}
                                        statusText="Upcoming"
                                    />
                                ))}
                            </View>
                        )}

                        {/* Past Hackathons */}
                        {pastHackathons.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIconBg, { backgroundColor: colors.icon + '20' }]}>
                                        <Ionicons name="checkmark-circle" size={24} color={colors.icon} />
                                    </View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Previous ({pastHackathons.length})
                                    </Text>
                                </View>
                                {pastHackathons.map((hackathon) => (
                                    <HackathonCard
                                        key={hackathon.id}
                                        hackathon={hackathon}
                                        statusColor={colors.icon}
                                        statusText="Completed"
                                    />
                                ))}
                            </View>
                        )}
                    </>
                )}
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 40,
        paddingTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
    },
    content: {
        padding: 16,
    },
    statsContainer: {
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    statIconContainer: {
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    createHackathonButton: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    createButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    createHackathonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    createHackathonSubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    emptyState: {
        borderRadius: 20,
        padding: 48,
        alignItems: 'center',
        marginTop: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    sectionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    hackathonCard: {
        flexDirection: 'row',
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
    },
    hackathonPoster: {
        width: 130,
        height: 170,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hackathonInfo: {
        flex: 1,
        padding: 18,
        justifyContent: 'space-between',
    },
    hackathonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    hackathonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
        lineHeight: 24,
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    hackathonDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    hackathonMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
    },
});
