'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showNumber?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  showNumber = true,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const handleClick = (newRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);
        const isPartial =
          starValue > Math.floor(rating) && starValue <= Math.ceil(rating);
        const fillPercentage = isPartial ? (rating % 1) * 100 : 0;

        return (
          <div
            key={i}
            className={`relative ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => handleClick(starValue)}
          >
            {isPartial && !interactive ? (
              <div className="relative" style={{ width: size, height: size }}>
                {/* Background empty star */}
                <Star
                  size={size}
                  className="text-gray-300 absolute top-0 left-0"
                  fill="currentColor"
                />
                {/* Foreground filled portion */}
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    size={size}
                    className="text-yellow-400"
                    fill="currentColor"
                  />
                </div>
              </div>
            ) : (
              <Star
                size={size}
                className={`${
                  isFilled
                    ? 'text-yellow-400'
                    : interactive
                    ? 'text-gray-300 hover:text-yellow-200'
                    : 'text-gray-300'
                } transition-colors`}
                fill="currentColor"
              />
            )}
          </div>
        );
      })}
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
