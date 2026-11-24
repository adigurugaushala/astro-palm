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
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }]
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
