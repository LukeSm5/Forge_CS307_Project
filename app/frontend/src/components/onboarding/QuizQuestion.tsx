import React, { useState } from 'react';
import RadioGroup from 'react-native-radio-buttons-group';
import { StyleSheet, TextInput } from 'react-native';
import { Text, View } from '../Themed';
import QuizText from './QuizText';
import Slider from '@react-native-community/slider';
import { useAppColorScheme } from '@/core/accessibility';
import { Schemes } from '@/constants/Colors';

export type QuestionInput =
  | { type: 'Slider'; min: number; max: number }
  | { type: 'TextBox'; maxlen: number }
  | { type: 'MultipleChoice'; options: string[]; maxSelect: number };

export type Question = {
  textPrompt: string;
  inputType: QuestionInput;
};

export default function QuizQuestion({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate?: (val: number | string) => void;
}) {
  const scheme = useAppColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  let inputComponent: React.JSX.Element;

  switch (question.inputType.type) {
    case 'Slider': {
      const defaultValue = Math.round(
        (question.inputType.min + question.inputType.max) / 2
      );

      inputComponent = (
        <View style={styles.transparent}>
          <Slider
            style={{ width: 220, height: 40 }}
            minimumValue={question.inputType.min}
            maximumValue={question.inputType.max}
            value={defaultValue}
            step={1}
            minimumTrackTintColor="#2f80ed"
            maximumTrackTintColor={isDark ? '#6b7280' : '#cbd5e1'}
            thumbTintColor="#2f80ed"
            onValueChange={(val) => onUpdate?.(val)}
          />
        </View>
      );
      break;
    }

    case 'TextBox':
      inputComponent = (
        <View style={styles.transparent}>
          <TextInput
            style={[
              styles.input,
              {
                color: Schemes[scheme].text,
                borderColor: isDark ? '#6b7280' : 'gray',
                backgroundColor: isDark ? '#111827' : '#ffffff',
              },
            ]}
            placeholder="Type here..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            maxLength={question.inputType.maxlen}
            onChangeText={(val) => onUpdate?.(val)}
            selectionColor="#2f80ed"
          />
        </View>
      );
      break;

    case 'MultipleChoice': {
      const radioButtons = [];
      for (let i = 0; i < question.inputType.options.length; i++) {
        const option = question.inputType.options[i];
        radioButtons.push({
          id: String(i),
          label: option,
          value: option,
          color: '#2f80ed',
          labelStyle: {
            color: Schemes[scheme].text,
          },
        });
      }

      const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

      inputComponent = (
        <View style={styles.transparent}>
          <RadioGroup
            radioButtons={radioButtons}
            onPress={(id) => {
              setSelectedId(id);
              onUpdate?.(Number(id));
            }}
            selectedId={selectedId}
          />
        </View>
      );
      break;
    }
  }

  return (
    <View style={styles.transparent}>
      <View style={[styles.questionContainer, styles.transparent]}>
        <QuizText text={question.textPrompt} />
        {inputComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  questionContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    width: 360,
    maxWidth: '90%',
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
});