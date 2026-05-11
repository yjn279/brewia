import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ScreenContainer } from '@/components/ScreenContainer'
import { FlavorPicker } from '@/components/FlavorPicker'
import { NumberField } from '@/components/form/NumberField'
import { RatingField } from '@/components/form/RatingField'
import { SelectField } from '@/components/form/SelectField'
import { StepListField } from '@/components/form/StepListField'
import { TextField } from '@/components/form/TextField'
import { listBeans } from '@/features/beans/api'
import { getBrew, updateBrew } from '@/features/brews/api'
import { upsertBrewSchema, type UpsertBrewDto } from '@/features/brews/schema'
import { listBrewFlavors } from '@/features/flavors/api'
import type { Bean } from '@/types/domain'

export default function EditBrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [beans, setBeans] = useState<Bean[]>([])

  useEffect(() => {
    listBeans().then(setBeans).catch(() => {})
  }, [])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertBrewDto>({
    resolver: zodResolver(upsertBrewSchema),
    defaultValues: {
      beanId: '',
      beanWeight: 15,
      beanGrind: 0,
      waterWeight: 250,
      waterTemp: 93,
      steps: [{ time: 0, water: 0 }],
      aroma: 3,
      acidity: 3,
      sweetness: 3,
      body: 3,
      overall: 3,
      notes: '',
      flavorIds: [],
    },
  })

  useEffect(() => {
    if (!id) return
    Promise.all([getBrew(id), listBrewFlavors(id)]).then(([brew, flavorIds]) => {
      if (brew) {
        reset({
          beanId: brew.beanId,
          beanWeight: brew.beanWeight,
          beanGrind: brew.beanGrind,
          waterWeight: brew.waterWeight,
          waterTemp: brew.waterTemp,
          steps: brew.steps,
          aroma: brew.aroma,
          acidity: brew.acidity,
          sweetness: brew.sweetness,
          body: brew.body,
          overall: brew.overall,
          notes: brew.notes,
          flavorIds,
        })
      }
    })
  }, [id, reset])

  const { fields, append, remove } = useFieldArray({ control, name: 'steps' })
  const beanOptions = beans.map((b) => b.name)
  const selectedBeanName = watch('beanId')
    ? beans.find((b) => b.id === watch('beanId'))?.name ?? ''
    : ''

  async function onSubmit(data: UpsertBrewDto) {
    if (!id) return
    try {
      await updateBrew(id, data)
      router.back()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Edit Brew</Text>

      <SelectField
        label="Bean"
        value={selectedBeanName}
        options={beanOptions}
        onChange={(name) => {
          const bean = beans.find((b) => b.name === name)
          if (bean) setValue('beanId', bean.id)
        }}
        error={errors.beanId?.message}
      />

      <Controller
        control={control}
        name="beanWeight"
        render={({ field: { value, onChange } }) => (
          <NumberField label="Bean Weight (g)" value={String(value ?? '')} onChangeText={onChange} error={errors.beanWeight?.message} />
        )}
      />
      <Controller
        control={control}
        name="waterWeight"
        render={({ field: { value, onChange } }) => (
          <NumberField label="Water (ml)" value={String(value ?? '')} onChangeText={onChange} error={errors.waterWeight?.message} />
        )}
      />
      <Controller
        control={control}
        name="waterTemp"
        render={({ field: { value, onChange } }) => (
          <NumberField label="Temperature (°C)" value={String(value ?? '')} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="beanGrind"
        render={({ field: { value, onChange } }) => (
          <NumberField label="Grind size" value={String(value ?? '')} onChangeText={onChange} />
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

      <Controller
        control={control}
        name="aroma"
        render={({ field: { value, onChange } }) => <RatingField label="Aroma" value={value} onChange={onChange} />}
      />
      <Controller
        control={control}
        name="acidity"
        render={({ field: { value, onChange } }) => <RatingField label="Acidity" value={value} onChange={onChange} />}
      />
      <Controller
        control={control}
        name="sweetness"
        render={({ field: { value, onChange } }) => <RatingField label="Sweetness" value={value} onChange={onChange} />}
      />
      <Controller
        control={control}
        name="body"
        render={({ field: { value, onChange } }) => <RatingField label="Body" value={value} onChange={onChange} />}
      />
      <Controller
        control={control}
        name="overall"
        render={({ field: { value, onChange } }) => <RatingField label="Overall" value={value} onChange={onChange} />}
      />

      <Controller
        control={control}
        name="flavorIds"
        render={({ field: { value, onChange } }) => (
          <FlavorPicker selectedIds={value} onChange={onChange} />
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
