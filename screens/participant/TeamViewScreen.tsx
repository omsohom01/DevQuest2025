import { Ionicons } from '@expo/vector-icons';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface TeamMember {
    email: string;
    name?: string;
    status: 'accepted' | 'pending' | 'rejected';
}

export default function TeamViewScreen({ route, navigation }: any) {
    const { hackathonId, hackathon } = route.params;
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [teamData, setTeamData] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
        const loadTeamData = async () => {
            if (!user?.email) return;

            try {
                // Find registration where user is either leader or participant
                const q = query(
                    collection(db, 'registrations'),
                    where('hackathonId', '==', hackathonId)
                );

                const snapshot = await getDocs(q);
                let foundTeam: any = null;

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    // Check if user is leader or in participantIds
                    if (
                        data.leaderId === user.uid ||
                        data.participantIds?.includes(user.uid)
                    ) {
                        foundTeam = { id: docSnap.id, ...data };
                        break;
                    }
                }

                if (foundTeam) {
                    setTeamData(foundTeam);

                    // Load team member details
                    const members: TeamMember[] = [];

                    // Add leader
                    const leaderDoc = await getDoc(doc(db, 'users', foundTeam.leaderId));
                    if (leaderDoc.exists()) {
                        const leaderData = leaderDoc.data();
                        members.push({
                            email: foundTeam.leaderEmail,
                            name: leaderData.name,
                            status: 'accepted',
                        });
                    }

                    // Load invited members from notifications
                    const notifQuery = query(
                        collection(db, 'notifications'),
                        where('registrationId', '==', foundTeam.id),
                        where('type', '==', 'team_invitation')
                    );

                    const notifSnapshot = await getDocs(notifQuery);
                    for (const notifDoc of notifSnapshot.docs) {
                        const notifData = notifDoc.data();
                        members.push({
                            email: notifData.invitedEmail,
                            name: notifData.invitedEmail.split('@')[0],
                            status: notifData.status,
                        });
                    }

                    setTeamMembers(members);

                    // Set up real-time listener for status changes
                    const unsubscribe = onSnapshot(
                        doc(db, 'registrations', foundTeam.id),
                        (docSnap) => {
                            if (docSnap.exists()) {
                                setTeamData({ id: docSnap.id, ...docSnap.data() });
                            }
                        }
                    );

                    return unsubscribe;
                }
            } catch (error) {
                console.error('Error loading team data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTeamData();
    }, [hackathonId, user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return colors.success;
            case 'rejected':
                return colors.error;
            case 'pending':
                return colors.warning;
            case 'selected':
                return colors.primary;
            default:
                return colors.icon;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accepted':
                return 'checkmark-circle';
            case 'rejected':
                return 'close-circle';
            case 'pending':
                return 'time';
            case 'selected':
                return 'star';
            default:
                return 'help-circle';
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!teamData) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        You are not part of any team for this hackathon
                    </Text>
                </View>
            </View>
        );
    }

    const isLeader = teamData.leaderId === user?.uid;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.card }]}>
                    <Text style={[styles.hackathonTitle, { color: colors.text }]}>
                        {hackathon.title}
                    </Text>
                    <View style={styles.statusBadge}>
                        <Ionicons
                            name={getStatusIcon(teamData.status)}
                            size={20}
                            color={getStatusColor(teamData.status)}
                        />
                        <Text
                            style={[
                                styles.statusText,
                                { color: getStatusColor(teamData.status) },
                            ]}
                        >
                            {teamData.status?.toUpperCase() || 'DRAFT'}
                        </Text>
                    </View>
                </View>

                {/* Team Information */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Team Information
                    </Text>

                    <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: colors.icon }]}>Team Name:</Text>
                        <Text style={[styles.value, { color: colors.text }]}>
                            {teamData.teamName}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: colors.icon }]}>Team Leader:</Text>
                        <Text style={[styles.value, { color: colors.text }]}>
                            {teamData.leaderName || teamData.leaderEmail}
                            {isLeader && ' (You)'}
                        </Text>
                    </View>

                    {teamData.status === 'selected' && teamData.attendanceMarked && (
                        <View style={[styles.attendanceBadge, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={[styles.attendanceText, { color: colors.success }]}>
                                Attendance Confirmed
                            </Text>
                        </View>
                    )}
                </View>

                {/* Team Members */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Team Members ({teamMembers.length}/{hackathon.teamSize.max})
                    </Text>

                    {teamMembers.map((member, index) => (
                        <View
                            key={index}
                            style={[
                                styles.memberCard,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <View style={styles.memberInfo}>
                                <Ionicons name="person" size={20} color={colors.icon} />
                                <View style={styles.memberDetails}>
                                    {member.name && (
                                        <Text style={[styles.memberName, { color: colors.text }]}>
                                            {member.name}
                                        </Text>
                                    )}
                                    <Text style={[styles.memberEmail, { color: colors.icon }]}>
                                        {member.email}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.statusBadgeSmall,
                                    { backgroundColor: getStatusColor(member.status) + '20' },
                                ]}
                            >
                                <Ionicons
                                    name={getStatusIcon(member.status)}
                                    size={16}
                                    color={getStatusColor(member.status)}
                                />
                                <Text
                                    style={[
                                        styles.statusTextSmall,
                                        { color: getStatusColor(member.status) },
                                    ]}
                                >
                                    {member.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Idea Description */}
                {teamData.ideaDescription && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Idea Description
                        </Text>
                        <Text style={[styles.ideaText, { color: colors.text }]}>
                            {teamData.ideaDescription}
                        </Text>
                    </View>
                )}

                {/* Presentation Images */}
                {teamData.presentationImages && teamData.presentationImages.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Presentation Materials
                        </Text>
                        <Text style={[styles.label, { color: colors.icon }]}>
                            {teamData.presentationImages.length} file(s) uploaded
                        </Text>
                    </View>
                )}

                {/* Info Banner */}
                {!isLeader && (
                    <View style={[styles.infoBanner, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.primary }]}>
                            Only the team leader can edit registration details
                        </Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    },
    content: {
        padding: 16,
    },
    header: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    hackathonTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
    },
    attendanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    attendanceText: {
        fontSize: 14,
        fontWeight: '600',
    },
    memberCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    memberDetails: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '600',
    },
    memberEmail: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadgeSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusTextSmall: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    ideaText: {
        fontSize: 14,
        lineHeight: 20,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
