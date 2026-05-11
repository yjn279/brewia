import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ScreenContainer } from '@/components/ScreenContainer'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { NumberField } from '@/components/form/NumberField'
import { getBean, updateBean } from '@/features/beans/api'
import { upsertBeanSchema, type UpsertBeanDto } from '@/features/beans/schema'
import { COUNTRIES, ROAST_LEVELS } from '@/types/domain'

export default function EditBeanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertBeanDto>({
    resolver: zodResolver(upsertBeanSchema),
    defaultValues: {
      name: '',
      roaster: '',
      country: 'Ethiopia',
      roast: 'Medium',
      region: '',
      farm: '',
      variety: '',
      process: '',
      priceJpy: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (id) {
      getBean(id).then((bean) => {
        if (bean) {
          reset({
            name: bean.name,
            roaster: bean.roaster,
            country: bean.country,
            roast: bean.roast,
            region: bean.region,
            farm: bean.farm,
            variety: bean.variety,
            process: bean.process,
            priceJpy: bean.priceJpy,
            notes: bean.notes,
          })
        }
      })
    }
  }, [id, reset])

  async function onSubmit(data: UpsertBeanDto) {
    if (!id) return
    try {
      await updateBean(id, data)
      router.back()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Edit Bean</Text>
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
        )}
      />
      <Controller
        control={control}
        name="roaster"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Roaster" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.roaster?.message} />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field: { value, onChange } }) => (
          <SelectField label="Country" value={value} options={COUNTRIES} onChange={onChange} error={errors.country?.message} />
        )}
      />
      <Controller
        control={control}
        name="roast"
        render={({ field: { value, onChange } }) => (
          <SelectField label="Roast Level" value={value} options={ROAST_LEVELS} onChange={onChange} error={errors.roast?.message} />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Region" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />
      <Controller
        control={control}
        name="farm"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Farm" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />
      <Controller
        control={control}
        name="variety"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Variety" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />
      <Controller
        control={control}
        name="process"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Process" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />
      <Controller
        control={control}
        name="priceJpy"
        render={({ field: { value, onChange } }) => (
          <NumberField label="Price (JPY)" value={String(value ?? '')} onChangeText={onChange} error={errors.priceJpy?.message} />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Notes" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
        )}
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
