import React from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Image, Switch } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, logOut } = useAuth();

    const [pushNotifications, setPushNotifications] = React.useState(true);
    const [promotionalNotifications, setPromotionalNotifications] = React.useState(true);

    const onLogout = async () => {
        try {
            await logOut();
            console.log("User signed out successfully");
        } catch (e) {
            console.log(e);
            Alert.alert("Logout Error", "An error occurred while trying to log out. Please try again.");
        }
    }

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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerIcon}>
                    <MaterialCommunityIcons name="view-grid" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Profile</Text>
                <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="notifications-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <Image
                        source={require('../../assets/images/Avatar Male 1.png')}
                        style={styles.profileImage}
                    />
                    <Text style={styles.profileName}>{user?.displayName || 'Zachary Nickerson'}</Text>
                    <Text style={styles.profileEmail}>{user?.email || 'zacharynickerson96@gmail.com'}</Text>
                    <TouchableOpacity style={styles.editButton}>
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
        </SafeAreaView>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerIcon: {
        width: 24,
    },
    title: {
        fontFamily: 'DMSans-Bold',
        fontSize: wp(5),
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
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
};
