import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, FlatList, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ModuleCard from '../components/ModuleCard';
import FirebaseImage from '../components/FirebaseImage';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('Trending');

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const filters = ['Trending', 'New Idea', 'Reflection', 'Goal Setting', 'Productivity'];

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
      guidePhoto: 'bg-Avatar Male 2.png',
      moduleName: 'Daily Standup',
      moduleDescription: 'Plan your day in 5 questions',
      backgroundColor: '#C52528', // Red
    },
    {
      id: '2',
      guideName: 'Guide Jaja',
      guidePhoto: 'bg-Avatar Female 6.png',
      moduleName: 'Gratitude',
      moduleDescription: 'Start your day saying thanks',
      backgroundColor: '#D4AF37', // Gold
    },
    {
      id: '3',
      guideName: 'The Vanguard',
      guidePhoto: 'bg-Avatar Male 9.png',
      moduleName: 'New Idea',
      moduleDescription: 'Develop a novel concept',
      backgroundColor: '#2E8B57', // Sea Green
    },
    {
      id: '4',
      guideName: 'PM Benji',
      guidePhoto: 'bg-Avatar Male 5.png',
      moduleName: 'Product Requirements',
      moduleDescription: 'Talk our your PRD',
      backgroundColor: '#FF7F50', // Coral
    },
    // Add more module data as needed
  ];

  const renderModuleCard = ({ item }) => (
    <ModuleCard
      guideName={item.guideName}
      guidePhoto={item.guidePhoto}
      moduleName={item.moduleName}
      moduleDescription={item.moduleDescription}
      backgroundColor={item.backgroundColor}
      // size prop is not specified, so it will use the default 'normal' size
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={navigateToSettings}>
          <MaterialCommunityIcons name="view-grid" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Explore</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Guided Session Catalog</Text>
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

      <FlatList
        data={moduleData}
        renderItem={renderModuleCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.moduleList}
        showsVerticalScrollIndicator={false}
      />
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
    fontFamily: 'DMSans-Bold',
    fontSize: wp(5),
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  subHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subHeaderText: {
    fontFamily: 'DMSans-Bold',
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 30,
    paddingTop: 10,
    paddingHorizontal: 20,
    // backgroundColor: 'red',
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
    backgroundColor: 'transparent',
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontFamily: 'DMSans-Bold',
    fontSize: wp(3.5),
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  filterButtonTextUnselected: {
    color: '#8A8B8D',
  },
  moduleList: {
    paddingHorizontal: wp(4),
    // paddingTop: hp(2),
  },
});
