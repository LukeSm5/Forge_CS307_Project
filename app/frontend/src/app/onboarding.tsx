import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import QuizText from '@/components/onboarding/QuizText';
import ForgeButton from '@/components/ForgeButton';
import QuizQuestion, { Question } from '@/components/onboarding/QuizQuestion';
import { Text, View } from '@/components/Themed';
import { api } from '@/core/api';
import { useRouter } from 'expo-router';
import { useAppColorScheme } from '@/core/accessibility';
import { Schemes } from '@/constants/Colors';

// Test questions for demo purposes
const QUESTIONS: Question[] = [
  {
    textPrompt: 'What is your age?',
    inputType: { type: 'TextBox', maxlen: 4 },
  },
  {
    textPrompt: 'What is your height?',
    inputType: { type: 'TextBox', maxlen: 10 },
  },
  {
    textPrompt: 'What is your weight?',
    inputType: { type: 'TextBox', maxlen: 10 },
  },
  {
    textPrompt:
      'How much experience do you have in the gym on a scale from 1 to 10, with 1 being not experienced at all, and 10 being extremely experienced?',
    inputType: { type: 'Slider', min: 1, max: 10 },
  },
  {
    textPrompt:
      'How much experience do you have dieting on a scale from 1 to 10, with 1 being not experienced at all, and 10 being extremely experienced?',
    inputType: { type: 'Slider', min: 1, max: 10 },
  },
  {
    textPrompt: 'How frequently do you go to the gym?',
    inputType: {
      type: 'MultipleChoice',
      options: ['Never', 'Once per week', '2-3 times per week', '4+ times per week'],
      maxSelect: 1,
    },
  },
  {
    textPrompt: 'Do you frequently perform active exercise, such as cardio or strength training?',
    inputType: {
      type: 'MultipleChoice',
      options: ['Yes', 'Sometimes', 'No'],
      maxSelect: 1,
    },
  },
  {
    textPrompt: 'Do you diet, such as counting calories and macros?',
    inputType: {
      type: 'MultipleChoice',
      options: ['Yes', 'Sometimes', 'No'],
      maxSelect: 1,
    },
  },
  {
    textPrompt: 'What goals would you like to accomplish in your health journey?',
    inputType: { type: 'TextBox', maxlen: 200 },
  },
  {
    textPrompt: 'What previous health and fitness experience do you have?',
    inputType: { type: 'TextBox', maxlen: 200 },
  },
  {
    textPrompt: 'What would you like others to know about you in your bio?',
    inputType: { type: 'TextBox', maxlen: 200 },
  },
];

function calculateHealthScore(
  gymExperience: number,
  dietExperience: number,
  gymFrequency: number,
  exerciseActivity: number,
  dietingActivity: number
): number {
  let score = 0;
  score += gymExperience * 2;
  score += dietExperience * 2;
  score += gymFrequency * 5;
  score += (2 - exerciseActivity) * 12;
  score += (2 - dietingActivity) * 10.5;
  return score;
}

function responsiveHealthScore(responses: (string | number)[]): number {
  let healthScore = 0;
  const healthResponses = responses.slice(0, 5);
  if (healthResponses.every((r) => typeof r === 'number'))
    healthScore = calculateHealthScore(
      responses[3] as number,
      responses[4] as number,
      responses[5] as number,
      responses[6] as number,
      responses[7] as number
    );
  return healthScore;
}

export default function OnboardingScreen() {
  const [quizState, setQuizState] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState<string | number>(0);
  const [responses, setResponses] = useState<(string | number)[]>([]);

  const router = useRouter();
  const scheme = useAppColorScheme() ?? 'light';

  const startQuiz = () => setQuizState(2);

  const submitQuestion = () => {
    if (currentResponse === -1) return false;

    setResponses([...responses, currentResponse]);
    setCurrentResponse(-1);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setQuizState(3);
    }
    return true;
  };

  const completeQuiz = () => {
    const healthScore = responsiveHealthScore(responses);

    let goals = '';
    if (typeof responses[8] === 'string') goals = responses[8];

    let previousExperience = '';
    if (typeof responses[9] === 'string') previousExperience = responses[9];

    let bio = '';
    if (typeof responses[10] === 'string') bio = responses[10];

    let age = '';
    if (typeof responses[0] === 'string') age = responses[0];

    let height = '';
    if (typeof responses[1] === 'string') height = responses[1];

    let weight = '';
    if (typeof responses[2] === 'string') weight = responses[2];

    setQuizState(1);
    setQuestionIndex(0);

    api
      .submitOnboarding({
        healthScore,
        age,
        height,
        weight,
        goals,
        previousExperience,
        bio,
      })
      .then((success) => {
        if (!success) {
          console.error('Error uploading onboarding data.');
        }
        router.replace('/(tabs)');
      });

    setResponses([]);
  };

  const startComponent = (
    <View style={styles.transparent}>
      <QuizText text="Welcome to the Forge 307 Onboarding Screen!" />
      <ForgeButton text="Start Onboarding" onPress={startQuiz} />
    </View>
  );

  const questionComponent = (
    <View style={styles.transparent}>
      <QuizQuestion key={questionIndex} question={QUESTIONS[questionIndex]} onUpdate={setCurrentResponse} />
      <ForgeButton text="Submit" onPress={submitQuestion} />
    </View>
  );

  const endComponent = (
    <View style={styles.transparent}>
      <QuizText text={`Onboarding Complete! Your health score is ${responsiveHealthScore(responses)}%!`} />
      <ForgeButton text="Continue" onPress={completeQuiz} />
    </View>
  );

  let component: React.JSX.Element;
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
    default:
      component = startComponent;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Schemes[scheme].background },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: Schemes[scheme].text },
        ]}
      >
        Onboarding
      </Text>

      <View
        style={[
          styles.separator,
          {
            backgroundColor:
              scheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#eee',
          },
        ]}
      />

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
  },
  transparent: {
    backgroundColor: 'transparent',
  },
});