import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { resetPassword } from '../../lib/firebase';
import { Mail } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please check your email address.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Password reset email sent! Check your inbox for further instructions.
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity style={styles.backToLogin}>
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={20} color={Colors.neutral[400]} />}
              />

              <Button
                title="Send Reset Instructions"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
              />

              <Link href="/login" asChild>
                <TouchableOpacity style={styles.backToLogin}>
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
              </Link>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: Layout.spacing.xl,
    maxWidth: 400,
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.neutral[900],
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[600],
    marginBottom: Layout.spacing.xl,
  },  errorContainer: {
    backgroundColor: Colors.error[50],
    padding: Layout.spacing.md,
    borderRadius: 8,
    marginVertical: Layout.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error[500],
    width: '100%',
    zIndex: 1,
    elevation: 1,
  },
  errorText: {
    color: Colors.error[700],
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },  successContainer: {
    backgroundColor: Colors.success[50],
    padding: Layout.spacing.md,
    borderRadius: 8,
    marginVertical: Layout.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success[500],
    width: '100%',
    zIndex: 1,
    elevation: 1,
    position: 'relative',
  },
  successText: {
    color: Colors.success[700],
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: Layout.spacing.md,
  },
  backToLogin: {
    alignSelf: 'center',
    marginTop: Layout.spacing.xl,
  },
  backToLoginText: {
    color: Colors.primary[600],
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});
