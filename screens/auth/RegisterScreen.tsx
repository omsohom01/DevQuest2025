import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { UserRole } from '../../types';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole>('participant');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signUp } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, name, role);
            Alert.alert('Success', 'Account created successfully!');
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={colorScheme === 'dark'
                    ? ['#1a1a2e', '#16213e', '#0f3460']
                    : [colors.primary + '10', colors.secondary + '10', colors.background]}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.logoContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="sparkles" size={50} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.title, { color: colors.text }]}>Join Votum</Text>
                    <Text style={[styles.subtitle, { color: colors.icon }]}>
                        Start Your Innovation Journey Today
                    </Text>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.formContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            Create Account 🚀
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="person" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Your full name"
                                placeholderTextColor={colors.icon}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="mail" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Email address"
                                placeholderTextColor={colors.icon}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="lock-closed" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Create password"
                                placeholderTextColor={colors.icon}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye' : 'eye-off'}
                                    size={22}
                                    color={colors.icon}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="shield-checkmark" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Confirm password"
                                placeholderTextColor={colors.icon}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons
                                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                                    size={22}
                                    color={colors.icon}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.roleContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="briefcase" size={22} color={colors.primary} style={styles.inputIcon} />
                            <Text style={[styles.roleLabel, { color: colors.text }]}>I am a:</Text>
                        </View>

                        <View style={styles.roleButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role === 'participant' && { backgroundColor: colors.primary },
                                    role !== 'participant' && { backgroundColor: colors.background }
                                ]}
                                onPress={() => setRole('participant')}
                            >
                                <Ionicons
                                    name="people"
                                    size={24}
                                    color={role === 'participant' ? '#fff' : colors.icon}
                                />
                                <Text style={[
                                    styles.roleButtonText,
                                    { color: role === 'participant' ? '#fff' : colors.text }
                                ]}>
                                    Participant
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role === 'judge' && { backgroundColor: colors.primary },
                                    role !== 'judge' && { backgroundColor: colors.background }
                                ]}
                                onPress={() => setRole('judge')}
                            >
                                <Ionicons
                                    name="ribbon"
                                    size={24}
                                    color={role === 'judge' ? '#fff' : colors.icon}
                                />
                                <Text style={[
                                    styles.roleButtonText,
                                    { color: role === 'judge' ? '#fff' : colors.text }
                                ]}>
                                    Judge
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role === 'organizer' && { backgroundColor: colors.primary },
                                    role !== 'organizer' && { backgroundColor: colors.background }
                                ]}
                                onPress={() => setRole('organizer')}
                            >
                                <Ionicons
                                    name="star"
                                    size={24}
                                    color={role === 'organizer' ? '#fff' : colors.icon}
                                />
                                <Text style={[
                                    styles.roleButtonText,
                                    { color: role === 'organizer' ? '#fff' : colors.text }
                                ]}>
                                    Organizer
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Create Account</Text>
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.icon }]}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.linkGradient}
                            >
                                <Text style={styles.linkText}>Sign In</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 50,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 8,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 6,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    formContainer: {
        width: '100%',
    },
    card: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 14,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        marginTop: 4,
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    roleButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 20,
    },
    roleButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 6,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    roleButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    button: {
        marginTop: 4,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
    },
    linkGradient: {
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    pickerContainer: {
        display: 'none',
    },
    picker: {
        display: 'none',
    },
});
