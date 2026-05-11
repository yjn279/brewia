import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'

interface TextFieldProps extends TextInputProps {
  label: string
  error?: string
}

export function TextField({ label, error, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor="#aaa"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  error: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
})
