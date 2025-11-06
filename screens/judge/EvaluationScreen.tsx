import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ProblemSubmission } from '../../types';

export default function EvaluationScreen({ route, navigation }: any) {
    const { submission } = route.params as { submission: ProblemSubmission };
    const [score, setScore] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [shortlistRecommendation, setShortlistRecommendation] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleSubmitEvaluation = async () => {
        if (!feedback.trim()) {
            Alert.alert('Error', 'Please provide feedback');
            return;
        }

        setLoading(true);
        try {
            // Add evaluation to Firestore
            await addDoc(collection(db, 'evaluations'), {
                submissionId: submission.id,
                judgeId: user?.uid,
                judgeName: user?.name,
                score,
                feedback,
                shortlistRecommendation,
                createdAt: serverTimestamp(),
            });

            // Update submission status
            await updateDoc(doc(db, 'submissions', submission.id), {
                status: 'under_review',
                updatedAt: serverTimestamp(),
            });

            Alert.alert('Success', 'Evaluation submitted successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Submission Details */}
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="document-text" size={48} color="#fff" />
                    <Text style={styles.headerTitle}>{submission.title}</Text>
                    <View style={styles.teamBadge}>
                        <Ionicons name="people" size={16} color="#fff" />
                        <Text style={styles.teamText}>{submission.teamName}</Text>
                    </View>
                </LinearGradient>

                {/* Problem Statement Content */}
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
                </View>

                {/* Evaluation Form */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.evaluationHeader}>
                        <LinearGradient
                            colors={[colors.accent, colors.success]}
                            style={styles.evaluationIconContainer}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="create" size={32} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.evaluationTitle, { color: colors.text }]}>Your Evaluation</Text>
                    </View>

                    {/* Score Slider */}
                    <View style={styles.formSection}>
                        <View style={styles.formHeader}>
                            <Ionicons name="bar-chart" size={20} color={colors.primary} />
                            <Text style={[styles.formLabel, { color: colors.text }]}>Score (1-10)</Text>
                        </View>
                        <View style={[styles.scoreContainer, { backgroundColor: colors.background }]}>
                            <Text style={[styles.scoreValue, { color: colors.primary }]}>{score}</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={10}
                            step={1}
                            value={score}
                            onValueChange={setScore}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.primary}
                        />
                        <View style={styles.sliderLabels}>
                            <Text style={[styles.sliderLabel, { color: colors.icon }]}>Poor</Text>
                            <Text style={[styles.sliderLabel, { color: colors.icon }]}>Excellent</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Feedback */}
                    <View style={styles.formSection}>
                        <View style={styles.formHeader}>
                            <Ionicons name="chatbox" size={20} color={colors.primary} />
                            <Text style={[styles.formLabel, { color: colors.text }]}>Feedback/Notes *</Text>
                        </View>
                        <View style={[styles.textAreaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.textArea, { color: colors.text }]}
                                placeholder="Provide detailed feedback..."
                                placeholderTextColor={colors.icon}
                                value={feedback}
                                onChangeText={setFeedback}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Shortlist Recommendation */}
                    <View style={styles.formSection}>
                        <View style={styles.formHeader}>
                            <Ionicons name="star" size={20} color={colors.primary} />
                            <Text style={[styles.formLabel, { color: colors.text }]}>Shortlist Recommendation</Text>
                        </View>
                        <View style={styles.switchContainer}>
                            <Text style={[styles.switchLabel, { color: colors.icon }]}>
                                {shortlistRecommendation ? 'YES - Recommend for shortlist' : 'NO - Do not recommend'}
                            </Text>
                            <Switch
                                value={shortlistRecommendation}
                                onValueChange={setShortlistRecommendation}
                                trackColor={{ false: colors.border, true: colors.success }}
                                thumbColor={shortlistRecommendation ? colors.accent : colors.icon}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSubmitEvaluation}
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
                                <>
                                    <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.buttonIcon} />
                                    <Text style={styles.buttonText}>Submit Evaluation</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
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
        marginBottom: 12,
        textAlign: 'center',
    },
    teamBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    teamText: {
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
    evaluationHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    evaluationIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    evaluationTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    formSection: {
        marginBottom: 20,
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    scoreContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    sliderLabel: {
        fontSize: 12,
    },
    textAreaContainer: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textArea: {
        fontSize: 16,
        minHeight: 120,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    switchLabel: {
        fontSize: 14,
        flex: 1,
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonGradient: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
