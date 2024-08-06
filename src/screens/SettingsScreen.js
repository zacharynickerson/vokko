import React from 'react';
import { Alert, ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Linking } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, ready } = useAuth();

    const onLogout = async () => {
        try {
            await auth.signOut();
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

    const openURL = (url) => {
        Linking.openURL(url).catch((err) => {
            console.error("Failed to open URL:", err);
            Alert.alert("Failed to open URL. Please try again later.");
        });
    };

    if (!ready) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const SettingsItem = ({ icon, title, onPress }) => (
        <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
            <Ionicons name={icon} size={24} color="#fff" style={styles.settingsIcon} />
            <Text style={styles.settingsText}>{title}</Text>
            <Ionicons name="chevron-forward" size={24} color="#777" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerText}>Settings</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <SettingsItem 
                        icon="person-outline" 
                        title="Account Details" 
                        onPress={() => {/* Navigate to Account Details */}}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <SettingsItem 
                        icon="mail-outline" 
                        title="Contact Support" 
                        onPress={() => openURL("https://vokko.io/contact/")}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security and Privacy</Text>
                    <SettingsItem 
                        icon="document-text-outline" 
                        title="Terms of Service" 
                        onPress={() => openURL("https://vokko.io/")}
                    />
                    <SettingsItem 
                        icon="log-out-outline" 
                        title={ready ? (user ? "Logout" : "Not Logged In") : "Loading..."}
                        onPress={confirmLogout}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#191A23',
    },
    scrollContent: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#191A23',
    },
    loadingText: {
        fontSize: wp(4),
        color: '#fff',
        marginTop: 10,
    },
    headerText: {
        fontSize: wp(6),
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: wp(3.5),
        color: '#777',
        marginBottom: 10,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242830',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    settingsIcon: {
        marginRight: 15,
    },
    settingsText: {
        flex: 1,
        fontSize: wp(4.3),
        color: '#fff',
        fontWeight: 'bold',
    },
};