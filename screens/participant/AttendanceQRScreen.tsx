import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function AttendanceQRScreen({ route }: any) {
    const { registrationId, teamName } = route.params;
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<string | null>(null);
    const [attendanceMarked, setAttendanceMarked] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadQRCode();
    }, []);

    const loadQRCode = async () => {
        try {
            const regDoc = await getDoc(doc(db, 'registrations', registrationId));
            if (regDoc.exists()) {
                const data = regDoc.data();
                setQrData(data.attendanceQRCode || null);
                setAttendanceMarked(data.attendanceMarked || false);
            }
        } catch (error) {
            console.error('Error loading QR code:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!qrData) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>
                    No QR code available
                </Text>
                <Text style={[styles.errorSubtext, { color: colors.icon }]}>
                    This hackathon may be online or QR code hasn't been generated yet.
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Ionicons
                    name={attendanceMarked ? "checkmark-circle" : "qr-code"}
                    size={48}
                    color={attendanceMarked ? colors.success : colors.primary}
                />
                <Text style={[styles.title, { color: colors.text }]}>
                    {attendanceMarked ? 'Attendance Marked ✓' : 'Attendance QR Code'}
                </Text>
                <Text style={[styles.teamName, { color: colors.primary }]}>
                    {teamName}
                </Text>
            </View>

            {attendanceMarked ? (
                <View style={[styles.successCard, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                    <Text style={[styles.successText, { color: colors.success }]}>
                        Attendance Confirmed!
                    </Text>
                    <Text style={[styles.successSubtext, { color: colors.text }]}>
                        Your team's attendance has been marked. You're all set for the hackathon!
                    </Text>
                </View>
            ) : (
                <>
                    <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
                        <View style={styles.qrContainer}>
                            <QRCode
                                value={qrData}
                                size={250}
                                backgroundColor="white"
                                color="black"
                            />
                        </View>
                    </View>

                    <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
                        <View style={styles.instructionItem}>
                            <Ionicons name="information-circle" size={24} color={colors.primary} />
                            <Text style={[styles.instructionText, { color: colors.text }]}>
                                Show this QR code to the organizers when you arrive at the venue
                            </Text>
                        </View>

                        <View style={styles.instructionItem}>
                            <Ionicons name="alert-circle" size={24} color={colors.warning} />
                            <Text style={[styles.instructionText, { color: colors.text }]}>
                                Only the team leader needs to show this code
                            </Text>
                        </View>

                        <View style={styles.instructionItem}>
                            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                            <Text style={[styles.instructionText, { color: colors.text }]}>
                                Keep this QR code secure and don't share screenshots
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    teamName: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
    qrCard: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    qrContainer: {
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    instructionsCard: {
        width: '100%',
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    instructionText: {
        fontSize: 14,
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    successCard: {
        width: '100%',
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    successText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    successSubtext: {
        fontSize: 16,
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 24,
    },
    errorText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
