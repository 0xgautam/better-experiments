# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-06-02

### Fixed

- Resolved a significant bias in the A/B test variant assignment logic. The previous hashing mechanism (`djb2Hash` combined with specific string processing) was producing a skewed distribution of users (often resulting in hash numbers > 0.5). This has been corrected by implementing MurmurHash3, ensuring a much more uniform and statistically sound distribution of users across experiment variants.

### Changed

- The internal `createUserHash` function was refactored. It now computes and returns a 32-bit unsigned integer hash directly (using MurmurHash3) instead of a hexadecimal string representation. This simplifies the variant assignment process and makes the hashing output more directly usable.
- The `assignVariant` method was updated to consume the numeric hash directly, maintaining the correct weighted distribution logic.

## [0.1.0] - 2025-06-02

### Added

- Initial release
- Basic A/B testing functionality
- Assignment-based conversion tracking
- Memory storage adapter
- TypeScript support
- Cookie-based user identification
