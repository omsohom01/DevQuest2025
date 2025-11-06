import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../config/firebase';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface TeamMember {
    email: string;
    invitationId?: string;
    status: 'not_invited' | 'pending' | 'accepted' | 'rejected';
}

export default function HackathonRegistrationScreen({ route, navigation }: any) {
    const { hackathonId, hackathon } = route.params;
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [teamName, setTeamName] = useState('');
    const [participants, setParticipants] = useState<TeamMember[]>([]);
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sendingInvite, setSendingInvite] = useState<number | null>(null);
    const [ideaDescription, setIdeaDescription] = useState('');
    const [presentationImages, setPresentationImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [checkingLeader, setCheckingLeader] = useState(true);

    // Check if user is part of a team but not the leader
    useEffect(() => {
        const checkTeamMembership = async () => {
            if (!user) return;

            try {
                const q = query(
                    collection(db, 'registrations'),
                    where('hackathonId', '==', hackathonId)
                );

                const snapshot = await getDocs(q);
                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    // If user is a participant but not the leader, redirect to team view
                    if (
                        data.participantIds?.includes(user.uid) &&
                        data.leaderId !== user.uid
                    ) {
                        navigation.replace('TeamView', { hackathonId, hackathon });
                        return;
                    }
                }
            } catch (error) {
                console.error('Error checking team membership:', error);
            } finally {
                setCheckingLeader(false);
            }
        };

        checkTeamMembership();
    }, [hackathonId, user]);

    // Load existing draft registration if any
    useEffect(() => {
        const loadDraftRegistration = async () => {
            if (!user) return;

            const q = query(
                collection(db, 'registrations'),
                where('hackathonId', '==', hackathonId),
                where('leaderId', '==', user.uid),
                where('status', '==', 'draft')
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const regDoc = snapshot.docs[0];
                const regData = regDoc.data();

                setRegistrationId(regDoc.id);
                setTeamName(regData.teamName || '');
                setIdeaDescription(regData.ideaDescription || '');
                if (regData.presentationImages && regData.presentationImages.length > 0) {
                    setPresentationImages(regData.presentationImages);
                }

                // Load invited members from notifications
                const notifQuery = query(
                    collection(db, 'notifications'),
                    where('registrationId', '==', regDoc.id),
                    where('type', '==', 'team_invitation')
                );

                const notifSnapshot = await getDocs(notifQuery);
                const members: TeamMember[] = notifSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        email: data.invitedEmail,
                        invitationId: doc.id,
                        status: data.status,
                    };
                });

                setParticipants(members);
            }
        };

        loadDraftRegistration();
    }, [hackathonId, user]);

    // Listen to invitation status changes
    useEffect(() => {
        if (!registrationId) return;

        const q = query(
            collection(db, 'notifications'),
            where('registrationId', '==', registrationId),
            where('type', '==', 'team_invitation')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedParticipants = [...participants];

            snapshot.forEach((doc) => {
                const data = doc.data();
                const index = participants.findIndex((p) => p.email === data.invitedEmail);

                if (index !== -1) {
                    updatedParticipants[index] = {
                        email: data.invitedEmail,
                        invitationId: doc.id,
                        status: data.status,
                    };
                }
            });

            setParticipants(updatedParticipants);
        });

        return unsubscribe;
    }, [registrationId]);

    const addParticipant = () => {
        if (participants.length < hackathon.teamSize.max - 1) {
            setParticipants([...participants, { email: '', status: 'not_invited' }]);
        } else {
            Alert.alert(
                'Team Size Limit',
                `Maximum team size is ${hackathon.teamSize.max} members (including team lead)`
            );
        }
    };

    const removeParticipant = (index: number) => {
        const newParticipants = participants.filter((_, i) => i !== index);
        setParticipants(newParticipants);
    };

    const updateParticipantEmail = (index: number, email: string) => {
        const newParticipants = [...participants];
        newParticipants[index] = { email, status: 'not_invited' };
        setParticipants(newParticipants);
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const sendInvitation = async (index: number) => {
        const member = participants[index];

        if (!member.email.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        if (!validateEmail(member.email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (user?.email && member.email.toLowerCase() === user.email.toLowerCase()) {
            Alert.alert('Error', 'You cannot invite yourself');
            return;
        }

        // Check for duplicates
        const duplicateIndex = participants.findIndex(
            (p, i) => i !== index && p.email.toLowerCase() === member.email.toLowerCase()
        );
        if (duplicateIndex !== -1) {
            Alert.alert('Error', 'This email is already added to the team');
            return;
        }

        try {
            setSendingInvite(index);

            // Create draft registration if not exists
            let regId = registrationId;
            if (!regId) {
                const userDoc = await getDoc(doc(db, 'users', user!.uid));
                const userData = userDoc.data();

                if (!teamName.trim()) {
                    Alert.alert('Error', 'Please enter a team name first');
                    setSendingInvite(null);
                    return;
                }

                const registrationData = {
                    hackathonId,
                    hackathonTitle: hackathon.title,
                    teamName: teamName.trim(),
                    leaderId: user!.uid,
                    leaderName: userData?.name || user!.email,
                    leaderEmail: user!.email,
                    participantEmails: [],
                    participantIds: [user!.uid],
                    status: 'draft', // draft until submitted
                    memberApprovals: {},
                    allMembersApproved: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };

                const docRef = await addDoc(collection(db, 'registrations'), registrationData);
                regId = docRef.id;
                setRegistrationId(regId);
            }

            // Get user details
            const userDoc = await getDoc(doc(db, 'users', user!.uid));
            const userData = userDoc.data();

            // Create notification/invitation
            const notificationDoc = await addDoc(collection(db, 'notifications'), {
                type: 'team_invitation',
                registrationId: regId,
                hackathonId,
                hackathonTitle: hackathon.title,
                teamName: teamName.trim(),
                leaderId: user!.uid,
                leaderName: userData?.name || user!.email,
                leaderEmail: user!.email,
                invitedEmail: member.email.trim(),
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Update participant status
            const newParticipants = [...participants];
            newParticipants[index] = {
                email: member.email,
                invitationId: notificationDoc.id,
                status: 'pending',
            };
            setParticipants(newParticipants);

            Alert.alert('Invitation Sent', `Invitation sent to ${member.email}`);
        } catch (error: any) {
            console.error('Send invitation error:', error);
            Alert.alert('Error', error.message || 'Failed to send invitation');
        } finally {
            setSendingInvite(null);
        }
    };

    const pickPresentationImages = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload presentation slides.');
                return;
            }

            // Launch image picker with multiple selection
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.3, // Lower quality for smaller size
                selectionLimit: 20,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log(`Compressing ${result.assets.length} images...`);

                const base64Images: string[] = [];

                for (let i = 0; i < result.assets.length; i++) {
                    const asset = result.assets[i];

                    // AGGRESSIVE compression: resize to 800px width and compress heavily
                    const manipResult = await ImageManipulator.manipulateAsync(
                        asset.uri,
                        [{ resize: { width: 800 } }], // Smaller size
                        {
                            compress: 0.3, // Heavy compression
                            format: ImageManipulator.SaveFormat.JPEG,
                            base64: true
                        }
                    );

                    if (manipResult.base64) {
                        const base64WithPrefix = `data:image/jpeg;base64,${manipResult.base64}`;

                        // Check size - each image should be under 150KB in base64
                        const sizeInKB = Math.round((manipResult.base64.length * 0.75) / 1024);
                        console.log(`Slide ${i + 1}: ~${sizeInKB}KB`);

                        if (sizeInKB > 200) {
                            console.warn(`⚠️ Slide ${i + 1} is large (${sizeInKB}KB), consider fewer slides`);
                        }

                        base64Images.push(base64WithPrefix);
                    }
                }

                // Calculate total size
                const totalSizeKB = Math.round(base64Images.join('').length * 0.75 / 1024);
                console.log(`Total size: ~${totalSizeKB}KB`);

                if (totalSizeKB > 900) {
                    Alert.alert(
                        'Images Too Large',
                        `Your slides total ~${totalSizeKB}KB. Firestore limit is ~1000KB. Please select fewer images or smaller images.`,
                        [{ text: 'OK' }]
                    );
                    return;
                }

                setPresentationImages(base64Images);
                console.log(`✅ All ${base64Images.length} slides ready! Total: ~${totalSizeKB}KB`);
                Alert.alert(
                    'Images Ready',
                    `${base64Images.length} slide${base64Images.length > 1 ? 's' : ''} compressed and ready! (~${totalSizeKB}KB)`
                );
            }
        } catch (error: any) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick images. Please try again.');
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...presentationImages];
        newImages.splice(index, 1);
        setPresentationImages(newImages);
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const file = result.assets[0];

                // This is now handled by pickPresentationImages
                Alert.alert('Info', 'Please use the "Select Presentation Slides" button to add images.');
            }
        } catch (error: any) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to pick document. Please try again.');
        }
    };

    const canSubmitRegistration = () => {
        if (!teamName.trim()) return false;
        if (!ideaDescription.trim()) return false;
        if (presentationImages.length === 0) return false;

        const allMembers = participants.filter((p) => p.email.trim() !== '');

        // If no members added, can submit immediately (solo)
        if (allMembers.length === 0) return true;

        // If members added but not invited, can't submit
        const notInvitedMembers = allMembers.filter((p) => p.status === 'not_invited');
        if (notInvitedMembers.length > 0) return false;

        // If all members are invited, they all must have accepted
        return allMembers.every((p) => p.status === 'accepted');
    };

    const handleSubmitRegistration = async () => {
        try {
            // Validation
            const errors: string[] = [];

            if (!teamName.trim()) {
                errors.push('• Team name is required');
            }

            if (!ideaDescription.trim()) {
                errors.push('• Idea description is required');
            }

            if (presentationImages.length === 0) {
                errors.push('• Presentation slides are required (upload images of your slides)');
            }

            // Check total document size to avoid Firestore limits (1MB max)
            const totalDataSize = JSON.stringify({ presentationImages }).length;
            const sizeInKB = Math.round(totalDataSize / 1024);
            console.log(`Document size check: ~${sizeInKB}KB`);

            if (totalDataSize > 900000) { // 900KB limit (leaving room for other fields)
                errors.push(`• Presentation images are too large (~${sizeInKB}KB). Please select fewer or smaller images.`);
            }

            const validMembers = participants.filter((p) => p.email.trim() !== '');

            // Check minimum team size (lead + members)
            const totalTeamSize = validMembers.length + 1;
            if (totalTeamSize < hackathon.teamSize.min) {
                errors.push(
                    `• Minimum team size is ${hackathon.teamSize.min} members (you have ${totalTeamSize})`
                );
            }

            // Check if any members haven't been invited yet
            const notInvitedMembers = validMembers.filter((p) => p.status === 'not_invited');
            if (notInvitedMembers.length > 0) {
                errors.push(
                    `• Please send invitations to all team members before submitting (${notInvitedMembers.length} not invited)`
                );
            }

            // Check if all invited members have accepted
            const pendingMembers = validMembers.filter((p) => p.status === 'pending');
            if (pendingMembers.length > 0) {
                errors.push(
                    `• All team members must accept the invitation before registration can be submitted (${pendingMembers.length} pending)`
                );
            }

            // Check if any members rejected
            const rejectedMembers = validMembers.filter((p) => p.status === 'rejected');
            if (rejectedMembers.length > 0) {
                errors.push(
                    `• Some team members rejected the invitation. Please remove them and add new members.`
                );
            }

            if (errors.length > 0) {
                Alert.alert('Cannot Submit Registration', errors.join('\n'));
                return;
            }

            // Verify images are selected
            if (presentationImages.length === 0) {
                Alert.alert('Error', 'Please upload presentation slides first.');
                return;
            }

            setLoading(true);

            // Images are already in base64 format from pickPresentationImages!
            console.log(`Submitting registration with ${presentationImages.length} slides...`);

            console.log('Saving registration data with presentation slides...');

            // Prepare members array with names and emails
            const membersArray = [];

            // Add leader as first member
            const leaderDoc = await getDoc(doc(db, 'users', user!.uid));
            const leaderData = leaderDoc.data();
            membersArray.push({
                email: user!.email,
                name: leaderData?.name || user!.email?.split('@')[0] || 'Team Leader',
                isLeader: true,
            });

            // Add other team members if any
            for (const member of validMembers) {
                // Try to find user by email to get their name
                const usersQuery = query(
                    collection(db, 'users'),
                    where('email', '==', member.email)
                );
                const userSnapshot = await getDocs(usersQuery);

                let memberName = member.email.split('@')[0]; // Default to email username
                if (!userSnapshot.empty) {
                    const memberData = userSnapshot.docs[0].data();
                    memberName = memberData.name || memberName;
                }

                membersArray.push({
                    email: member.email,
                    name: memberName,
                    isLeader: false,
                });
            }

            // Update registration status from draft to pending
            if (registrationId) {
                const acceptedEmails = validMembers.map((p) => p.email);
                await updateDoc(doc(db, 'registrations', registrationId), {
                    status: 'pending',
                    participantEmails: acceptedEmails,
                    members: membersArray,
                    allMembersApproved: true,
                    ideaDescription: ideaDescription.trim(),
                    presentationImages: presentationImages,
                    presentationImageCount: presentationImages.length,
                    updatedAt: serverTimestamp(),
                });
                console.log('Registration updated successfully!');
            } else {
                // Solo registration (no team members)
                const userDoc = await getDoc(doc(db, 'users', user!.uid));
                const userData = userDoc.data();

                await addDoc(collection(db, 'registrations'), {
                    hackathonId,
                    hackathonTitle: hackathon.title,
                    teamName: teamName.trim(),
                    leaderId: user!.uid,
                    leaderName: userData?.name || user!.email,
                    leaderEmail: user!.email,
                    participantEmails: [],
                    participantIds: [user!.uid],
                    members: membersArray,
                    status: 'pending',
                    memberApprovals: {},
                    allMembersApproved: true,
                    ideaDescription: ideaDescription.trim(),
                    presentationImages: presentationImages,
                    presentationImageCount: presentationImages.length,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                console.log('New registration created successfully!');
            }

            console.log('Registration submission complete!');

            Alert.alert(
                'Registration Submitted!',
                'Your registration has been submitted successfully and will be reviewed by the organizer.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Registration error:', error);
            Alert.alert('Error', error.message || 'Failed to submit registration');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return colors.success;
            case 'rejected':
                return colors.error;
            case 'pending':
                return colors.warning;
            default:
                return colors.icon;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accepted':
                return 'checkmark-circle';
            case 'rejected':
                return 'close-circle';
            case 'pending':
                return 'time';
            default:
                return 'help-circle';
        }
    };

    // Show loading while checking if user is a team member
    if (checkingLeader) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.icon }]}>
                        Loading team information...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.card }]}>
                    <Text style={[styles.hackathonTitle, { color: colors.text }]}>
                        {hackathon.title}
                    </Text>
                    <Text style={[styles.teamSizeInfo, { color: colors.icon }]}>
                        Team Size: {hackathon.teamSize.min} - {hackathon.teamSize.max} members
                    </Text>
                </View>

                {/* Team Name */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Information</Text>

                    <Text style={[styles.label, { color: colors.text }]}>
                        Team Name <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                        ]}
                        placeholder="Enter your team name"
                        placeholderTextColor={colors.icon}
                        value={teamName}
                        onChangeText={setTeamName}
                        editable={!registrationId}
                    />
                    {registrationId && (
                        <Text style={[styles.hint, { color: colors.icon }]}>
                            Team name cannot be changed after sending invitations
                        </Text>
                    )}
                </View>

                {/* Team Lead */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Lead</Text>
                    <View style={[styles.leadCard, { backgroundColor: colors.background }]}>
                        <Ionicons name="person-circle" size={40} color={colors.primary} />
                        <View style={styles.leadInfo}>
                            <Text style={[styles.leadName, { color: colors.text }]}>You (Team Lead)</Text>
                            <Text style={[styles.leadEmail, { color: colors.icon }]}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Team Members */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Team Members ({participants.filter((p) => p.email.trim() !== '').length})
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.icon }]}>
                            Send invites to team members (they must accept before registration)
                        </Text>
                    </View>

                    {participants.map((member, index) => (
                        <View key={index} style={styles.participantCard}>
                            <View style={styles.participantRow}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.participantInput,
                                        {
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    placeholder={`Member ${index + 1} email`}
                                    placeholderTextColor={colors.icon}
                                    value={member.email}
                                    onChangeText={(text) => updateParticipantEmail(index, text)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={member.status === 'not_invited'}
                                />

                                {member.status === 'not_invited' ? (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.inviteButton, { backgroundColor: colors.primary }]}
                                            onPress={() => sendInvitation(index)}
                                            disabled={sendingInvite === index}
                                        >
                                            {sendingInvite === index ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Ionicons name="send" size={20} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                                            onPress={() => removeParticipant(index)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </>
                                ) : member.status === 'rejected' ? (
                                    <>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: getStatusColor(member.status) + '20' },
                                            ]}
                                        >
                                            <Ionicons
                                                name={getStatusIcon(member.status)}
                                                size={16}
                                                color={getStatusColor(member.status)}
                                            />
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: getStatusColor(member.status) },
                                                ]}
                                            >
                                                Rejected
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                                            onPress={() => removeParticipant(index)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(member.status) + '20' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={getStatusIcon(member.status)}
                                            size={16}
                                            color={getStatusColor(member.status)}
                                        />
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: getStatusColor(member.status) },
                                            ]}
                                        >
                                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}

                    {participants.length < hackathon.teamSize.max - 1 && (
                        <TouchableOpacity
                            style={[styles.addButton, { borderColor: colors.primary }]}
                            onPress={addParticipant}
                        >
                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                            <Text style={[styles.addButtonText, { color: colors.primary }]}>
                                Add Team Member
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View style={[styles.infoBox, { backgroundColor: colors.secondary + '10' }]}>
                        <Ionicons name="information-circle" size={20} color={colors.secondary} />
                        <Text style={[styles.infoText, { color: colors.icon }]}>
                            {participants.length === 0
                                ? 'You can submit registration as a solo participant, or add team members below.'
                                : 'Click the send button (📤) to invite each member. All members must accept before you can submit. You can remove rejected members.'}
                        </Text>
                    </View>
                </View>

                {/* Project Idea Section */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Idea</Text>

                    <Text style={[styles.label, { color: colors.text }]}>
                        What do you want to build? <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                        style={[
                            styles.textArea,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                        ]}
                        placeholder="Describe your project idea in detail..."
                        placeholderTextColor={colors.icon}
                        value={ideaDescription}
                        onChangeText={setIdeaDescription}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                    <Text style={[styles.hint, { color: colors.icon }]}>
                        Explain what you plan to build and how it addresses the hackathon theme
                    </Text>
                </View>

                {/* Presentation Upload */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Presentation Slides</Text>

                    <Text style={[styles.label, { color: colors.text }]}>
                        Upload Presentation Slides (Images) <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <Text style={[styles.hint, { color: colors.icon, marginBottom: 12 }]}>
                        Export your PPT/PDF slides as images and upload them here. They'll be displayed as a swipeable gallery.
                    </Text>

                    {presentationImages.length > 0 ? (
                        <>
                            <FlatList
                                data={presentationImages}
                                horizontal
                                keyExtractor={(item, index) => `slide-${index}`}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, marginBottom: 12 }}
                                renderItem={({ item, index }) => (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: item }} style={styles.imagePreview} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={24} color={colors.error} />
                                        </TouchableOpacity>
                                        <Text style={[styles.slideNumber, { color: colors.text }]}>
                                            Slide {index + 1}
                                        </Text>
                                    </View>
                                )}
                            />
                            <TouchableOpacity
                                style={[styles.addMoreButton, { borderColor: colors.primary }]}
                                onPress={pickPresentationImages}
                            >
                                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                <Text style={[styles.addMoreText, { color: colors.primary }]}>
                                    Add More Slides ({presentationImages.length} selected)
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.uploadButton, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                            onPress={pickPresentationImages}
                        >
                            <Ionicons name="images-outline" size={32} color={colors.primary} />
                            <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                                Select Presentation Slides
                            </Text>
                            <Text style={[styles.uploadHint, { color: colors.icon }]}>
                                Choose multiple images of your slides
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Removed uploadingImages indicator - images are ready immediately */}

                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: canSubmitRegistration() ? colors.primary : colors.icon },
                        loading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitRegistration}
                    disabled={loading || !canSubmitRegistration()}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.submitButtonText}>
                                Submitting...
                            </Text>
                        </>
                    ) : (
                        <>
                            {canSubmitRegistration() ? (
                                <>
                                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                    <Text style={styles.submitButtonText}>Submit Registration</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="lock-closed" size={24} color="#fff" />
                                    <Text style={styles.submitButtonText}>
                                        {participants.filter((p) => p.email.trim()).some((p) => p.status === 'not_invited')
                                            ? 'Send All Invitations First'
                                            : 'Waiting for Member Approvals'}
                                    </Text>
                                </>
                            )}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    content: {
        padding: 16,
    },
    header: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    hackathonTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    teamSizeInfo: {
        fontSize: 14,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    leadCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 12,
    },
    leadInfo: {
        flex: 1,
    },
    leadName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    leadEmail: {
        fontSize: 14,
    },
    participantCard: {
        marginBottom: 12,
    },
    participantRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    participantInput: {
        flex: 1,
        marginBottom: 0,
    },
    inviteButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        gap: 8,
        marginBottom: 16,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        gap: 12,
        marginBottom: 32,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    textArea: {
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
        minHeight: 120,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    fileDetails: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    fileStatus: {
        fontSize: 13,
    },
    changeFileButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        marginBottom: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
    uploadHint: {
        fontSize: 13,
        marginTop: 4,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        justifyContent: 'center',
    },
    uploadingText: {
        fontSize: 14,
    },
    imagePreviewContainer: {
        width: 120,
        height: 160,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
    },
    slideNumber: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    addMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
