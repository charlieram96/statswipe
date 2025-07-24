import React from 'react';
import { SvgProps } from 'react-native-svg';

// Import your custom SVG icons here
import BasketballIcon from '../assets/icons/basketball.svg';

// Define icon names
export type IconName = 'basketball';

interface IconProps extends SvgProps {
  name: IconName;
  size?: number;
  color?: string;
}

// Icon component that maps names to SVG components
export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = '#fff',
  ...props 
}) => {
  const icons: Record<IconName, React.FC<SvgProps>> = {
    basketball: BasketballIcon,
  };

  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      color={color}
      {...props}
    />
  );
};

// Export individual icons for direct use if needed
export { BasketballIcon };