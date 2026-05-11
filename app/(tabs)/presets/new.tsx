import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { ScreenContainer } from '@/components/ScreenContainer'
import { NumberField } from '@/components/form/NumberField'
import { StepListField } from '@/components/form/StepListField'
import { TextField } from '@/components/form/TextField'
import { createPreset } from '@/features/presets/api'
import { upsertPresetSchema, type UpsertPresetDto } from '@/features/presets/schema'
import { useSession } from '@/lib/auth'

export default function NewPresetScreen() {
  const { session } = useSession()
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpsertPresetDto>({
    resolver: zodResolver(upsertPresetSchema),
    defaultValues: {
      name: '',
      description: '',
      brewRatio: 15,
      steps: [{ time: 0, water: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'steps' })

  async function onSubmit(data: UpsertPresetDto) {
    if (!session?.user?.id) return
    try {
      await createPreset(session.user.id, data)
      router.back()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>New Preset</Text>
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} placeholder="e.g. V60 Classic" />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Description" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: 'top' }} />
        )}
      />
      <Controller
        control={control}
        name="brewRatio"
        render={({ field: { value, onChange } }) => (
          <NumberField label="Brew Ratio (e.g. 15 for 1:15)" value={String(value ?? '')} onChangeText={onChange} error={errors.brewRatio?.message} />
        )}
      />
      <StepListField
        fields={fields}
        append={append}
        remove={remove}
        getValue={(i, f) => String((watch(`steps.${i}.${f}`) ?? '') as string | number)}
        setValue={(i, f, v) => setValue(`steps.${i}.${f}` as Parameters<typeof setValue>[0], Number(v))}
        error={errors.steps?.message}
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.disabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={styles.saveText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#4285F4', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.6 },
})
