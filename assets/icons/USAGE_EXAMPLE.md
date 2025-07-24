# How to Use Custom SVG Icons

## 1. Direct Import Method
```tsx
import BasketballIcon from '../assets/icons/basketball.svg';

// In your component
<BasketballIcon width={24} height={24} color="#FF6723" />
```

## 2. Using the Icon Component
```tsx
import { Icon } from '../components/Icon';

// In your component
<Icon name="basketball" size={32} color="#FF6723" />
```

## 3. Adding New Icons

### Step 1: Add your SVG file
Place your SVG file in `/assets/icons/` with a descriptive name.

### Step 2: Update the Icon component
Edit `/components/Icon.tsx`:

```tsx
// Import the new icon
import YourNewIcon from '../assets/icons/your-new-icon.svg';

// Add to the IconName type
export type IconName = 'basketball' | 'your-new-icon';

// Add to the icons object
const icons: Record<IconName, React.FC<SvgProps>> = {
  basketball: BasketballIcon,
  'your-new-icon': YourNewIcon,
};
```

## SVG Best Practices

1. **Use currentColor**: This allows the icon to inherit color from the parent
   ```svg
   <path stroke="currentColor" />
   ```

2. **Consistent ViewBox**: Use 24x24 for all icons
   ```svg
   <svg viewBox="0 0 24 24">
   ```

3. **Remove fixed colors**: Let the component control colors
4. **Optimize SVGs**: Use tools like SVGO to minimize file size