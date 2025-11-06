import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function QRScannerScreen({ route, navigation }: any) {
    const { hackathonId, hackathonTitle } = route.params;
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (scanned || scanning) return;

        setScanned(true);
        setScanning(true);

        try {
            // Parse QR code data
            const qrData = JSON.parse(data);

            // Validate QR code
            if (qrData.hackathonId !== hackathonId) {
                Alert.alert(
                    'Invalid QR Code',
                    'This QR code is not for this hackathon.',
                    [{ text: 'OK', onPress: () => { setScanned(false); setScanning(false); } }]
                );
                return;
            }

            // Get team details
            const teamDoc = await getDoc(doc(db, 'registrations', qrData.teamId));
            if (!teamDoc.exists()) {
                Alert.alert(
                    'Team Not Found',
                    'This team is not registered.',
                    [{ text: 'OK', onPress: () => { setScanned(false); setScanning(false); } }]
                );
                return;
            }

            const teamData = teamDoc.data();

            // Check if team is selected
            if (teamData.status !== 'selected') {
                Alert.alert(
                    'Team Not Selected',
                    `Team "${qrData.teamName}" has not been selected for this hackathon.`,
                    [{ text: 'OK', onPress: () => { setScanned(false); setScanning(false); } }]
                );
                return;
            }

            // Check if already marked
            if (teamData.attendanceMarked) {
                Alert.alert(
                    'Already Marked',
                    `Attendance for team "${qrData.teamName}" was already marked at ${new Date(teamData.attendanceMarkedAt?.toDate()).toLocaleString()}.`,
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => { setScanned(false); setScanning(false); } },
                        {
                            text: 'Mark Again',
                            onPress: () => markAttendance(qrData, teamData)
                        }
                    ]
                );
                return;
            }

            // Mark attendance
            await markAttendance(qrData, teamData);

        } catch (error: any) {
            console.error('QR scan error:', error);
            Alert.alert(
                'Error',
                'Invalid QR code or an error occurred.',
                [{ text: 'OK', onPress: () => { setScanned(false); setScanning(false); } }]
            );
        }
    };

    const markAttendance = async (qrData: any, teamData: any) => {
        try {
            // Update registration with attendance
            await updateDoc(doc(db, 'registrations', qrData.teamId), {
                attendanceMarked: true,
                attendanceMarkedAt: new Date(),
            });

            // Send notifications to all team members
            const memberIds = [teamData.leaderId, ...(teamData.participantIds || [])];
            const uniqueMemberIds = [...new Set(memberIds)];

            for (const memberId of uniqueMemberIds) {
                await addDoc(collection(db, 'notifications'), {
                    userId: memberId,
                    type: 'attendance_marked',
                    title: '✅ Attendance Confirmed',
                    message: `Attendance has been marked for your team "${qrData.teamName}" at ${hackathonTitle}. Welcome!`,
                    hackathonId,
                    teamId: qrData.teamId,
                    teamName: qrData.teamName,
                    read: false,
                    createdAt: new Date(),
                });
            }

            Alert.alert(
                '✅ Attendance Marked!',
                `Team: ${qrData.teamName}\nMembers: ${uniqueMemberIds.length}\n\nAttendance has been successfully recorded.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setScanned(false);
                            setScanning(false);
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('Mark attendance error:', error);
            Alert.alert(
                'Error',
                'Failed to mark attendance. Please try again.',
                [{ text: 'OK', onPress: () => { setScanned(false); setScanning(false); } }]
            );
        }
    };

    if (permission === null || !permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Ionicons name="camera-outline" size={64} color={colors.primary} />
                <Text style={[styles.text, { color: colors.text }]}>
                    {permission === null ? 'Requesting camera permission...' : 'Camera permission is required to scan QR codes'}
                </Text>
                {permission && !permission.granted && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={requestPermission}
                    >
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />

            <View style={styles.overlay}>
                <View style={styles.topOverlay} />
                <View style={styles.middleRow}>
                    <View style={styles.sideOverlay} />
                    <View style={styles.scanBox}>
                        <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                        <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                        <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                        <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                    </View>
                    <View style={styles.sideOverlay} />
                </View>
                <View style={styles.bottomOverlay}>
                    <View style={styles.instructions}>
                        <Ionicons name="qr-code-outline" size={32} color="#fff" />
                        <Text style={styles.instructionText}>
                            Scan team's QR code to mark attendance
                        </Text>
                        <Text style={styles.subText}>
                            {hackathonTitle}
                        </Text>
                    </View>
                </View>
            </View>

            {scanned && (
                <View style={styles.scanAgainContainer}>
                    <TouchableOpacity
                        style={[styles.scanAgainButton, { backgroundColor: colors.primary }]}
                        onPress={() => { setScanned(false); setScanning(false); }}
                    >
                        <Ionicons name="scan" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Scan Another</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
        marginVertical: 20,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    topOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    middleRow: {
        flexDirection: 'row',
        height: 300,
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scanBox: {
        width: 300,
        height: 300,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructions: {
        alignItems: 'center',
        padding: 20,
    },
    instructionText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    subText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        opacity: 0.8,
    },
    scanAgainContainer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
    },
    scanAgainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 8,
    },
});
