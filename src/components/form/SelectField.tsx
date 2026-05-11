import { useState } from 'react'
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface SelectFieldProps {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  error?: string
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setOpen(true)}
      >
        <Text style={value ? styles.triggerText : styles.triggerPlaceholder}>
          {value || 'Select...'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item)
                    setOpen(false)
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  trigger: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  triggerError: {
    borderColor: '#e53e3e',
  },
  triggerText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  triggerPlaceholder: {
    fontSize: 16,
    color: '#aaa',
  },
  chevron: {
    color: '#999',
    fontSize: 14,
  },
  error: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#EBF4FF',
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionTextSelected: {
    color: '#4285F4',
    fontWeight: '600',
  },
})
