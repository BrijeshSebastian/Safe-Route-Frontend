import { useState, useEffect, useCallback } from 'react';

export const useRateLimitCountdown = (defaultSeconds = 30) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const startCountdown = useCallback((seconds = defaultSeconds) => {
    setSecondsLeft(seconds);
  }, [defaultSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return {
    isRateLimited: secondsLeft > 0,
    secondsLeft,
    startCountdown,
  };
};

export default useRateLimitCountdown;
