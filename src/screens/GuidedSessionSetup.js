import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, SafeAreaView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import moment from 'moment';
import CustomDatePicker from '/Users/zacharynickerson/Desktop/vokko/src/components/CustomDatePicker.js';
import SessionConfirmation from '../components/SessionConfirmation';
import { getModules, getModuleWithGuide, getGuides } from '/Users/zacharynickerson/Desktop/vokko/config/firebase.js';
import useAuth from '/Users/zacharynickerson/Desktop/vokko/hooks/useAuth.js';
import { auth } from '/Users/zacharynickerson/Desktop/vokko/config/firebase.js';

const images = {
  'Avatar Female 6.png': require('../../assets/images/Avatar Female 6.png'),
  'Avatar Male 9.png': require('../../assets/images/Avatar Male 9.png'),
  'Avatar Female 13.png': require('../../assets/images/Avatar Female 13.png'),
  'Avatar Male 14.png': require('../../assets/images/Avatar Male 14.png'),
  'Avatar Female 1.png': require('../../assets/images/Avatar Female 1.png'),
  'Avatar Male 2.png': require('../../assets/images/Avatar Male 2.png'),
  // Add all other image filenames here
};

const getImageSource = (imageName) => {
  if (!imageName) return require('../../assets/images/user-photo.png');
  const key = imageName.split('/').pop(); // This will get just the filename
  return images[key] || require('../../assets/images/user-photo.png');
};

