import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function Root() {
  useFrameworkReady();
  
  return <Redirect href="/login" />;
}