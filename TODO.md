# Issues

# It'd be great

- [x] Video display tunes (at least some of the: streched, border)
- [ ] Config options - contorls, autoplay, etc.
- [ ] Error handler API
- [ ] Poster tune with config option `allowPoster`
- [ ] Caption length limit
- [ ] Option to use default library implemented uploader function with just string endpoint?

# Optional

- [x] Config option for the upload input accept value - `videoAcceptFormats`.

# Refactor

- [ ] UI manipulation module or at least move frequently used elements to class properties?
- [x] Use id instead of class in query selectors? No, negative impact on SEO

# Guide

- [ ] `featureFlags` options - every option of tunes in `featureFlags` of config has no effect on saved tune data in `data`, only on availability of the tune and displaying its effect in editor.

# Proposed logic shifts

- [ ] Add vanish of disabled feature values from data on save? Like `withBorder` to `null` or `undefined` when `border` option is off in `featureFlags`.
