import { useEffect, useRef } from 'react';

interface UsePollingOptions {
  enabled: boolean;
  interval: number;
  onPoll: () => void;
}

export const usePolling = ({ enabled, interval, onPoll }: UsePollingOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (enabled && onPoll) {
      // Start polling
      intervalRef.current = setInterval(onPoll, interval);

      // Cleanup function to clear interval
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Stop polling if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [enabled, interval, onPoll]);

  // Also cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};

export default usePolling;
