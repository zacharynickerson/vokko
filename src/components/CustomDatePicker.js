import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';

const CustomDatePicker = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedTime, setSelectedTime] = useState('07:00 AM');

  const onDayPress = (day) => {
    setSelectedDate(moment(day.dateString));
    onDateSelect(day.dateString, selectedTime);
  };

  const renderHeader = (date) => {
    const monthYear = moment(date).format('MMMM YYYY');
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedDate(moment(date).subtract(1, 'month'))}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{monthYear}</Text>
        <TouchableOpacity onPress={() => setSelectedDate(moment(date).add(1, 'month'))}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const timeOptions = ['07:00 AM', '08:00 AM', '09:00 AM'];

  const onTimeSelect = (time) => {
    setSelectedTime(time);
    onDateSelect(selectedDate.format('YYYY-MM-DD'), time);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate.format('YYYY-MM-DD')}
        onDayPress={onDayPress}
        monthFormat={'MMMM yyyy'}
        renderHeader={renderHeader}
        markedDates={{
          [selectedDate.format('YYYY-MM-DD')]: {selected: true, selectedColor: '#4FBF67'}
        }}
        theme={{
          calendarBackground: 'white',
          textSectionTitleColor: '#FF6B00',
          selectedDayBackgroundColor: '#4FBF67',
          selectedDayTextColor: 'white',
          todayTextColor: '#4FBF67',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#4FBF67',
          selectedDotColor: 'white',
          arrowColor: 'white',
          monthTextColor: 'white',
          textDayFontFamily: 'DMSans-Regular',
          textMonthFontFamily: 'DMSans-Bold',
          textDayHeaderFontFamily: 'DMSans-Medium',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
          'stylesheet.calendar.header': {
            week: {
              marginTop: 20,
              flexDirection: 'row',
              justifyContent: 'space-around'
            }
          }
        }}
      />
      <Text style={styles.pickTimeText}>Pick time</Text>
      <View style={styles.timeContainer}>
        {timeOptions.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeButton,
              selectedTime === time && styles.selectedTimeButton
            ]}
            onPress={() => onTimeSelect(time)}
          >
            <Text style={[
              styles.timeButtonText,
              selectedTime === time && styles.selectedTimeButtonText
            ]}>
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4FBF67',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
    marginTop: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
  },
  pickTimeText: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    marginLeft: 20,
    fontFamily: 'DMSans-Regular',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4FBF67',
  },
  selectedTimeButton: {
    backgroundColor: '#4FBF67',
  },
  timeButtonText: {
    color: '#4FBF67',
    fontFamily: 'DMSans-Regular',
  },
  selectedTimeButtonText: {
    color: 'white',
  },
});

export default CustomDatePicker;
