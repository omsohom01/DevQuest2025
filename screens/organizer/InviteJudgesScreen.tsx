import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface Judge {
    id: string;
    name: string;
    email: string;
    bio?: string;
    status?: 'invited' | 'accepted' | 'not_invited';
}

export default function InviteJudgesScreen({ route, navigation }: any) {
    const { hackathonId, hackathon } = route.params;
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [judges, setJudges] = useState<Judge[]>([]);
    const [filteredJudges, setFilteredJudges] = useState<Judge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState<string | null>(null);

    useEffect(() => {
        loadJudges();
    }, [hackathonId]);

    const loadJudges = async () => {
        try {
            // Load all users with role 'judge'
            const judgesQuery = query(collection(db, 'users'), where('role', '==', 'judge'));
            const judgesSnapshot = await getDocs(judgesQuery);

            // Load existing invitations for this hackathon
            const invitationsQuery = query(
                collection(db, 'notifications'),
                where('hackathonId', '==', hackathonId)
            );
            const invitationsSnapshot = await getDocs(invitationsQuery);

            const invitedJudges = new Map<string, string>();
            invitationsSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                // Only process judge invitations
                if (data.type === 'judge_invitation') {
                    invitedJudges.set(data.judgeId, data.status);
                }
            });

            const judgesList: Judge[] = judgesSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || data.email,
                    email: data.email,
                    bio: data.bio,
                    status: invitedJudges.get(doc.id) as any || 'not_invited',
                };
            });

            setJudges(judgesList);
            setFilteredJudges(judgesList);
        } catch (error: any) {
            console.error('Load judges error:', error);
            Alert.alert('Error', 'Failed to load judges');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredJudges(judges);
        } else {
            const filtered = judges.filter(
                (judge) =>
                    judge.name.toLowerCase().includes(text.toLowerCase()) ||
                    judge.email.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredJudges(filtered);
        }
    };

    const inviteJudge = async (judge: Judge) => {
        try {
            setInviting(judge.id);

            // Get organizer's name
            const organizerDoc = await getDoc(doc(db, 'users', user!.uid));
            const organizerName = organizerDoc.exists()
                ? (organizerDoc.data().name || user!.email)
                : user!.email;

            // Create judge invitation notification
            await addDoc(collection(db, 'notifications'), {
                type: 'judge_invitation',
                hackathonId,
                hackathonTitle: hackathon.title,
                organizerId: user!.uid,
                organizerName: organizerName,
                judgeId: judge.id,
                judgeName: judge.name,
                judgeEmail: judge.email,
                status: 'pending',
                read: false,
                createdAt: new Date(),
            });

            Alert.alert('Success', `Invitation sent to ${judge.name}`);

            // Reload judges to update status
            await loadJudges();
        } catch (error: any) {
            console.error('Invite judge error:', error);
            Alert.alert('Error', 'Failed to send invitation');
        } finally {
            setInviting(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return colors.success;
            case 'invited':
            case 'pending':
                return colors.warning;
            default:
                return colors.icon;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accepted':
                return 'checkmark-circle';
            case 'invited':
            case 'pending':
                return 'time';
            default:
                return 'person-add';
        }
    };

    const renderJudge = ({ item }: { item: Judge }) => (
        <View style={[styles.judgeCard, { backgroundColor: colors.card }]}>
            <View style={styles.judgeInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.judgeDetails}>
                    <Text style={[styles.judgeName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.judgeEmail, { color: colors.icon }]}>{item.email}</Text>
                    {item.bio && (
                        <Text style={[styles.judgeBio, { color: colors.icon }]} numberOfLines={2}>
                            {item.bio}
                        </Text>
                    )}
                </View>
            </View>

            {item.status === 'not_invited' ? (
                <TouchableOpacity
                    style={[styles.inviteButton, { backgroundColor: colors.primary }]}
                    onPress={() => inviteJudge(item)}
                    disabled={inviting === item.id}
                >
                    {inviting === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="send" size={16} color="#fff" />
                            <Text style={styles.inviteButtonText}>Invite</Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : (
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status!) + '20' },
                    ]}
                >
                    <Ionicons name={getStatusIcon(item.status!)} size={16} color={getStatusColor(item.status!)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status!) }]}>
                        {item.status === 'invited' ? 'Invited' : item.status!.charAt(0).toUpperCase() + item.status!.slice(1)}
                    </Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.icon }]}>Loading judges...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>Invite Judges</Text>
                <Text style={[styles.subtitle, { color: colors.icon }]}>
                    {hackathon.title}
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.icon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search judges by name or email..."
                        placeholderTextColor={colors.icon}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {/* Judges List */}
            {filteredJudges.length > 0 ? (
                <FlatList
                    data={filteredJudges}
                    renderItem={renderJudge}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                        {searchQuery ? 'No judges found matching your search' : 'No judges available'}
                    </Text>
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
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
    },
    searchSection: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    judgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    judgeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    judgeDetails: {
        flex: 1,
    },
    judgeName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    judgeEmail: {
        fontSize: 14,
        marginBottom: 4,
    },
    judgeBio: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    inviteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
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
        textAlign: 'center',
        marginTop: 16,
    },
});
