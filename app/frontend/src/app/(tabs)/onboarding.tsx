import React, {useState} from 'react';

import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import QuizText from '@/components/onboarding/QuizText';
import QuizButton from '@/components/onboarding/QuizButton';
import QuizQuestion, { Question, QuestionInput } from '@/components/onboarding/QuizQuestion';
import { Text, View } from '@/components/Themed';
import { Button } from 'react-native';

// Test questions for demo purposes
// TODO: real questions
const QUESTIONS: Question[] = [
    {
        textPrompt: "Are you healthy",
        inputType: { type: "Checkbox", label: "Yes" }
    },
    {
        textPrompt: "How are you doing today :D",
        inputType: { type: "MultipleChoice", options: ["Fine", "Horrible", "Could be better"], maxSelect: 1 }
    },
    {
        textPrompt: "Tell me about your best lift ever",
        inputType: { type: "TextBox", maxlen: 200 }
    },
    {
        textPrompt: "Rank your coolness from 1 to 10",
        inputType: { type: "Slider", min: 1, max: 10 }
    }
];

export default function OnboardingScreen() {
    /*
     * Ok so here's my general plan imma write it out so i can like
     * go step by step and also im gonna murder copilot
     * for constantly trying to autocomplete my comments
     * and wow as soon as i wrote that it stopped trying to do it!
     * 
     * Always have "Onboarding" at top of screen
     * State 1. Starting State
     *  - Welcome to onboarding! text
     *  - [Start Onboarding] Button
     * State 2. Question State
     *  - Question prompt
     *  - Potential input (slider, text box, whatever)
     *  - [Submit] button
     *  - Progress bar at bottom that fills up
     *  - Question should be a component so its modular, like
     * 
     *      Question {
     *          textPrompt: string
     *          inputType: QuestionInput
     *      }
     * 
     *      type QuestionInput =
     *          { type: "Slider", min: int, max: int }
     *          { type: "TextBox", maxlen: int }
     *  - cool! we <3 tsx unions
     * State 3. Completion State:
     *  - first, we use an algorithm defined somewhere in this file probably lwk and
     *    pass in user input
     *  - next, display an "onboarding complete!" text with maybe like a
     *    move ring style health score below it?
     *  - finally, add an empty function for api call to database to send
     *    the health score
     *  - [Continue] button (does nothing for now until we have a home page to link to)
     */

    const [quizState, setQuizState] = useState(1);
    const [questionIndex, setQuestionIndex] = useState(0);

    const startQuiz = () => setQuizState(2);

    // TODO: remember question inputs n stuff
    const submitQuestion = () => {
        if (questionIndex < QUESTIONS.length - 1) {
            setQuestionIndex(questionIndex + 1);
        } else {
            setQuizState(3);
        }
    }

    // TODO: Actually complete quiz
    const completeQuiz = () => {
        setQuizState(1);
        setQuestionIndex(0);
    }

    const startComponent = (<View>
        <QuizText text="Welcome to the Forge 307 Onboarding Screen!" />
        <QuizButton text="Start Onboarding" onPress={startQuiz} />
    </View>);

    const questionComponent = (<View>
        <QuizQuestion question={QUESTIONS[questionIndex]} />
        <QuizButton text="Submit" onPress={submitQuestion} />
    </View>);

    const endComponent = (<View>
        <QuizText text="Onboarding Complete! Your health score is 100%!" />
        <QuizButton text="Continue" onPress={completeQuiz} />
    </View>);

    let component;
    switch (quizState) {
        case 1:
            component = startComponent;
            break;
        case 2:
            component = questionComponent;
            break;
        case 3:
            component = endComponent;
            break;
            
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Onboarding</Text>
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            {component}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  quizButton: {
    marginTop: 20,
  }
});
