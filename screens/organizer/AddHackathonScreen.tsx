import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { HackathonMode, HackathonTrack } from '../../types';

export default function AddHackathonScreen({ navigation }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [posterUri, setPosterUri] = useState<string | null>(null);
    const [prizePool, setPrizePool] = useState('');
    const [minTeamSize, setMinTeamSize] = useState('1');
    const [maxTeamSize, setMaxTeamSize] = useState('4');
    const [mode, setMode] = useState<HackathonMode>('online');
    const [venue, setVenue] = useState('');

    // Schedule dates with Date objects
    const [regStart, setRegStart] = useState<Date>(new Date());
    const [regEnd, setRegEnd] = useState<Date>(new Date());
    const [eventStart, setEventStart] = useState<Date>(new Date());
    const [eventEnd, setEventEnd] = useState<Date>(new Date());

    // Date picker visibility states
    const [showRegStartPicker, setShowRegStartPicker] = useState(false);
    const [showRegEndPicker, setShowRegEndPicker] = useState(false);
    const [showEventStartPicker, setShowEventStartPicker] = useState(false);
    const [showEventStartTimePicker, setShowEventStartTimePicker] = useState(false);
    const [showEventEndPicker, setShowEventEndPicker] = useState(false);
    const [showEventEndTimePicker, setShowEventEndTimePicker] = useState(false);

    // Tracks
    const [tracks, setTracks] = useState<HackathonTrack[]>([]);
    const [trackName, setTrackName] = useState('');
    const [trackDescription, setTrackDescription] = useState('');
    const [trackPrize, setTrackPrize] = useState('');

    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant photo library access');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPosterUri(result.assets[0].uri);
        }
    };

    const addTrack = () => {
        if (!trackName.trim()) {
            Alert.alert('Error', 'Track name is required');
            return;
        }

        const newTrack: HackathonTrack = {
            id: Date.now().toString(),
            name: trackName,
            description: trackDescription,
            prizePool: trackPrize ? parseFloat(trackPrize) : undefined,
        };

        setTracks([...tracks, newTrack]);
        setTrackName('');
        setTrackDescription('');
        setTrackPrize('');
        Alert.alert('Success', 'Track added!');
    };

    const removeTrack = (id: string) => {
        setTracks(tracks.filter(t => t.id !== id));
    };

    const handleSubmit = async () => {
        // Comprehensive validation
        const errors: string[] = [];

        // Required fields validation
        if (!title?.trim()) errors.push('• Title is required');
        if (!description?.trim()) errors.push('• Description is required');
        if (!prizePool?.trim()) errors.push('• Prize Pool is required');
        else if (isNaN(parseFloat(prizePool)) || parseFloat(prizePool) <= 0) {
            errors.push('• Prize Pool must be a valid positive number');
        }

        // Team size validation
        const minSize = parseInt(minTeamSize);
        const maxSize = parseInt(maxTeamSize);
        if (isNaN(minSize) || minSize < 1) {
            errors.push('• Minimum team size must be at least 1');
        }
        if (isNaN(maxSize) || maxSize < 1) {
            errors.push('• Maximum team size must be at least 1');
        }
        if (minSize > maxSize) {
            errors.push('• Minimum team size cannot be greater than maximum team size');
        }

        // Venue validation for offline/hybrid events
        if (mode !== 'online' && !venue?.trim()) {
            errors.push('• Venue is required for offline/hybrid events');
        }

        // Date validation
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to start of today
        const regStartDay = new Date(regStart);
        regStartDay.setHours(0, 0, 0, 0); // Set to start of regStart day

        if (regStartDay < now) {
            errors.push('• Registration start date cannot be in the past');
        }
        if (regEnd <= regStart) {
            errors.push('• Registration end date must be after registration start date');
        }
        if (eventStart <= regEnd) {
            errors.push('• Event start date must be after registration end date');
        }
        if (eventEnd <= eventStart) {
            errors.push('• Event end date must be after event start date');
        }

        // User validation
        if (!user || !user.uid) {
            errors.push('• User not authenticated');
        }
        if (!user?.name) {
            errors.push('• User name not found. Please update your profile');
        }

        // Track validation
        tracks.forEach((track, index) => {
            if (!track.name?.trim()) {
                errors.push(`• Track ${index + 1}: Name is required`);
            }
            if (track.prizePool && track.prizePool < 0) {
                errors.push(`• Track ${index + 1}: Prize pool cannot be negative`);
            }
        });

        // If there are errors, show them
        if (errors.length > 0) {
            Alert.alert(
                'Validation Error',
                'Please fix the following issues:\n\n' + errors.join('\n'),
                [{ text: 'OK' }]
            );
            return;
        }

        setLoading(true);
        try {
            // Final safety check
            if (!user) {
                Alert.alert('Error', 'User session expired. Please login again.');
                return;
            }

            const hackathonData = {
                organizerId: user.uid,
                organizerName: user.name || user.email || 'Unknown Organizer',
                title: title.trim(),
                description: description.trim(),
                posterUrl: posterUri || null,
                prizePool: parseFloat(prizePool),
                teamSize: {
                    min: minSize,
                    max: maxSize,
                },
                mode,
                venue: mode !== 'online' ? venue?.trim() : null,
                schedule: {
                    registrationStart: Timestamp.fromDate(regStart),
                    registrationEnd: Timestamp.fromDate(regEnd),
                    eventStart: Timestamp.fromDate(eventStart),
                    eventEnd: Timestamp.fromDate(eventEnd),
                },
                tracks: tracks.map(track => ({
                    ...track,
                    name: track.name.trim(),
                    description: track.description?.trim() || '',
                })),
                judges: [], // Initialize empty judges array
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'hackathons'), hackathonData);

            Alert.alert('Success', 'Hackathon created successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error: any) {
            console.error('Error creating hackathon:', error);
            let errorMessage = 'Failed to create hackathon. ';

            if (error.code === 'permission-denied') {
                errorMessage += 'You do not have permission to create hackathons.';
            } else if (error.code === 'unavailable') {
                errorMessage += 'Network error. Please check your connection and try again.';
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please try again later.';
            }

            Alert.alert('Error', errorMessage);
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
                            <Ionicons name="trophy" size={32} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Create New Hackathon
                        </Text>
                    </View>

                    {/* Poster Upload */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Hackathon Poster</Text>
                        <TouchableOpacity
                            style={[styles.posterButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={pickImage}
                        >
                            {posterUri ? (
                                <Image source={{ uri: posterUri }} style={styles.posterImage} />
                            ) : (
                                <>
                                    <Ionicons name="image-outline" size={48} color={colors.icon} />
                                    <Text style={[styles.posterText, { color: colors.icon }]}>Tap to upload poster</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Basic Info */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Enter hackathon title"
                            placeholderTextColor={colors.icon}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Describe your hackathon"
                            placeholderTextColor={colors.icon}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.label, { color: colors.text }]}>Total Prize Pool ($) *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g., 10000"
                            placeholderTextColor={colors.icon}
                            value={prizePool}
                            onChangeText={setPrizePool}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Team Size */}
                    <View style={styles.row}>
                        <View style={styles.halfSection}>
                            <Text style={[styles.label, { color: colors.text }]}>Min Team Size *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                value={minTeamSize}
                                onChangeText={setMinTeamSize}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.halfSection}>
                            <Text style={[styles.label, { color: colors.text }]}>Max Team Size *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                value={maxTeamSize}
                                onChangeText={setMaxTeamSize}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Mode */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: colors.text }]}>Mode *</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Picker
                                selectedValue={mode}
                                onValueChange={(value: HackathonMode) => setMode(value)}
                                style={[styles.picker, { color: colors.text }]}
                            >
                                <Picker.Item label="Online" value="online" />
                                <Picker.Item label="Offline" value="offline" />
                                <Picker.Item label="Hybrid" value="hybrid" />
                            </Picker>
                        </View>
                    </View>

                    {mode !== 'online' && (
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: colors.text }]}>Venue *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                placeholder="Enter venue address"
                                placeholderTextColor={colors.icon}
                                value={venue}
                                onChangeText={setVenue}
                            />
                        </View>
                    )}

                    {/* Schedule */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>

                        <Text style={[styles.label, { color: colors.text }]}>Registration Start *</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => setShowRegStartPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                            <Text style={[styles.dateButtonText, { color: colors.text }]}>
                                {regStart.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </Text>
                        </TouchableOpacity>
                        {showRegStartPicker && (
                            <DateTimePicker
                                value={regStart}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowRegStartPicker(false);
                                    if (selectedDate) setRegStart(selectedDate);
                                }}
                            />
                        )}

                        <Text style={[styles.label, { color: colors.text }]}>Registration End *</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => setShowRegEndPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                            <Text style={[styles.dateButtonText, { color: colors.text }]}>
                                {regEnd.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </Text>
                        </TouchableOpacity>
                        {showRegEndPicker && (
                            <DateTimePicker
                                value={regEnd}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowRegEndPicker(false);
                                    if (selectedDate) setRegEnd(selectedDate);
                                }}
                            />
                        )}

                        <Text style={[styles.label, { color: colors.text }]}>Event Start (Date & Time) *</Text>
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity
                                style={[styles.dateButton, styles.flexButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setShowEventStartPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                                    {eventStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateButton, styles.flexButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setShowEventStartTimePicker(true)}
                            >
                                <Ionicons name="time-outline" size={20} color={colors.icon} />
                                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                                    {eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {showEventStartPicker && (
                            <DateTimePicker
                                value={eventStart}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEventStartPicker(false);
                                    if (selectedDate) setEventStart(selectedDate);
                                }}
                            />
                        )}
                        {showEventStartTimePicker && (
                            <DateTimePicker
                                value={eventStart}
                                mode="time"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEventStartTimePicker(false);
                                    if (selectedDate) setEventStart(selectedDate);
                                }}
                            />
                        )}

                        <Text style={[styles.label, { color: colors.text }]}>Event End (Date & Time) *</Text>
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity
                                style={[styles.dateButton, styles.flexButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setShowEventEndPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                                    {eventEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateButton, styles.flexButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setShowEventEndTimePicker(true)}
                            >
                                <Ionicons name="time-outline" size={20} color={colors.icon} />
                                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                                    {eventEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {showEventEndPicker && (
                            <DateTimePicker
                                value={eventEnd}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEventEndPicker(false);
                                    if (selectedDate) setEventEnd(selectedDate);
                                }}
                            />
                        )}
                        {showEventEndTimePicker && (
                            <DateTimePicker
                                value={eventEnd}
                                mode="time"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEventEndTimePicker(false);
                                    if (selectedDate) setEventEnd(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    {/* Tracks */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracks (Optional)</Text>

                        {tracks.map((track) => (
                            <View key={track.id} style={[styles.trackCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <View style={styles.trackHeader}>
                                    <Text style={[styles.trackName, { color: colors.text }]}>{track.name}</Text>
                                    <TouchableOpacity onPress={() => removeTrack(track.id)}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.trackDesc, { color: colors.icon }]}>{track.description}</Text>
                                {track.prizePool && (
                                    <Text style={[styles.trackPrize, { color: colors.success }]}>
                                        Prize: ${track.prizePool}
                                    </Text>
                                )}
                            </View>
                        ))}

                        <View style={[styles.addTrackSection, { backgroundColor: colors.background }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Track Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="e.g., Web Development"
                                placeholderTextColor={colors.icon}
                                value={trackName}
                                onChangeText={setTrackName}
                            />

                            <Text style={[styles.label, { color: colors.text }]}>Track Description</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="Brief description"
                                placeholderTextColor={colors.icon}
                                value={trackDescription}
                                onChangeText={setTrackDescription}
                            />

                            <Text style={[styles.label, { color: colors.text }]}>Prize Pool ($) - Optional</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="e.g., 5000"
                                placeholderTextColor={colors.icon}
                                value={trackPrize}
                                onChangeText={setTrackPrize}
                                keyboardType="numeric"
                            />

                            <TouchableOpacity
                                style={[styles.addTrackButton, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}
                                onPress={addTrack}
                            >
                                <Ionicons name="add-circle" size={20} color={colors.secondary} />
                                <Text style={[styles.addTrackText, { color: colors.secondary }]}>Add Track</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Submit Button */}
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
                                    <Text style={styles.buttonText}>Create Hackathon</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
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
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        fontSize: 16,
        marginBottom: 12,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    halfSection: {
        flex: 1,
    },
    posterButton: {
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    posterImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    posterText: {
        marginTop: 8,
        fontSize: 14,
    },
    trackCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    trackHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    trackName: {
        fontSize: 16,
        fontWeight: '600',
    },
    trackDesc: {
        fontSize: 14,
        marginBottom: 4,
    },
    trackPrize: {
        fontSize: 14,
        fontWeight: '600',
    },
    addTrackSection: {
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    addTrackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        marginTop: 12,
    },
    addTrackText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 12,
    },
    dateButtonText: {
        fontSize: 16,
        flex: 1,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    flexButton: {
        flex: 1,
    },
});
