import 'react';

/** chessground renders pieces as custom `<piece>` elements; we reuse them in the promotion picker. */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      piece: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
