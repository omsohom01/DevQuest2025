import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
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
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Hackathon } from '../../types';

export default function HackathonDetailScreen({ route, navigation }: any) {
    const { hackathonId } = route.params;
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const [totalReviewed, setTotalReviewed] = useState(0);
    const [pending, setPending] = useState(0);
    const [selected, setSelected] = useState(0);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadHackathon();

        // Subscribe to registrations for this hackathon (all statuses except draft)
        const registrationsQuery = query(
            collection(db, 'registrations'),
            where('hackathonId', '==', hackathonId)
        );

        const unsubscribe = onSnapshot(registrationsQuery, (snapshot) => {
            // Filter out draft registrations
            const validRegistrations = snapshot.docs.filter(doc => doc.data().status !== 'draft');

            setTotalSubmissions(validRegistrations.length); // Total submitted teams

            let pendingCount = 0;
            let reviewedCount = 0;
            let selectedCount = 0;

            validRegistrations.forEach((doc) => {
                const data = doc.data();

                // Pending: submitted but not yet evaluated by judge
                if (!data.evaluatedBy && data.status === 'pending') {
                    pendingCount++;
                }

                // Reviewed: evaluated by judge but not yet selected by organizer
                if (data.evaluatedBy && data.status === 'pending') {
                    reviewedCount++;
                }

                // Selected: organizer approved as winner
                if (data.status === 'selected') {
                    selectedCount++;
                }
            });

            setPending(pendingCount);
            setTotalReviewed(reviewedCount);
            setSelected(selectedCount);
        });

        return () => unsubscribe();
    }, [hackathonId]);

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

    const handleDelete = () => {
        Alert.alert(
            'Delete Hackathon',
            'Are you sure you want to delete this hackathon? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'hackathons', hackathonId));
                            Alert.alert('Success', 'Hackathon deleted successfully');
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
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

    const isUpcoming = hackathon.schedule.eventStart > new Date();
    const isOngoing =
        hackathon.schedule.eventStart <= new Date() && hackathon.schedule.eventEnd >= new Date();
    const isPast = hackathon.schedule.eventEnd < new Date();

    let statusColor = colors.icon;
    let statusText = 'Past';
    let statusIcon: any = 'checkmark-circle';
    if (isUpcoming) {
        statusColor = colors.secondary;
        statusText = 'Upcoming';
        statusIcon = 'time';
    } else if (isOngoing) {
        statusColor = colors.success;
        statusText = 'Ongoing';
        statusIcon = 'play-circle';
    }

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

            {/* Content */}
            <View style={styles.content}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={statusIcon} size={20} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>{hackathon.title}</Text>

                {/* Organizer */}
                <View style={styles.organizerRow}>
                    <Ionicons name="person-circle-outline" size={20} color={colors.icon} />
                    <Text style={[styles.organizerText, { color: colors.icon }]}>
                        Organized by {hackathon.organizerName}
                    </Text>
                </View>

                {/* Submission Statistics */}
                <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
                    <View style={styles.statsSectionHeader}>
                        <Ionicons name="stats-chart" size={24} color={colors.primary} />
                        <Text style={[styles.statsSectionTitle, { color: colors.text }]}>
                            Team Statistics
                        </Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.primary }]}
                            onPress={() => {
                                navigation.navigate('TeamList', {
                                    hackathonId,
                                    filter: 'all'
                                });
                            }}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.statIconContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="documents" size={28} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.statValue, { color: colors.text }]}>{totalSubmissions}</Text>
                            <Text style={[styles.statLabel, { color: colors.icon }]}>Total Teams</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.background, borderColor: '#f59e0b' }]}
                            onPress={() => {
                                navigation.navigate('TeamList', {
                                    hackathonId,
                                    filter: 'pending'
                                });
                            }}
                        >
                            <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b' }]}>
                                <Ionicons name="time" size={28} color="#fff" />
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{pending}</Text>
                            <Text style={[styles.statLabel, { color: colors.icon }]}>Pending Review</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsGrid}>
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.success }]}
                            onPress={() => {
                                navigation.navigate('TeamList', {
                                    hackathonId,
                                    filter: 'reviewed'
                                });
                            }}
                        >
                            <LinearGradient
                                colors={[colors.success, '#34d399']}
                                style={styles.statIconContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="checkmark-done" size={28} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.statValue, { color: colors.text }]}>{totalReviewed}</Text>
                            <Text style={[styles.statLabel, { color: colors.icon }]}>Reviewed</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.accent }]}
                            onPress={() => {
                                navigation.navigate('TeamList', {
                                    hackathonId,
                                    filter: 'selected'
                                });
                            }}
                        >
                            <View style={[styles.statIconContainer, { backgroundColor: colors.accent }]}>
                                <Ionicons name="trophy" size={28} color="#fff" />
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{selected}</Text>
                            <Text style={[styles.statLabel, { color: colors.icon }]}>Selected</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.icon }]}>
                            Tap any box above to view and manage teams
                        </Text>
                    </View>
                </View>

                {/* Attendance Section (for offline hackathons) */}
                {hackathon.mode === 'offline' && (
                    <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
                        <View style={styles.statsSectionHeader}>
                            <Ionicons name="people" size={24} color={colors.primary} />
                            <Text style={[styles.statsSectionTitle, { color: colors.text }]}>
                                Attendance Management
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.scannerButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                navigation.navigate('QRScanner', {
                                    hackathonId,
                                    hackathonTitle: hackathon.title
                                });
                            }}
                        >
                            <Ionicons name="scan" size={28} color="#fff" />
                            <View style={styles.scannerButtonText}>
                                <Text style={styles.scannerTitle}>Scan QR Code</Text>
                                <Text style={styles.scannerSubtitle}>Mark team attendance</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.attendanceButton, { backgroundColor: colors.success }]}
                            onPress={() => {
                                navigation.navigate('AttendanceList', {
                                    hackathonId
                                });
                            }}
                        >
                            <Ionicons name="checkmark-done" size={28} color="#fff" />
                            <View style={styles.attendanceButtonText}>
                                <Text style={styles.attendanceTitle}>View Attendance</Text>
                                <Text style={styles.attendanceSubtitle}>See teams who checked in</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

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
                                <Text style={[styles.detailValue, { color: colors.text }]}>{hackathon.venue}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Schedule */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>

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
                        <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                        <View style={styles.timelineContent}>
                            <Text style={[styles.timelineLabel, { color: colors.icon }]}>Event Ends</Text>
                            <Text style={[styles.timelineDate, { color: colors.text }]}>
                                {formatDate(hackathon.schedule.eventEnd)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tracks */}
                {hackathon.tracks.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracks</Text>
                        {hackathon.tracks.map((track, index) => (
                            <View key={track.id} style={styles.trackCard}>
                                <View style={styles.trackHeader}>
                                    <View style={[styles.trackNumber, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[styles.trackNumberText, { color: colors.primary }]}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <View style={styles.trackInfo}>
                                        <Text style={[styles.trackName, { color: colors.text }]}>{track.name}</Text>
                                        {track.prizePool && (
                                            <View style={styles.trackPrize}>
                                                <Ionicons name="trophy" size={14} color={colors.success} />
                                                <Text style={[styles.trackPrizeText, { color: colors.success }]}>
                                                    ${track.prizePool.toLocaleString()}
                                                </Text>
                                            </View>
                                        )}
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

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() =>
                            navigation.navigate('InviteJudges', { hackathonId, hackathon })
                        }
                    >
                        <Ionicons name="people" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Invite Judges</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
                        onPress={handleDelete}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                        <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete Hackathon</Text>
                    </TouchableOpacity>
                </View>
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
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
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
    actions: {
        marginTop: 8,
        marginBottom: 32,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    statsSection: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    statsSectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    statIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    infoText: {
        fontSize: 13,
        flex: 1,
    },
    viewSubmissionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    viewSubmissionsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    scannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        gap: 16,
    },
    scannerButtonText: {
        flex: 1,
    },
    scannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    scannerSubtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    attendanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        gap: 16,
    },
    attendanceButtonText: {
        flex: 1,
    },
    attendanceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    attendanceSubtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
});
