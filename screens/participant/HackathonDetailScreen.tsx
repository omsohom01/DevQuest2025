import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Hackathon } from '../../types';

export default function HackathonDetailScreen({ route, navigation }: any) {
    const { hackathonId } = route.params;
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [registration, setRegistration] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadHackathon();
        checkRegistration();
    }, [hackathonId, user]);

    const loadHackathon = async () => {
        try {
            const docRef = doc(db, 'hackathons', hackathonId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setHackathon({
                    id: docSnap.id,
                    ...data,
                    schedule: {
                        registrationStart: data.schedule?.registrationStart?.toDate() || new Date(),
                        registrationEnd: data.schedule?.registrationEnd?.toDate() || new Date(),
                        eventStart: data.schedule?.eventStart?.toDate() || new Date(),
                        eventEnd: data.schedule?.eventEnd?.toDate() || new Date(),
                    },
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                } as Hackathon);
            } else {
                Alert.alert('Error', 'Hackathon not found');
                navigation.goBack();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkRegistration = () => {
        if (!user) return;

        // Query for registrations where user is either leader or participant
        const q = query(
            collection(db, 'registrations'),
            where('hackathonId', '==', hackathonId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let foundRegistration = null;

            snapshot.docs.forEach((regDoc) => {
                const data = regDoc.data();
                // Check if user is leader or in participantIds
                if (data.leaderId === user.uid || data.participantIds?.includes(user.uid)) {
                    foundRegistration = {
                        id: regDoc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || new Date(),
                    };
                }
            });

            setRegistration(foundRegistration);
        });

        return unsubscribe;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatShortDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.icon }]}>Loading details...</Text>
            </View>
        );
    }

    if (!hackathon) {
        return null;
    }

    const now = new Date();
    const canRegister =
        hackathon.schedule.registrationStart <= now && hackathon.schedule.registrationEnd >= now;
    const isUpcoming = hackathon.schedule.registrationStart > now;
    const isRegistrationClosed = hackathon.schedule.registrationEnd < now;
    const isEventOngoing = hackathon.schedule.eventStart <= now && hackathon.schedule.eventEnd >= now;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Image */}
            {hackathon.posterUrl ? (
                <Image source={{ uri: hackathon.posterUrl }} style={styles.headerImage} />
            ) : (
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.headerImage}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="trophy" size={80} color="#fff" />
                </LinearGradient>
            )}

            <View style={styles.content}>
                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>{hackathon.title}</Text>

                {/* Organizer */}
                <View style={styles.organizerRow}>
                    <Ionicons name="person-circle-outline" size={20} color={colors.icon} />
                    <Text style={[styles.organizerText, { color: colors.icon }]}>
                        Organized by {hackathon.organizerName}
                    </Text>
                </View>

                {/* Registration Status */}
                {registration ? (
                    registration.status === 'draft' ? (
                        // Draft Registration - Incomplete
                        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
                            <View style={[styles.statusHeader, { backgroundColor: colors.warning + '20' }]}>
                                <Ionicons name="create-outline" size={24} color={colors.warning} />
                                <Text style={[styles.statusTitle, { color: colors.warning }]}>
                                    Registration Incomplete
                                </Text>
                            </View>
                            <View style={styles.statusContent}>
                                <View style={styles.statusRow}>
                                    <Text style={[styles.statusLabel, { color: colors.icon }]}>Team Name:</Text>
                                    <Text style={[styles.statusValue, { color: colors.text }]}>
                                        {registration.teamName || 'Not set'}
                                    </Text>
                                </View>
                                {registration.leaderId === user?.uid && (
                                    <Text style={[styles.infoText, { color: colors.icon }]}>
                                        You can still invite team members or submit your registration.
                                    </Text>
                                )}
                                <TouchableOpacity
                                    style={[styles.continueButton, { backgroundColor: colors.warning }]}
                                    onPress={() =>
                                        navigation.navigate('HackathonRegistration', {
                                            hackathonId,
                                            hackathon,
                                        })
                                    }
                                >
                                    <Ionicons name="create" size={20} color="#fff" />
                                    <Text style={styles.continueButtonText}>
                                        Continue Registration
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        // Completed Registration
                        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
                            <View style={[styles.statusHeader, { backgroundColor: colors.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                <Text style={[styles.statusTitle, { color: colors.success }]}>
                                    You're Registered!
                                </Text>
                            </View>
                            <View style={styles.statusContent}>
                                <View style={styles.statusRow}>
                                    <Text style={[styles.statusLabel, { color: colors.icon }]}>Team Name:</Text>
                                    <Text style={[styles.statusValue, { color: colors.text }]}>
                                        {registration.teamName}
                                    </Text>
                                </View>
                                <View style={styles.statusRow}>
                                    <Text style={[styles.statusLabel, { color: colors.icon }]}>Role:</Text>
                                    <Text style={[styles.statusValue, { color: colors.text }]}>
                                        {registration.leaderId === user?.uid ? 'Team Lead' : 'Team Member'}
                                    </Text>
                                </View>
                                <View style={styles.statusRow}>
                                    <Text style={[styles.statusLabel, { color: colors.icon }]}>
                                        Registration Status:
                                    </Text>
                                    <View
                                        style={[
                                            styles.approvalBadge,
                                            {
                                                backgroundColor:
                                                    registration.status === 'selected'
                                                        ? colors.success + '20'
                                                        : registration.status === 'approved'
                                                            ? colors.success + '20'
                                                            : colors.warning + '20',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.approvalText,
                                                {
                                                    color:
                                                        registration.status === 'selected'
                                                            ? colors.success
                                                            : registration.status === 'approved'
                                                                ? colors.success
                                                                : colors.warning,
                                                },
                                            ]}
                                        >
                                            {registration.status === 'selected'
                                                ? '✨ Team Selected!'
                                                : registration.status === 'approved'
                                                    ? 'Approved'
                                                    : 'Pending Approval'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.statusRow}>
                                    <Text style={[styles.statusLabel, { color: colors.icon }]}>
                                        Registered On:
                                    </Text>
                                    <Text style={[styles.statusValue, { color: colors.text }]}>
                                        {formatShortDate(registration.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )
                ) : canRegister ? (
                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: colors.primary }]}
                        onPress={() =>
                            navigation.navigate('HackathonRegistration', {
                                hackathonId: hackathon.id,
                                hackathon,
                            })
                        }
                    >
                        <Ionicons name="person-add" size={24} color="#fff" />
                        <Text style={styles.registerButtonText}>Register for this Hackathon</Text>
                    </TouchableOpacity>
                ) : isUpcoming ? (
                    <View style={[styles.infoBanner, { backgroundColor: colors.secondary + '20' }]}>
                        <Ionicons name="time" size={24} color={colors.secondary} />
                        <View style={styles.infoBannerContent}>
                            <Text style={[styles.infoBannerTitle, { color: colors.secondary }]}>
                                Registration Opens Soon
                            </Text>
                            <Text style={[styles.infoBannerText, { color: colors.icon }]}>
                                Registration starts on {formatShortDate(hackathon.schedule.registrationStart)}
                            </Text>
                        </View>
                    </View>
                ) : isRegistrationClosed ? (
                    <View style={[styles.infoBanner, { backgroundColor: colors.error + '20' }]}>
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                        <View style={styles.infoBannerContent}>
                            <Text style={[styles.infoBannerTitle, { color: colors.error }]}>
                                Registration Closed
                            </Text>
                            <Text style={[styles.infoBannerText, { color: colors.icon }]}>
                                Registration ended on {formatShortDate(hackathon.schedule.registrationEnd)}
                            </Text>
                        </View>
                    </View>
                ) : null}

                {/* Description */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                    <Text style={[styles.description, { color: colors.icon }]}>{hackathon.description}</Text>
                </View>

                {/* Key Details */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Details</Text>

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="cash-outline" size={24} color={colors.success} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Total Prize Pool</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                ${hackathon.prizePool.toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: colors.secondary + '20' }]}>
                            <Ionicons name="people-outline" size={24} color={colors.secondary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Team Size</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                {hackathon.teamSize.min} - {hackathon.teamSize.max} members
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={[styles.detailIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons
                                name={
                                    hackathon.mode === 'online'
                                        ? 'globe-outline'
                                        : hackathon.mode === 'offline'
                                            ? 'location-outline'
                                            : 'layers-outline'
                                }
                                size={24}
                                color={colors.primary}
                            />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Mode</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                {hackathon.mode.charAt(0).toUpperCase() + hackathon.mode.slice(1)}
                            </Text>
                        </View>
                    </View>

                    {hackathon.venue && (
                        <View style={styles.detailRow}>
                            <View style={[styles.detailIcon, { backgroundColor: colors.accent + '20' }]}>
                                <Ionicons name="navigate-outline" size={24} color={colors.accent} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={[styles.detailLabel, { color: colors.icon }]}>Venue</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {hackathon.venue}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Schedule */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Important Dates</Text>

                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: colors.secondary }]} />
                        <View style={styles.timelineContent}>
                            <Text style={[styles.timelineLabel, { color: colors.icon }]}>
                                Registration Opens
                            </Text>
                            <Text style={[styles.timelineDate, { color: colors.text }]}>
                                {formatDate(hackathon.schedule.registrationStart)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: colors.secondary }]} />
                        <View style={styles.timelineContent}>
                            <Text style={[styles.timelineLabel, { color: colors.icon }]}>
                                Registration Closes
                            </Text>
                            <Text style={[styles.timelineDate, { color: colors.text }]}>
                                {formatDate(hackathon.schedule.registrationEnd)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                        <View style={styles.timelineContent}>
                            <Text style={[styles.timelineLabel, { color: colors.icon }]}>Event Starts</Text>
                            <Text style={[styles.timelineDate, { color: colors.text }]}>
                                {formatDate(hackathon.schedule.eventStart)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                        <View style={styles.timelineContent}>
                            <Text style={[styles.timelineLabel, { color: colors.icon }]}>Event Ends</Text>
                            <Text style={[styles.timelineDate, { color: colors.text }]}>
                                {formatDate(hackathon.schedule.eventEnd)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tracks */}
                {hackathon.tracks && hackathon.tracks.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Tracks & Prizes
                        </Text>
                        {hackathon.tracks.map((track, index) => (
                            <View key={index} style={styles.trackCard}>
                                <View style={styles.trackHeader}>
                                    <View
                                        style={[
                                            styles.trackNumber,
                                            { backgroundColor: colors.primary + '20' },
                                        ]}
                                    >
                                        <Text style={[styles.trackNumberText, { color: colors.primary }]}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <View style={styles.trackInfo}>
                                        <Text style={[styles.trackName, { color: colors.text }]}>
                                            {track.name}
                                        </Text>
                                        <View style={styles.trackPrize}>
                                            <Ionicons name="trophy" size={16} color={colors.success} />
                                            <Text style={[styles.trackPrizeText, { color: colors.success }]}>
                                                ${(track.prizePool || 0).toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                {track.description && (
                                    <Text style={[styles.trackDescription, { color: colors.icon }]}>
                                        {track.description}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </View>
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
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    headerImage: {
        width: '100%',
        height: 250,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    organizerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
    },
    organizerText: {
        fontSize: 14,
    },
    statusCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusContent: {
        padding: 16,
        gap: 12,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 14,
    },
    statusValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    approvalBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    approvalText: {
        fontSize: 13,
        fontWeight: '600',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        marginBottom: 16,
        gap: 12,
    },
    registerButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        marginTop: 12,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 12,
        fontStyle: 'italic',
    },
    infoBanner: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        gap: 12,
    },
    infoBannerContent: {
        flex: 1,
    },
    infoBannerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    infoBannerText: {
        fontSize: 14,
    },
    section: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        marginRight: 12,
    },
    timelineContent: {
        flex: 1,
    },
    timelineLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    timelineDate: {
        fontSize: 16,
        fontWeight: '600',
    },
    trackCard: {
        marginBottom: 16,
    },
    trackHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    trackNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    trackNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    trackInfo: {
        flex: 1,
    },
    trackName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    trackPrize: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trackPrizeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    trackDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 44,
    },
});
