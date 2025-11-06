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
    type: 'judge_invitation';
    hackathonId: string;
    hackathonTitle: string;
    organizerName: string;
    status: 'pending' | 'accepted' | 'declined';
    read: boolean;
    createdAt: Date;
}

export default function JudgeNotificationsScreen({ navigation }: any) {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('judgeId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs: Notification[] = [];

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                // Only process judge invitations
                if (data.type === 'judge_invitation') {
                    notifs.push({
                        id: doc.id,
                        type: data.type,
                        hackathonId: data.hackathonId,
                        hackathonTitle: data.hackathonTitle,
                        organizerName: data.organizerName,
                        status: data.status,
                        read: data.read || false,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    });
                }
            });

            // Sort by date (newest first)
            notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setNotifications(notifs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAccept = async (notification: Notification) => {
        try {
            setProcessing(notification.id);

            // Add judge to hackathon's judges array
            const hackathonRef = doc(db, 'hackathons', notification.hackathonId);

            // Get current hackathon to check if judges array exists
            const hackathonDoc = await getDoc(hackathonRef);
            if (hackathonDoc.exists()) {
                const currentJudges = hackathonDoc.data().judges || [];
                if (!currentJudges.includes(user!.uid)) {
                    await updateDoc(hackathonRef, {
                        judges: arrayUnion(user!.uid),
                    });
                }
            }

            // Update notification status
            await updateDoc(doc(db, 'notifications', notification.id), {
                status: 'accepted',
                read: true,
            });

            Alert.alert('Success', `You've accepted to judge ${notification.hackathonTitle}`);
        } catch (error: any) {
            console.error('Accept invitation error:', error);
            Alert.alert('Error', 'Failed to accept invitation');
        } finally {
            setProcessing(null);
        }
    };

    const handleDecline = async (notification: Notification) => {
        try {
            setProcessing(notification.id);

            // Update notification status
            await updateDoc(doc(db, 'notifications', notification.id), {
                status: 'declined',
                read: true,
            });

            Alert.alert('Declined', 'You have declined the invitation');
        } catch (error: any) {
            console.error('Decline invitation error:', error);
            Alert.alert('Error', 'Failed to decline invitation');
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <View
            style={[
                styles.notificationCard,
                { backgroundColor: colors.card, borderColor: item.read ? colors.border : colors.primary },
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="people" size={28} color={colors.primary} />
            </View>

            <View style={styles.notificationContent}>
                <Text style={[styles.title, { color: colors.text }]}>Judge Invitation</Text>
                <Text style={[styles.message, { color: colors.text }]}>
                    <Text style={{ fontWeight: '600' }}>{item.organizerName}</Text> has invited you to judge{' '}
                    <Text style={{ fontWeight: '600' }}>{item.hackathonTitle}</Text>
                </Text>
                <Text style={[styles.time, { color: colors.icon }]}>{formatDate(item.createdAt)}</Text>

                {item.status === 'pending' ? (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.acceptButton, { backgroundColor: colors.success }]}
                            onPress={() => handleAccept(item)}
                            disabled={processing === item.id}
                        >
                            {processing === item.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Accept</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.declineButton, { backgroundColor: colors.error }]}
                            onPress={() => handleDecline(item)}
                            disabled={processing === item.id}
                        >
                            {processing === item.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="close" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Decline</Text>
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
                        <Ionicons
                            name={item.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                            size={16}
                            color={item.status === 'accepted' ? colors.success : colors.error}
                        />
                        <Text
                            style={[
                                styles.statusText,
                                { color: item.status === 'accepted' ? colors.success : colors.error },
                            ]}
                        >
                            {item.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.icon }]}>No notifications</Text>
                </View>
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
    notificationCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    time: {
        fontSize: 12,
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    declineButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});
