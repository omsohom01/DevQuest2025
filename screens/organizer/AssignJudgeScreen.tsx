import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
import { useColorScheme } from '../../hooks/use-color-scheme';

interface Judge {
    id: string;
    name: string;
    email: string;
}

export default function AssignJudgeScreen({ route, navigation }: any) {
    const { hackathonId, teamId, teamName } = route.params;
    const [judges, setJudges] = useState<Judge[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadJudges();
    }, [hackathonId]);

    const loadJudges = async () => {
        try {
            // Get hackathon to find assigned judges
            const hackathonDoc = await getDoc(doc(db, 'hackathons', hackathonId));
            if (!hackathonDoc.exists()) {
                Alert.alert('Error', 'Hackathon not found');
                navigation.goBack();
                return;
            }

            const judgeIds = hackathonDoc.data().judges || [];

            if (judgeIds.length === 0) {
                setJudges([]);
                setLoading(false);
                return;
            }

            // Fetch judge details
            const judgesData: Judge[] = [];
            for (const judgeId of judgeIds) {
                const judgeDoc = await getDoc(doc(db, 'users', judgeId));
                if (judgeDoc.exists()) {
                    const data = judgeDoc.data();
                    judgesData.push({
                        id: judgeDoc.id,
                        name: data.name || data.email,
                        email: data.email
                    });
                }
            }

            setJudges(judgesData);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignJudge = async (judgeId: string, judgeName: string) => {
        Alert.alert(
            'Assign Judge',
            `Assign ${judgeName} to evaluate "${teamName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Assign',
                    onPress: async () => {
                        setAssigning(true);
                        try {
                            const teamRef = doc(db, 'registrations', teamId);
                            await updateDoc(teamRef, {
                                assignedJudgeId: judgeId,
                                assignedAt: new Date()
                            });
                            Alert.alert('Success', 'Judge assigned successfully!');
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setAssigning(false);
                        }
                    }
                }
            ]
        );
    };

    const renderJudgeCard = ({ item }: { item: Judge }) => (
        <TouchableOpacity
            style={[styles.judgeCard, { backgroundColor: colors.card }]}
            onPress={() => handleAssignJudge(item.id, item.name)}
            disabled={assigning}
        >
            <View style={[styles.judgeIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <View style={styles.judgeInfo}>
                <Text style={[styles.judgeName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.judgeEmail, { color: colors.icon }]}>{item.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.icon} />
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Assign Judge</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.teamInfoBanner}>
                <Text style={[styles.teamInfoLabel, { color: colors.icon }]}>Assigning judge for:</Text>
                <Text style={[styles.teamInfoName, { color: colors.text }]}>{teamName}</Text>
            </View>

            {judges.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                        No judges assigned to this hackathon yet
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                        Invite judges from the hackathon details screen
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={judges}
                    renderItem={renderJudgeCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
    teamInfoBanner: {
        padding: 16,
        alignItems: 'center',
    },
    teamInfoLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    teamInfoName: {
        fontSize: 18,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    judgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    judgeIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    judgeInfo: {
        flex: 1,
    },
    judgeName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    judgeEmail: {
        fontSize: 14,
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
