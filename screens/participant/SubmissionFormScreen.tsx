import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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

export default function SubmissionFormScreen({ navigation }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [significance, setSignificance] = useState('');
    const [highlights, setHighlights] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleSubmit = async () => {
        if (!title || !description || !significance || !highlights) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'submissions'), {
                title,
                description,
                significance,
                highlights,
                status: 'pending',
                teamId: user?.uid,
                teamName: user?.name,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            Alert.alert('Success', 'Your problem statement has been submitted successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setTitle('');
                        setDescription('');
                        setSignificance('');
                        setHighlights('');
                        navigation.navigate('MySubmissions');
                    },
                },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.header}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.iconContainer}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="document-text" size={32} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Submit Problem Statement
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
                            All fields are mandatory
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Title <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Enter a concise title"
                                    placeholderTextColor={colors.icon}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Detailed Problem Description <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <View style={[styles.textAreaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.textArea, { color: colors.text }]}
                                    placeholder="Describe the problem in detail"
                                    placeholderTextColor={colors.icon}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Significance/Impact <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <View style={[styles.textAreaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.textArea, { color: colors.text }]}
                                    placeholder="Why is this problem important?"
                                    placeholderTextColor={colors.icon}
                                    value={significance}
                                    onChangeText={setSignificance}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Unique Highlights <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <View style={[styles.textAreaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.textArea, { color: colors.text }]}
                                    placeholder="What makes this problem unique?"
                                    placeholderTextColor={colors.icon}
                                    value={highlights}
                                    onChangeText={setHighlights}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleSubmit}
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
                                        <Text style={styles.buttonText}>Submit</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
    },
    form: {
        width: '100%',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
    },
    textAreaContainer: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textArea: {
        fontSize: 16,
        minHeight: 100,
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
