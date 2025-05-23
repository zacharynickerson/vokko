import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, Alert, FlatList, TextInput, Image, StatusBar, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import { auth, db, updateVoiceNote, storage } from '../../config/firebase';
import { ref, onValue, off, remove } from 'firebase/database';
import { deleteObject } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import FirebaseImage from '../components/FirebaseImage';

export default function RamblingsScreen() {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Get user's name
    if (auth.currentUser?.displayName) {
      setUserName(auth.currentUser.displayName.split(' ')[0]);
    }
  }, []);

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const navigateToSoloSession = () => {
    navigation.navigate('SoloSessionCall');
  };

  const fetchVoiceNotes = useCallback((voiceNotesRef) => {
    return new Promise((resolve, reject) => {
      try {
        onValue(voiceNotesRef, (snapshot) => {
          let firebaseNotes = [];
          if (snapshot.exists()) {
            firebaseNotes = Object.entries(snapshot.val()).map(([id, note]) => ({
              id: note.voiceNoteId || id,
              createdDate: note.createdDate || new Date().toISOString(),
              title: note.title || 'Untitled Note',
              status: note.status || 'completed',
              processingStartedAt: note.processingStartedAt || null,
              errorDetails: note.errorDetails || null,
              type: 'solo',
              image: note.image || null,
              summary: note.summary || null,
              location: note.location || null
            }));
          }
          resolve(firebaseNotes);
        }, {
          onlyOnce: true
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const voiceNotesRef = ref(db, `/voiceNotes/${userId}`);

    // Set up listeners for real-time updates
    const voiceNotesListener = onValue(voiceNotesRef, (snapshot) => {
      let firebaseNotes = [];
      if (snapshot.exists()) {
        firebaseNotes = Object.entries(snapshot.val()).map(([id, note]) => ({
          id: note.voiceNoteId || id,
          createdDate: note.createdDate || new Date().toISOString(),
          title: note.title || 'Untitled Note',
          status: note.status || 'completed',
          processingStartedAt: note.processingStartedAt || null,
          errorDetails: note.errorDetails || null,
          type: 'solo',
          image: note.image || null,
          summary: note.summary || null,
          location: note.location || null
        }));
      }
      
      setSessions(sortSessionsChronologically(firebaseNotes));
    });

    // Initial load
    fetchVoiceNotes(voiceNotesRef)
      .then((voiceNotes) => {
        setSessions(sortSessionsChronologically(voiceNotes));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sessions:', error);
        Alert.alert('Error', 'Failed to load sessions. Please try again.');
        setLoading(false);
      });

    // Cleanup listeners
    return () => {
      off(voiceNotesRef);
    };
  }, [fetchVoiceNotes]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sessions.filter(session => 
        session.title?.toLowerCase().includes(query) ||
        session.summary?.toLowerCase().includes(query)
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);

  const sortSessionsChronologically = (sessions) => {
    return sessions.sort((b, a) => new Date(a.createdDate) - new Date(b.createdDate));
  };

  const handleRetry = async (voiceNoteId) => {
    if (isRetrying) return;

    console.log(`Attempting to retry processing for voice note ID: ${voiceNoteId}`);
    setIsRetrying(true);
    
    try {
      await updateVoiceNote(auth.currentUser.uid, voiceNoteId, {
        status: 'processing',
        lastRetry: new Date().toISOString()
      });
      Alert.alert('Retry initiated', 'The transcription process has been retried.');
    } catch (error) {
      console.error('Error retrying transcription:', error);
      Alert.alert('Error', 'Failed to retry transcription.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async (voiceNoteId) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const voiceNoteRef = ref(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
              await remove(voiceNoteRef);
              
              const storageRef = ref(storage, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
              await deleteObject(storageRef);
              
              setSessions(prev => prev.filter(session => session.id !== voiceNoteId));
            } catch (error) {
              console.error('Error deleting voice note:', error);
              Alert.alert('Error', 'Failed to delete recording. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getFilteredSessions = useCallback(() => {
    let filtered = sessions;

    // Apply time filter
    if (selectedMonth !== null || selectedYear !== null) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.createdDate);
        const matchesMonth = selectedMonth === null || sessionDate.getMonth() === selectedMonth;
        const matchesYear = selectedYear === null || sessionDate.getFullYear() === selectedYear;
        return matchesMonth && matchesYear;
      });
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(session => 
        session.tags && 
        selectedTags.every(tag => session.tags.includes(tag))
      );
    }

    // Apply search filter if exists
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => 
        session.title?.toLowerCase().includes(query) ||
        session.summary?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [sessions, selectedMonth, selectedYear, selectedTags, searchQuery]);

  const renderItem = ({ item }) => {
    const isLoading = item.status === 'recording' || item.status === 'processing';
    const onPress = () => {
      if (!isLoading) {
        navigation.navigate('VoiceNoteDetails', { voiceNote: item });
      }
    };

    return (
      <SoloVoiceNoteItem
        item={item}
        onPress={onPress}
        onRetry={() => handleRetry(item.id)}
        onDelete={() => handleDelete(item.id)}
        isLoading={isLoading || isRetrying}
        enableMapClick={false}
      />
    );
  };

  const renderFloatingActionButton = () => (
    <TouchableOpacity 
      style={styles.fab}
      onPress={navigateToSoloSession}
    >
      <MaterialCommunityIcons name="microphone" size={24} color="white" />
    </TouchableOpacity>
  );

  const renderWelcomeSection = () => {
    const totalRamblings = sessions.length;
    const thisWeekRamblings = sessions.filter(s => {
      const sessionDate = new Date(s.createdDate);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return sessionDate >= oneWeekAgo;
    }).length;

    return (
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.greeting}>{greeting}{userName ? `, ${userName}` : ''}</Text>
          <Text style={styles.welcomeSubtitle}>What's on your mind today?</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalRamblings}</Text>
            <Text style={styles.statLabel}>Total Ramblings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{thisWeekRamblings}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuickTips = () => (
    <View style={styles.quickTipsContainer}>
      <Text style={styles.quickTipsTitle}>Quick Tips</Text>
      <View style={styles.tipsList}>
        <View style={styles.tipItem}>
          <MaterialCommunityIcons name="microphone" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>Tap the mic to start recording</Text>
        </View>
        <View style={styles.tipItem}>
          <MaterialCommunityIcons name="text-search" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>Search your ramblings by title or content</Text>
        </View>
      </View>
    </View>
  );

  const getAvailableMonthsAndYears = useCallback(() => {
    const months = new Set();
    const years = new Set();
    
    sessions.forEach(session => {
      const date = new Date(session.createdDate);
      months.add(date.getMonth());
      years.add(date.getFullYear());
    });

    return {
      months: Array.from(months).sort((a, b) => a - b),
      years: Array.from(years).sort((a, b) => b - a) // Most recent first
    };
  }, [sessions]);

  const getMonthName = (month) => {
    return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderFilterModal = () => {
    const { months, years } = getAvailableMonthsAndYears();

    return (
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Ramblings</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#1B1D21" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date</Text>
              <View style={styles.dateFilterContainer}>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {selectedMonth !== null ? getMonthName(selectedMonth) : 'Any Month'}
                    </Text>
                    <Ionicons 
                      name={showMonthDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  {showMonthDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedMonth(null);
                            setShowMonthDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>Any Month</Text>
                        </TouchableOpacity>
                        {months.map((month) => (
                          <TouchableOpacity
                            key={month}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedMonth(month);
                              setShowMonthDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{getMonthName(month)}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {selectedYear !== null ? selectedYear : 'Any Year'}
                    </Text>
                    <Ionicons 
                      name={showYearDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  {showYearDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedYear(null);
                            setShowYearDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>Any Year</Text>
                        </TouchableOpacity>
                        {years.map((year) => (
                          <TouchableOpacity
                            key={year}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedYear(year);
                              setShowYearDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{year}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Tags</Text>
              <View style={styles.filterOptions}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.filterOption,
                      selectedTags.includes(tag) && styles.filterOptionSelected
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedTags.includes(tag) && styles.filterOptionTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
                {availableTags.length === 0 && (
                  <Text style={styles.noTagsText}>No tags available</Text>
                )}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSelectedMonth(null);
                  setSelectedYear(null);
                  setSelectedTags([]);
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.searchContainer}
          onPress={() => {
            setIsSearchModalVisible(true);
            // Small delay to ensure modal is visible before focusing
            setTimeout(() => {
              searchInputRef.current?.focus();
            }, 100);
          }}
        >
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search ramblings...</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={navigateToSettings}
        >
          <FirebaseImage
            avatarName={auth.currentUser?.avatar}
            style={styles.profileImage}
            defaultImage={require('../../assets/images/default-prof-pic.png')}
          />
        </TouchableOpacity>
      </View>

      {!isSearchFocused && (
        <>
          {renderWelcomeSection()}
          {sessions.length === 0 && renderQuickTips()}
          <View style={styles.viewOptionsContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Search Results' : 'Your Ramblings'}
              </Text>
              {(selectedMonth !== null || selectedYear !== null || selectedTags.length > 0) && (
                <Text style={styles.filterCount}>
                  {getFilteredSessions().length} of {sessions.length}
                </Text>
              )}
            </View>
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.filterButton,
                  (selectedMonth !== null || selectedYear !== null || selectedTags.length > 0) && styles.filterButtonActive
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <MaterialCommunityIcons 
                  name="filter-variant" 
                  size={24} 
                  color={(selectedMonth !== null || selectedYear !== null || selectedTags.length > 0) ? '#4CAF50' : '#1B1D21'} 
                />
                <Text style={[
                  styles.filterButtonText,
                  (selectedMonth !== null || selectedYear !== null || selectedTags.length > 0) && styles.filterButtonTextActive
                ]}>
                  {(selectedMonth !== null || selectedYear !== null || selectedTags.length > 0) ? 'Filtered' : 'Filter'}
                </Text>
              </TouchableOpacity>
              {(selectedMonth !== null || selectedYear !== null || selectedTags.length > 0) && (
                <TouchableOpacity 
                  style={styles.clearFilterButton}
                  onPress={() => {
                    setSelectedMonth(null);
                    setSelectedYear(null);
                    setSelectedTags([]);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#4CAF50" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );

  const renderSearchModal = () => (
    <Modal
      visible={isSearchModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setIsSearchModalVisible(false);
        setSearchQuery('');
      }}
    >
      <SafeAreaView style={styles.searchModalContainer}>
        <View style={styles.searchModalContent}>
          <View style={styles.searchModalHeader}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchModalInput}
                placeholder="Search ramblings..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeSearchButton}
              onPress={() => {
                setIsSearchModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close" size={24} color="#1B1D21" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getFilteredSessions()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.searchResultsList}
            ListEmptyComponent={() => (
              <View style={styles.emptySearchContainer}>
                <Text style={styles.emptySearchText}>
                  {searchQuery ? 'No results found' : 'Start typing to search'}
                </Text>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons name="microphone-off" size={48} color="#666" />
      <Text style={styles.emptyStateTitle}>No Ramblings Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Tap the microphone button to start your first rambling
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={getFilteredSessions()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              getFilteredSessions().length === 0 && styles.emptyListContent
            ]}
            style={styles.flatList}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
          {renderFloatingActionButton()}
          {renderFilterModal()}
          {renderSearchModal()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: wp(4),
    color: '#666',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  viewOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  viewOptions: {
    flexDirection: 'row',
  },
  viewOptionButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  activeViewOption: {
    backgroundColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#1B1D21',
  },
  listContent: {
    paddingBottom: 80, // Extra padding for FAB
  },
  emptyListContent: {
    flex: 1,
  },
  flatList: {
    backgroundColor: '#F9F9F9',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#1B1D21',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: wp(4),
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: wp(4),
    color: '#666',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  welcomeTextContainer: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: wp(6),
    fontWeight: '600',
    color: '#1B1D21',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: wp(4),
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: wp(5.5),
    fontWeight: '600',
    color: '#1B1D21',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: wp(3.2),
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: wp(4),
  },
  quickTipsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  quickTipsTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#1B1D21',
    marginBottom: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    fontSize: wp(3.5),
    color: '#666',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#1B1D21',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#1B1D21',
    marginBottom: 12,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownButtonText: {
    fontSize: wp(4),
    color: '#1B1D21',
  },
  dropdownList: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 4,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: wp(4),
    color: '#1B1D21',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  filterOptionText: {
    fontSize: wp(3.5),
    color: '#666',
  },
  filterOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#4CAF50',
    fontSize: wp(4),
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: wp(4),
    fontWeight: '600',
  },
  noTagsText: {
    color: '#666',
    fontSize: wp(3.5),
    fontStyle: 'italic',
  },
  filterButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#E8F5E9',
  },
  filterButtonText: {
    fontSize: wp(4),
    color: '#1B1D21',
  },
  filterButtonTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  clearFilterButton: {
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterCount: {
    fontSize: wp(3.5),
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchModalContent: {
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchModalInput: {
    flex: 1,
    fontSize: wp(4),
    color: '#000',
    paddingVertical: 8,
  },
  closeSearchButton: {
    padding: 8,
  },
  searchResultsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  emptySearchText: {
    fontSize: wp(4),
    color: '#666',
  },
}); 