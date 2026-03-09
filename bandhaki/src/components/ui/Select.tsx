import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { ChevronDown, Search, Check } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  searchable?: boolean;
}

export function Select({
  label,
  placeholder = 'Select...',
  options,
  value,
  onValueChange,
  error,
  required,
  searchable = false,
}: SelectProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchQuery
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selectedOption ? colors.text : colors.textTertiary,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {label || 'Select'}
            </Text>

            {searchable && (
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Search size={16} color={colors.textTertiary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        item.value === value
                          ? colors.primaryLight
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          item.value === value ? colors.primary : colors.text,
                        fontWeight: item.value === value ? '600' : '400',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Check size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={[styles.emptyText, { color: colors.textTertiary }]}
                >
                  No options found
                </Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  trigger: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
});
