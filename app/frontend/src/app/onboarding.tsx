import React, { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import QuizText from '@/components/onboarding/QuizText';
import ForgeButton from '@/components/ForgeButton';
import QuizQuestion, { Question } from '@/components/onboarding/QuizQuestion';
import { Text, View } from '@/components/Themed';
import { api } from '@/core/api';
import { useRouter } from 'expo-router';
import { useAppColorScheme } from '@/core/accessibility';
import { Schemes } from '@/constants/Colors';
import { WebView } from 'react-native-webview';

// Test questions for demo purposes
const QUESTIONS: Question[] = [
  {
    textPrompt: 'What is your age?',
    inputType: { type: 'Number', min: 0, max: 100 },
  },
  {
    textPrompt: 'What is your gender?',
    inputType: {
      type: 'MultipleChoice',
      options: ['Male', 'Female'],
      maxSelect: 1,
    },
  },
  {
    textPrompt: 'What is your height in inches?',
    inputType: { type: 'Number', min: 0, max: 500 },
  },
  {
    textPrompt: 'What is your weight in pounds?',
    inputType: { type: 'Number', min: 0, max: 1000 },
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
    textPrompt: 'What is your activity level?',
    inputType: {
      type: 'MultipleChoice',
      options: [
        'Sedentary (desk job, no exercise)',
        'Lightly active (1-3 days/week)',
        'Moderately active (3-5 days/week)',
        'Very active (6-7 days/week)',
        'Extremely active (athlete/physical job)',
      ],
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

const ACTIVITY_MULTIPLIERS = [1.2, 1.375, 1.55, 1.725, 1.9];

function calculateDay1Calorie(
  age: number,
  weightLbs: number,
  heightIn: number,
  genderIndex: number,  // 0 = male, 1 = female
  activityIndex: number
): number {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;
  const bmr = genderIndex === 0
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5      // male
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;   // female
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityIndex]);
}


function responsiveHealthScore(responses: (string | number)[]): number {
  let healthScore = 0;
  const healthResponses = responses.slice(4, 9);
  if (healthResponses.every((r) => typeof r === 'number'))
    healthScore = calculateHealthScore(
      responses[4] as number,
      responses[5] as number,
      responses[6] as number,
      responses[7] as number,
      responses[8] as number
    );
  return healthScore;
}

export default function OnboardingScreen() {
  const [quizState, setQuizState] = useState(1);
  /*
   * quizState:
   * 1 = start screen
   * 2 = terms and conditions
   * 3 = question screen
   * 4 = end screen
   */
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState<string | number>(0);
  const [responses, setResponses] = useState<(string | number)[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const router = useRouter();
  const scheme = useAppColorScheme() ?? 'light';

  const startQuiz = () => setQuizState(2);

  const submitQuestion = () => {
    if (currentResponse === -1) return false;

    if (QUESTIONS[questionIndex].inputType.type == 'Number' && typeof(currentResponse) === 'number' && isNaN(currentResponse))
      return false;

    setResponses([...responses, currentResponse]);
    setCurrentResponse(-1);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setQuizState(4);
    }
    return true;
  };

  const continueTerms = () => {
    if (acceptedTerms)
      setQuizState(3);
    else
      alert('You must accept the terms and conditions to continue.');
  }

  const completeQuiz = () => {
    const healthScore = responsiveHealthScore(responses);

    const age = typeof responses[0] === 'number' ? responses[0] : 0;
    const genderIndex = typeof responses[1] === 'number' ? responses[1] : 0;
    const height = typeof responses[2] === 'number' ? responses[2] : 0;
    const weight = typeof responses[3] === 'number' ? responses[3] : 0;
    const activityIndex = typeof responses[6] === 'number' ? responses[6] : 0;
    const goals = typeof responses[9] === 'string' ? responses[9] : '';
    const previousExperience = typeof responses[10] === 'string' ? responses[10] : '';
    const bio = typeof responses[11] === 'string' ? responses[11] : '';

    const calorie_goal = calculateDay1Calorie(
      age,
      weight,
      height,
      genderIndex,
      activityIndex,
    );

    api.submitOnboarding({
      healthScore,
      age,
      height,
      weight,
      genderIndex,
      activityIndex,
      calorie_goal,
      goals,
      previousExperience,
      bio,
      acceptedTerms,
    }).then((success) => {
      if (!success) {
        console.error('Error uploading onboarding data.');
        return;
      }
      setQuizState(1);
      setQuestionIndex(0);
      setResponses([]);
      router.replace('/(tabs)');
    }).catch((err) => {
      console.error('Onboarding submission failed:', err);
    });
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

  const tocPdfAsset = require('@/assets/toc.pdf');
  const tocPdfComponent = Platform.OS === 'web' ? (
    <iframe src={tocPdfAsset} style={{ width: '100%', height: 400 }} title="Terms and Conditions" />
  ) : (
    <WebView
      source={tocPdfAsset}
      style={{ width: '100%', height: 400 }}
    />
  );

  // terms is in @/assets/toc.pdf, but react-native-pdf doesn't work for some reason, so using webview to display
  // iframe if web tho bc webview ironically doesnt work on web :P
  const termsComponent = (
    <View style={styles.transparent}>
      {tocPdfComponent}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          style={{ marginRight: 10 }}
        />
        <Text style={{ color: Schemes[scheme].text }}>I accept the terms and conditions</Text>
      </View>
      <ForgeButton text="Continue" onPress={continueTerms} style={styles.quizButton} />
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
      component = termsComponent;
      break;
    case 3:
      component = questionComponent;
      break;
    case 4:
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