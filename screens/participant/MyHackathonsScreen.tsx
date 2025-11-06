import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function MyHackathonsScreen({ navigation }: any) {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [hackathons, setHackathons] = useState<any>({});
    const [submissions, setSubmissions] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        if (!user) return;

        // Load user's registrations
        const registrationsQuery = query(
            collection(db, 'registrations'),
            where('participantIds', 'array-contains', user.uid)
        );

        const unsubscribeRegistrations = onSnapshot(registrationsQuery, async (snapshot) => {
            const registrationData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    hackathonId: data.hackathonId || '',
                    teamName: data.teamName || '',
                    leaderId: data.leaderId || '',
                    participantIds: data.participantIds || [],
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
                    evaluatedAt: data.evaluatedAt?.toDate?.() || null,
                    // Remove presentationImages from navigation params (too large)
                    presentationImages: undefined,
                };
            });

            setRegistrations(registrationData);

            // Load hackathon details for each registration
            const hackathonIds = [...new Set(registrationData.map((r) => r.hackathonId))];
            const hackathonData: any = {};

            for (const hackathonId of hackathonIds) {
                const hackathonQuery = query(
                    collection(db, 'hackathons'),
                    where('__name__', '==', hackathonId)
                );
                const hackathonSnapshot = await new Promise((resolve) => {
                    const unsub = onSnapshot(hackathonQuery, (snap) => {
                        resolve(snap);
                        unsub();
                    });
                });
                const hackathonDoc: any = (hackathonSnapshot as any).docs[0];
                if (hackathonDoc) {
                    const data = hackathonDoc.data();
                    hackathonData[hackathonId] = {
                        id: hackathonDoc.id,
                        ...data,
                        schedule: {
                            registrationStart: data.schedule?.registrationStart?.toDate() || new Date(),
                            registrationEnd: data.schedule?.registrationEnd?.toDate() || new Date(),
                            eventStart: data.schedule?.eventStart?.toDate() || new Date(),
                            eventEnd: data.schedule?.eventEnd?.toDate() || new Date(),
                        },
                    };
                }
            }

            setHackathons(hackathonData);
            setLoading(false);
            setRefreshing(false);
        });

        // Load submissions for registered hackathons
        const submissionsQuery = query(
            collection(db, 'submissions'),
            where('participantIds', 'array-contains', user.uid)
        );

        const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
            const submissionData: any = {};
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                submissionData[data.hackathonId] = {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                };
            });
            setSubmissions(submissionData);
        });

        return () => {
            unsubscribeRegistrations();
            unsubscribeSubmissions();
        };
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderRegistrationItem = ({ item }: { item: any }) => {
        const hackathon = hackathons[item.hackathonId];
        if (!hackathon) return null;

        const submission = submissions[item.hackathonId];
        const now = new Date();
        const isEventOngoing =
            hackathon.schedule.eventStart <= now && hackathon.schedule.eventEnd >= now;
        const isEventUpcoming = hackathon.schedule.eventStart > now;
        const isEventPast = hackathon.schedule.eventEnd < now;

        let statusColor = colors.icon;
        let statusText = 'Completed';
        let statusIcon: any = 'checkmark-circle';

        if (isEventUpcoming) {
            statusColor = colors.secondary;
            statusText = 'Upcoming';
            statusIcon = 'time';
        } else if (isEventOngoing) {
            statusColor = colors.success;
            statusText = 'Ongoing';
            statusIcon = 'play-circle';
        }

        return (
            <TouchableOpacity
                style={[styles.registrationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                    // Navigate to HackathonDetail screen with hackathonId
                    navigation.navigate('HackathonDetail', {
                        hackathonId: item.hackathonId,
                    });
                }}
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
                        <Ionicons name="trophy" size={32} color="#fff" />
                    </LinearGradient>
                )}

                <View style={styles.cardContent}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.hackathonTitle, { color: colors.text }]} numberOfLines={2}>
                            {hackathon.title}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <Ionicons name={statusIcon} size={14} color={statusColor} />
                            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                        </View>
                    </View>

                    <View style={styles.teamInfo}>
                        <Ionicons name="people" size={16} color={colors.primary} />
                        <Text style={[styles.teamName, { color: colors.text }]}>{item.teamName}</Text>
                        <Text style={[styles.teamRole, { color: colors.icon }]}>
                            {item.leaderId === user?.uid ? '(Team Lead)' : '(Member)'}
                        </Text>
                    </View>

                    {/* Member Approval Status */}
                    {!item.allMembersApproved && item.participantEmails && item.participantEmails.length > 0 && item.status !== 'selected' && (
                        <View style={[styles.approvalAlert, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="alert-circle" size={16} color={colors.warning} />
                            <Text style={[styles.approvalText, { color: colors.warning }]}>
                                Waiting for team member approvals
                            </Text>
                        </View>
                    )}

                    {/* Selected Status with Gradient */}
                    {item.status === 'selected' && (
                        <LinearGradient
                            colors={[colors.success + '25', colors.success + '15']}
                            style={styles.selectedBadge}
                        >
                            <View style={[styles.trophyIconBg, { backgroundColor: colors.success + '30' }]}>
                                <Ionicons name="trophy" size={22} color={colors.success} />
                            </View>
                            <Text style={[styles.selectedText, { color: colors.success }]}>
                                ✨ TEAM SELECTED! ✨
                            </Text>
                        </LinearGradient>
                    )}

                    {/* Attendance QR Code Button (for selected teams in offline hackathons) */}
                    {item.status === 'selected' && item.attendanceQRCode && item.leaderId === user?.uid && (
                        <TouchableOpacity
                            style={[styles.qrButton, {
                                backgroundColor: item.attendanceMarked ? colors.success : colors.primary
                            }]}
                            onPress={() => navigation.navigate('AttendanceQR', {
                                registrationId: item.id,
                                teamName: item.teamName,
                            })}
                        >
                            <Ionicons
                                name={item.attendanceMarked ? "checkmark-circle" : "qr-code"}
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.qrButtonText}>
                                {item.attendanceMarked ? 'Attendance Marked ✓' : 'Show Attendance QR'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={14} color={colors.icon} />
                            <Text style={[styles.infoText, { color: colors.icon }]}>
                                {formatDate(hackathon.schedule.eventStart)}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="cash-outline" size={14} color={colors.success} />
                            <Text style={[styles.infoText, { color: colors.success }]}>
                                ${hackathon.prizePool.toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {submission ? (
                        <View style={[styles.submittedBadge, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="checkmark-done" size={16} color={colors.success} />
                            <Text style={[styles.submittedText, { color: colors.success }]}>
                                Project Submitted
                            </Text>
                        </View>
                    ) : isEventOngoing ? (
                        item.allMembersApproved ? (
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.accent }]}
                                onPress={() =>
                                    navigation.navigate('SubmitProject', {
                                        registration: item,
                                        hackathon,
                                    })
                                }
                            >
                                <Ionicons name="cloud-upload" size={16} color="#fff" />
                                <Text style={styles.submitButtonText}>Submit Project</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.disabledButton, { backgroundColor: colors.icon + '20' }]}>
                                <Ionicons name="lock-closed" size={16} color={colors.icon} />
                                <Text style={[styles.disabledButtonText, { color: colors.icon }]}>
                                    Submission Locked
                                </Text>
                            </View>
                        )
                    ) : isEventUpcoming ? (
                        <Text style={[styles.waitingText, { color: colors.icon }]}>
                            Event starts {formatDate(hackathon.schedule.eventStart)}
                        </Text>
                    ) : (
                        <Text style={[styles.waitingText, { color: colors.icon }]}>No submission made</Text>
                    )}
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={registrations}
                renderItem={renderRegistrationItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={colors.icon} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            No Registered Hackathons
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.icon }]}>
                            Browse and register for hackathons from the dashboard
                        </Text>
                        <TouchableOpacity
                            style={[styles.browseButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('ParticipantDashboard')}
                        >
                            <Text style={styles.browseButtonText}>Browse Hackathons</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
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
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    registrationCard: {
        flexDirection: 'row',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    poster: {
        width: 120,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    hackathonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    teamName: {
        fontSize: 15,
        fontWeight: '600',
    },
    teamRole: {
        fontSize: 13,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 13,
    },
    approvalAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 6,
        gap: 6,
        marginBottom: 8,
    },
    approvalText: {
        fontSize: 12,
        fontWeight: '600',
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    trophyIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedText: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    qrButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginBottom: 8,
    },
    qrButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    submittedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    submittedText: {
        fontSize: 13,
        fontWeight: '600',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    disabledButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    disabledButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    waitingText: {
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        marginBottom: 24,
    },
    browseButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
