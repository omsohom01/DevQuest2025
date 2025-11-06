import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface AttendanceTeam {
    id: string;
    teamName: string;
    leaderId: string;
    leaderName: string;
    membersCount: number;
    attendanceMarkedAt: Date;
}

export default function AttendanceListScreen({ route, navigation }: any) {
    const { hackathonId } = route.params;
    const [teams, setTeams] = useState<AttendanceTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        const q = query(
            collection(db, 'registrations'),
            where('hackathonId', '==', hackathonId),
            where('status', '==', 'selected'),
            where('attendanceMarked', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData: AttendanceTeam[] = [];

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                teamsData.push({
                    id: doc.id,
                    teamName: data.teamName,
                    leaderId: data.leaderId,
                    leaderName: data.leaderName || data.teamLeaderName,
                    membersCount: (data.members?.length || 0) + 1,
                    attendanceMarkedAt: data.attendanceMarkedAt?.toDate() || new Date(),
                });
            });

            // Sort by attendance time (most recent first)
            teamsData.sort((a, b) => b.attendanceMarkedAt.getTime() - a.attendanceMarkedAt.getTime());

            setTeams(teamsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [hackathonId]);

    const renderTeamItem = ({ item }: { item: AttendanceTeam }) => (
        <View style={[styles.teamCard, { backgroundColor: colors.card }]}>
            <View style={styles.teamHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <View style={styles.teamInfo}>
                    <Text style={[styles.teamName, { color: colors.text }]}>
                        {item.teamName}
                    </Text>
                    <Text style={[styles.leaderName, { color: colors.icon }]}>
                        Lead by: {item.leaderName}
                    </Text>
                </View>
            </View>

            <View style={styles.teamDetails}>
                <View style={styles.detailItem}>
                    <Ionicons name="people" size={18} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                        {item.membersCount} member{item.membersCount > 1 ? 's' : ''}
                    </Text>
                </View>

                <View style={styles.detailItem}>
                    <Ionicons name="time" size={18} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                        {item.attendanceMarkedAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
            </View>
        </View>
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
                <View style={styles.headerContent}>
                    <Ionicons name="people" size={32} color={colors.primary} />
                    <View style={styles.headerText}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Attendance Marked
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
                            {teams.length} team{teams.length !== 1 ? 's' : ''} present
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.scanButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="scan" size={20} color="#fff" />
                    <Text style={styles.scanButtonText}>Scan More</Text>
                </TouchableOpacity>
            </View>

            {teams.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        No attendance marked yet
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                        Teams will appear here once they check in
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={teams}
                    renderItem={renderTeamItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerText: {
        marginLeft: 16,
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    teamCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    teamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    teamInfo: {
        marginLeft: 12,
        flex: 1,
    },
    teamName: {
        fontSize: 18,
        fontWeight: '600',
    },
    leaderName: {
        fontSize: 14,
        marginTop: 2,
    },
    teamDetails: {
        flexDirection: 'row',
        gap: 24,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});
