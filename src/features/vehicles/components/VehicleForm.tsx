import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Banner } from '../../../components/Banner';
import { Button } from '../../../components/Button';
import { SegmentedControl } from '../../../components/SegmentedControl';
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
  const isCreate = mode === 'create';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createMutation = useCreateVehicleMutation();
  const updateMutation = useUpdateVehicleMutation(vehicleId ?? '');
  const { mutate, isPending } = isCreate ? createMutation : updateMutation;

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
    <View
      className={
        isCreate
          ? 'm-5 rounded-card border border-dashed border-neutral-300 p-4'
          : 'px-5 py-5'
      }
    >
      {isCreate && (
        <Text className="mb-3 text-[12px] font-jakarta-bold uppercase tracking-[0.08em] text-neutral-500">
          Add a vehicle
        </Text>
      )}

      {errorMessage && (
        <Banner message={errorMessage} variant="error" onDismiss={() => setErrorMessage(null)} />
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="plate_number"
            render={({ field, fieldState }) => (
              <TextInput
                label="Plate number"
                autoCapitalize="characters"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                errorText={fieldState.error?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="seat_count"
            render={({ field }) => (
              <Stepper label="Seats" value={field.value} min={1} max={20} onChange={field.onChange} />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="model_name"
        render={({ field, fieldState }) => (
          <TextInput
            label="Model"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            errorText={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="color"
        render={({ field, fieldState }) => (
          <TextInput
            label="Color"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            errorText={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <SegmentedControl
            label="Category"
            value={field.value}
            options={CATEGORY_OPTIONS}
            onChange={field.onChange}
            testID="vehicle-category"
          />
        )}
      />

      <Button
        label={isCreate ? 'Register vehicle' : 'Save changes'}
        variant={isCreate ? 'dark' : 'primary'}
        shape="rect"
        size="default"
        onPress={handleSubmit(onValid, onInvalid)}
        loading={isPending}
        testID="vehicle-submit"
      />
    </View>
  );
}
