import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { ChevronDown, Search, Check, Plus } from 'lucide-react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  addNewLabel?: string;
  onAddNew?: () => void;
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
  addNewLabel,
  onAddNew,
}: SelectProps) {
  const { colors } = useTheme();
  const bottomSheetModalRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchQuery
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handlePresent = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismiss = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleAddNew = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
    onAddNew?.();
  }, [onAddNew]);

  const handleSelect = useCallback(
    (itemValue: string) => {
      onValueChange(itemValue);
      bottomSheetModalRef.current?.dismiss();
    },
    [onValueChange]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: SelectOption }) => (
      <TouchableOpacity
        style={[
          styles.option,
          {
            backgroundColor:
              item.value === value ? colors.primaryLight : 'transparent',
          },
        ]}
        onPress={() => handleSelect(item.value)}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: item.value === value ? colors.primary : colors.text,
              fontWeight: item.value === value ? '600' : '400',
            },
          ]}
        >
          {item.label}
        </Text>
        {item.value === value && <Check size={18} color={colors.primary} />}
      </TouchableOpacity>
    ),
    [value, colors, handleSelect]
  );

  const insets = useSafeAreaInsets();

  return (
    <View>
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
        onPress={handlePresent}
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

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={['60%' , '90%']}
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: 36,
          height: 4,
          borderRadius: 2,
        }}
        backgroundStyle={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <View style={[styles.sheetContent , {marginBottom:insets.bottom}]}>
          <View style={styles.modalTitleRow}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {label || 'Select'}
            </Text>
            {onAddNew && (
              <TouchableOpacity
                onPress={handleAddNew}
                style={[styles.addNewBtn, { backgroundColor: colors.primaryLight }]}
              >
                <Plus size={14} color={colors.primary} />
                <Text style={[styles.addNewBtnText, { color: colors.primary }]}>
                  {addNewLabel || 'Add New'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
              />
            </View>
          )}

          <BottomSheetFlatList
            data={filteredOptions}
            keyExtractor={(item: SelectOption) => item.value}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text
                style={[styles.emptyText, { color: colors.textTertiary }]}
              >
                No options found
              </Text>
            }
          />
        </View>
      </BottomSheetModal>
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
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flex: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNewBtnText: {
    fontSize: 12,
    fontWeight: '600',
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
