import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Hackathon } from '../../types';

interface Registration {
    id: string;
    teamName: string;
    leaderName: string;
    participantEmails: string[];
    status: string;
}

export default function JudgeHackathonDetailScreen({ route, navigation }: any) {
    const { hackathonId } = route.params;
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadHackathonDetails();
    }, [hackathonId]);

    const loadHackathonDetails = async () => {
        try {
            // Load hackathon details
            const docRef = doc(db, 'hackathons', hackathonId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setHackathon({
                    id: docSnap.id,
                    ...data,
                    schedule: {
                        registrationStart: data.schedule?.registrationStart?.toDate() || new Date(),
                        registrationEnd: data.schedule?.registrationEnd?.toDate() || new Date(),
                        eventStart: data.schedule?.eventStart?.toDate() || new Date(),
                        eventEnd: data.schedule?.eventEnd?.toDate() || new Date(),
                    },
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                } as Hackathon);
            }

            // Load all registrations (not just approved)
            const q = query(
                collection(db, 'registrations'),
                where('hackathonId', '==', hackathonId)
            );

            const snapshot = await getDocs(q);
            const regs: Registration[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    teamName: data.teamName,
                    leaderName: data.leaderName,
                    participantEmails: data.participantEmails || [],
                    status: data.status,
                };
            });

            setRegistrations(regs);
        } catch (error: any) {
            console.error('Load hackathon details error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!hackathon) {
        return null;
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Image */}
            {hackathon.posterUrl ? (
                <Image source={{ uri: hackathon.posterUrl }} style={styles.headerImage} />
            ) : (
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.headerImage}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="trophy" size={80} color="#fff" />
                </LinearGradient>
            )}

            <View style={styles.content}>
                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>{hackathon.title}</Text>

                {/* Organizer */}
                <View style={styles.organizerRow}>
                    <Ionicons name="person-circle-outline" size={20} color={colors.icon} />
                    <Text style={[styles.organizerText, { color: colors.icon }]}>
                        Organized by {hackathon.organizerName}
                    </Text>
                </View>

                {/* Description */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                    <Text style={[styles.description, { color: colors.icon }]}>{hackathon.description}</Text>
                </View>

                {/* Prize Pool */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cash" size={24} color={colors.success} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Prize Pool</Text>
                    </View>
                    <Text style={[styles.prizeAmount, { color: colors.success }]}>
                        ${hackathon.prizePool.toLocaleString()}
                    </Text>
                </View>

                {/* Schedule */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar" size={24} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
                    </View>

                    <View style={styles.scheduleItem}>
                        <Text style={[styles.scheduleLabel, { color: colors.icon }]}>Registration Period</Text>
                        <Text style={[styles.scheduleDate, { color: colors.text }]}>
                            {formatDate(hackathon.schedule.registrationStart)} - {formatDate(hackathon.schedule.registrationEnd)}
                        </Text>
                    </View>

                    <View style={styles.scheduleItem}>
                        <Text style={[styles.scheduleLabel, { color: colors.icon }]}>Event Period</Text>
                        <Text style={[styles.scheduleDate, { color: colors.text }]}>
                            {formatDate(hackathon.schedule.eventStart)} - {formatDate(hackathon.schedule.eventEnd)}
                        </Text>
                    </View>
                </View>

                {/* My Assigned Teams Button */}
                <TouchableOpacity
                    style={[styles.viewTeamsButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        navigation.navigate('JudgeAssignedTeams', {
                            hackathonId: hackathon.id
                        });
                    }}
                >
                    <Ionicons name="clipboard" size={20} color="#fff" />
                    <Text style={styles.viewTeamsButtonText}>View My Assigned Teams</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Participants */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="people" size={24} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Registered Teams ({registrations.length})
                        </Text>
                    </View>

                    {registrations.length > 0 ? (
                        registrations.map((reg, index) => (
                            <View key={reg.id} style={[styles.teamCard, { backgroundColor: colors.background }]}>
                                <View style={styles.teamHeader}>
                                    <View style={[styles.teamNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.teamNumberText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.teamInfo}>
                                        <Text style={[styles.teamName, { color: colors.text }]}>
                                            {reg.teamName}
                                        </Text>
                                        <Text style={[styles.teamLeader, { color: colors.icon }]}>
                                            Lead: {reg.leaderName}
                                        </Text>
                                    </View>
                                </View>

                                {reg.participantEmails.length > 0 && (
                                    <View style={styles.membersSection}>
                                        <Text style={[styles.membersLabel, { color: colors.icon }]}>
                                            Team Members ({reg.participantEmails.length}):
                                        </Text>
                                        {reg.participantEmails.map((email, idx) => (
                                            <View key={idx} style={styles.memberRow}>
                                                <Ionicons name="person-outline" size={14} color={colors.icon} />
                                                <Text style={[styles.memberEmail, { color: colors.icon }]}>
                                                    {email}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyTeams}>
                            <Ionicons name="people-outline" size={48} color={colors.icon} />
                            <Text style={[styles.emptyTeamsText, { color: colors.icon }]}>
                                No teams have registered yet
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
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
    headerImage: {
        width: '100%',
        height: 250,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    organizerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    organizerText: {
        fontSize: 16,
    },
    section: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    prizeAmount: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    scheduleItem: {
        marginBottom: 16,
    },
    scheduleLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    scheduleDate: {
        fontSize: 16,
        fontWeight: '600',
    },
    teamCard: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    teamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    teamNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    teamNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    teamLeader: {
        fontSize: 13,
    },
    membersSection: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    membersLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    memberEmail: {
        fontSize: 12,
    },
    emptyTeams: {
        alignItems: 'center',
        padding: 32,
    },
    emptyTeamsText: {
        fontSize: 14,
        marginTop: 12,
    },
    viewTeamsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    viewTeamsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
