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
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Hackathon } from '../../types';

export default function ParticipantDashboardScreen({ navigation }: any) {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [myHackathons, setMyHackathons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const rocketRotate = useRef(new Animated.Value(0)).current;

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
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();

        // Rocket floating animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(rocketRotate, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(rocketRotate, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rocketFloat = rocketRotate.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
    });

    useEffect(() => {
        // Load all available hackathons
        const hackathonsQuery = query(collection(db, 'hackathons'));
        const unsubscribeHackathons = onSnapshot(hackathonsQuery, (snapshot) => {
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

            setHackathons(hackathonData);
            setLoading(false);
            setRefreshing(false);
        });

        // Load user's registered hackathons
        if (user) {
            const registrationsQuery = query(
                collection(db, 'registrations'),
                where('participantIds', 'array-contains', user.uid)
            );
            const unsubscribeRegistrations = onSnapshot(registrationsQuery, (snapshot) => {
                const registrationData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                }));
                setMyHackathons(registrationData);
            });

            return () => {
                unsubscribeHackathons();
                unsubscribeRegistrations();
            };
        }

        return () => unsubscribeHackathons();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Filter hackathons
    const now = new Date();
    const filteredHackathons = hackathons.filter((h) => {
        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                h.title.toLowerCase().includes(query) ||
                h.description.toLowerCase().includes(query) ||
                h.organizerName.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }
        return true;
    });

    // Categorize hackathons
    const openForRegistration = filteredHackathons.filter(
        (h) => h.schedule.registrationStart <= now && h.schedule.registrationEnd >= now
    );
    const upcomingRegistration = filteredHackathons.filter((h) => h.schedule.registrationStart > now);
    const ongoing = filteredHackathons.filter(
        (h) => h.schedule.eventStart <= now && h.schedule.eventEnd >= now
    );

    const isRegistered = (hackathonId: string) => {
        const registration = myHackathons.find((reg) => reg.hackathonId === hackathonId);
        if (!registration) return { registered: false, status: null };

        // Return status information
        return {
            registered: registration.status === 'pending' || registration.status === 'approved',
            status: registration.status,
            isDraft: registration.status === 'draft',
        };
    };

    const HackathonCard = ({ hackathon }: { hackathon: Hackathon }) => {
        const regStatus = isRegistered(hackathon.id);
        const canRegister =
            hackathon.schedule.registrationStart <= now && hackathon.schedule.registrationEnd >= now;
        const isUpcoming = hackathon.schedule.registrationStart > now;

        const handleCardPress = () => {
            // If it's a draft registration, navigate to registration screen to continue
            if (regStatus.isDraft) {
                navigation.navigate('HackathonRegistration', {
                    hackathonId: hackathon.id,
                    hackathon,
                });
            } else {
                // Otherwise, navigate to detail screen
                navigation.navigate('HackathonDetail', { hackathonId: hackathon.id, hackathon });
            }
        };

        return (
            <TouchableOpacity
                style={[styles.hackathonCard, { backgroundColor: colors.card }]}
                onPress={handleCardPress}
                activeOpacity={0.9}
            >
                {hackathon.posterUrl ? (
                    <Image source={{ uri: hackathon.posterUrl }} style={styles.poster} />
                ) : (
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.poster}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="trophy" size={56} color="#fff" />
                    </LinearGradient>
                )}

                {/* Status Badge Overlay */}
                {regStatus.registered && (
                    <LinearGradient
                        colors={[colors.success, colors.success + 'DD']}
                        style={styles.statusOverlay}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.statusOverlayText}>Registered</Text>
                    </LinearGradient>
                )}

                <View style={styles.cardContent}>
                    <Text style={[styles.hackathonTitle, { color: colors.text }]} numberOfLines={2}>
                        {hackathon.title}
                    </Text>
                    <Text style={[styles.hackathonDescription, { color: colors.icon }]} numberOfLines={2}>
                        {hackathon.description}
                    </Text>

                    <View style={styles.infoRow}>
                        <LinearGradient
                            colors={[colors.success + '15', colors.success + '08']}
                            style={styles.infoBox}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="trophy" size={18} color={colors.success} />
                            <Text style={[styles.infoText, { color: colors.success }]}>
                                ${hackathon.prizePool.toLocaleString()}
                            </Text>
                        </LinearGradient>
                        <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
                            <Ionicons name="calendar" size={16} color={colors.primary} />
                            <Text style={[styles.infoText, { color: colors.text }]}>
                                {formatDate(hackathon.schedule.eventStart)}
                            </Text>
                        </View>
                    </View>

                    {regStatus.isDraft ? (
                        <LinearGradient
                            colors={[colors.warning + '20', colors.warning + '10']}
                            style={styles.actionButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="create" size={18} color={colors.warning} />
                            <Text style={[styles.actionText, { color: colors.warning }]}>
                                Complete Registration
                            </Text>
                        </LinearGradient>
                    ) : !regStatus.registered && isUpcoming ? (
                        <View style={[styles.upcomingBadge, { backgroundColor: colors.secondary + '15' }]}>
                            <Ionicons name="time" size={16} color={colors.secondary} />
                            <Text style={[styles.upcomingText, { color: colors.secondary }]}>
                                Opens {formatDate(hackathon.schedule.registrationStart)}
                            </Text>
                        </View>
                    ) : !regStatus.registered && canRegister ? (
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate('HackathonRegistration', {
                                    hackathonId: hackathon.id,
                                    hackathon,
                                })
                            }
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.registerButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.registerButtonText}>Register Now</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : !regStatus.registered ? (
                        <View style={[styles.closedBadge, { backgroundColor: colors.error + '15' }]}>
                            <Ionicons name="close-circle" size={16} color={colors.error} />
                            <Text style={[styles.closedText, { color: colors.error }]}>
                                Registration Closed
                            </Text>
                        </View>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

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
                <Animated.View style={{ transform: [{ translateY: rocketFloat }] }}>
                    <Ionicons name="rocket" size={56} color="#fff" />
                </Animated.View>
                <Text style={styles.headerTitle}>Discover Hackathons</Text>
                <Text style={styles.headerSubtitle}>Find and join amazing opportunities</Text>
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
                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={22} color={colors.primary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search hackathons..."
                        placeholderTextColor={colors.icon}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={22} color={colors.icon} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* My Registered Hackathons */}
                {myHackathons.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionIconBg, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name="bookmark" size={22} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        My Hackathons ({myHackathons.length})
                                    </Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.icon }]}>
                                        View and manage your registrations
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('MyHackathons')}>
                                <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Open for Registration */}
                {openForRegistration.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionIconBg, { backgroundColor: colors.accent + '20' }]}>
                                <Ionicons name="flash" size={22} color={colors.accent} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Open for Registration ({openForRegistration.length})
                            </Text>
                        </View>
                        {openForRegistration.map((hackathon) => (
                            <HackathonCard key={hackathon.id} hackathon={hackathon} />
                        ))}
                    </View>
                )}

                {/* Ongoing Events */}
                {ongoing.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionIconBg, { backgroundColor: colors.success + '20' }]}>
                                <Ionicons name="play-circle" size={22} color={colors.success} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Ongoing Events ({ongoing.length})
                            </Text>
                        </View>
                        {ongoing.map((hackathon) => (
                            <HackathonCard key={hackathon.id} hackathon={hackathon} />
                        ))}
                    </View>
                )}

                {/* Upcoming */}
                {upcomingRegistration.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionIconBg, { backgroundColor: colors.secondary + '20' }]}>
                                <Ionicons name="time" size={22} color={colors.secondary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Opening Soon ({upcomingRegistration.length})
                            </Text>
                        </View>
                        {upcomingRegistration.map((hackathon) => (
                            <HackathonCard key={hackathon.id} hackathon={hackathon} />
                        ))}
                    </View>
                )}

                {filteredHackathons.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={64} color={colors.icon} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Hackathons Found</Text>
                        <Text style={[styles.emptyText, { color: colors.icon }]}>
                            {searchQuery ? 'Try a different search term' : 'Check back later for new events'}
                        </Text>
                    </View>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 28,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    sectionIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    hackathonCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    poster: {
        width: '100%',
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    statusOverlayText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    cardContent: {
        padding: 20,
    },
    hackathonTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 28,
    },
    hackathonDescription: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 8,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '700',
    },
    registeredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    registeredText: {
        fontSize: 14,
        fontWeight: '600',
    },
    draftBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    draftText: {
        fontSize: 14,
        fontWeight: '600',
    },
    upcomingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 8,
    },
    upcomingText: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        gap: 10,
    },
    registerButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    closedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 8,
    },
    closedText: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
});
