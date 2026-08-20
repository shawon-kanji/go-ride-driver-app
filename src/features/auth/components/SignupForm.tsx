import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Info } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Banner } from '../../../components/Banner';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { ApiError } from '../../../api/http-client';
import { SignupSucceededLoginFailedError, useSignupMutation } from '../api';
import { signupSchema, type SignupFormValues } from '../schemas';

export function SignupForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate, isPending } = useSignupMutation();

  const { control, handleSubmit } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', first_name: '', last_name: '' },
  });

  const onValid = (values: SignupFormValues) => {
    setErrorMessage(null);
    mutate(values, {
      onError: (error) => {
        if (error instanceof SignupSucceededLoginFailedError) {
          router.replace({ pathname: '/(auth)/login', params: { email: error.email } });
          return;
        }
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to sign up.');
      },
    });
  };

  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const firstError = Object.values(errors)[0]?.message;
    setErrorMessage(firstError ?? 'Please check the form and try again.');
  };

  return (
    <View>
      {errorMessage && (
        <Banner message={errorMessage} variant="error" onDismiss={() => setErrorMessage(null)} />
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="first_name"
            render={({ field }) => (
              <TextInput
                label="First name"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="last_name"
            render={({ field }) => (
              <TextInput
                label="Last name"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            label="Email"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextInput
            label="Password"
            secureTextEntry
            revealToggle
            errorText={fieldState.error ? 'Use at least 8 characters.' : undefined}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <View className="mb-4 flex-row items-start gap-3 rounded-control bg-primary-50 px-3 py-3">
        <Info size={18} strokeWidth={2} color="#4338CA" />
        <Text className="flex-1 text-[13px] font-jakarta-semibold text-primary-700">
          That&apos;s all we need to open your account. Add a vehicle and upload documents later,
          from the menu — you&apos;ll need both approved before your first trip.
        </Text>
      </View>

      <Button
        label="Continue"
        size="large"
        shape="rect"
        onPress={handleSubmit(onValid, onInvalid)}
        loading={isPending}
        testID="signup-submit"
      />
    </View>
  );
}
