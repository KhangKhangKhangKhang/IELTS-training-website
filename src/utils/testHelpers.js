/**
 * Test Helper Utilities
 * Provides functions for processing test data, especially for review mode
 * where answer keys need to be injected from the API response.
 */

/**
 * Build an answer key data map from the full test result response.
 * This is used in Review Mode to provide correct answer information
 * that is NOT available during test-taking (for security).
 *
 * @param {Object} fullResultData - The full test result from getTestResultAndAnswersAPI
 * @returns {Object} Map of questionId -> { correctKeys: string[], acceptedAnswers: string[] }
 *
 * Example output:
 * {
 *   "question-uuid-1": { correctKeys: ["A"], acceptedAnswers: ["Paris"] },
 *   "question-uuid-2": { correctKeys: ["B", "C"], acceptedAnswers: [] },
 *   "question-uuid-3": { correctKeys: [], acceptedAnswers: ["10am", "10.00 am", "10 am"] }
 * }
 */
export function buildAnswerKeyData(fullResultData) {
    const answerKeyData = {};

    if (!fullResultData?.test?.parts) {
        return answerKeyData;
    }

    fullResultData.test.parts.forEach((part) => {
        const groups = part.groupOfQuestions || [];

        groups.forEach((group) => {
            const questions = group.question || [];
            const questionType = group.typeQuestion;

            questions.forEach((q) => {
                const questionId = q.idQuestion;
                const answers = q.answers || [];

                // Extract correct keys (for MCQ, TFNG, YES_NO_NOTGIVEN, MATCHING, LABELING)
                const correctKeys = answers
                    .filter((a) => a.matching_value === "CORRECT")
                    .map((a) => a.matching_key)
                    .filter(Boolean);

                // Extract all accepted text answers (for FILL_BLANK, SHORT_ANSWER)
                // These are stored in answer_text field
                let acceptedAnswers = [];

                if (
                    questionType === "FILL_BLANK" ||
                    questionType === "SHORT_ANSWER"
                ) {
                    // For fill blank / short answer, all answer_text values are acceptable
                    acceptedAnswers = answers
                        .map((a) => a.answer_text)
                        .filter(Boolean);
                } else if (questionType === "MATCHING") {
                    // For matching, the correct answer is the one with matching_value = "CORRECT"
                    const correctAnswer = answers.find(
                        (a) => a.matching_value === "CORRECT"
                    );
                    if (correctAnswer?.matching_key) {
                        // correctKeys already has this
                    }
                }

                answerKeyData[questionId] = {
                    correctKeys,
                    acceptedAnswers,
                    questionType, // Include type for reference
                };
            });
        });
    });

    return answerKeyData;
}

/**
 * Normalize text for answer comparison
 * Matches the backend normalization logic for consistent grading display
 *
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeAnswerText(text) {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[.,?!\-:;'"()\[\]]/g, "") // Remove punctuation
        .replace(/\s+/g, " ") // Collapse multiple spaces
        .trim();
}

/**
 * Check if user answer matches any accepted answer (normalized comparison)
 *
 * @param {string} userAnswer - User's answer text
 * @param {string[]} acceptedAnswers - Array of accepted answer texts
 * @returns {boolean} True if matches any accepted answer
 */
export function isAnswerCorrect(userAnswer, acceptedAnswers) {
    if (!userAnswer || !acceptedAnswers?.length) return false;

    const normalizedUser = normalizeAnswerText(userAnswer);

    return acceptedAnswers.some(
        (accepted) => normalizeAnswerText(accepted) === normalizedUser
    );
}
