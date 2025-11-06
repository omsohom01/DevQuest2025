import { Ionicons } from '@expo/vector-icons';
import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface Notification {
    id: string;
    type: 'team_invitation' | 'team_selected' | 'attendance_marked';
    registrationId?: string;
    hackathonId: string;
    hackathonTitle: string;
    teamName: string;
    leaderId?: string;
    leaderName?: string;
    leaderEmail?: string;
    invitedEmail: string;
    status?: 'pending' | 'accepted' | 'rejected';
    read?: boolean;
    createdAt: Date;
    message?: string;
}

export default function NotificationsScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.email) return;

        const q = query(
            collection(db, 'notifications'),
            where('invitedEmail', '==', user.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Notification[];

            // Sort by date, newest first
            notifData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setNotifications(notifData);
            setLoading(false);

            // Mark non-invitation notifications as read
            snapshot.docs.forEach(async (docSnap) => {
                const data = docSnap.data();
                if (data.type !== 'team_invitation' && !data.read) {
                    await updateDoc(doc(db, 'notifications', docSnap.id), { read: true });
                }
            });
        });

        return unsubscribe;
    }, [user]);

    const handleAccept = async (notification: Notification) => {
        try {
            setProcessingId(notification.id);

            if (!notification.registrationId) {
                Alert.alert('Error', 'Invalid notification data');
                setProcessingId(null);
                return;
            }

            // Update notification status
            await updateDoc(doc(db, 'notifications', notification.id), {
                status: 'accepted',
            });

            // Add user to registration's participantIds
            const regRef = doc(db, 'registrations', notification.registrationId);
            await updateDoc(regRef, {
                participantIds: arrayUnion(user!.uid),
                [`memberApprovals.${user!.email}`]: true,
            });

            // Check if all members have approved
            const regDoc = await getDoc(regRef);
            const regData = regDoc.data();
            if (regData) {
                const participantEmails = regData.participantEmails || [];
                const memberApprovals = regData.memberApprovals || {};

                // Check if all invited members have approved
                const allApproved = participantEmails.every(
                    (email: string) => memberApprovals[email] === true
                );

                if (allApproved) {
                    // All members approved, update registration status
                    await updateDoc(regRef, {
                        allMembersApproved: true,
                    });
                }
            }

            Alert.alert('Success', `You've joined ${notification.teamName}!`);
        } catch (error: any) {
            console.error('Accept error:', error);
            Alert.alert('Error', error.message || 'Failed to accept invitation');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (notification: Notification) => {
        Alert.alert(
            'Reject Invitation',
            `Are you sure you want to reject the invitation to join ${notification.teamName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingId(notification.id);

                            if (!notification.registrationId) {
                                Alert.alert('Error', 'Invalid notification data');
                                setProcessingId(null);
                                return;
                            }

                            // Update notification status
                            await updateDoc(doc(db, 'notifications', notification.id), {
                                status: 'rejected',
                            });

                            // Update registration to mark rejection
                            await updateDoc(doc(db, 'registrations', notification.registrationId), {
                                [`memberApprovals.${user!.email}`]: false,
                            });

                            Alert.alert('Invitation Rejected', 'You have declined the team invitation.');
                        } catch (error: any) {
                            console.error('Reject error:', error);
                            Alert.alert('Error', error.message || 'Failed to reject invitation');
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    };

    const renderNotification = ({ item }: { item: Notification }) => {
        const isPending = item.status === 'pending';
        const isProcessing = processingId === item.id;

        // Different rendering for different notification types
        if (item.type === 'team_selected') {
            return (
                <View style={[styles.notificationCard, { backgroundColor: colors.card }]}>
                    <View style={styles.notificationHeader}>
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: colors.success + '20' },
                            ]}
                        >
                            <Ionicons name="star" size={28} color={colors.success} />
                        </View>
                        <View style={styles.notificationContent}>
                            <Text style={[styles.notificationTitle, { color: colors.text }]}>
                                Team Selected! 🎉
                            </Text>
                            <Text style={[styles.notificationTime, { color: colors.icon }]}>
                                {item.createdAt.toLocaleDateString()} at{' '}
                                {item.createdAt.toLocaleTimeString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.notificationBody}>
                        <Text style={[styles.notificationText, { color: colors.text }]}>
                            Congratulations! Your team{' '}
                            <Text style={[styles.teamName, { color: colors.primary }]}>
                                {item.teamName}
                            </Text>{' '}
                            has been selected for{' '}
                            <Text style={[styles.hackathonTitle, { color: colors.secondary }]}>
                                {item.hackathonTitle}
                            </Text>
                        </Text>
                        {item.message && (
                            <Text style={[styles.notificationMessage, { color: colors.icon }]}>
                                {item.message}
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        if (item.type === 'attendance_marked') {
            return (
                <View style={[styles.notificationCard, { backgroundColor: colors.card }]}>
                    <View style={styles.notificationHeader}>
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: colors.primary + '20' },
                            ]}
                        >
                            <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.notificationContent}>
                            <Text style={[styles.notificationTitle, { color: colors.text }]}>
                                Attendance Confirmed ✓
                            </Text>
                            <Text style={[styles.notificationTime, { color: colors.icon }]}>
                                {item.createdAt.toLocaleDateString()} at{' '}
                                {item.createdAt.toLocaleTimeString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.notificationBody}>
                        <Text style={[styles.notificationText, { color: colors.text }]}>
                            Your team's attendance for{' '}
                            <Text style={[styles.hackathonTitle, { color: colors.secondary }]}>
                                {item.hackathonTitle}
                            </Text>{' '}
                            has been confirmed. Good luck with your project!
                        </Text>
                    </View>
                </View>
            );
        }

        // Team invitation notification (original)
        return (
            <View style={[styles.notificationCard, { backgroundColor: colors.card }]}>
                <View style={styles.notificationHeader}>
                    <View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor:
                                    item.status === 'accepted'
                                        ? colors.success + '20'
                                        : item.status === 'rejected'
                                            ? colors.error + '20'
                                            : colors.primary + '20',
                            },
                        ]}
                    >
                        <Ionicons
                            name={
                                item.status === 'accepted'
                                    ? 'checkmark-circle'
                                    : item.status === 'rejected'
                                        ? 'close-circle'
                                        : 'people'
                            }
                            size={28}
                            color={
                                item.status === 'accepted'
                                    ? colors.success
                                    : item.status === 'rejected'
                                        ? colors.error
                                        : colors.primary
                            }
                        />
                    </View>
                    <View style={styles.notificationContent}>
                        <Text style={[styles.notificationTitle, { color: colors.text }]}>
                            Team Invitation
                        </Text>
                        <Text style={[styles.notificationTime, { color: colors.icon }]}>
                            {formatTimeAgo(item.createdAt)}
                        </Text>
                    </View>
                </View>

                <View style={styles.notificationBody}>
                    <Text style={[styles.notificationText, { color: colors.text }]}>
                        <Text style={{ fontWeight: 'bold' }}>{item.leaderName}</Text> invited you to join
                        the team{' '}
                        <Text style={{ fontWeight: 'bold', color: colors.primary }}>
                            {item.teamName}
                        </Text>{' '}
                        for the hackathon:
                    </Text>
                    <Text style={[styles.hackathonTitle, { color: colors.secondary }]}>
                        {item.hackathonTitle}
                    </Text>
                </View>

                {item.status === 'pending' ? (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.rejectButton, { backgroundColor: colors.error + '20' }]}
                            onPress={() => handleReject(item)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                                <>
                                    <Ionicons name="close" size={20} color={colors.error} />
                                    <Text style={[styles.rejectButtonText, { color: colors.error }]}>
                                        Reject
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.acceptButton, { backgroundColor: colors.success }]}
                            onPress={() => handleAccept(item)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                    <Text style={styles.acceptButtonText}>Accept</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor:
                                    item.status === 'accepted'
                                        ? colors.success + '20'
                                        : colors.error + '20',
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                {
                                    color:
                                        item.status === 'accepted' ? colors.success : colors.error,
                                },
                            ]}
                        >
                            {item.status === 'accepted' ? 'Accepted' : 'Rejected'}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

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
                <Text style={[styles.loadingText, { color: colors.icon }]}>
                    Loading notifications...
                </Text>
            </View>
        );
    }

    if (notifications.length === 0) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="notifications-off-outline" size={80} color={colors.icon} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                    You don't have any team invitations yet
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
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
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    notificationCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    notificationTime: {
        fontSize: 12,
    },
    notificationBody: {
        marginBottom: 16,
    },
    notificationText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    notificationMessage: {
        fontSize: 13,
        lineHeight: 18,
        marginTop: 8,
        fontStyle: 'italic',
    },
    hackathonTitle: {
        fontSize: 15,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    teamName: {
        fontSize: 15,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 6,
    },
    rejectButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    acceptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 6,
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
