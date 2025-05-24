'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface HeaderIconWithFeedbackProps {
  icon: React.ReactElement;
  count: number;
  iconLabel: string; // For sr-only text
}

const HeaderIconWithFeedback: React.FC<HeaderIconWithFeedbackProps> = ({
  icon,
  count,
  iconLabel,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count > prevCountRef.current) {
      setShowFeedback(true);
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 1500); // Feedback visible for 1.5 seconds

      // Store the number of items added in this interaction
      // This is a simple way to show "how many" were added if count increased by more than 1
      // For a more complex scenario, you might want to track the diff precisely.
      // For now, a simple "+" is shown.

      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  return (
    <div className="relative">
      {/* The actual icon passed as a prop */}
      {icon}
      <span className="sr-only">{iconLabel}</span>

      {/* Persistent count badge */}
      {count > 0 && (
        <span className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs rounded-full px-1 py-0.5 min-w-[1rem] h-[1rem] flex items-center justify-center font-bold shadow-md">
          {count}
        </span>
      )}

      {/* "Added" feedback animation - REMOVED */}
    </div>
  );
};

export default HeaderIconWithFeedback; 