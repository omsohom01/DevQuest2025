import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ProblemSubmission, SubmissionStatus, User } from '../../types';

export default function SubmissionManagementScreen({ route, navigation }: any) {
    const { submission } = route.params as { submission: ProblemSubmission };
    const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus>(submission.status);
    const [selectedJudge, setSelectedJudge] = useState(submission.assignedJudge || '');
    const [judges, setJudges] = useState<User[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingJudges, setLoadingJudges] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        // Fetch all judges
        const fetchJudges = async () => {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', 'judge'));
            const snapshot = await getDocs(q);
            const judgesData = snapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data(),
            })) as User[];
            setJudges(judgesData);
            setLoadingJudges(false);
        };

        fetchJudges();

        // Fetch evaluations for this submission
        const evaluationsQuery = query(
            collection(db, 'evaluations'),
            where('submissionId', '==', submission.id)
        );
        const unsubscribe = onSnapshot(evaluationsQuery, (snapshot) => {
            const evaluationsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            }));
            setEvaluations(evaluationsData);
        });

        return () => unsubscribe();
    }, [submission.id]);

    const handleUpdateStatus = async () => {
        if (selectedStatus === submission.status) {
            Alert.alert('No Change', 'Status is already set to this value');
            return;
        }

        setLoading(true);
        try {
            await updateDoc(doc(db, 'submissions', submission.id), {
                status: selectedStatus,
            });
            Alert.alert('Success', 'Status updated successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignJudge = async () => {
        if (!selectedJudge) {
            Alert.alert('Error', 'Please select a judge');
            return;
        }

        if (selectedJudge === submission.assignedJudge) {
            Alert.alert('No Change', 'This judge is already assigned');
            return;
        }

        setLoading(true);
        try {
            const judge = judges.find((j) => j.uid === selectedJudge);
            await updateDoc(doc(db, 'submissions', submission.id), {
                assignedJudge: selectedJudge,
                assignedJudgeName: judge?.name,
            });
            Alert.alert('Success', 'Judge assigned successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
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

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name="settings" size={48} color="#fff" />
                <Text style={styles.headerTitle}>Manage Submission</Text>
            </LinearGradient>

            <View style={styles.content}>
                {/* Submission Details */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Submission Details</Text>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon }]}>Title:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{submission.title}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon }]}>Team:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{submission.teamName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.icon }]}>Current Status:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(submission.status) }]}>
                                {submission.status.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                        <Text style={[styles.sectionContent, { color: colors.text }]}>
                            {submission.description}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Significance</Text>
                        <Text style={[styles.sectionContent, { color: colors.text }]}>
                            {submission.significance}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlights</Text>
                        <Text style={[styles.sectionContent, { color: colors.text }]}>
                            {submission.highlights}
                        </Text>
                    </View>
                </View>

                {/* Evaluations */}
                {evaluations.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Evaluations</Text>
                        {evaluations.map((evaluation) => (
                            <View key={evaluation.id} style={[styles.evaluationItem, { backgroundColor: colors.background }]}>
                                <View style={styles.evaluationHeader}>
                                    <Text style={[styles.judgeName, { color: colors.text }]}>{evaluation.judgeName}</Text>
                                    <View style={[styles.scoreCircle, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                                        <Text style={[styles.scoreText, { color: colors.primary }]}>{evaluation.score}/10</Text>
                                    </View>
                                </View>
                                <Text style={[styles.feedback, { color: colors.text }]}>{evaluation.feedback}</Text>
                                <View style={styles.recommendation}>
                                    <Ionicons
                                        name={evaluation.shortlistRecommendation ? 'star' : 'star-outline'}
                                        size={16}
                                        color={evaluation.shortlistRecommendation ? colors.success : colors.icon}
                                    />
                                    <Text
                                        style={[
                                            styles.recommendationText,
                                            { color: evaluation.shortlistRecommendation ? colors.success : colors.icon },
                                        ]}
                                    >
                                        {evaluation.shortlistRecommendation ? 'Recommended' : 'Not Recommended'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Admin Actions */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Admin Actions</Text>

                    <View style={styles.actionSection}>
                        <View style={styles.actionHeader}>
                            <Ionicons name="flag" size={20} color={colors.primary} />
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Set Status</Text>
                        </View>
                        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Picker
                                selectedValue={selectedStatus}
                                onValueChange={(itemValue: any) => setSelectedStatus(itemValue)}
                                style={[styles.picker, { color: colors.text }]}
                            >
                                <Picker.Item label="Pending" value="pending" />
                                <Picker.Item label="Under Review" value="under_review" />
                                <Picker.Item label="Shortlisted" value="shortlisted" />
                                <Picker.Item label="Selected" value="selected" />
                                <Picker.Item label="Not Selected" value="not_selected" />
                            </Picker>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionButton, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleUpdateStatus}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Update Status</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.actionSection}>
                        <View style={styles.actionHeader}>
                            <Ionicons name="person-add" size={20} color={colors.primary} />
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Assign Judge</Text>
                        </View>
                        {loadingJudges ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <>
                                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <Picker
                                        selectedValue={selectedJudge}
                                        onValueChange={(itemValue: any) => setSelectedJudge(itemValue)}
                                        style={[styles.picker, { color: colors.text }]}
                                    >
                                        <Picker.Item label="Select a judge..." value="" />
                                        {judges.map((judge) => (
                                            <Picker.Item key={judge.uid} label={judge.name} value={judge.uid} />
                                        ))}
                                    </Picker>
                                </View>
                                <TouchableOpacity
                                    style={[styles.actionButton, { opacity: loading ? 0.7 : 1 }]}
                                    onPress={handleAssignJudge}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={[colors.accent, colors.success]}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>Assign Judge</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
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
    header: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
    },
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        width: 120,
    },
    detailValue: {
        fontSize: 14,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 14,
        lineHeight: 20,
    },
    evaluationItem: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    evaluationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    judgeName: {
        fontSize: 14,
        fontWeight: '600',
    },
    scoreCircle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 2,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    feedback: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    recommendation: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendationText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '500',
    },
    actionSection: {
        marginBottom: 16,
    },
    actionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 12,
        height: 48,
        justifyContent: 'center',
    },
    picker: {
        height: 48,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
