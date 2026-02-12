import React from 'react';
import { CapitalCategory } from '../types';
import { Target, Dumbbell, Heart, Users, Brain, CircleDollarSign } from 'lucide-react';

interface CategoryIconProps {
  category: CapitalCategory;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className }) => {
  switch (category) {
    case 'Skill': return <Target className={className} />;
    case 'Physical': return <Dumbbell className={className} />;
    case 'Emotional': return <Heart className={className} />;
    case 'Social': return <Users className={className} />;
    case 'Intellectual': return <Brain className={className} />;
    case 'Financial': return <CircleDollarSign className={className} />;
    default: return <Target className={className} />;
  }
};