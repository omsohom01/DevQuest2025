import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface TeamData {
    id: string;
    teamName: string;
    teamLeaderName: string;
    membersCount: number;
    ideaDescription: string;
    evaluatedBy?: string;
    totalMarks?: number;
    hackathonId: string;
}

export default function JudgeAssignedTeamsScreen({ route, navigation }: any) {
    const { hackathonId } = route.params;
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) return;

        const teamsQuery = query(
            collection(db, 'registrations'),
            where('hackathonId', '==', hackathonId),
            where('assignedJudgeId', '==', currentUserId)
        );

        const unsubscribe = onSnapshot(teamsQuery, (snapshot) => {
            const teamsData: TeamData[] = [];

            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                teamsData.push({
                    id: docSnap.id,
                    teamName: data.teamName,
                    teamLeaderName: data.teamLeaderName,
                    membersCount: (data.members?.length || 0) + 1,
                    ideaDescription: data.ideaDescription,
                    evaluatedBy: data.evaluatedBy,
                    totalMarks: data.totalMarks,
                    hackathonId: data.hackathonId
                });
            });

            setTeams(teamsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [hackathonId, currentUserId]);

    const renderTeamCard = ({ item }: { item: TeamData }) => (
        <TouchableOpacity
            style={[styles.teamCard, { backgroundColor: colors.card }]}
            onPress={() => {
                navigation.navigate('TeamEvaluation', {
                    teamId: item.id,
                    hackathonId: item.hackathonId
                });
            }}
        >
            <View style={styles.teamHeader}>
                <View style={styles.teamNameContainer}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                    <Text style={[styles.teamName, { color: colors.text }]}>{item.teamName}</Text>
                </View>
                {item.evaluatedBy && item.totalMarks !== undefined && (
                    <View style={[styles.marksBadge, { backgroundColor: colors.success }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.marksText}>{item.totalMarks}/40</Text>
                    </View>
                )}
            </View>

            <View style={styles.teamInfo}>
                <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color={colors.icon} />
                    <Text style={[styles.infoText, { color: colors.icon }]}>
                        Leader: {item.teamLeaderName}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={16} color={colors.icon} />
                    <Text style={[styles.infoText, { color: colors.icon }]}>
                        {item.membersCount} members
                    </Text>
                </View>
            </View>

            <Text style={[styles.ideaPreview, { color: colors.icon }]} numberOfLines={2}>
                {item.ideaDescription}
            </Text>

            {!item.evaluatedBy ? (
                <View style={[styles.statusBadge, { backgroundColor: '#f59e0b20' }]}>
                    <Ionicons name="time" size={16} color="#f59e0b" />
                    <Text style={[styles.statusText, { color: '#f59e0b' }]}>Pending Evaluation</Text>
                </View>
            ) : (
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="checkmark-done" size={16} color={colors.success} />
                    <Text style={[styles.statusText, { color: colors.success }]}>Evaluated</Text>
                </View>
            )}

            <View style={styles.viewButtonContainer}>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Assigned Teams</Text>
                <View style={styles.backButton} />
            </View>

            {teams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                        No teams assigned yet
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                        Teams will appear here when organizers assign them to you
                    </Text>
                </View>
            ) : (
                <>
                    <TouchableOpacity
                        style={[styles.aiButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('AIAnalysis', { hackathonId })}
                    >
                        <Ionicons name="sparkles" size={20} color="#fff" />
                        <Text style={styles.aiButtonText}>Analyze Ideas with AI</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>

                    <FlatList
                        data={teams}
                        renderItem={renderTeamCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 48,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    teamCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    teamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    teamNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    teamName: {
        fontSize: 18,
        fontWeight: '600',
    },
    marksBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    marksText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    teamInfo: {
        gap: 8,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
    },
    ideaPreview: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontWeight: '600',
        fontSize: 14,
    },
    viewButtonContainer: {
        position: 'absolute',
        bottom: 16,
        right: 16,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    aiButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});
