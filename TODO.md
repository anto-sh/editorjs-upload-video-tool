# Issues

# It'd be great to make that

- [ ] Video display options (at least some of the: streched, border, contorls, autoplay, etc.)
- [ ] Error handler API

# Optional

- [ ] Configuration for the options of upload files (type, multiple, etc.)

# Refactor

- [ ] UI manipulation module or at least move frequently used elements to class properies

# Guide

- [ ] `AllowCaption` option - `allowCaption` option in config has no effect on saved `caption` data, only on availability of the tune and displaying the caption HTML element,
      unlike `withCaption` from block data, which set `caption` to undefined on save if `withCaption` equals false or falsy
