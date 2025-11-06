import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ImageGalleryViewer from '../../components/ImageGalleryViewer';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface TeamData {
    id: string;
    teamName: string;
    teamLeaderId: string;
    teamLeaderName: string;
    members: any[];
    ideaDescription: string;
    ideaPPTUrl?: string;
    ideaPPTName?: string;
    presentationImages?: string[];
    presentationImageCount?: number;
    assignedJudgeId?: string;
    assignedJudgeName?: string;
    evaluatedBy?: string;
    totalMarks?: number;
    status: string;
}

export default function TeamListScreen({ route, navigation }: any) {
    const { hackathonId, filter } = route.params;
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [selectedPresentation, setSelectedPresentation] = useState<{ images: string[]; name: string } | null>(null);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const filterTitles: { [key: string]: string } = {
        all: 'All Teams',
        pending: 'Pending Review',
        reviewed: 'Reviewed Teams',
        selected: 'Selected Teams'
    };
    const filterTitle = filterTitles[filter] || 'Teams';

    useEffect(() => {
        const registrationsQuery = query(
            collection(db, 'registrations'),
            where('hackathonId', '==', hackathonId)
        );

        const unsubscribe = onSnapshot(registrationsQuery, async (snapshot) => {
            const teamsData: TeamData[] = [];

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();

                // Skip draft registrations
                if (data.status === 'draft') continue;

                // Apply filter
                let shouldInclude = false;
                if (filter === 'all') {
                    shouldInclude = true;
                } else if (filter === 'pending') {
                    shouldInclude = !data.evaluatedBy && data.status === 'pending';
                } else if (filter === 'reviewed') {
                    shouldInclude = data.evaluatedBy && data.status === 'pending';
                } else if (filter === 'selected') {
                    shouldInclude = data.status === 'selected';
                }

                if (shouldInclude) {
                    // Fetch judge name if assigned
                    let judgeName = undefined;
                    if (data.assignedJudgeId) {
                        try {
                            const judgeDoc = await getDoc(doc(db, 'users', data.assignedJudgeId));
                            if (judgeDoc.exists()) {
                                judgeName = judgeDoc.data().name || judgeDoc.data().email;
                            }
                        } catch (error) {
                            console.error('Error fetching judge:', error);
                        }
                    }

                    // Build members array if it doesn't exist (for old registrations)
                    let membersArray = data.members || [];
                    if (!membersArray || membersArray.length === 0) {
                        // Create members array from old data structure
                        membersArray = [];

                        // Fetch leader's actual name from users collection
                        let leaderName = data.leaderName || data.teamLeaderName || 'Team Leader';
                        try {
                            if (data.leaderId) {
                                const leaderDoc = await getDoc(doc(db, 'users', data.leaderId));
                                if (leaderDoc.exists()) {
                                    leaderName = leaderDoc.data().name || leaderName;
                                }
                            }
                        } catch (error) {
                            console.error('Error fetching leader name:', error);
                        }

                        // Add leader
                        membersArray.push({
                            email: data.leaderEmail || 'Unknown',
                            name: leaderName,
                            isLeader: true,
                        });

                        // Add other members from participantEmails if exists
                        if (data.participantEmails && data.participantEmails.length > 0) {
                            for (const email of data.participantEmails) {
                                if (email !== data.leaderEmail) {
                                    // Try to fetch user's actual name
                                    let memberName = email.split('@')[0];
                                    try {
                                        const usersQuery = query(
                                            collection(db, 'users'),
                                            where('email', '==', email)
                                        );
                                        const userSnapshot = await getDocs(usersQuery);
                                        if (!userSnapshot.empty) {
                                            const userData = userSnapshot.docs[0].data();
                                            memberName = userData.name || memberName;
                                        }
                                    } catch (error) {
                                        console.error('Error fetching member name:', error);
                                    }

                                    membersArray.push({
                                        email: email,
                                        name: memberName,
                                        isLeader: false,
                                    });
                                }
                            }
                        }
                    }

                    teamsData.push({
                        id: docSnap.id,
                        teamName: data.teamName,
                        teamLeaderId: data.leaderId || data.teamLeaderId,
                        teamLeaderName: data.leaderName || data.teamLeaderName,
                        members: membersArray,
                        ideaDescription: data.ideaDescription || '',
                        ideaPPTUrl: data.ideaPPTUrl,
                        ideaPPTName: data.ideaPPTName || 'presentation.pdf',
                        assignedJudgeId: data.assignedJudgeId,
                        assignedJudgeName: judgeName,
                        evaluatedBy: data.evaluatedBy,
                        totalMarks: data.totalMarks,
                        status: data.status
                    });
                }
            }

            // Sort reviewed teams by marks (descending)
            if (filter === 'reviewed') {
                teamsData.sort((a, b) => (b.totalMarks || 0) - (a.totalMarks || 0));
            }

            setTeams(teamsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [hackathonId, filter]);

    const handleAssignJudge = (teamId: string, teamName: string) => {
        navigation.navigate('AssignJudge', {
            hackathonId,
            teamId,
            teamName
        });
    };

    const handleApproveTeam = async (teamId: string, teamName: string) => {
        // First, get the hackathon details to check if it's offline
        const hackathonDoc = await getDoc(doc(db, 'hackathons', hackathonId));
        const hackathonData = hackathonDoc.data();
        const isOffline = hackathonData?.mode === 'offline';

        Alert.alert(
            'Select Team',
            `Are you sure you want to select "${teamName}" for this hackathon?${isOffline ? '\n\n✅ A unique QR code will be generated for attendance.' : ''}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Select Team',
                    onPress: async () => {
                        try {
                            // Get team details
                            const teamDoc = await getDoc(doc(db, 'registrations', teamId));
                            const teamData = teamDoc.data();

                            if (!teamData) {
                                Alert.alert('Error', 'Team not found');
                                return;
                            }

                            // Generate unique QR code data for offline hackathons
                            const qrCodeData = isOffline ? {
                                hackathonId,
                                teamId,
                                teamName: teamData.teamName,
                                leaderId: teamData.leaderId,
                                timestamp: Date.now(),
                                uniqueCode: `${hackathonId}-${teamId}-${Date.now()}`
                            } : null;

                            // Update team status to selected
                            const teamRef = doc(db, 'registrations', teamId);
                            await updateDoc(teamRef, {
                                status: 'selected',
                                selectedAt: new Date(),
                                ...(qrCodeData && {
                                    attendanceQRCode: JSON.stringify(qrCodeData),
                                    attendanceMarked: false
                                })
                            });

                            // Send notifications to all team members
                            const memberIds = [teamData.leaderId, ...(teamData.participantIds || [])];
                            const uniqueMemberIds = [...new Set(memberIds)];

                            for (const memberId of uniqueMemberIds) {
                                await addDoc(collection(db, 'notifications'), {
                                    userId: memberId,
                                    type: 'team_selected',
                                    title: '🎉 Team Selected!',
                                    message: `Congratulations! Your team "${teamData.teamName}" has been selected for ${hackathonData?.title}!${isOffline ? ' Check your dashboard for the attendance QR code.' : ''}`,
                                    hackathonId,
                                    teamId,
                                    teamName: teamData.teamName,
                                    read: false,
                                    createdAt: new Date(),
                                });
                            }

                            Alert.alert(
                                'Success',
                                `Team "${teamName}" selected successfully!\n\n✅ Notifications sent to all ${uniqueMemberIds.length} members${isOffline ? '\n✅ QR code generated for attendance' : ''}`
                            );
                        } catch (error: any) {
                            console.error('Selection error:', error);
                            Alert.alert('Error', error.message || 'Failed to select team');
                        }
                    }
                }
            ]
        );
    };

    const handleOpenPPT = (images: string[] | undefined, teamName: string) => {
        if (images && images.length > 0) {
            setSelectedPresentation({ images, name: `${teamName} - Presentation` });
            setGalleryVisible(true);
        } else {
            Alert.alert('No Presentation', 'This team has not uploaded any presentation slides yet.');
        }
    };

    const renderTeamCard = ({ item }: { item: TeamData }) => {
        const isExpanded = expandedTeamId === item.id;

        return (
            <View style={[styles.teamCard, { backgroundColor: colors.card }]}>
                {/* Compact Header - Always Visible */}
                <TouchableOpacity
                    style={styles.compactHeader}
                    onPress={() => setExpandedTeamId(isExpanded ? null : item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.compactLeft}>
                        <Ionicons name="people" size={20} color={colors.primary} />
                        <Text style={[styles.compactTeamName, { color: colors.text }]} numberOfLines={1}>
                            {item.teamName}
                        </Text>
                        {item.totalMarks !== undefined && (
                            <View style={[styles.compactMarksBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.compactMarksText}>{item.totalMarks}/40</Text>
                            </View>
                        )}
                    </View>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={colors.icon}
                    />
                </TouchableOpacity>

                {/* Assign Judge Button - Always Visible if no judge assigned */}
                {!item.assignedJudgeId && (
                    <TouchableOpacity
                        style={[styles.compactAssignButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleAssignJudge(item.id, item.teamName)}
                    >
                        <Ionicons name="person-add" size={16} color="#fff" />
                        <Text style={styles.compactAssignText}>Assign Judge</Text>
                    </TouchableOpacity>
                )}

                {item.assignedJudgeName && !isExpanded && (
                    <View style={[styles.compactJudgeInfo, { backgroundColor: colors.success + '20' }]}>
                        <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                        <Text style={[styles.compactJudgeText, { color: colors.success }]}>
                            Judge: {item.assignedJudgeName}
                        </Text>
                    </View>
                )}

                {/* Expanded Details - Show only when tapped */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {/* Team Info */}
                        <View style={styles.detailsSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Details</Text>

                            <View style={styles.infoRow}>
                                <Ionicons name="person" size={16} color={colors.icon} />
                                <Text style={[styles.infoLabel, { color: colors.icon }]}>Leader:</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {item.members.find((m: any) => m.isLeader)?.name || item.teamLeaderName || 'Team Leader'}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="mail" size={16} color={colors.icon} />
                                <Text style={[styles.infoLabel, { color: colors.icon }]}>Email:</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {item.members.find((m: any) => m.isLeader)?.email || 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="people-outline" size={16} color={colors.icon} />
                                <Text style={[styles.infoLabel, { color: colors.icon }]}>Members:</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {item.members.length} total
                                </Text>
                            </View>

                            {/* Show all team members with name and email */}
                            {item.members && item.members.length > 0 && (
                                <View style={styles.membersList}>
                                    <Text style={[styles.membersHeader, { color: colors.icon }]}>All Team Members:</Text>
                                    {item.members.map((member: any, index: number) => (
                                        <View key={index} style={styles.memberItem}>
                                            <Ionicons
                                                name={member.isLeader ? "star" : "person-circle-outline"}
                                                size={14}
                                                color={member.isLeader ? colors.warning : colors.icon}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.memberText, { color: colors.text, fontWeight: member.isLeader ? '600' : '400' }]}>
                                                    {member.name || `Member ${index + 1}`} {member.isLeader ? '(Leader)' : ''}
                                                </Text>
                                                <Text style={[styles.memberEmail, { color: colors.icon, fontSize: 12, marginTop: 2 }]}>
                                                    {member.email || 'No email provided'}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {item.assignedJudgeName && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                                    <Text style={[styles.infoLabel, { color: colors.icon }]}>Judge:</Text>
                                    <Text style={[styles.infoValue, { color: colors.success }]}>
                                        {item.assignedJudgeName}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Idea Description */}
                        {item.ideaDescription && (
                            <View style={[styles.ideaSection, { borderLeftColor: colors.secondary }]}>
                                <View style={styles.ideaHeader}>
                                    <Ionicons name="bulb" size={18} color={colors.secondary} />
                                    <Text style={[styles.ideaTitle, { color: colors.text }]}>Project Idea</Text>
                                </View>
                                <Text style={[styles.ideaText, { color: colors.text }]}>
                                    {item.ideaDescription}
                                </Text>
                            </View>
                        )}

                        {/* Presentation View Button */}
                        {(item.presentationImages && item.presentationImages.length > 0) || item.ideaPPTUrl ? (
                            <TouchableOpacity
                                style={[styles.pptButton, { backgroundColor: colors.secondary }]}
                                onPress={() => {
                                    if (item.presentationImages && item.presentationImages.length > 0) {
                                        handleOpenPPT(item.presentationImages, item.teamName);
                                    } else if (item.ideaPPTUrl) {
                                        // Fallback for old PDF/PPT uploads
                                        WebBrowser.openBrowserAsync(item.ideaPPTUrl);
                                    }
                                }}
                            >
                                <Ionicons name="images" size={20} color="#fff" />
                                <Text style={styles.pptButtonText}>
                                    View Presentation {item.presentationImageCount ? `(${item.presentationImageCount} slides)` : ''}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color="#fff" />
                            </TouchableOpacity>
                        ) : null}

                        {/* Actions */}
                        <View style={styles.actions}>
                            {!item.assignedJudgeId && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                    onPress={() => handleAssignJudge(item.id, item.teamName)}
                                >
                                    <Ionicons name="person-add" size={18} color="#fff" />
                                    <Text style={styles.actionButtonText}>Assign Judge</Text>
                                </TouchableOpacity>
                            )}

                            {item.assignedJudgeId && !item.evaluatedBy && (
                                <View style={[styles.statusBadge, { backgroundColor: '#f59e0b20' }]}>
                                    <Text style={[styles.statusText, { color: '#f59e0b' }]}>
                                        Waiting for evaluation
                                    </Text>
                                </View>
                            )}

                            {filter === 'reviewed' && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                                    onPress={() => handleApproveTeam(item.id, item.teamName)}
                                >
                                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                    <Text style={styles.actionButtonText}>Select Team</Text>
                                </TouchableOpacity>
                            )}

                            {item.status === 'selected' && (
                                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                                    <Ionicons name="trophy" size={16} color={colors.success} />
                                    <Text style={[styles.statusText, { color: colors.success }]}>Selected</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        );
    };

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
                <Text style={[styles.headerTitle, { color: colors.text }]}>{filterTitle}</Text>
                <View style={styles.backButton} />
            </View>

            {teams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                        No teams in this category
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={teams}
                    renderItem={renderTeamCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Image Gallery Viewer */}
            {selectedPresentation && (
                <ImageGalleryViewer
                    visible={galleryVisible}
                    onClose={() => {
                        setGalleryVisible(false);
                        setSelectedPresentation(null);
                    }}
                    images={selectedPresentation.images}
                    fileName={selectedPresentation.name}
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
    listContent: {
        padding: 16,
    },
    teamCard: {
        borderRadius: 16,
        padding: 0,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    compactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    compactTeamName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    compactMarksBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    compactMarksText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    compactAssignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 14,
        marginBottom: 10,
    },
    compactAssignText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    compactJudgeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
        marginHorizontal: 14,
        marginBottom: 10,
        borderRadius: 6,
    },
    compactJudgeText: {
        fontSize: 13,
        fontWeight: '500',
    },
    expandedContent: {
        padding: 14,
        paddingTop: 0,
    },
    detailsSection: {
        marginBottom: 12,
        paddingTop: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    membersList: {
        marginTop: 8,
        paddingLeft: 8,
    },
    membersHeader: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        paddingLeft: 8,
    },
    memberText: {
        fontSize: 13,
    },
    memberEmail: {
        fontSize: 12,
        marginTop: 2,
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
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    ideaSection: {
        marginTop: 12,
        marginBottom: 12,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#6366f1',
    },
    ideaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    ideaTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    ideaText: {
        fontSize: 14,
        lineHeight: 20,
    },
    pptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    pptButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    ideaPreview: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
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
        fontWeight: '600',
        fontSize: 14,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginLeft: 'auto',
    },
    viewButtonText: {
        fontWeight: '600',
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
    },
});
