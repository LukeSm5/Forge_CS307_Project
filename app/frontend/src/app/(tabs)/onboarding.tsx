import React, {useState} from 'react';

import { StyleSheet } from 'react-native';

import QuizText from '@/components/onboarding/QuizText';
import QuizButton from '@/components/onboarding/QuizButton';
import QuizQuestion, { Question } from '@/components/onboarding/QuizQuestion';
import { Text, View } from '@/components/Themed';
import { api } from '@/core/api';

// Test questions for demo purposes
const QUESTIONS: Question[] = [
    {
        textPrompt: "What is your age?",
        inputType: { type: "TextBox", maxlen: 4 }
    },
    {
        textPrompt: "What is your height?",
        inputType: { type: "TextBox", maxlen: 10 }
    },
    {
        textPrompt: "What is your weight?",
        inputType: { type: "TextBox", maxlen: 10 }
    },
    {
        textPrompt: "How much experience do you have in the gym on a scale from 1 to 10, with 1 being not experienced at all, and 10 being extremely experienced?",
        inputType: { type: "Slider", min: 1, max: 10 }
    },
    {
        textPrompt: "How much experience do you have dieting on a scale from 1 to 10, with 1 being not experienced at all, and 10 being extremely experienced?",
        inputType: { type: "Slider", min: 1, max: 10 }
    },
    {
        textPrompt: "How frequently do you go to the gym?",
        inputType: { type: "MultipleChoice", options: [
            "Never",
            "Once per week",
            "2-3 times per week",
            "4+ times per week"
        ], maxSelect: 1}
    },
    {
        textPrompt: "Do you frequently perform active exercise, such as cardio or strength training?",
        inputType: { type: "MultipleChoice", options: [
            "Yes",
            "Sometimes",
            "No",
        ], maxSelect: 1}
    },
    {
        textPrompt: "Do you diet, such as counting calories and macros?",
        inputType: { type: "MultipleChoice", options: [
            "Yes",
            "Sometimes",
            "No",
        ], maxSelect: 1}
    },
    {
        textPrompt: "What goals would you like to accomplish in your health journey?",
        inputType: { type: "TextBox", maxlen: 200 }
    },
    {
        textPrompt: "What previous health and fitness experience do you have?",
        inputType: { type: "TextBox", maxlen: 200 }
    },
    {
        textPrompt: "What would you like others to know about you in your bio?",
        inputType: { type: "TextBox", maxlen: 200 }
    },
];

/**
 * Takes a bunch of shi from onboarding quiz, calculates health score on [0, 100]
 * @param gymExperience Gym experience from 1-10
 * @param dietExperience Dieting experience from 1-10
 * @param gymFrequency Gym frequency, indexing [Never, 1x/Week, 2-3x/Week, 4x+/Week]
 * @param exerciseActivity Do you exercise?, indexing [Yes/Sometimes/No]
 * @param dietingActivity Do you diet?, indexing [Yes/Sometimes/No]
 */
function calculateHealthScore(gymExperience: number, dietExperience: number, gymFrequency: number,
                                exerciseActivity: number, dietingActivity: number): number {
    let score = 0;
    // 0-20pts
    // 20/100
    score += gymExperience * 2;
    // 0-20pts
    // 40/100
    score += dietExperience * 2;
    // 0-15pts
    // 55/100
    score += gymFrequency * 5;
    // 0-24pts
    // 79/100
    score += (2 - exerciseActivity) * 12;
    // 0-21pts
    // 100/100
    score += (2 - dietingActivity) * 10.5;
    // return 🤯
    return score;
}

function responsiveHealthScore(responses: (string | number)[]): number {
    let healthScore = 0;
    const healthResponses = responses.slice(0, 5);
    if (healthResponses.every(r => typeof r === "number"))
        healthScore = calculateHealthScore(
            healthResponses[3], healthResponses[4], healthResponses[5],
            healthResponses[6], healthResponses[7]
        );
    return healthScore;
}

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

    const [currentResponse, setCurrentResponse] = useState<string | number>(0);
    const [responses, setResponses] = useState<(string | number)[]>([]);

    const submitQuestion = () => {
        // Add question response
        if (currentResponse == -1)
            return false;

        setResponses([...responses, currentResponse]);
        setCurrentResponse(-1);

        if (questionIndex < QUESTIONS.length - 1) {
            setQuestionIndex(questionIndex + 1);
        } else {
            setQuizState(3);
        }
        return true;
    }

    const completeQuiz = () => {
        const healthScore = responsiveHealthScore(responses);
        
        let goals = "";
        if (typeof responses[8] === "string")
            goals = responses[8];
        
        let previousExperience = "";
        if (typeof responses[9] === "string")
            previousExperience = responses[9];
        
        let bio = "";
        if (typeof responses[10] === "string")
            bio = responses[10];
        
        let age = "";
        if (typeof responses[0] === "string")
            age = responses[0];

        let height = "";
        if (typeof responses[1] === "string")
            height = responses[1];

        let weight = "";
        if (typeof responses[2] === "string")
            weight = responses[2];

        
        setQuizState(1);
        setQuestionIndex(0);
        api.submitOnboarding({
            healthScore,
            age,
            height,
            weight,
            goals,
            previousExperience,
            bio
        }).then(success => {
            if (!success)
                console.error('Error uploading onboarding data.')
        });
        setResponses([]);
    }

    const startComponent = (<View>
        <QuizText text="Welcome to the Forge 307 Onboarding Screen!" />
        <QuizButton text="Start Onboarding" onPress={startQuiz} />
    </View>);

    const questionComponent = (<View>
        <QuizQuestion key={questionIndex} question={QUESTIONS[questionIndex]} onUpdate={setCurrentResponse} />
        <QuizButton text="Submit" onPress={submitQuestion} />
    </View>);

    const endComponent = (<View>
        <QuizText text={`Onboarding Complete! Your health score is ${responsiveHealthScore(responses)}%!`} />
        <QuizButton text="Continue" onPress={completeQuiz} />
    </View>);

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
