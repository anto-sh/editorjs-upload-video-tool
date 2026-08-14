# Issues

# It'd be great

- [x] Video display tunes (at least some of the: streched, border)
- [ ] Config options - contorls, autoplay, etc.
- [ ] Error handler API
- [ ] Poster tune with config option `allowPoster`
- [ ] Caption length limit

# Optional

- [x] Config option for the upload input accept value - `videoAcceptFormats`

# Refactor

- [ ] UI manipulation module or at least move frequently used elements to class properies
- [ ] Use id instead of class in query selectors?

# Guide

- [ ] `AllowCaption` option - `allowCaption` option in config has no effect on saved `caption` data, only on availability of the tune and displaying the caption HTML element,
      unlike `withCaption` from block data, which set `caption` to undefined on save if `withCaption` equals false or falsy
