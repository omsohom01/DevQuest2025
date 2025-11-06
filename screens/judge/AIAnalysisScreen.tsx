import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface TeamIdea {
    id: string;
    teamName: string;
    ideaDescription: string;
}

interface SimilarityGroup {
    teams: TeamIdea[];
    reason: string;
    similarityScore: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export default function AIAnalysisScreen({ route, navigation }: any) {
    const { hackathonId } = route.params;
    const [teams, setTeams] = useState<TeamIdea[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<SimilarityGroup[]>([]);
    const [uniqueIdeas, setUniqueIdeas] = useState<TeamIdea[]>([]);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const currentUserId = auth.currentUser?.uid;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const sparkleRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous sparkle rotation
        Animated.loop(
            Animated.timing(sparkleRotate, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const sparkleRotation = sparkleRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    useEffect(() => {
        loadTeams();
    }, [hackathonId, currentUserId]);

    const loadTeams = async () => {
        if (!currentUserId) return;

        try {
            const teamsQuery = query(
                collection(db, 'registrations'),
                where('hackathonId', '==', hackathonId),
                where('assignedJudgeId', '==', currentUserId)
            );

            const snapshot = await getDocs(teamsQuery);
            const teamsData: TeamIdea[] = [];

            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.ideaDescription) {
                    teamsData.push({
                        id: docSnap.id,
                        teamName: data.teamName,
                        ideaDescription: data.ideaDescription,
                    });
                }
            });

            setTeams(teamsData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading teams:', error);
            Alert.alert('Error', 'Failed to load teams');
            setLoading(false);
        }
    };

    const analyzeIdeasWithAI = async () => {
        if (teams.length === 0) {
            Alert.alert('No Ideas', 'There are no team ideas to analyze.');
            return;
        }

        setAnalyzing(true);

        try {
            // Prepare the prompt for Gemini
            const teamsDescription = teams
                .map((team, index) => `Team ${index + 1}: "${team.teamName}"\nIdea: ${team.ideaDescription}`)
                .join('\n\n');

            const prompt = `You are an expert hackathon judge analyzing team project ideas. Analyze the following team ideas and identify which ideas are similar or related to each other.

${teamsDescription}

Please provide a detailed analysis in the following JSON format:
{
  "similarityGroups": [
    {
      "teamIndices": [array of team numbers that are similar, e.g., [1, 3]],
      "reason": "Detailed explanation of why these ideas are similar (mention specific aspects like technology stack, problem domain, target audience, features, or approach)",
      "similarityScore": "High/Medium" (based on how similar they are)
    }
  ],
  "uniqueTeams": [array of team numbers that have unique ideas not similar to others]
}

Guidelines:
- Consider ideas similar if they:
  * Address the same problem domain or target audience
  * Use similar technology stacks or approaches
  * Have overlapping core features or functionalities
  * Solve related use cases in the same industry
- Mark as "High" similarity if ideas are very similar in concept and execution
- Mark as "Medium" similarity if ideas are related but have different approaches
- Only group teams if there's genuine similarity - it's okay if most ideas are unique
- Be specific in your reasoning - mention exact features, technologies, or problem areas that overlap
- If all ideas are unique, return an empty similarityGroups array

Respond ONLY with valid JSON, no additional text.`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.3,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 2048,
                        },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const generatedText = data.candidates[0]?.content?.parts[0]?.text;

            if (!generatedText) {
                throw new Error('No response from AI');
            }

            // Parse the JSON response
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid AI response format');
            }

            const analysisResult = JSON.parse(jsonMatch[0]);

            // Convert team indices to actual team data
            const similarityGroups: SimilarityGroup[] = [];
            const uniqueTeamIndices = new Set(analysisResult.uniqueTeams || []);

            if (analysisResult.similarityGroups) {
                analysisResult.similarityGroups.forEach((group: any) => {
                    const groupTeams = group.teamIndices.map((index: number) => teams[index - 1]);
                    similarityGroups.push({
                        teams: groupTeams,
                        reason: group.reason,
                        similarityScore: group.similarityScore,
                    });

                    // Remove these teams from unique list
                    group.teamIndices.forEach((index: number) => uniqueTeamIndices.delete(index));
                });
            }

            // Get unique teams
            const uniqueTeamsList = Array.from(uniqueTeamIndices)
                .map((index) => teams[(index as number) - 1])
                .filter(Boolean);

            setAnalysis(similarityGroups);
            setUniqueIdeas(uniqueTeamsList);
            setAnalyzing(false);
        } catch (error: any) {
            console.error('Error analyzing ideas:', error);
            Alert.alert(
                'Analysis Failed',
                'Failed to analyze ideas with AI. Please try again.',
                [{ text: 'OK' }]
            );
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.icon }]}>
                    Loading team ideas...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Enhanced Header with Gradient */}
            <LinearGradient
                colors={[colors.primary, colors.primary + 'E6']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Idea Analysis</Text>
                <Animated.View style={{ transform: [{ rotate: sparkleRotation }] }}>
                    <Ionicons name="sparkles" size={24} color="#fff" />
                </Animated.View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    }}
                >
                    {/* Enhanced Info Card with Gradient */}
                    <LinearGradient
                        colors={[colors.primary + '15', colors.primary + '08']}
                        style={styles.infoCard}
                    >
                        <View style={[styles.infoIconBg, { backgroundColor: colors.primary + '25' }]}>
                            <Ionicons name="bulb" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={[styles.infoTitle, { color: colors.primary }]}>
                                AI-Powered Analysis
                            </Text>
                            <Text style={[styles.infoText, { color: colors.icon }]}>
                                Our AI analyzes all team ideas to identify patterns, similarities, and unique innovations.
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Enhanced Stats Card with Gradient */}
                    <LinearGradient
                        colors={[colors.success + '15', colors.success + '08']}
                        style={styles.statsCard}
                    >
                        <View style={[styles.statIconBg, { backgroundColor: colors.success + '25' }]}>
                            <Ionicons name="people" size={32} color={colors.success} />
                        </View>
                        <Text style={[styles.statNumber, { color: colors.success }]}>
                            {teams.length}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.icon }]}>
                            Total Teams Analyzed
                        </Text>
                    </LinearGradient>

                    {analysis.length === 0 && uniqueIdeas.length === 0 ? (
                        <TouchableOpacity
                            style={styles.analyzeButton}
                            onPress={analyzeIdeasWithAI}
                            disabled={analyzing}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={analyzing ? [colors.primary + 'AA', colors.primary + '88'] : [colors.primary, colors.primary + 'DD']}
                                style={styles.analyzeButtonGradient}
                            >
                                {analyzing ? (
                                    <>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={styles.analyzeButtonText}>Analyzing with AI...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={26} color="#fff" />
                                        <Text style={styles.analyzeButtonText}>Analyze Ideas with AI</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {/* Enhanced Similar Ideas Section */}
                            {analysis.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionIconBg, { backgroundColor: colors.error + '15' }]}>
                                            <Ionicons name="git-compare" size={24} color={colors.error} />
                                        </View>
                                        <View style={styles.sectionTitleContainer}>
                                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                                Similar Ideas Found
                                            </Text>
                                            <Text style={[styles.sectionCount, { color: colors.icon }]}>
                                                {analysis.length} group{analysis.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {analysis.map((group, groupIndex) => (
                                        <View
                                            key={groupIndex}
                                            style={[
                                                styles.groupCard,
                                                { backgroundColor: colors.card },
                                            ]}
                                        >
                                            {/* Similarity Badge with Gradient */}
                                            <LinearGradient
                                                colors={
                                                    group.similarityScore === 'High'
                                                        ? [colors.error + '15', colors.error + '08']
                                                        : [colors.warning + '15', colors.warning + '08']
                                                }
                                                style={styles.similarityBadge}
                                            >
                                                <Ionicons
                                                    name="git-compare"
                                                    size={18}
                                                    color={
                                                        group.similarityScore === 'High'
                                                            ? colors.error
                                                            : colors.warning
                                                    }
                                                />
                                                <Text
                                                    style={[
                                                        styles.similarityText,
                                                        {
                                                            color:
                                                                group.similarityScore === 'High'
                                                                    ? colors.error
                                                                    : colors.warning,
                                                        },
                                                    ]}
                                                >
                                                    {group.similarityScore} Similarity
                                                </Text>
                                            </LinearGradient>

                                            {/* Reason Section */}
                                            <View style={[styles.reasonContainer, { backgroundColor: colors.background }]}>
                                                <View style={styles.reasonHeader}>
                                                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                                                    <Text style={[styles.reasonTitle, { color: colors.text }]}>
                                                        Why these ideas are similar
                                                    </Text>
                                                </View>
                                                <Text style={[styles.reasonText, { color: colors.icon }]}>
                                                    {group.reason}
                                                </Text>
                                            </View>

                                            {/* Teams in Group */}
                                            <View style={styles.teamsInGroup}>
                                                <Text
                                                    style={[
                                                        styles.teamsInGroupTitle,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    Teams in this group ({group.teams.length})
                                                </Text>
                                                {group.teams.map((team, teamIndex) => (
                                                    <View
                                                        key={team.id}
                                                        style={[
                                                            styles.teamInGroupCard,
                                                            { backgroundColor: colors.background },
                                                        ]}
                                                    >
                                                        <View style={[styles.teamIconBg, { backgroundColor: colors.primary + '15' }]}>
                                                            <Ionicons
                                                                name="people"
                                                                size={20}
                                                                color={colors.primary}
                                                            />
                                                        </View>
                                                        <View style={styles.teamInGroupInfo}>
                                                            <Text
                                                                style={[
                                                                    styles.teamInGroupName,
                                                                    { color: colors.text },
                                                                ]}
                                                            >
                                                                {team.teamName}
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.teamInGroupIdea,
                                                                    { color: colors.icon },
                                                                ]}
                                                                numberOfLines={3}
                                                            >
                                                                {team.ideaDescription}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Enhanced Unique Ideas Section */}
                            {uniqueIdeas.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionIconBg, { backgroundColor: colors.success + '15' }]}>
                                            <Ionicons name="star" size={24} color={colors.success} />
                                        </View>
                                        <View style={styles.sectionTitleContainer}>
                                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                                Unique Ideas
                                            </Text>
                                            <Text style={[styles.sectionCount, { color: colors.icon }]}>
                                                {uniqueIdeas.length} team{uniqueIdeas.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.sectionSubtitle, { color: colors.icon }]}>
                                        These teams have distinct concepts not similar to others
                                    </Text>

                                    {uniqueIdeas.map((team, index) => (
                                        <LinearGradient
                                            key={team.id}
                                            colors={[colors.success + '08', colors.success + '04']}
                                            style={styles.uniqueTeamCard}
                                        >
                                            <View style={styles.uniqueTeamHeader}>
                                                <View style={[styles.uniqueStarBg, { backgroundColor: colors.success + '15' }]}>
                                                    <Ionicons
                                                        name="star"
                                                        size={22}
                                                        color={colors.success}
                                                    />
                                                </View>
                                                <Text
                                                    style={[
                                                        styles.uniqueTeamName,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {team.teamName}
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.uniqueTeamIdea,
                                                    { color: colors.icon },
                                                ]}
                                            >
                                                {team.ideaDescription}
                                            </Text>
                                        </LinearGradient>
                                    ))}
                                </View>
                            )}

                            {/* Enhanced Re-analyze Button */}
                            <TouchableOpacity
                                style={[styles.reanalyzeButton, { borderColor: colors.primary + '30' }]}
                                onPress={analyzeIdeasWithAI}
                                disabled={analyzing}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.reanalyzeIconBg, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="refresh" size={22} color={colors.primary} />
                                </View>
                                <Text style={[styles.reanalyzeText, { color: colors.primary }]}>
                                    Re-analyze Ideas
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            </ScrollView>
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
        paddingHorizontal: 16,
        paddingVertical: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 15,
        lineHeight: 22,
    },
    statsCard: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statNumber: {
        fontSize: 42,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 16,
        marginTop: 6,
    },
    analyzeButton: {
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    analyzeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 12,
    },
    analyzeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sectionTitleContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    sectionCount: {
        fontSize: 14,
        fontWeight: '500',
    },
    sectionSubtitle: {
        fontSize: 15,
        marginBottom: 16,
        marginLeft: 60,
    },
    groupCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    similarityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 8,
        marginBottom: 16,
    },
    similarityText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    reasonContainer: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    reasonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    reasonTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    reasonText: {
        fontSize: 15,
        lineHeight: 22,
    },
    teamsInGroup: {
        marginTop: 8,
    },
    teamsInGroupTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 14,
    },
    teamInGroupCard: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 16,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    teamIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamInGroupInfo: {
        flex: 1,
        marginLeft: 14,
    },
    teamInGroupName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    teamInGroupIdea: {
        fontSize: 14,
        lineHeight: 20,
    },
    uniqueTeamCard: {
        padding: 18,
        borderRadius: 20,
        marginBottom: 14,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    uniqueTeamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    uniqueStarBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uniqueTeamName: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    uniqueTeamIdea: {
        fontSize: 15,
        lineHeight: 22,
    },
    reanalyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 20,
        gap: 10,
        borderWidth: 2,
    },
    reanalyzeIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reanalyzeText: {
        fontSize: 17,
        fontWeight: '600',
    },
});
