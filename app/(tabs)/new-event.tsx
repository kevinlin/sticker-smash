import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, Linking, Switch, Platform } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NewEventScreen() {
  const [subject, setSubject] = useState('');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [isAllDay, setIsAllDay] = useState(false);

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
        console.log('Outlook mobile app not found, trying web version');
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

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const newFromDate = new Date(fromDate);
      newFromDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setFromDate(newFromDate);
      
      // Auto-update toDate to be at least 1 hour after fromDate
      if (newFromDate >= toDate) {
        setToDate(new Date(newFromDate.getTime() + 60 * 60 * 1000));
      }
    }
  };

  const onFromTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const newFromDate = new Date(fromDate);
      newFromDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setFromDate(newFromDate);
      
      // Auto-update toDate to be at least 1 hour after fromDate
      if (newFromDate >= toDate) {
        setToDate(new Date(newFromDate.getTime() + 60 * 60 * 1000));
      }
    }
  };

  const onToDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const newToDate = new Date(toDate);
      newToDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      if (newToDate >= fromDate) {
        setToDate(newToDate);
      } else {
        Alert.alert('Error', 'End date cannot be before start date');
      }
    }
  };

  const onToTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const newToDate = new Date(toDate);
      newToDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      if (newToDate > fromDate) {
        setToDate(newToDate);
      } else {
        Alert.alert('Error', 'End time must be after start time');
      }
    }
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
          <ThemedView style={styles.dateTimeRow}>
            <ThemedView style={styles.dateTimeColumn}>
              <ThemedText type="defaultSemiBold" style={styles.label}>From Date</ThemedText>
              <ThemedView style={styles.pickerContainer}>
                <DateTimePicker
                  value={fromDate}
                  mode="date"
                  display="default"
                  onChange={onFromDateChange}
                />
              </ThemedView>
            </ThemedView>
            
            {!isAllDay && (
              <ThemedView style={styles.dateTimeColumn}>
                <ThemedText type="defaultSemiBold" style={styles.label}>From Time</ThemedText>
                <ThemedView style={styles.pickerContainer}>
                  <DateTimePicker
                    value={fromDate}
                    mode="time"
                    display="default"
                    onChange={onFromTimeChange}
                  />
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* To Date/Time */}
        <ThemedView style={styles.fieldContainer}>
          <ThemedView style={styles.dateTimeRow}>
            <ThemedView style={styles.dateTimeColumn}>
              <ThemedText type="defaultSemiBold" style={styles.label}>To Date</ThemedText>
              <ThemedView style={styles.pickerContainer}>
                <DateTimePicker
                  value={toDate}
                  mode="date"
                  display="default"
                  onChange={onToDateChange}
                />
              </ThemedView>
            </ThemedView>
            
            {!isAllDay && (
              <ThemedView style={styles.dateTimeColumn}>
                <ThemedText type="defaultSemiBold" style={styles.label}>To Time</ThemedText>
                <ThemedView style={styles.pickerContainer}>
                  <DateTimePicker
                    value={toDate}
                    mode="time"
                    display="default"
                    onChange={onToTimeChange}
                  />
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <ThemedText type="defaultSemiBold" style={styles.submitButtonText}>
            Create Event in Outlook
          </ThemedText>
        </TouchableOpacity>
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
  pickerContainer: {
    marginTop: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 15,
  },
  dateTimeColumn: {
    flex: 1,
  },
  subLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
}); 