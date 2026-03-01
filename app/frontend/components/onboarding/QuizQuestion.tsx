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
    | { type: "Checkbox", label: string }

export type Question = {
    textPrompt: string,
    inputType: QuestionInput
}

export default function QuizQuestion({ question }: { question: Question }) {
    let inputComponent;
    switch (question.inputType.type) {
        case "Slider":
            inputComponent = (
                <View>
                    <Slider
                        style={{ width: 200, height: 40 }}
                        minimumValue={question.inputType.min}
                        maximumValue={question.inputType.max}
                        step={1}
                    />
                </View>
            );
            break;

        case "TextBox":
            inputComponent = (
                <View>
                    <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, width: 200, padding: 10 }}
                        maxLength={question.inputType.maxlen}
                    />
                </View>
            );
            break;

        case "MultipleChoice": {
            const radioButtons = [];
            for (let option of question.inputType.options) {
                radioButtons.push({
                    id: option,
                    label: option,
                    value: option,
                });
            }

            const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
            inputComponent = (
                <View>
                    <RadioGroup
                        radioButtons={radioButtons}
                        onPress={setSelectedId}
                        selectedId={selectedId}
                    />
                </View>
            );
            break;
        }

        // TODO: Checkboxes cannot be unchecked. Should probably fix
        // or lowkey maybe remove checkbox input type :P
        // or make my own checkbox component
        case "Checkbox": {
            const [checked, setChecked] = useState(false);
            inputComponent = (
                <View>
                    <RadioGroup
                        radioButtons={[{
                            id: '1',
                            label: question.inputType.label,
                            value: question.inputType.label
                        }]}
                        onPress={() => setChecked(!checked)}
                        selectedId={checked ? '1' : undefined}
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
