/**
 * Tailwind build for the site.
 *
 * This mirrors the theme that used to be declared inline beside the Play CDN
 * script. The CDN compiled the stylesheet in every visitor's browser, which
 * held up the first paint on every page; the same CSS is now built once, here,
 * and served as a file.
 *
 * After changing markup or a template, rebuild with:  npm run build:css
 */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  // Every file that writes a class name. A file missing from this list loses
  // its styles silently, so it is kept broad on purpose.
  content: ['./index.html', './*.js'],
  // In the previous build though no file uses them now: kept in case saved
  // page content (from the admin) still does.
  safelist: ['focus:border-amber-500', 'from-amber-100', 'gap-x-3', 'md:self-center', 'sm:col-span-3', 'to-amber-200', 'to-white'],
  theme: {
    extend: {
      colors: {
        night: token('night'), 'night-2': token('night-2'), 'night-line': token('night-line'),
        ink: token('ink'), 'ink-2': token('ink-2'), 'ink-3': token('ink-3'),
        maroon: token('maroon'), 'maroon-dark': token('maroon-dark'),
        gold: token('gold'), 'gold-soft': token('gold-soft'),
        cream: token('cream'), 'cream-2': token('cream-2'),
        parchment: token('parchment'), paper: token('paper'), sand: token('sand'),
        line: token('line'), 'line-strong': token('line-strong')
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        sans: ['Lato', 'Outfit', 'system-ui', 'sans-serif']
      },
      // Every size is Tailwind's own plus half a pixel (12px -> 12.5px,
      // 13px -> 13.5px ...), so text reads a touch larger without the
      // spacing (which is in rem) changing.
      fontSize: {
        '2xs': ['calc(0.6875rem + 0.5px)', { lineHeight: '1rem' }],
        'xs': ['calc(0.75rem + 0.5px)', { lineHeight: '1rem' }],
        'sm': ['calc(0.875rem + 0.5px)', { lineHeight: '1.25rem' }],
        'base': ['calc(1rem + 0.5px)', { lineHeight: '1.5rem' }],
        'lg': ['calc(1.125rem + 0.5px)', { lineHeight: '1.75rem' }],
        'xl': ['calc(1.25rem + 0.5px)', { lineHeight: '1.75rem' }],
        '2xl': ['calc(1.5rem + 0.5px)', { lineHeight: '2rem' }],
        '3xl': ['calc(1.875rem + 0.5px)', { lineHeight: '2.25rem' }],
        '4xl': ['calc(2.25rem + 0.5px)', { lineHeight: '2.5rem' }],
        '5xl': ['calc(3rem + 0.5px)', { lineHeight: '1' }],
        '6xl': ['calc(3.75rem + 0.5px)', { lineHeight: '1' }],
        '7xl': ['calc(4.5rem + 0.5px)', { lineHeight: '1' }],
        '8xl': ['calc(6rem + 0.5px)', { lineHeight: '1' }],
        '9xl': ['calc(8rem + 0.5px)', { lineHeight: '1' }]
      },
      spacing: { '4.5': '1.125rem' },
      maxWidth: { container: '80rem' },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        card: 'var(--shadow-card)',
        'warm-card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'gold-glow': 'var(--shadow-gold)'
      }
    }
  }
};
