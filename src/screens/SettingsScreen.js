import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Image, Switch, StyleSheet, TextInput, Modal } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import FirebaseImage from '../components/FirebaseImage';
import { auth, db } from '../../config/firebase';
import { ref, update } from 'firebase/database';
import { updateProfile } from 'firebase/auth';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, logOut } = useAuth();
    const [pushNotifications, setPushNotifications] = useState(true);
    const [promotionalNotifications, setPromotionalNotifications] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [isModalVisible, setIsModalVisible] = useState(false);

    const onLogout = async () => {
        try {
            await logOut();
            console.log("User signed out successfully");
        } catch (e) {
            console.log(e);
            Alert.alert("Logout Error", "An error occurred while trying to log out. Please try again.");
        }
    }

    const handleEditName = () => {
        setNewName(user?.displayName || '');
        setIsModalVisible(true);
    };

    const handleSaveName = async () => {
        try {
            if (!newName.trim()) {
                Alert.alert("Error", "Name cannot be empty");
                return;
            }

            // Update in Firebase Realtime Database
            const userRef = ref(db, `users/${user.uid}`);
            await update(userRef, {
                name: newName.trim()
            });

            // Update in Firebase Auth
            await updateProfile(auth.currentUser, {
                displayName: newName.trim()
            });

            setIsModalVisible(false);
            Alert.alert("Success", "Name updated successfully");
        } catch (error) {
            console.error("Error updating name:", error);
            Alert.alert("Error", "Failed to update name. Please try again.");
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you'd like to logout?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Logout canceled"),
                    style: "cancel"
                },
                { text: "Confirm", onPress: onLogout }
            ]
        );
    };

    const SettingsItem = ({ icon, title, subtitle, onPress, showArrow = true, isLast = false }) => (
        <TouchableOpacity style={[styles.settingsItem, isLast && styles.lastSettingsItem]} onPress={onPress}>
            <Ionicons name={icon} size={24} color="black" style={styles.settingsIcon} />
            <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
            </View>
            {showArrow && <Ionicons name="chevron-forward" size={24} color="#777" />}
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('RamblingsScreen')}
            >
                <Ionicons name="close" size={24} color="#1B1D21" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.placeholder} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <FirebaseImage
                        avatarName={user?.avatar}
                        style={styles.profileImage}
                        defaultImage={require('/Users/zachary.nickerson/Desktop/vokko/assets/images/default-prof-pic.png')}
                    />
                    <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
                    <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                    <TouchableOpacity style={styles.editButton} onPress={handleEditName}>
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>GENERAL</Text>

                <SettingsItem 
                    icon="card-outline" 
                    title="Subscription" 
                    subtitle="Manage your plan"
                    onPress={() => {}}
                />
                <SettingsItem 
                    icon="add-circle-outline" 
                    title="Add Integration" 
                    subtitle="Connect Notion to send notes"
                    onPress={() => {}}
                />
                <SettingsItem 
                    icon="share-outline" 
                    title="Refer Your Friends" 
                    subtitle="Get more sessions for referring friends"
                    onPress={() => {}}
                />

                <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

                <View style={styles.settingsItem}>
                    <Ionicons name="notifications-outline" size={24} color="black" style={styles.settingsIcon} />
                    <View style={styles.settingsTextContainer}>
                        <Text style={styles.settingsTitle}>Push Notifications</Text>
                        <Text style={styles.settingsSubtitle}>For daily update and others.</Text>
                    </View>
                    <Switch
                        value={pushNotifications}
                        onValueChange={setPushNotifications}
                        trackColor={{ false: "#767577", true: "#4FBF67" }}
                        thumbColor={pushNotifications ? "#f4f3f4" : "#f4f3f4"}
                        style={styles.switch}
                    />
                </View>

                <View style={styles.settingsItem}>
                    <Ionicons name="megaphone-outline" size={24} color="black" style={styles.settingsIcon} />
                    <View style={styles.settingsTextContainer}>
                        <Text style={styles.settingsTitle}>Promotional Notifications</Text>
                        <Text style={styles.settingsSubtitle}>New Campaign & Offers</Text>
                    </View>
                    <Switch
                        value={promotionalNotifications}
                        onValueChange={setPromotionalNotifications}
                        trackColor={{ false: "#767577", true: "#4FBF67" }}
                        thumbColor={promotionalNotifications ? "#f4f3f4" : "#f4f3f4"}
                        style={styles.switch}
                    />
                </View>

                <Text style={styles.sectionTitle}>MORE</Text>

                <SettingsItem 
                    icon="call-outline" 
                    title="Contact Us" 
                    subtitle="For more information"
                    onPress={() => {}}
                />
                <SettingsItem 
                    icon="log-out-outline" 
                    title="Logout" 
                    onPress={confirmLogout}
                    showArrow={false}
                    isLast={true}
                />
            </ScrollView>

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Name</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1B1D21" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.nameInput}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Enter your name"
                            autoFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]} 
                                onPress={handleSaveName}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: 'white',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: wp(4.5),
        fontWeight: '600',
        color: '#1B1D21',
    },
    placeholder: {
        width: 40, // Same width as backButton to maintain center alignment
    },
    scrollContent: {
        padding: 20,
    },
    profileSection: {
        alignItems: 'center',
        // marginBottom: 30,

    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },
    profileName: {
        fontFamily: 'DMSans-Bold',
        fontSize: wp(4.5),
        fontWeight: 'bold',
        marginBottom: 10,
    },
    profileEmail: {
        fontFamily: 'DMSans-Regular',
        fontSize: wp(3.5),
        color: '#4FBF67',
        marginBottom: 20,
    },
    editButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.2,
        borderColor: '#4FBF67',
    },
    editButtonText: {
        fontFamily: 'DMSans',
        color: '#1B1D21',
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontFamily: 'DMSans-Bold',
        fontSize: wp(4),
        color: '#8CD69C',
        fontWeight: 'bold',

        marginTop: 20,
        marginBottom: 10,

    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F4F7',
    },
    lastSettingsItem: {
        borderBottomWidth: 0,
    },
    settingsIcon: {
        marginRight: 15,
    },
    settingsTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    settingsTitle: {
        fontFamily: 'DMSans-Medium',
        fontSize: wp(4.5),
        fontWeight: '500',
        marginBottom: 6,
    },
    settingsSubtitle: {
        fontFamily: 'DMSans-Regular',
        fontSize: wp(4),
        color: '#777',
        marginTop: 2,
    },
    switch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: wp(80),
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#1B1D21',
    },
    nameInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 15,
        fontSize: wp(4),
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
    },
    saveButton: {
        backgroundColor: '#4FBF67',
    },
    cancelButtonText: {
        color: '#1B1D21',
        fontWeight: '600',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});
