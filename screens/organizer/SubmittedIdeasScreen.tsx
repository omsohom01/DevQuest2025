import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface Registration {
    id: string;
    teamName: string;
    leaderName: string;
    leaderEmail: string;
    participantEmails: string[];
    ideaDescription: string;
    ideaPPTUrl: string;
    ideaPPTName: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

export default function SubmittedIdeasScreen({ route, navigation }: any) {
    const { hackathonId, hackathon } = route.params;
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        loadRegistrations();
    }, [hackathonId]);

    const loadRegistrations = async () => {
        try {
            const q = query(
                collection(db, 'registrations'),
                where('hackathonId', '==', hackathonId),
                where('status', 'in', ['pending', 'approved', 'rejected'])
            );

            const snapshot = await getDocs(q);
            const regs: Registration[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    teamName: data.teamName,
                    leaderName: data.leaderName,
                    leaderEmail: data.leaderEmail,
                    participantEmails: data.participantEmails || [],
                    ideaDescription: data.ideaDescription || 'No description provided',
                    ideaPPTUrl: data.ideaPPTUrl,
                    ideaPPTName: data.ideaPPTName || 'presentation.pdf',
                    status: data.status,
                    createdAt: data.createdAt?.toDate() || new Date(),
                };
            });

            // Sort by creation date (newest first)
            regs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setRegistrations(regs);
        } catch (error: any) {
            console.error('Load registrations error:', error);
            Alert.alert('Error', 'Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const updateRegistrationStatus = async (regId: string, newStatus: 'approved' | 'rejected') => {
        try {
            await updateDoc(doc(db, 'registrations', regId), {
                status: newStatus,
            });

            Alert.alert(
                'Success',
                `Registration ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`
            );

            // Reload registrations
            await loadRegistrations();
        } catch (error: any) {
            console.error('Update registration error:', error);
            Alert.alert('Error', 'Failed to update registration status');
        }
    };

    const openPPT = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open this file');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open presentation');
        }
    };

    const filteredRegistrations = registrations.filter((reg) => {
        if (selectedFilter === 'all') return true;
        return reg.status === selectedFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return colors.success;
            case 'rejected':
                return colors.error;
            default:
                return colors.warning;
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.icon }]}>Loading submissions...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>Submitted Ideas</Text>
                <Text style={[styles.subtitle, { color: colors.icon }]}>{hackathon.title}</Text>
                <Text style={[styles.count, { color: colors.primary }]}>
                    {filteredRegistrations.length} {filteredRegistrations.length === 1 ? 'submission' : 'submissions'}
                </Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[
                        styles.filterTab,
                        selectedFilter === 'all' && [styles.filterTabActive, { backgroundColor: colors.primary }],
                    ]}
                    onPress={() => setSelectedFilter('all')}
                >
                    <Text
                        style={[
                            styles.filterTabText,
                            { color: selectedFilter === 'all' ? '#fff' : colors.icon },
                        ]}
                    >
                        All ({registrations.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterTab,
                        selectedFilter === 'pending' && [styles.filterTabActive, { backgroundColor: colors.warning }],
                    ]}
                    onPress={() => setSelectedFilter('pending')}
                >
                    <Text
                        style={[
                            styles.filterTabText,
                            { color: selectedFilter === 'pending' ? '#fff' : colors.icon },
                        ]}
                    >
                        Pending ({registrations.filter((r) => r.status === 'pending').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterTab,
                        selectedFilter === 'approved' && [styles.filterTabActive, { backgroundColor: colors.success }],
                    ]}
                    onPress={() => setSelectedFilter('approved')}
                >
                    <Text
                        style={[
                            styles.filterTabText,
                            { color: selectedFilter === 'approved' ? '#fff' : colors.icon },
                        ]}
                    >
                        Approved ({registrations.filter((r) => r.status === 'approved').length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Submissions List */}
            <ScrollView contentContainerStyle={styles.listContent}>
                {filteredRegistrations.length > 0 ? (
                    filteredRegistrations.map((reg) => (
                        <View key={reg.id} style={[styles.submissionCard, { backgroundColor: colors.card }]}>
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <Text style={[styles.teamName, { color: colors.text }]}>{reg.teamName}</Text>
                                    <Text style={[styles.submittedDate, { color: colors.icon }]}>
                                        Submitted {formatDate(reg.createdAt)}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(reg.status) + '20' },
                                    ]}
                                >
                                    <Text style={[styles.statusText, { color: getStatusColor(reg.status) }]}>
                                        {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            {/* Team Details */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Lead</Text>
                                <View style={styles.memberRow}>
                                    <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                                    <View style={styles.memberInfo}>
                                        <Text style={[styles.memberName, { color: colors.text }]}>
                                            {reg.leaderName}
                                        </Text>
                                        <Text style={[styles.memberEmail, { color: colors.icon }]}>
                                            {reg.leaderEmail}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {reg.participantEmails.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Team Members ({reg.participantEmails.length})
                                    </Text>
                                    {reg.participantEmails.map((email, index) => (
                                        <View key={index} style={styles.memberRow}>
                                            <Ionicons name="person-outline" size={20} color={colors.icon} />
                                            <Text style={[styles.memberEmail, { color: colors.icon }]}>{email}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Idea Description */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Idea</Text>
                                <Text style={[styles.ideaText, { color: colors.text }]}>
                                    {reg.ideaDescription}
                                </Text>
                            </View>

                            {/* Presentation */}
                            {reg.ideaPPTUrl && (
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Presentation</Text>
                                    <TouchableOpacity
                                        style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                                        onPress={() => openPPT(reg.ideaPPTUrl)}
                                    >
                                        <Ionicons name="document" size={20} color="#fff" />
                                        <Text style={styles.downloadButtonText}>{reg.ideaPPTName}</Text>
                                        <Ionicons name="open-outline" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Action Buttons */}
                            {reg.status === 'pending' && (
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: colors.success }]}
                                        onPress={() => updateRegistrationStatus(reg.id, 'approved')}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: colors.error }]}
                                        onPress={() => updateRegistrationStatus(reg.id, 'rejected')}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color={colors.icon} />
                        <Text style={[styles.emptyText, { color: colors.icon }]}>
                            {selectedFilter === 'all'
                                ? 'No submissions yet'
                                : `No ${selectedFilter} submissions`}
                        </Text>
                    </View>
                )}
            </ScrollView>
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
        marginBottom: 8,
    },
    count: {
        fontSize: 16,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    filterTabActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    submissionCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cardHeaderLeft: {
        flex: 1,
    },
    teamName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    submittedDate: {
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '500',
    },
    memberEmail: {
        fontSize: 13,
    },
    ideaText: {
        fontSize: 14,
        lineHeight: 20,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
    },
    downloadButtonText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    },
});
