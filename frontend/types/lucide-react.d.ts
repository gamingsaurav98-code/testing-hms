declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface LucideIconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    color?: string;
    strokeWidth?: number;
  }

  type Icon = ComponentType<LucideIconProps>;

  export const AlertCircle: Icon;
  export const Check: Icon;
  export const X: Icon;
  export const Search: Icon;
  export const Upload: Icon;
  export const Info: Icon;
  export const Plus: Icon;
  export const Trash: Icon;
  export const Filter: Icon;
  export const Edit: Icon;
  export const Eye: Icon;
  export const Download: Icon;
  export const ExternalLink: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Clock: Icon;
  export const Calendar: Icon;
  export const Save: Icon;
  export const Loader: Icon;
  export const User: Icon;
  export const Home: Icon;
  export const Settings: Icon;
  export const LogOut: Icon;
  export const Menu: Icon;
  export const MoreVertical: Icon;
  export const Image: Icon;
  export const File: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  
  // Add any other icons you use here
}
