// @types/react 18.3.x omits viewTransitionName; remove this file when upgrading to @types/react 19+
import 'react';

declare module 'react' {
  interface CSSProperties {
    viewTransitionName?: string;
  }
}
