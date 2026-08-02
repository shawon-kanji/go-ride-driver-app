import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Banner } from '../../../components/Banner';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { Stepper } from '../../../components/Stepper';
import { TextInput } from '../../../components/TextInput';
import { ApiError } from '../../../api/http-client';
import { useCreateVehicleMutation, useUpdateVehicleMutation } from '../api';
import { CATEGORY_OPTIONS, vehicleSchema, type VehicleFormValues } from '../schemas';

interface VehicleFormProps {
  mode: 'create' | 'edit';
  vehicleId?: string;
  defaultValues?: VehicleFormValues;
}

const EMPTY_DEFAULTS: VehicleFormValues = {
  plate_number: '',
  color: '',
  model_name: '',
  seat_count: 4,
  category: 'normal',
};

export function VehicleForm({ mode, vehicleId, defaultValues }: VehicleFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createMutation = useCreateVehicleMutation();
  const updateMutation = useUpdateVehicleMutation(vehicleId ?? '');
  const { mutate, isPending } = mode === 'create' ? createMutation : updateMutation;

  const { control, handleSubmit } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: defaultValues ?? EMPTY_DEFAULTS,
  });

  const onValid = (values: VehicleFormValues) => {
    setErrorMessage(null);
    mutate(values, {
      onSuccess: () => router.back(),
      onError: (error) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to save vehicle.');
      },
    });
  };

  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const firstError = Object.values(errors)[0]?.message;
    setErrorMessage(firstError ?? 'Please check the form and try again.');
  };

  return (
    <View className="px-6 py-6">
      {errorMessage && (
        <Banner message={errorMessage} variant="error" onDismiss={() => setErrorMessage(null)} />
      )}

      <Controller
        control={control}
        name="plate_number"
        render={({ field }) => (
          <TextInput
            label="Plate number"
            autoCapitalize="characters"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name="model_name"
        render={({ field }) => (
          <TextInput
            label="Model"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <TextInput
            label="Color"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name="seat_count"
        render={({ field }) => (
          <Stepper
            label="Seat count"
            value={field.value}
            min={1}
            max={20}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <Select
            label="Category"
            value={field.value}
            options={CATEGORY_OPTIONS}
            onChange={field.onChange}
          />
        )}
      />

      <Button
        label={mode === 'create' ? 'Register vehicle' : 'Save changes'}
        onPress={handleSubmit(onValid, onInvalid)}
        loading={isPending}
      />
    </View>
  );
}
