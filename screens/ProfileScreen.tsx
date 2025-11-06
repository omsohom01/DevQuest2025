import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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
import { db } from '../config/firebase';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useColorScheme } from '../hooks/use-color-scheme';

export default function ProfileScreen({ navigation }: any) {
    const { user, refreshUser } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setName(data.name || '');
                setEmail(data.email || '');
                setProfilePicUri(data.profilePicUrl || null);
                setBio(data.bio || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant photo library access');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setProfilePicUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        // Validation
        const errors: string[] = [];

        if (!name?.trim()) {
            errors.push('• Name is required');
        }

        if (name?.trim().length < 2) {
            errors.push('• Name must be at least 2 characters');
        }

        if (errors.length > 0) {
            Alert.alert(
                'Validation Error',
                'Please fix the following issues:\n\n' + errors.join('\n'),
                [{ text: 'OK' }]
            );
            return;
        }

        setSaving(true);
        try {
            const updateData: any = {
                name: name.trim(),
                bio: bio?.trim() || '',
                updatedAt: new Date(),
            };

            if (profilePicUri) {
                updateData.profilePicUrl = profilePicUri;
            }

            await updateDoc(doc(db, 'users', user.uid), updateData);

            Alert.alert('Success', 'Profile updated successfully!', [
                {
                    text: 'OK',
                    onPress: async () => {
                        // Reload auth context to update user data
                        if (refreshUser) {
                            await refreshUser();
                        }
                        loadProfile();
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.icon }]}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity style={styles.profilePicContainer} onPress={pickImage}>
                        {profilePicUri ? (
                            <Image source={{ uri: profilePicUri }} style={styles.profilePic} />
                        ) : (
                            <View style={[styles.profilePicPlaceholder, { backgroundColor: colors.background }]}>
                                <Ionicons name="person" size={60} color={colors.icon} />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Your Profile</Text>
                    <Text style={styles.headerSubtitle}>Update your personal information</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        {/* Name */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Ionicons name="person-outline" size={20} color={colors.icon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={colors.icon}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        {/* Email (Read-only) */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.6 }]}>
                                <Ionicons name="mail-outline" size={20} color={colors.icon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={email}
                                    editable={false}
                                />
                            </View>
                            <Text style={[styles.helperText, { color: colors.icon }]}>Email cannot be changed</Text>
                        </View>

                        {/* Role (Read-only) */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: colors.text }]}>Role</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.6 }]}>
                                <Ionicons name="shield-outline" size={20} color={colors.icon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                                    editable={false}
                                />
                            </View>
                        </View>

                        {/* Bio */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: colors.text }]}>Bio (Optional)</Text>
                            <View style={[styles.textAreaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.textArea, { color: colors.text }]}
                                    placeholder="Tell us about yourself..."
                                    placeholderTextColor={colors.icon}
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.button, { opacity: saving ? 0.7 : 1 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <LinearGradient
                                colors={[colors.accent, colors.success]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.buttonIcon} />
                                        <Text style={styles.buttonText}>Save Changes</Text>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    header: {
        padding: 32,
        alignItems: 'center',
        paddingTop: 60,
    },
    profilePicContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profilePic: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
    },
    profilePicPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10b981',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    content: {
        padding: 16,
        marginTop: -20,
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
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    textAreaContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
    },
    textArea: {
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
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
