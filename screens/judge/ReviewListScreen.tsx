import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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

export default function ReviewListScreen({ navigation }: any) {
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
            where('assignedJudge', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const submissionsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as ProblemSubmission[];

            // Sort in memory instead of using orderBy in query
            submissionsData.sort((a, b) => {
                const dateA = a.createdAt?.getTime() || 0;
                const dateB = b.createdAt?.getTime() || 0;
                return dateB - dateA; // desc order
            });

            setSubmissions(submissionsData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const renderSubmissionItem = ({ item }: { item: ProblemSubmission }) => (
        <TouchableOpacity
            style={[styles.submissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('EvaluationScreen', { submission: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="document-text" size={32} color={colors.primary} />
                </View>
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={styles.teamInfo}>
                        <Ionicons name="people" size={16} color={colors.icon} />
                        <Text style={[styles.teamText, { color: colors.icon }]}>
                            {item.teamName}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.icon} />
            </View>

            <Text style={[styles.description, { color: colors.icon }]} numberOfLines={3}>
                {item.description}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color={colors.icon} />
                    <Text style={[styles.dateText, { color: colors.icon }]}>
                        {item.createdAt?.toLocaleDateString()}
                    </Text>
                </View>
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
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Assigned Submissions</Text>
                <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
                    {submissions.length} submission{submissions.length !== 1 ? 's' : ''} to review
                </Text>
            </View>

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
                        <Ionicons name="clipboard-outline" size={80} color={colors.icon} />
                        <Text style={[styles.emptyText, { color: colors.icon }]}>No submissions assigned</Text>
                        <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                            You don't have any submissions to review yet
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
    header: {
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teamText: {
        fontSize: 14,
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
        textAlign: 'center',
    },
});
