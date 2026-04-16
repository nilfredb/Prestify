import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';
import { NotificationProvider } from '@/context/NotificationContext';



const _layout = () => {

  return <Stack screenOptions={{ headerShown: false }}> </Stack>;

};


export default _layout;

const styles = StyleSheet.create({});