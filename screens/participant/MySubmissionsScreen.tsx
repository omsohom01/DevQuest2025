import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
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
import { ProblemSubmission } from '../../types';

export default function MySubmissionsScreen({ navigation }: any) {
    const [submissions, setSubmissions] = useState<ProblemSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'submissions'),
            where('teamId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const submissionsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as ProblemSubmission[];

            setSubmissions(submissionsData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return colors.warning;
            case 'under_review':
                return colors.secondary;
            case 'shortlisted':
            case 'selected':
                return colors.success;
            case 'not_selected':
                return colors.error;
            default:
                return colors.icon;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pending Review';
            case 'under_review':
                return 'Under Review';
            case 'shortlisted':
                return 'Shortlisted';
            case 'selected':
                return 'Selected';
            case 'not_selected':
                return 'Not Selected';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return 'time-outline';
            case 'under_review':
                return 'eye-outline';
            case 'shortlisted':
            case 'selected':
                return 'checkmark-circle';
            case 'not_selected':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    const renderSubmissionItem = ({ item }: { item: ProblemSubmission }) => (
        <TouchableOpacity
            style={[styles.submissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('SubmissionDetail', { submission: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                    <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Ionicons name={getStatusIcon(item.status) as any} size={16} color={getStatusColor(item.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>

            <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color={colors.icon} />
                    <Text style={[styles.dateText, { color: colors.icon }]}>
                        {item.createdAt?.toLocaleDateString()}
                    </Text>
                </View>
                {item.assignedJudgeName && (
                    <View style={styles.judgeContainer}>
                        <Ionicons name="person-outline" size={14} color={colors.icon} />
                        <Text style={[styles.judgeText, { color: colors.icon }]}>
                            {item.assignedJudgeName}
                        </Text>
                    </View>
                )}
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={submissions}
                renderItem={renderSubmissionItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={80} color={colors.icon} />
                        <Text style={[styles.emptyText, { color: colors.icon }]}>No submissions yet</Text>
                        <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                            Start by submitting your first problem statement
                        </Text>
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
    },
    submissionCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        marginLeft: 4,
    },
    judgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    judgeText: {
        fontSize: 12,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
    },
});
