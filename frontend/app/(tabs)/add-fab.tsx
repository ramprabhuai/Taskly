import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This is a placeholder tab - the FAB button navigates to /add-task modal
export default function AddFabPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#999' },
});
