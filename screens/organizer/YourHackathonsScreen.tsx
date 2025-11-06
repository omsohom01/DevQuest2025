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

export default function YourHackathonsScreen({ navigation }: any) {
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

        // Simplified query without orderBy to avoid index requirement
        const q = query(
            collection(db, 'hackathons'),
            where('organizerId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
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

            // Sort by createdAt desc in memory
            hackathonData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

    const HackathonCard = React.memo(({ item, index }: { item: Hackathon; index: number }) => {
        const isUpcoming = item.schedule.eventStart > new Date();
        const isOngoing =
            item.schedule.eventStart <= new Date() && item.schedule.eventEnd >= new Date();
        const isPast = item.schedule.eventEnd < new Date();

        let statusColor = colors.icon;
        let statusText = 'Past';
        let statusIcon = 'checkmark-circle';
        if (isUpcoming) {
            statusColor = colors.secondary;
            statusText = 'Upcoming';
            statusIcon = 'time';
        } else if (isOngoing) {
            statusColor = colors.success;
            statusText = 'Ongoing';
            statusIcon = 'play-circle';
        }

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
                    style={[styles.card, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('HackathonDetail', { hackathonId: item.id })}
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
                        colors={[statusColor + 'EE', statusColor]}
                        style={styles.statusOverlay}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name={statusIcon as any} size={16} color="#fff" />
                        <Text style={styles.statusOverlayText}>{statusText}</Text>
                    </LinearGradient>

                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                        </View>

                        <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>
                            {item.description}
                        </Text>

                        <View style={styles.infoRow}>
                            <View style={[styles.infoItemBox, { backgroundColor: colors.background }]}>
                                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                                <Text style={[styles.infoText, { color: colors.text }]}>
                                    {formatDate(item.schedule.eventStart)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <LinearGradient
                                colors={[colors.success + '20', colors.success + '10']}
                                style={styles.prizeContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="trophy" size={20} color={colors.success} />
                                <Text style={[styles.prizeText, { color: colors.success }]}>
                                    ${item.prizePool.toLocaleString()}
                                </Text>
                            </LinearGradient>

                            <View style={[styles.modeTag, { backgroundColor: colors.background }]}>
                                <Ionicons
                                    name={
                                        item.mode === 'online'
                                            ? 'globe'
                                            : item.mode === 'offline'
                                                ? 'location'
                                                : 'layers'
                                    }
                                    size={16}
                                    color={colors.primary}
                                />
                                <Text style={[styles.modeText, { color: colors.text }]}>
                                    {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                                </Text>
                            </View>
                        </View>

                        {item.tracks.length > 0 && (
                            <View style={[styles.tracksContainer, { backgroundColor: colors.background }]}>
                                <Ionicons name="git-branch" size={14} color={colors.primary} />
                                <Text style={[styles.tracksText, { color: colors.text }]}>
                                    {item.tracks.length} track{item.tracks.length > 1 ? 's' : ''} available
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    });

    const renderHackathonCard = ({ item, index }: { item: Hackathon; index: number }) => {
        return <HackathonCard item={item} index={index} />;
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.icon }]}>Loading hackathons...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {hackathons.length === 0 ? (
                <Animated.View
                    style={[
                        styles.centerContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={[colors.primary + '25', colors.secondary + '25']}
                        style={styles.emptyIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="trophy-outline" size={72} color={colors.primary} />
                    </LinearGradient>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Hackathons Yet</Text>
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                        Create your first hackathon and start building an amazing community!
                    </Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddHackathon')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.addButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.addButtonText}>Create Hackathon</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <>
                    <Animated.View
                        style={{
                            flex: 1,
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }}
                    >
                        <FlatList
                            data={hackathons}
                            renderItem={renderHackathonCard}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={[colors.primary]}
                                />
                            }
                        />
                    </Animated.View>
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => navigation.navigate('AddHackathon')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.fabGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="add" size={32} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </>
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 90,
    },
    card: {
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
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
    cardHeader: {
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        lineHeight: 28,
    },
    description: {
        fontSize: 15,
        marginBottom: 16,
        lineHeight: 22,
    },
    infoRow: {
        marginBottom: 16,
    },
    infoItemBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginBottom: 12,
    },
    prizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    prizeText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    modeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tracksContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    tracksText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyIconContainer: {
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
        marginBottom: 32,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    addButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    addButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
    },
    fabGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
