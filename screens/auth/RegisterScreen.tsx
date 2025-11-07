import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
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
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const { signUp } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start animations on mount
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

    const handleButtonPressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handleButtonPressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={colorScheme === 'dark'
                    ? ['#0D1117', '#161B22', '#0D1117']
                    : [colors.primary + '10', colors.secondary + '10', colors.background]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
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
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/Votum.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Votum</Text>
                    <Text style={[styles.subtitle, { color: colors.icon }]}>
                        Shape the Future. Create Your Account.
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
                            Register Now 🌟
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: colors.icon }]}>
                            Join the innovation community
                        </Text>

                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.background,
                                borderWidth: 2,
                                borderColor: nameFocused ? colors.primary : 'transparent',
                                shadowColor: nameFocused ? colors.primary : '#000',
                                shadowOpacity: nameFocused ? 0.3 : 0.05,
                            }
                        ]}>
                            <Ionicons name="person" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.icon}
                                value={name}
                                onChangeText={setName}
                                onFocus={() => setNameFocused(true)}
                                onBlur={() => setNameFocused(false)}
                            />
                        </View>

                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.background,
                                borderWidth: 2,
                                borderColor: emailFocused ? colors.primary : 'transparent',
                                shadowColor: emailFocused ? colors.primary : '#000',
                                shadowOpacity: emailFocused ? 0.3 : 0.05,
                            }
                        ]}>
                            <Ionicons name="mail" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.icon}
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.background,
                                borderWidth: 2,
                                borderColor: passwordFocused ? colors.primary : 'transparent',
                                shadowColor: passwordFocused ? colors.primary : '#000',
                                shadowOpacity: passwordFocused ? 0.3 : 0.05,
                            }
                        ]}>
                            <Ionicons name="lock-closed" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.icon}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
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

                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.background,
                                borderWidth: 2,
                                borderColor: confirmPasswordFocused ? colors.primary : 'transparent',
                                shadowColor: confirmPasswordFocused ? colors.primary : '#000',
                                shadowOpacity: confirmPasswordFocused ? 0.3 : 0.05,
                            }
                        ]}>
                            <Ionicons name="shield-checkmark" size={22} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Confirm your password"
                                placeholderTextColor={colors.icon}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                onFocus={() => setConfirmPasswordFocused(true)}
                                onBlur={() => setConfirmPasswordFocused(false)}
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

                        <Text style={[styles.roleLabel, { color: colors.text }]}>Select Your Role:</Text>

                        <View style={styles.roleButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role !== 'participant' && { backgroundColor: colors.background },
                                ]}
                                onPress={() => setRole('participant')}
                                activeOpacity={0.8}
                            >
                                {role === 'participant' ? (
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.roleButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Ionicons
                                            name="people"
                                            size={24}
                                            color="#fff"
                                        />
                                        <Text style={[styles.roleButtonText, { color: '#fff' }]}>
                                            Participant
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <>
                                        <Ionicons
                                            name="people"
                                            size={24}
                                            color={colors.icon}
                                        />
                                        <Text style={[styles.roleButtonText, { color: colors.text }]}>
                                            Participant
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role !== 'judge' && { backgroundColor: colors.background },
                                ]}
                                onPress={() => setRole('judge')}
                                activeOpacity={0.8}
                            >
                                {role === 'judge' ? (
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.roleButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Ionicons
                                            name="ribbon"
                                            size={24}
                                            color="#fff"
                                        />
                                        <Text style={[styles.roleButtonText, { color: '#fff' }]}>
                                            Judge
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <>
                                        <Ionicons
                                            name="ribbon"
                                            size={24}
                                            color={colors.icon}
                                        />
                                        <Text style={[styles.roleButtonText, { color: colors.text }]}>
                                            Judge
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role !== 'organizer' && { backgroundColor: colors.background },
                                ]}
                                onPress={() => setRole('organizer')}
                                activeOpacity={0.8}
                            >
                                {role === 'organizer' ? (
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.roleButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Ionicons
                                            name="star"
                                            size={24}
                                            color="#fff"
                                        />
                                        <Text style={[styles.roleButtonText, { color: '#fff' }]}>
                                            Organizer
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <>
                                        <Ionicons
                                            name="star"
                                            size={24}
                                            color={colors.icon}
                                        />
                                        <Text style={[styles.roleButtonText, { color: colors.text }]}>
                                            Organizer
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
                                onPress={handleRegister}
                                onPressIn={handleButtonPressIn}
                                onPressOut={handleButtonPressOut}
                                disabled={loading}
                                activeOpacity={0.9}
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
                        </Animated.View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.icon }]}>
                            Already have an account?
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.linkButton}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.linkGradient}
                            >
                                <Text style={styles.linkText}>Sign In Now</Text>
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
        justifyContent: 'center',
        padding: 24,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        backgroundColor: '#fff',
        overflow: 'hidden',
        padding: 2,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        marginTop: 8,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 15,
        marginTop: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
    },
    formContainer: {
        width: '100%',
    },
    card: {
        borderRadius: 28,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        padding: 28,
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 50,
        paddingHorizontal: 20,
        paddingVertical: 4,
        marginBottom: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 14,
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 4,
    },
    roleButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 24,
    },
    roleButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        minHeight: 70,
    },
    roleButtonGradient: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    roleButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
    button: {
        marginTop: 12,
        borderRadius: 50,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
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
        marginTop: 32,
        marginBottom: 20,
        gap: 8,
    },
    footerText: {
        fontSize: 15,
        fontWeight: '500',
    },
    linkButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    linkGradient: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    linkText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.3,
    },
});