const GuidedSessionSetup = () => {
  const [step, setStep] = useState(1);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [startNow, setStartNow] = useState(true);
  const [startOption, setStartOption] = useState('now');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [isSessionScheduled, setIsSessionScheduled] = useState(false);
  const [modules, setModules] = useState([]);
  const [guides, setGuides] = useState([]);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modulesData = await getModules();
        if (modulesData) {
          const modulesArray = Object.keys(modulesData).map(key => {
            const module = modulesData[key];
            return {
              id: key,
              name: module.name,
              description: module.description,
              ui: module.ui || {
                // Default UI properties if none exist
                icon: 'circle',
                color: '#4CAF50',
                bgColor: 'rgba(76, 175, 80, 0.1)'
              },
              session_approach: module.session_approach || {},
              ...module
            };
          });
          setModules(modulesArray);
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    const fetchGuides = async () => {
      try {
        const guidesData = await getGuides();
        if (guidesData) {
          // Convert the object to an array and ensure the structure is correct
          const guidesArray = Object.keys(guidesData).map(key => {
            const guide = guidesData[key];
            return {
              id: key,
              name: guide.name,
              description: guide.description,
              mainPhoto: guide.mainPhoto,
              personality: guide.personality || {},
              expertise: guide.expertise || [],
              ...guide
            };
          });
          setGuides(guidesArray);
        }
      } catch (error) {
        console.error('Error fetching guides:', error);
      }
    };

    fetchModules();
    fetchGuides();
  }, []);

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Setup</Text>
        <TouchableOpacity onPress={navigateToSettings}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.headerCurve} />
    </View>
  ), [navigation]);

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.stepContentWrapper}>
          <Text style={styles.stepTitle}>Session Topic</Text>
          <TouchableOpacity style={styles.customButton}>
            <Text style={styles.customButtonText}>+ Custom</Text>
          </TouchableOpacity>
          <View style={styles.selectedModuleContainer}>
            <MaterialCommunityIcons name="circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.selectedModuleText}>
              {selectedModule 
                ? `${selectedModule.name}`
                : "Select a topic to explore with your guide"}
            </Text>
          </View>
          <View style={styles.selectorContainer}>
            <FlatList
              data={modules}
              horizontal={false} // Change to vertical list
              renderItem={({ item, index }) => {
                return (
                  <TouchableOpacity
                    style={[
                      styles.selectorOption,
                      index === 0 && styles.firstOption,
                      index === modules.length - 1 && styles.lastOption,
                    ]}
                    onPress={() => setSelectedModule(item)}
                  >
                    <View style={styles.selectorRow}>
                      <View style={styles.iconContainer}>
                        <FontAwesome5 
                          name={item.ui?.icon || 'circle'} 
                          size={24} 
                          color={item.ui?.color || '#4CAF50'} 
                        />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.selectorTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.selectorDescription} numberOfLines={2}>{item.description}</Text>
                      </View>
                      <View style={styles.checkboxContainer}>
                        <MaterialCommunityIcons 
                          name={selectedModule?.id === item.id ? "circle" : "circle-outline"} 
                          size={24} 
                          color="#4CAF50" 
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyExtractor={(item) => item.id}
            />
          </View>
          {selectedModule && (
            <View style={styles.overviewSection}>
              {/* <Text style={styles.sectionTitle}>Overview</Text>
              {selectedModule.base_questions?.map((question, index) => (
                <View key={index} style={styles.questionItem}>
                  <Text style={styles.questionText}>{question}</Text>
                </View>
              ))} */}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.proceedButtonContainer}>
        <TouchableOpacity
          style={[styles.proceedButton, !selectedModule && styles.disabledButton]}
          onPress={() => setStep(2)}
          disabled={!selectedModule}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.stepContentWrapper}>
          <Text style={styles.stepTitle}>Session Guide</Text>
          <View style={styles.selectedModuleContainer}>
            <MaterialCommunityIcons name="circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.selectedModuleText}>
              {selectedModule.name}
            </Text>
            <TouchableOpacity onPress={() => {
              setSelectedModule(null);
              setStep(1);
            }}>
              <MaterialCommunityIcons name="close" size={24} color="#1B1D21" />
            </TouchableOpacity>
          </View>
          <View style={styles.dottedLine} />
          <View style={styles.chooseGuideContainer}>
            <MaterialCommunityIcons name="heart-outline" size={24} color="#4CAF50" />
            <Text style={styles.selectedModuleText}>
              {selectedGuide 
                ? `${selectedGuide.name}`
                : "Select a guide for your session"}
            </Text>
          </View>
          <View style={styles.selectorContainer}>
            <FlatList
              data={guides}
              horizontal={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorOption,
                    index === 0 && styles.firstOption,
                    index === guides.length - 1 && styles.lastOption,
                  ]}
                  onPress={() => setSelectedGuide(item)}
                >
                  <View style={styles.selectorRow}>
                    <View style={styles.iconContainer}>
                      <Image
                        source={getImageSource(item.mainPhoto)}
                        style={styles.guideImage}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.selectorTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.selectorDescription} numberOfLines={2}>{item.description}</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <MaterialCommunityIcons 
                        name={selectedGuide?.id === item.id ? "circle" : "circle-outline"} 
                        size={24} 
                        color="#4CAF50" 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyExtractor={(item) => item.id}
            />
          </View>
        </View>
      </ScrollView>
      <View style={styles.proceedButtonContainer}>
        <TouchableOpacity
          style={[styles.proceedButton, !selectedGuide && styles.disabledButton]}
          onPress={() => setStep(3)}
          disabled={!selectedGuide}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDatePicker = () => (
    <Modal
      isVisible={isDatePickerVisible}
      onBackdropPress={() => setDatePickerVisibility(false)}
      style={styles.modal}
    >
      <View style={styles.datePickerContainer}>
        <CustomDatePicker
          onDateSelect={(date, time) => {
            setScheduledDate(moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm A').toDate());
            setDatePickerVisibility(false);
          }}
        />
      </View>
    </Modal>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.stepContentWrapper}>
          <Text style={styles.stepTitle}>Session Start</Text>
          <View style={styles.selectorContainer}>
            <View style={styles.selectedItemRow}>
              <MaterialCommunityIcons name="circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.selectedItemText}>
                {selectedModule ? selectedModule.name : "Select a module"}
              </Text>
              {selectedModule && (
                <TouchableOpacity onPress={() => {
                  setSelectedModule(null);
                  setStep(1);
                }}>
                  <MaterialCommunityIcons name="close" size={24} color="#1B1D21" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.selectorContainer}>
            <View style={styles.selectedItemRow}>
              <MaterialCommunityIcons name="circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.selectedItemText}>
                {selectedGuide ? selectedGuide.name : "Select a guide"}
              </Text>
              {selectedGuide && (
                <TouchableOpacity onPress={() => {
                  setSelectedGuide(null);
                  setStep(2);
                }}>
                  <MaterialCommunityIcons name="close" size={24} color="#1B1D21" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.chooseGuideContainer}>
            <MaterialCommunityIcons name="heart-outline" size={24} color="#4CAF50" />
            <Text style={styles.subtitle}>Choose when</Text>
          </View>
          <View style={styles.startOptionsContainer}>
            <TouchableOpacity
              style={[styles.startOption, startOption === 'now' && styles.selectedStartOption]}
              onPress={() => setStartOption('now')}
            >
              <MaterialCommunityIcons
                name={startOption === 'now' ? "circle-slice-8" : "circle-outline"}
                size={24}
                color={startOption === 'now' ? "#4CAF50" : "#1B1D21"}
              />
              <Text style={styles.startOptionText}>Start now</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity
              style={[styles.startOption, startOption === 'schedule' && styles.selectedStartOption]}
              onPress={() => setStartOption('schedule')}
            >
              <MaterialCommunityIcons
                name={startOption === 'schedule' ? "circle-slice-8" : "circle-outline"}
                size={24}
                color={startOption === 'schedule' ? "#4CAF50" : "#1B1D21"}
              />
              <Text style={styles.startOptionText}>Schedule a time</Text>
            </TouchableOpacity>
          </View>
          {startOption === 'schedule' && (
            <View style={styles.datePickerWrapper}>
              <CustomDatePicker
                onDateSelect={(date, time) => {
                  setScheduledDate(moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm A').toDate());
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
      {startOption === 'now' && (
        <View style={styles.proceedButtonContainer}>
          <TouchableOpacity
            style={[styles.proceedButton, { backgroundColor: '#1B1D21' }]}
            onPress={handleBeginSession}
          >
            <View style={styles.proceedButtonContent}>
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.proceedButtonText}>Begin Session</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
      {startOption === 'schedule' && (
        <View style={styles.proceedButtonContainer}>
          <TouchableOpacity
            style={[
              styles.proceedButton,
              { backgroundColor: '#1B1D21' },
              !scheduledDate && styles.disabledButton
            ]}
            onPress={handleScheduleSession}
            disabled={!scheduledDate}
          >
            <View style={styles.proceedButtonContent}>
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color={scheduledDate ? "white" : "rgba(255, 255, 255, 0.5)"}
                style={styles.buttonIcon}
              />
              <Text style={[
                styles.proceedButtonText,
                !scheduledDate && styles.disabledButtonText
              ]}>
                Schedule Session
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const handleScheduleSession = () => {
    // Here you would typically call your API to set up the cron job
    // For now, we'll just set the state to show the confirmation screen
    setIsSessionScheduled(true);
  };

  const handleAddToCalendar = () => {
    // Implement the logic to add the session to the user's calendar
    console.log('Adding to calendar');
  };

  const handleGoToHomepage = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeScreen' }],
    });
  };

  const handleBeginSession = async () => {
    if (!selectedModule || !selectedGuide || !user) {
      console.error('Missing required data:', { selectedModule, selectedGuide, user });
      return;
    }

    try {
      navigation.navigate('CallStack', {
        screen: 'GuidedSessionCall',
        params: {
          guide: {
            ...selectedGuide,
            mainPhoto: selectedGuide.mainPhoto.split('/').pop(),
          },
          module: selectedModule,
          userId: user.uid
        }
      });
    } catch (error) {
      console.error('Error preparing session:', error);
    }
  };

  if (isSessionScheduled) {
    return (
      <SessionConfirmation
        scheduledDate={moment(scheduledDate)}
        guideName={selectedGuide.name}
        onAddToCalendar={handleAddToCalendar}
        onGoToHomepage={handleGoToHomepage}
        navigation={navigation}
      />
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>
      {renderDatePicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#1B1D21',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // headerCurve: {
  //   height: 15,
  //   backgroundColor: '#1B1D21',
  //   borderBottomLeftRadius: 100,
  //   borderBottomRightRadius: 100,
  // },
  content: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 130 : 80, // Adjust based on header height
  },
  stepContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  stepTitle: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#1B1D21',
    marginBottom: hp(2),
  },
  customButton: {
    position: 'absolute',
    top: hp(2), // Adjust this value to align with stepTitle
    right: wp(15),
    backgroundColor: '#F3F4F5',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: 15,
  },
  customButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: wp(4),
    color: '#8A8B8D',
    marginLeft: wp(2),
  },
  selectorContainer: {
    marginHorizontal: wp(4),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  selectorOption: {
    backgroundColor: 'white',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  firstOption: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastOption: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  guideImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginRight: wp(4),
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: wp(4),
    color: '#1B1D21',
    marginBottom: hp(0.5),
  },
  selectorDescription: {
    fontFamily: 'DMSans-Regular',
    fontSize: wp(3.5),
    color: '#666',
  },
  overviewSection: {
    marginTop: hp(4),
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#4FBF67',
    marginBottom: hp(1),
  },
  questionItem: {
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  questionText: {
    fontSize: wp(3.5),
    color: '#1B1D21',
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: hp(2),
    borderRadius: 25,
    alignItems: 'center',
    marginTop: hp(3),
    marginBottom: hp(4), // Add this line
  },
  proceedButtonText: {
    color: 'white',
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectedModuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  selectedModuleText: {
    fontSize: wp(4),
    color: '#1B1D21',
    marginLeft: wp(2),
    marginRight: 'auto',
  },
  dottedLine: {
    height: hp(4),
    width: 1,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginLeft: wp(3),
    marginBottom: hp(2),
  },
  chooseGuideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  guideDivider: {
    width: '113%',
    height: 1,
    marginVertical: hp(1),
  },
  selectedGuideDivider: {
    backgroundColor: 'white',
  },
  unselectedGuideDivider: {
    backgroundColor: '#C4C4C4',
  },
  guideName: {
    fontSize: wp(4),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  guideDescription: {
    fontSize: wp(3),
    textAlign: 'center',
  },
  selectedGuideText: {
    color: 'white',
  },
  unselectedGuidePrimaryText: {
    color: '#1B1D21',
  },
  unselectedGuideSecondaryText: {
    color: '#808080',
  },
  guidePhotoBackground: {
    width: wp(19),
    height: wp(17),
    borderRadius: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  startOptionsContainer: {
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  startOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
  },
  selectedStartOption: {
    backgroundColor: 'white',
  },
  startOptionText: {
    marginLeft: wp(2),
    fontSize: wp(4),
    color: '#1B1D21',
  },
  buttonIcon: {
    marginRight: wp(2),
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  datePickerContainer: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    backgroundColor: 'red',

  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  datePickerButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  datePickerContent: {
    width: '100%',
    alignItems: 'center',
  },
  datePickerWrapper: {
    marginTop: hp(2),
  },
  proceedButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContentWrapper: {
    paddingTop: hp(4),
    paddingBottom: hp(6),
  },
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    backgroundColor: 'white',
  },
  proceedButton: {
    backgroundColor: '#1B1D21',
    paddingVertical: hp(2),
    borderRadius: 25,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: wp(4),
    fontWeight: 'bold',
    marginLeft: wp(2),
  },
  buttonIcon: {
    marginRight: wp(2),
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: hp(10), // Add padding to account for the button
  },
  stepContentWrapper: {
    padding: wp(4),
  },
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    backgroundColor: 'white', // To ensure the button has a solid background
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: hp(2),
    borderRadius: 25,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: wp(16),
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: hp(2),
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  stepContentWrapper: {
    padding: wp(4),
  },
  selectorOuterContainer: {
    marginBottom: hp(3),
    width: '100%',
  },
  selectorContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    overflow: 'hidden',
    width: '100%',
  },
  selectorList: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  selectorItem: {
    width: wp(40),
    marginRight: wp(3),
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectorContent: {
    alignItems: 'center',
    padding: wp(4),
  },
  iconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  guideImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginBottom: hp(2),
  },
  selectorDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginVertical: hp(2),
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: wp(2), // Add padding to prevent text from touching edges
  },
  titleText: {
    fontFamily: 'DMSans-Bold',
    fontSize: wp(4),
    marginBottom: hp(1),
    color: '#1B1D21',
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: 'DMSans-Regular',
    fontSize: wp(3.2),
    color: '#666',
    lineHeight: wp(4.2),
    textAlign: 'center',
  },
  selectedItem: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  selectorContainer: {
    marginBottom: hp(3),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(4),
  },
  selectedItemText: {
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: wp(4),
    color: '#1B1D21',
    marginLeft: wp(3),
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(8),
  },
  iconContainer: {
    width: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideImage: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: wp(3),
  },
  checkboxContainer: {
    width: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: wp(3.8),
    color: '#1B1D21',
    marginBottom: hp(0.5),
  },
  selectorDescription: {
    fontFamily: 'DMSans-Regular',
    fontSize: wp(3.2),
    color: '#666',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: wp(16),
  },
});

export default GuidedSessionSetup;
