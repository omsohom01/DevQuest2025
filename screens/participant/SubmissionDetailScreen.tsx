import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ProblemSubmission } from '../../types';

export default function SubmissionDetailScreen({ route }: any) {
    const { submission } = route.params as { submission: ProblemSubmission };
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

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
                return 'Pending Review';
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return 'time-outline';
            case 'under_review':
                return 'eye-outline';
            case 'shortlisted':
            case 'selected':
                return 'checkmark-circle';
            case 'not_selected':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="document-text" size={48} color="#fff" />
                    <Text style={styles.headerTitle}>{submission.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name={getStatusIcon(submission.status) as any} size={20} color="#fff" />
                        <Text style={styles.statusText}>{getStatusLabel(submission.status)}</Text>
                    </View>
                </LinearGradient>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Problem Description</Text>
                        </View>
                        <Text style={[styles.sectionContent, { color: colors.text }]}>
                            {submission.description}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="trending-up" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Significance/Impact</Text>
                        </View>
                        <Text style={[styles.sectionContent, { color: colors.text }]}>
                            {submission.significance}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="star" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Unique Highlights</Text>
                        </View>
                        <Text style={[styles.sectionContent, { color: colors.text }]}>
                            {submission.highlights}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar" size={20} color={colors.icon} />
                            <Text style={[styles.infoLabel, { color: colors.icon }]}>Submitted on:</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>
                                {submission.createdAt?.toLocaleDateString()}
                            </Text>
                        </View>

                        {submission.assignedJudgeName && (
                            <View style={styles.infoRow}>
                                <Ionicons name="person" size={20} color={colors.icon} />
                                <Text style={[styles.infoLabel, { color: colors.icon }]}>Assigned Judge:</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {submission.assignedJudgeName}
                                </Text>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Ionicons name={getStatusIcon(submission.status) as any} size={20} color={getStatusColor(submission.status)} />
                            <Text style={[styles.infoLabel, { color: colors.icon }]}>Status:</Text>
                            <Text style={[styles.infoValue, { color: getStatusColor(submission.status), fontWeight: '600' }]}>
                                {getStatusLabel(submission.status)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 24,
    },
    header: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    card: {
        margin: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    sectionContent: {
        fontSize: 16,
        lineHeight: 24,
    },
    divider: {
        height: 1,
        marginVertical: 20,
    },
    infoSection: {
        marginTop: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        marginLeft: 8,
        marginRight: 8,
    },
    infoValue: {
        fontSize: 14,
        flex: 1,
    },
});
