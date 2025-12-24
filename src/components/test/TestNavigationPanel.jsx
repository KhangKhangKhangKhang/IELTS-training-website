import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

const TestNavigationPanel = ({
    parts = [],
    activePartIndex = 0,
    onPartChange,
    answers = {},
    allQuestions = [],
    onQuestionClick,
    currentQuestionId = null,
    testType = "reading", // reading, listening, writing
}) => {
    // Calculate progress
    const { answeredCount, totalQuestions, progressPercentage } = useMemo(() => {
        const total = allQuestions.length;
        const answered = allQuestions.filter(
            (q) => answers[q.question_id] && answers[q.question_id].value
        ).length;
        const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

        return {
            answeredCount: answered,
            totalQuestions: total,
            progressPercentage: percentage,
        };
    }, [allQuestions, answers]);

    // Group questions by part
    const questionsByPart = useMemo(() => {
        const grouped = {};
        parts.forEach((part, partIndex) => {
            grouped[partIndex] = allQuestions.filter(
                (q) => q.partIndex === partIndex
            );
        });
        return grouped;
    }, [parts, allQuestions]);

    const getQuestionStatus = (questionId) => {
        if (currentQuestionId === questionId) return "current";
        if (answers[questionId] && answers[questionId].value) return "answered";
        return "unanswered";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "current":
                return "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 scale-110";
            case "answered":
                return "bg-green-600 text-white border-green-600 hover:bg-green-700";
            case "unanswered":
                return "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700";
            default:
                return "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600";
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                    🧭 Navigation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click to jump to question
                </p>
            </div>

            {/* Progress Section */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Progress
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {answeredCount}/{totalQuestions}
                    </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
                <p className="text-xs text-center mt-1 text-slate-500 dark:text-slate-400 font-medium">
                    {progressPercentage}% Complete
                </p>
            </div>

            {/* Questions Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {parts.map((part, partIndex) => {
                    const partQuestions = questionsByPart[partIndex] || [];
                    if (partQuestions.length === 0) return null;

                    return (
                        <div key={partIndex} className="mb-6 last:mb-0">
                            {/* Part Header */}
                            <div
                                className={cn(
                                    "flex items-center justify-between mb-3 pb-2 border-b",
                                    partIndex === activePartIndex
                                        ? "border-blue-500 dark:border-blue-400"
                                        : "border-slate-200 dark:border-slate-700"
                                )}
                            >
                                <h4
                                    className={cn(
                                        "font-bold text-sm",
                                        partIndex === activePartIndex
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-slate-600 dark:text-slate-400"
                                    )}
                                >
                                    {testType === "writing"
                                        ? `Task ${partIndex + 1}`
                                        : part.namePart || `Part ${partIndex + 1}`}
                                </h4>
                                {partIndex !== activePartIndex && (
                                    <button
                                        onClick={() => onPartChange(partIndex)}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Switch
                                    </button>
                                )}
                            </div>

                            {/* Question Grid */}
                            <div className="grid grid-cols-5 gap-2">
                                {partQuestions.map((question) => {
                                    const status = getQuestionStatus(question.question_id);
                                    const questionNum = question.question_number;

                                    return (
                                        <button
                                            key={question.question_id}
                                            onClick={() =>
                                                onQuestionClick(question.question_id, partIndex)
                                            }
                                            className={cn(
                                                "w-full aspect-square rounded-lg border-2 font-bold text-sm transition-all duration-200 flex items-center justify-center relative",
                                                getStatusColor(status)
                                            )}
                                            title={`Question ${questionNum} - ${status}`}
                                        >
                                            {questionNum}
                                            {status === "answered" && (
                                                <CheckCircle
                                                    size={10}
                                                    className="absolute top-0.5 right-0.5"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-600" />
                        <span className="text-slate-600 dark:text-slate-400">Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600" />
                        <span className="text-slate-600 dark:text-slate-400">
                            Unanswered
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-600 ring-2 ring-blue-300" />
                        <span className="text-slate-600 dark:text-slate-400">Current</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestNavigationPanel;
