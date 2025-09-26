// components/FloatingWords.jsx
import React from "react";
import { motion } from "framer-motion";

const FloatingWords = () => {
  const words = [
    "Vocabulary",
    "Listening",
    "Reading",
    "Writing",
    "Speaking",
    "Grammar",
    "Pronunciation",
    "Fluency",
    "Accuracy",
    "Coherence",
  ];

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      {words.map((word, index) => (
        <motion.div
          key={index}
          className="absolute text-slate-500 text-lg font-medium"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 100 - 50, 0],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: 20 + Math.random() * 20,
            repeat: Infinity,
            delay: Math.random() * 10,
          }}
        >
          {word}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingWords;
