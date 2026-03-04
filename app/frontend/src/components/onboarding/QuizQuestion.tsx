import React, { useState } from 'react';

import RadioGroup from 'react-native-radio-buttons-group';

import { StyleSheet, TextInput } from 'react-native';

import { Text, View } from '../Themed';

import QuizText from './QuizText';

import Slider from '@react-native-community/slider';

/*
 *      Question {
 *          textPrompt: string
 *          inputType: QuestionInput
 *      }
 * 
 *      type QuestionInput =
 *          { type: "Slider", min: int, max: int }
 *          { type: "TextBox", maxlen: int }
 */

export type QuestionInput =
    | { type: "Slider", min: number, max: number }
    | { type: "TextBox", maxlen: number }
    | { type: "MultipleChoice", options: string[], maxSelect: number }

export type Question = {
    textPrompt: string,
    inputType: QuestionInput
}

export default function QuizQuestion({ question, onUpdate }: { question: Question, onUpdate?: (val: number | string) => void} ) {
    let inputComponent: React.JSX.Element;
    switch (question.inputType.type) {
        case "Slider": {
            const defaultValue = Math.round((question.inputType.min + question.inputType.max) / 2);

            inputComponent = (
                <View>
                    <Slider
                        style={{ width: 200, height: 40 }}
                        minimumValue={question.inputType.min}
                        maximumValue={question.inputType.max}
                        value={defaultValue}
                        step={1}
                        onValueChange={val => onUpdate(val)}
                    />
                </View>
            );
            break;
        }

        case "TextBox":
            inputComponent = (
                <View>
                    <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, width: 200, padding: 10 }}
                        maxLength={question.inputType.maxlen}
                        onChangeText={val => onUpdate(val)}
                    />
                </View>
            );
            break;

        case "MultipleChoice": {
            const radioButtons = [];
            for (let i = 0; i < question.inputType.options.length; i++) {
                const option = question.inputType.options[i];
                radioButtons.push({
                    id: i,
                    label: option,
                    value: option,
                });
            }

            const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
            inputComponent = (
                <View>
                    <RadioGroup
                        radioButtons={radioButtons}
                        onPress={id => {
                            setSelectedId(id);
                            onUpdate(id);
                        }}
                        selectedId={selectedId}
                    />
                </View>
            );
            break;
        }
    }

    return (
        <View>
          <View style={styles.questionContainer}>
            <QuizText text={question.textPrompt}/>

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
});
