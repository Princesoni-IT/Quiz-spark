import React, { useState, useEffect } from 'react';
import './App.css';

function QuizCountdown() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      // Har second count kam karo
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <div className="countdown-container">
      {count > 0 ? (
        <h1 className="countdown-number">{count}</h1>
      ) : (
        <h2 className="countdown-text">Are you ready? The quiz is starting...</h2>
      )}
    </div>
  );
}

export default QuizCountdown;

