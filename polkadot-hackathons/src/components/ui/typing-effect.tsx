"use client";

import { useState, useEffect } from "react";

interface TypingEffectProps {
  text: string;
  speed?: number;
  className?: string;
  startDelay?: number;
}

export function TypingEffect({ 
  text, 
  speed = 100, 
  className = "", 
  startDelay = 0 
}: TypingEffectProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  // console.log(currentIndex, isTyping);
  useEffect(() => {
    const startTyping = () => {
      setIsTyping(true);
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex < text.length) {
            setDisplayText(text.slice(0, prevIndex + 1));
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            setIsTyping(false);
            return prevIndex;
          }
        });
      }, speed);

      return () => clearInterval(interval);
    };

    const delayTimer = setTimeout(startTyping, startDelay);
    return () => clearTimeout(delayTimer);
  }, [text, speed, startDelay]);

  // Blinking cursor effect that continues after typing
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // Slightly slower blink for better visibility

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span className="text-gray-700 dark:text-bright-turquoise">|</span>
      )}
    </span>
  );
} 