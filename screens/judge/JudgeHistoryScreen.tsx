import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Evaluation } from '../../types';

export default function JudgeHistoryScreen() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'evaluations'),
            where('judgeId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const evaluationsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as Evaluation[];

            // Sort in memory instead of using orderBy in query
            evaluationsData.sort((a, b) => {
                const dateA = a.createdAt?.getTime() || 0;
                const dateB = b.createdAt?.getTime() || 0;
                return dateB - dateA; // desc order
            });

            setEvaluations(evaluationsData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const renderEvaluationItem = ({ item }: { item: Evaluation }) => (
        <View style={[styles.evaluationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.scoreCircle, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                    <Text style={[styles.scoreText, { color: colors.primary }]}>{item.score}</Text>
                </View>
                <View style={styles.headerContent}>
                    <Text style={[styles.submissionId, { color: colors.text }]}>
                        Submission #{item.submissionId?.substring(0, 8) || 'N/A'}
                    </Text>
                    <View style={styles.recommendationBadge}>
                        <Ionicons
                            name={item.shortlistRecommendation ? 'star' : 'star-outline'}
                            size={16}
                            color={item.shortlistRecommendation ? colors.success : colors.icon}
                        />
                        <Text
                            style={[
                                styles.recommendationText,
                                { color: item.shortlistRecommendation ? colors.success : colors.icon },
                            ]}
                        >
                            {item.shortlistRecommendation ? 'Recommended' : 'Not Recommended'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[styles.feedbackContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.feedbackLabel, { color: colors.icon }]}>Feedback:</Text>
                <Text style={[styles.feedback, { color: colors.text }]} numberOfLines={3}>
                    {item.feedback}
                </Text>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color={colors.icon} />
                    <Text style={[styles.dateText, { color: colors.icon }]}>
                        {item.createdAt?.toLocaleDateString()}
                    </Text>
                </View>
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
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Evaluation History</Text>
                <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
                    {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} completed
                </Text>
            </View>

            <FlatList
                data={evaluations}
                renderItem={renderEvaluationItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="clipboard-outline" size={80} color={colors.icon} />
                        <Text style={[styles.emptyText, { color: colors.icon }]}>No evaluations yet</Text>
                        <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                            Your completed evaluations will appear here
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
    evaluationCard: {
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
    scoreCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
    },
    submissionId: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    recommendationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendationText: {
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '500',
    },
    feedbackContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    feedbackLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    feedback: {
        fontSize: 14,
        lineHeight: 20,
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
