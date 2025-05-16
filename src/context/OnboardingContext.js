import React from 'react';

export const OnboardingContext = React.createContext({
  onboardingCompleted: false,
  setOnboardingCompleted: () => {},
}); 