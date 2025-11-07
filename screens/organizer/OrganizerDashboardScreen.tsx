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
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

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

        // Subtle pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Float animation for header icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Shimmer effect
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 300],
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
            style={[styles.hackathonCard, { backgroundColor: '#1a1f3a', borderColor: '#2d3548' }]}
            onPress={() => navigation.navigate('HackathonDetail', { hackathonId: hackathon.id })}
            activeOpacity={0.85}
        >
            {hackathon.posterUrl ? (
                <Image source={{ uri: hackathon.posterUrl }} style={styles.hackathonPoster} />
            ) : (
                <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.hackathonPoster}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="trophy" size={36} color="#fff" />
                </LinearGradient>
            )}
            <View style={styles.hackathonInfo}>
                <View style={styles.hackathonHeader}>
                    <Text style={[styles.hackathonTitle, { color: '#ffffff' }]} numberOfLines={2}>
                        {hackathon.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                </View>
                <Text style={[styles.hackathonDescription, { color: '#9ca3af' }]} numberOfLines={2}>
                    {hackathon.description}
                </Text>
                <View style={styles.hackathonMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={14} color="#10b981" />
                        <Text style={[styles.metaText, { color: '#e5e7eb' }]}>
                            ${hackathon.prizePool.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                        <Text style={[styles.metaText, { color: '#9ca3af' }]}>
                            {formatDate(hackathon.schedule.eventStart)}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="#9ca3af" />
                        <Text style={[styles.metaText, { color: '#9ca3af' }]}>
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
        <View style={[styles.container, { backgroundColor: '#0A0E27' }]}>
            <LinearGradient
                colors={['#0A0E27', '#1a1f3a', '#0A0E27']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
            >
                <LinearGradient
                    colors={['#1a1f3a', '#0f1629']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View
                        style={{
                            transform: [
                                { translateY: floatAnim },
                                { scale: pulseAnim }
                            ]
                        }}
                    >
                        <LinearGradient
                            colors={[colors.primary + '40', colors.secondary + '40']}
                            style={styles.headerIconBg}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="grid" size={48} color="#fff" />
                        </LinearGradient>
                    </Animated.View>
                    <Text style={styles.headerTitle}>Organizer Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Manage your hackathons with precision</Text>
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
                            <Animated.View style={[styles.statCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
                                <LinearGradient
                                    colors={['#10b981', '#059669']}
                                    style={styles.statCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name="play-circle" size={24} color="#fff" />
                                    </View>
                                    <Text style={styles.statNumber}>{ongoingHackathons.length}</Text>
                                    <Text style={styles.statLabel}>Ongoing</Text>
                                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />
                                </LinearGradient>
                            </Animated.View>

                            <Animated.View style={[styles.statCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
                                <LinearGradient
                                    colors={['#3b82f6', '#2563eb']}
                                    style={styles.statCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name="time" size={24} color="#fff" />
                                    </View>
                                    <Text style={styles.statNumber}>{upcomingHackathons.length}</Text>
                                    <Text style={styles.statLabel}>Upcoming</Text>
                                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />
                                </LinearGradient>
                            </Animated.View>
                        </View>

                        <View style={styles.statsRow}>
                            <Animated.View style={[styles.statCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
                                <LinearGradient
                                    colors={['#8b5cf6', '#7c3aed']}
                                    style={styles.statCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                    </View>
                                    <Text style={styles.statNumber}>{pastHackathons.length}</Text>
                                    <Text style={styles.statLabel}>Completed</Text>
                                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />
                                </LinearGradient>
                            </Animated.View>

                            <Animated.View style={[styles.statCardWrapper, { transform: [{ scale: pulseAnim }] }]}>
                                <LinearGradient
                                    colors={['#f59e0b', '#d97706']}
                                    style={styles.statCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name="trophy" size={24} color="#fff" />
                                    </View>
                                    <Text style={styles.statNumber}>{hackathons.length}</Text>
                                    <Text style={styles.statLabel}>Total</Text>
                                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />
                                </LinearGradient>
                            </Animated.View>
                        </View>
                    </View>

                    {/* Create Hackathon Button */}
                    <TouchableOpacity
                        style={styles.createHackathonButton}
                        onPress={() => navigation.navigate('AddHackathon')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#6366f1', '#8b5cf6']}
                            style={styles.createButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.createButtonContent}>
                                <View style={styles.createIconBg}>
                                    <Ionicons name="add-circle" size={28} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.createHackathonText}>Create New Hackathon</Text>
                                    <Text style={styles.createHackathonSubtext}>Build the next big event</Text>
                                </View>
                            </View>
                            <Ionicons name="arrow-forward" size={22} color="#fff" />
                            <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />
                        </LinearGradient>
                    </TouchableOpacity>

                    {hackathons.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: '#1a1f3a' }]}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <LinearGradient
                                    colors={['#6366f120', '#8b5cf620']}
                                    style={styles.emptyIconBg}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="trophy-outline" size={56} color="#6366f1" />
                                </LinearGradient>
                            </Animated.View>
                            <Text style={[styles.emptyTitle, { color: '#ffffff' }]}>No Hackathons Yet</Text>
                            <Text style={[styles.emptyText, { color: '#9ca3af' }]}>
                                Create your first hackathon and start building an amazing community!
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Ongoing Hackathons */}
                            {ongoingHackathons.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionIconBg, { backgroundColor: '#10b98125' }]}>
                                            <Ionicons name="play-circle" size={20} color="#10b981" />
                                        </View>
                                        <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>
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
                                        <View style={[styles.sectionIconBg, { backgroundColor: '#3b82f625' }]}>
                                            <Ionicons name="time" size={20} color="#3b82f6" />
                                        </View>
                                        <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>
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
                                        <View style={[styles.sectionIconBg, { backgroundColor: '#9ca3af25' }]}>
                                            <Ionicons name="checkmark-circle" size={20} color="#9ca3af" />
                                        </View>
                                        <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A0E27',
    },
    header: {
        padding: 36,
        paddingTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    headerIconBg: {
        width: 88,
        height: 88,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    content: {
        padding: 16,
    },
    statsContainer: {
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    statCardWrapper: {
        flex: 1,
    },
    statCard: {
        flex: 1,
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        overflow: 'hidden',
    },
    statIconContainer: {
        marginBottom: 6,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 100,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    createHackathonButton: {
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        overflow: 'hidden',
    },
    createButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    createIconBg: {
        width: 44,
        height: 44,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createHackathonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.3,
    },
    createHackathonSubtext: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    emptyState: {
        borderRadius: 8,
        padding: 40,
        alignItems: 'center',
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#2d3548',
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 10,
    },
    sectionIconBg: {
        width: 36,
        height: 36,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    hackathonCard: {
        flexDirection: 'row',
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    hackathonPoster: {
        width: 110,
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hackathonInfo: {
        flex: 1,
        padding: 14,
        justifyContent: 'space-between',
    },
    hackathonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    hackathonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
        lineHeight: 22,
        letterSpacing: 0.2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    hackathonDescription: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 10,
    },
    hackathonMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
