import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Linking from 'expo-linking';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ImageGalleryViewer from '../../components/ImageGalleryViewer';
import { auth, db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface TeamData {
    id: string;
    teamName: string;
    teamLeaderName: string;
    members: any[];
    ideaDescription: string;
    ideaPPT?: string;
    presentationImages?: string[];
    presentationImageCount?: number;
    evaluatedBy?: string;
    totalMarks?: number;
}

interface Evaluation {
    innovation: number;
    presentation: number;
    technicalApproach: number;
    novelty: number;
    feedback: string;
}

export default function TeamEvaluationScreen({ route, navigation }: any) {
    const { teamId, hackathonId } = route.params;
    const [team, setTeam] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [evaluation, setEvaluation] = useState<Evaluation>({
        innovation: 5,
        presentation: 5,
        technicalApproach: 5,
        novelty: 5,
        feedback: ''
    });
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const currentUserId = auth.currentUser?.uid;

    const totalMarks =
        evaluation.innovation +
        evaluation.presentation +
        evaluation.technicalApproach +
        evaluation.novelty;

    useEffect(() => {
        loadTeamDetails();
    }, [teamId]);

    const loadTeamDetails = async () => {
        try {
            const teamDoc = await getDoc(doc(db, 'registrations', teamId));
            if (!teamDoc.exists()) {
                Alert.alert('Error', 'Team not found');
                navigation.goBack();
                return;
            }

            const data = teamDoc.data();
            setTeam({
                id: teamDoc.id,
                teamName: data.teamName,
                teamLeaderName: data.teamLeaderName,
                members: data.members || [],
                ideaDescription: data.ideaDescription,
                ideaPPT: data.ideaPPT,
                presentationImages: data.presentationImages || [],
                presentationImageCount: data.presentationImageCount || 0,
                evaluatedBy: data.evaluatedBy,
                totalMarks: data.totalMarks
            });

            // If already evaluated, load existing scores
            if (data.evaluatedBy === currentUserId) {
                setEvaluation({
                    innovation: data.innovation || 5,
                    presentation: data.presentation || 5,
                    technicalApproach: data.technicalApproach || 5,
                    novelty: data.novelty || 5,
                    feedback: data.feedback || ''
                });
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPPT = () => {
        // Check for new presentation format (base64 images)
        if (team?.presentationImages && team.presentationImages.length > 0) {
            setGalleryVisible(true);
        }
        // Fallback to old format (file URL)
        else if (team?.ideaPPT) {
            Linking.openURL(team.ideaPPT);
        }
        else {
            Alert.alert('No Presentation', 'This team has not uploaded a presentation yet.');
        }
    };

    const handleSubmitEvaluation = async () => {
        if (!evaluation.feedback.trim()) {
            Alert.alert('Required', 'Please provide feedback for the team');
            return;
        }

        Alert.alert(
            'Submit Evaluation',
            `Total Score: ${totalMarks}/40\n\nAre you sure you want to submit this evaluation?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            // Create evaluation record
                            await addDoc(collection(db, 'evaluations'), {
                                teamId,
                                hackathonId,
                                judgeId: currentUserId,
                                innovation: evaluation.innovation,
                                presentation: evaluation.presentation,
                                technicalApproach: evaluation.technicalApproach,
                                novelty: evaluation.novelty,
                                totalMarks,
                                feedback: evaluation.feedback,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });

                            // Update registration with evaluation data
                            const teamRef = doc(db, 'registrations', teamId);
                            await updateDoc(teamRef, {
                                evaluatedBy: currentUserId,
                                innovation: evaluation.innovation,
                                presentation: evaluation.presentation,
                                technicalApproach: evaluation.technicalApproach,
                                novelty: evaluation.novelty,
                                totalMarks,
                                feedback: evaluation.feedback,
                                evaluatedAt: new Date()
                            });

                            Alert.alert('Success', 'Evaluation submitted successfully!');
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!team) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.text }]}>Team not found</Text>
            </View>
        );
    }

    const isAlreadyEvaluated = team.evaluatedBy && team.evaluatedBy === currentUserId;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Team Evaluation</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Team Info Card */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="people" size={24} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Team Information</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.icon }]}>Team Name:</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{team.teamName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.icon }]}>Team Leader:</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{team.teamLeaderName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.icon }]}>Team Size:</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                            {team.members.length + 1} members
                        </Text>
                    </View>
                </View>

                {/* Idea Description */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="bulb" size={24} color={colors.secondary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Idea Description</Text>
                    </View>
                    <Text style={[styles.ideaText, { color: colors.text }]}>{team.ideaDescription}</Text>
                </View>

                {/* View Presentation */}
                {(team.presentationImages && team.presentationImages.length > 0) || team.ideaPPT ? (
                    <TouchableOpacity
                        style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                        onPress={handleDownloadPPT}
                    >
                        <Ionicons name="images" size={20} color="#fff" />
                        <Text style={styles.downloadButtonText}>
                            {team.presentationImages && team.presentationImages.length > 0
                                ? `View Presentation (${team.presentationImageCount} slides)`
                                : 'View/Download Presentation'}
                        </Text>
                        <Ionicons name="eye" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : null}

                {/* Evaluation Form */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="clipboard" size={24} color={colors.accent} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Evaluation Criteria</Text>
                    </View>

                    {/* Innovation */}
                    <View style={styles.criteriaSection}>
                        <View style={styles.criteriaHeader}>
                            <Text style={[styles.criteriaLabel, { color: colors.text }]}>Innovation</Text>
                            <View style={[styles.marksBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.marksText}>{evaluation.innovation}/10</Text>
                            </View>
                        </View>
                        <Text style={[styles.criteriaDescription, { color: colors.icon }]}>
                            Originality and creativity of the solution
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10}
                            step={1}
                            value={evaluation.innovation}
                            onValueChange={isAlreadyEvaluated ? undefined : (value) => setEvaluation({ ...evaluation, innovation: value })}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.primary}
                        />
                    </View>

                    {/* Presentation */}
                    <View style={styles.criteriaSection}>
                        <View style={styles.criteriaHeader}>
                            <Text style={[styles.criteriaLabel, { color: colors.text }]}>Presentation</Text>
                            <View style={[styles.marksBadge, { backgroundColor: colors.secondary }]}>
                                <Text style={styles.marksText}>{evaluation.presentation}/10</Text>
                            </View>
                        </View>
                        <Text style={[styles.criteriaDescription, { color: colors.icon }]}>
                            Quality of presentation and communication
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10}
                            step={1}
                            value={evaluation.presentation}
                            onValueChange={isAlreadyEvaluated ? undefined : (value) => setEvaluation({ ...evaluation, presentation: value })}
                            minimumTrackTintColor={colors.secondary}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.secondary}
                        />
                    </View>

                    {/* Technical Approach */}
                    <View style={styles.criteriaSection}>
                        <View style={styles.criteriaHeader}>
                            <Text style={[styles.criteriaLabel, { color: colors.text }]}>Technical Approach</Text>
                            <View style={[styles.marksBadge, { backgroundColor: colors.success }]}>
                                <Text style={styles.marksText}>{evaluation.technicalApproach}/10</Text>
                            </View>
                        </View>
                        <Text style={[styles.criteriaDescription, { color: colors.icon }]}>
                            Technical implementation and feasibility
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10}
                            step={1}
                            value={evaluation.technicalApproach}
                            onValueChange={isAlreadyEvaluated ? undefined : (value) => setEvaluation({ ...evaluation, technicalApproach: value })}
                            minimumTrackTintColor={colors.success}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.success}
                        />
                    </View>

                    {/* Novelty */}
                    <View style={styles.criteriaSection}>
                        <View style={styles.criteriaHeader}>
                            <Text style={[styles.criteriaLabel, { color: colors.text }]}>Novelty</Text>
                            <View style={[styles.marksBadge, { backgroundColor: colors.accent }]}>
                                <Text style={styles.marksText}>{evaluation.novelty}/10</Text>
                            </View>
                        </View>
                        <Text style={[styles.criteriaDescription, { color: colors.icon }]}>
                            Uniqueness and potential impact
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10}
                            step={1}
                            value={evaluation.novelty}
                            onValueChange={isAlreadyEvaluated ? undefined : (value) => setEvaluation({ ...evaluation, novelty: value })}
                            minimumTrackTintColor={colors.accent}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.accent}
                        />
                    </View>

                    {/* Total Score */}
                    <View style={[styles.totalScoreContainer, { borderTopColor: colors.border }]}>
                        <Text style={[styles.totalScoreLabel, { color: colors.text }]}>Total Score</Text>
                        <Text style={[styles.totalScoreValue, { color: colors.primary }]}>
                            {totalMarks}/40
                        </Text>
                    </View>
                </View>

                {/* Feedback */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="chatbox-ellipses" size={24} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Feedback</Text>
                    </View>
                    <TextInput
                        style={[
                            styles.feedbackInput,
                            {
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderColor: colors.border
                            }
                        ]}
                        placeholder="Provide detailed feedback for the team..."
                        placeholderTextColor={colors.icon}
                        multiline
                        numberOfLines={6}
                        value={evaluation.feedback}
                        onChangeText={(text) => setEvaluation({ ...evaluation, feedback: text })}
                        editable={!isAlreadyEvaluated}
                    />
                </View>

                {/* Submit Button */}
                {!isAlreadyEvaluated && (
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: colors.primary },
                            submitting && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmitEvaluation}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.submitButtonText}>Submit Evaluation</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {isAlreadyEvaluated && (
                    <View style={[styles.evaluatedBanner, { backgroundColor: colors.success + '20' }]}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        <Text style={[styles.evaluatedText, { color: colors.success }]}>
                            You have already evaluated this team
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Image Gallery Modal */}
            {team?.presentationImages && team.presentationImages.length > 0 && (
                <ImageGalleryViewer
                    visible={galleryVisible}
                    onClose={() => setGalleryVisible(false)}
                    images={team.presentationImages}
                    fileName={`${team.teamName} - Presentation`}
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
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    card: {
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
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    ideaText: {
        fontSize: 15,
        lineHeight: 22,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    criteriaSection: {
        marginBottom: 24,
    },
    criteriaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    criteriaLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    criteriaDescription: {
        fontSize: 13,
        marginBottom: 8,
    },
    marksBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    marksText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    totalScoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 1,
    },
    totalScoreLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    totalScoreValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    feedbackInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        textAlignVertical: 'top',
        minHeight: 120,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    evaluatedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
    },
    evaluatedText: {
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
