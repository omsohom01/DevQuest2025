import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    RefreshControl,
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

export default function JudgeMyHackathonsScreen({ navigation }: any) {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
    }, []);

    useEffect(() => {
        if (!user) return;

        // Get all hackathons where the judge is assigned with real-time updates
        const q = query(
            collection(db, 'hackathons'),
            where('judges', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const hackathonData: Hackathon[] = snapshot.docs.map((doc) => {
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
                } as Hackathon;
            });

            // Sort by event start date (most recent first)
            hackathonData.sort((a, b) => b.schedule.eventStart.getTime() - a.schedule.eventStart.getTime());

            setHackathons(hackathonData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [user]);

    const loadHackathons = () => {
        // This function is now handled by the real-time listener above
        // Keep it for the refresh functionality
        setRefreshing(true);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadHackathons();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getHackathonStatus = (hackathon: Hackathon) => {
        const now = new Date();
        if (now < hackathon.schedule.eventStart) {
            return { label: 'Upcoming', color: colors.secondary };
        } else if (now >= hackathon.schedule.eventStart && now <= hackathon.schedule.eventEnd) {
            return { label: 'Ongoing', color: colors.success };
        } else {
            return { label: 'Completed', color: colors.icon };
        }
    };

    const HackathonCard = React.memo(({ item, index }: { item: Hackathon; index: number }) => {
        const status = getHackathonStatus(item);
        const cardAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(cardAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 80,
                useNativeDriver: true,
            }).start();
        }, []);

        return (
            <Animated.View
                style={{
                    opacity: cardAnim,
                    transform: [
                        {
                            translateY: cardAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            }),
                        },
                    ],
                }}
            >
                <TouchableOpacity
                    style={[styles.hackathonCard, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('JudgeHackathonDetail', { hackathonId: item.id, hackathon: item })}
                    activeOpacity={0.9}
                >
                    {item.posterUrl ? (
                        <Image source={{ uri: item.posterUrl }} style={styles.poster} />
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
                    <LinearGradient
                        colors={[status.color, status.color + 'DD']}
                        style={styles.statusOverlay}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons
                            name={status.label === 'Ongoing' ? 'play-circle' : status.label === 'Upcoming' ? 'time' : 'checkmark-circle'}
                            size={16}
                            color="#fff"
                        />
                        <Text style={styles.statusOverlayText}>{status.label}</Text>
                    </LinearGradient>

                    <View style={styles.cardContent}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                            {item.title}
                        </Text>

                        <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>
                            {item.description}
                        </Text>

                        <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
                            <Ionicons name="calendar" size={16} color={colors.primary} />
                            <Text style={[styles.infoText, { color: colors.text }]}>
                                {formatDate(item.schedule.eventStart)} - {formatDate(item.schedule.eventEnd)}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <LinearGradient
                                colors={[colors.success + '15', colors.success + '08']}
                                style={styles.prizeBox}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="trophy" size={18} color={colors.success} />
                                <Text style={[styles.prizeText, { color: colors.success }]}>
                                    ${item.prizePool.toLocaleString()}
                                </Text>
                            </LinearGradient>
                            <View style={[styles.organizerBox, { backgroundColor: colors.background }]}>
                                <Ionicons name="person" size={16} color={colors.icon} />
                                <Text style={[styles.organizerText, { color: colors.icon }]} numberOfLines={1}>
                                    {item.organizerName}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.viewButton, { backgroundColor: colors.primary + '10' }]}>
                            <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details & Evaluate</Text>
                            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    });

    const renderHackathonItem = ({ item, index }: { item: Hackathon; index: number }) => {
        return <HackathonCard item={item} index={index} />;
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {hackathons.length > 0 ? (
                <Animated.View
                    style={{
                        flex: 1,
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }}
                >
                    <FlatList
                        data={hackathons}
                        renderItem={renderHackathonItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                        }
                    />
                </Animated.View>
            ) : (
                <Animated.View
                    style={[
                        styles.emptyContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={[colors.primary + '20', colors.secondary + '20']}
                        style={styles.emptyIconBg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="trophy" size={72} color={colors.primary} />
                    </LinearGradient>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Hackathons Yet</Text>
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                        You haven't been assigned to any hackathons as a judge yet.
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                        Check your notifications for judge invitations!
                    </Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
    },
    hackathonCard: {
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 28,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    prizeBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    prizeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    organizerBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    organizerText: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 8,
    },
    viewButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    arrowContainer: {
        justifyContent: 'center',
        paddingRight: 12,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyIconBg: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    emptyTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 4,
    },
});
