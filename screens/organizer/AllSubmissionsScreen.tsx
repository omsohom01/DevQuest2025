import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ProblemSubmission, SubmissionStatus } from '../../types';

export default function AllSubmissionsScreen({ navigation, route }: any) {
    const hackathonId = route?.params?.hackathonId;
    const [submissions, setSubmissions] = useState<ProblemSubmission[]>([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState<ProblemSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        // If hackathonId is provided, filter submissions by hackathonId
        // Otherwise, show all submissions
        // Note: Removed orderBy to avoid requiring a composite index in Firestore
        // We'll sort in memory instead
        const q = hackathonId
            ? query(
                collection(db, 'submissions'),
                where('hackathonId', '==', hackathonId)
            )
            : query(collection(db, 'submissions'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const submissionsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as ProblemSubmission[];

            // Sort by createdAt in memory (descending - newest first)
            submissionsData.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });

            setSubmissions(submissionsData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [hackathonId]);

    useEffect(() => {
        let filtered = submissions;

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((sub) => sub.status === statusFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (sub) =>
                    sub.title.toLowerCase().includes(query) ||
                    sub.teamName.toLowerCase().includes(query) ||
                    sub.description.toLowerCase().includes(query)
            );
        }

        setFilteredSubmissions(filtered);
    }, [submissions, statusFilter, searchQuery]);

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
                return 'Pending';
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

    const renderSubmissionItem = ({ item }: { item: ProblemSubmission }) => (
        <TouchableOpacity
            style={[styles.submissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('SubmissionManagement', { submission: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                    <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                    <View style={styles.titleContent}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <View style={styles.teamContainer}>
                            <Ionicons name="people" size={14} color={colors.icon} />
                            <Text style={[styles.teamName, { color: colors.icon }]}>{item.teamName}</Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
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
                        <Text style={[styles.judgeText, { color: colors.icon }]}>{item.assignedJudgeName}</Text>
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
            {hackathonId && (
                <View style={[styles.hackathonFilterBanner, { backgroundColor: colors.primary + '20', borderBottomColor: colors.primary }]}>
                    <Ionicons name="funnel" size={20} color={colors.primary} />
                    <Text style={[styles.hackathonFilterText, { color: colors.primary }]}>
                        Showing submissions for selected hackathon
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.setParams({ hackathonId: undefined })}
                        style={styles.clearFilterButton}
                    >
                        <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear Filter</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={[styles.filterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.icon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search submissions..."
                        placeholderTextColor={colors.icon}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.icon} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="filter" size={20} color={colors.icon} style={styles.pickerIcon} />
                    <Picker
                        selectedValue={statusFilter}
                        onValueChange={(itemValue: any) => setStatusFilter(itemValue)}
                        style={[styles.picker, { color: colors.text }]}
                    >
                        <Picker.Item label="All Status" value="all" />
                        <Picker.Item label="Pending" value="pending" />
                        <Picker.Item label="Under Review" value="under_review" />
                        <Picker.Item label="Shortlisted" value="shortlisted" />
                        <Picker.Item label="Selected" value="selected" />
                        <Picker.Item label="Not Selected" value="not_selected" />
                    </Picker>
                </View>

                <Text style={[styles.resultCount, { color: colors.icon }]}>
                    {filteredSubmissions.length} result{filteredSubmissions.length !== 1 ? 's' : ''}
                </Text>
            </View>

            <FlatList
                data={filteredSubmissions}
                renderItem={renderSubmissionItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={80} color={colors.icon} />
                        <Text style={[styles.emptyText, { color: colors.icon }]}>No submissions found</Text>
                        <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                            Try adjusting your search or filters
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
    filterContainer: {
        padding: 16,
        borderBottomWidth: 1,
    },
    hackathonFilterBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 2,
        gap: 8,
    },
    hackathonFilterText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    clearFilterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    clearFilterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 8,
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingLeft: 16,
        height: 48,
        marginBottom: 8,
    },
    pickerIcon: {
        marginRight: 8,
    },
    picker: {
        flex: 1,
        height: 48,
    },
    resultCount: {
        fontSize: 12,
        textAlign: 'center',
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
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleContent: {
        flex: 1,
        marginLeft: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    teamContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teamName: {
        fontSize: 14,
        marginLeft: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
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
