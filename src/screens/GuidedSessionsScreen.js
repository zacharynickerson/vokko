import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModuleCard from '../components/ModuleCard';
import { auth, db } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';

export default function GuidedSessionsScreen() {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('Trending');
  const [scheduledSessionsCount, setScheduledSessionsCount] = useState(0);

  const navigateToGuidedSession = () => {
    navigation.navigate('GuidedSession');
  };

  const navigateToSoloSession = () => {
    navigation.navigate('SoloSessionSetup');
  };

  const navigateToScheduledSessions = () => {
    navigation.navigate('ScheduledSessions');
  };

  const filters = ['Trending', 'New Idea', 'Reflection', 'Goal Setting', 'Productivity'];

  useEffect(() => {
    if (!auth.currentUser) return;

    const sessionsRef = ref(db, `scheduledSessions/${auth.currentUser.uid}`);
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessions = Object.values(snapshot.val());
        const futureSessionsCount = sessions.filter(session => 
          session.status === 'scheduled' && 
          new Date(session.scheduledFor) > new Date()
        ).length;
        setScheduledSessionsCount(futureSessionsCount);
      } else {
        setScheduledSessionsCount(0);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const FilterButton = ({ title, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isSelected ? styles.filterButtonSelected : styles.filterButtonUnselected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        isSelected ? styles.filterButtonTextSelected : styles.filterButtonTextUnselected
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const moduleData = [
    {
      id: '1',
      guideName: 'Guide Carter',
      guidePhoto: require('../../assets/images/bg-Avatar Male 2.png'),
      moduleName: 'Daily Standup',
      moduleDescription: 'Plan your day in 5 questions',
      backgroundColor: '#BA59FE',
    },
    {
      id: '2',
      guideName: 'Guide Jaja',
      guidePhoto: require('../../assets/images/bg-Avatar Female 6.png'),
      moduleName: 'Gratitude',
      moduleDescription: 'Start your day saying thanks',
      backgroundColor: '#71D7F4',
    },
  ];

  const renderModuleCard = ({ item }) => (
    <ModuleCard
      guideName={item.guideName}
      guidePhoto={item.guidePhoto}
      moduleName={item.moduleName}
      moduleDescription={item.moduleDescription}
      backgroundColor={item.backgroundColor}
      size="small"
    />
  );

  const renderSessionTypeButton = (title, iconName, color, onPress, badgeCount = null) => (
    <TouchableOpacity style={styles.sessionTypeButton} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={iconName} size={24} color="white" />
        {badgeCount !== null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.sessionTypeText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Guided Rambles</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome 👋</Text>
          <Text style={styles.welcomeSubtitle}>Need to talk through an idea?</Text>
        </View>

        <View style={styles.buttonCardsContainer}>
          {renderSessionTypeButton("Guided Ramble", "robot", "#FDB921", navigateToGuidedSession)}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExploreScreen')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {filters.map((filter) => (
            <FilterButton
              key={filter}
              title={filter}
              isSelected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          ))}
        </ScrollView>

        <View style={styles.moduleListContainer}>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={moduleData}
            renderItem={renderModuleCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.moduleList}
            ListEmptyComponent={<Text>No modules available</Text>}
            initialNumToRender={2}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: wp(5),
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeTitle: {
    fontSize: wp(7),
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: wp(4),
    color: '#666',
  },
  buttonCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sessionTypeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    width: wp(28),
    height: hp(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sessionTypeText: {
    fontSize: wp(3.5),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1B1D21',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
  },
  seeAllButton: {
    fontSize: wp(3.5),
    color: '#4FBF67',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonSelected: {
    backgroundColor: '#4FBF67',
    borderWidth: 0,
  },
  filterButtonUnselected: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: wp(3.5),
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  filterButtonTextUnselected: {
    color: '#8A8B8D',
  },
  moduleListContainer: {
    marginBottom: 20,
  },
  moduleList: {
    paddingHorizontal: 20,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: wp(3),
    fontWeight: 'bold',
  },
}); 