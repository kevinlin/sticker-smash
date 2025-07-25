import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, Linking, Switch, Modal, Platform } from 'react-native';
import { TextInput, TouchableOpacity, View, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NewEventScreen() {
  const [subject, setSubject] = useState('');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [isAllDay, setIsAllDay] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<'fromDate' | 'fromTime' | 'toDate' | 'toTime'>('fromDate');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTimeForOutlook = (date: Date) => {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject for the event');
      return;
    }

    try {
      const startDateTime = formatDateTimeForOutlook(fromDate);
      const endDateTime = formatDateTimeForOutlook(toDate);
      
      // Use mobile app deeplink scheme for Outlook mobile
      let deepLink = `ms-outlook://events/new?subject=${encodeURIComponent(subject)}&startdt=${startDateTime}`;
      
      if (!isAllDay) {
        deepLink += `&enddt=${endDateTime}`;
      }

      console.log('Opening Outlook mobile app with URL:', deepLink);
      
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        // Fallback to web version if mobile app is not available
        const webDeepLink = `https://outlook.office.com/calendar/deeplink/compose?subject=${encodeURIComponent(subject)}&startdt=${startDateTime}${!isAllDay ? `&enddt=${endDateTime}` : ''}`;
        
        console.log('Outlook mobile app not found, trying web version:', webDeepLink);
        
        const canOpenWeb = await Linking.canOpenURL(webDeepLink);
        if (canOpenWeb) {
          await Linking.openURL(webDeepLink);
        } else {
          Alert.alert('Error', 'Cannot open Outlook. Please make sure Outlook is installed or accessible via web.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Outlook');
      console.error('Error opening Outlook:', error);
    }
  };

  const openDatePicker = (field: 'fromDate' | 'fromTime' | 'toDate' | 'toTime') => {
    setCurrentDateField(field);
    setShowDatePicker(true);
  };

  const handleDateChange = (selectedDate: Date) => {
    const now = new Date();
    
    switch (currentDateField) {
      case 'fromDate':
        const newFromDate = new Date(fromDate);
        newFromDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setFromDate(newFromDate);
        
        // Auto-update toDate to be at least 1 hour after fromDate
        if (newFromDate >= toDate) {
          setToDate(new Date(newFromDate.getTime() + 60 * 60 * 1000));
        }
        break;
        
      case 'fromTime':
        const newFromTime = new Date(fromDate);
        newFromTime.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        setFromDate(newFromTime);
        
        // Auto-update toDate to be at least 1 hour after fromDate
        if (newFromTime >= toDate) {
          setToDate(new Date(newFromTime.getTime() + 60 * 60 * 1000));
        }
        break;
        
      case 'toDate':
        const newToDate = new Date(toDate);
        newToDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        if (newToDate >= fromDate) {
          setToDate(newToDate);
        } else {
          Alert.alert('Error', 'End date cannot be before start date');
        }
        break;
        
      case 'toTime':
        const newToTime = new Date(toDate);
        newToTime.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        if (newToTime > fromDate) {
          setToDate(newToTime);
        } else {
          Alert.alert('Error', 'End time must be after start time');
        }
        break;
    }
    
    setShowDatePicker(false);
  };

  const SimpleDateTimePicker = () => {
    const [tempDate, setTempDate] = useState(
      currentDateField === 'fromDate' || currentDateField === 'fromTime' ? fromDate : toDate
    );

    const isTimeMode = currentDateField === 'fromTime' || currentDateField === 'toTime';

    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {isTimeMode ? 'Select Time' : 'Select Date'}
            </ThemedText>
            
            {isTimeMode ? (
              <View style={styles.timePickerContainer}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Hour:</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempDate.getHours().toString().padStart(2, '0')}
                    onChangeText={(text) => {
                      const hour = parseInt(text) || 0;
                      if (hour >= 0 && hour <= 23) {
                        const newDate = new Date(tempDate);
                        newDate.setHours(hour);
                        setTempDate(newDate);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Minute:</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempDate.getMinutes().toString().padStart(2, '0')}
                    onChangeText={(text) => {
                      const minute = parseInt(text) || 0;
                      if (minute >= 0 && minute <= 59) {
                        const newDate = new Date(tempDate);
                        newDate.setMinutes(minute);
                        setTempDate(newDate);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.datePickerContainer}>
                <TextInput
                  style={styles.dateInput}
                  value={tempDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const newDate = new Date(text);
                    if (!isNaN(newDate.getTime())) {
                      setTempDate(newDate);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handleDateChange(tempDate)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Create New Event</ThemedText>
        
        {/* Subject Field */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>Subject *</ThemedText>
          <TextInput
            style={styles.textInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter event subject"
            placeholderTextColor="#999"
          />
        </ThemedView>

        {/* All Day Toggle */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedView style={styles.switchContainer}>
            <ThemedText type="defaultSemiBold" style={styles.label}>All Day Event</ThemedText>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isAllDay ? '#f5dd4b' : '#f4f3f4'}
            />
          </ThemedView>
        </ThemedView>

        {/* From Date/Time */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>From</ThemedText>
          <ThemedView style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => openDatePicker('fromDate')}
            >
              <ThemedText>{formatDate(fromDate)}</ThemedText>
            </TouchableOpacity>
            
            {!isAllDay && (
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => openDatePicker('fromTime')}
              >
                <ThemedText>{formatTime(fromDate)}</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>

        {/* To Date/Time */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>To</ThemedText>
          <ThemedView style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => openDatePicker('toDate')}
            >
              <ThemedText>{formatDate(toDate)}</ThemedText>
            </TouchableOpacity>
            
            {!isAllDay && (
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => openDatePicker('toTime')}
              >
                <ThemedText>{formatTime(toDate)}</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <ThemedText type="defaultSemiBold" style={styles.submitButtonText}>
            Create Event in Outlook
          </ThemedText>
        </TouchableOpacity>

        <SimpleDateTimePicker />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60, // Account for status bar
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#0078d4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
    textAlign: 'center',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  timeInputContainer: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#000',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
    textAlign: 'center',
    width: 60,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#0078d4',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 