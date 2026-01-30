# Changelog

## [0.7.2](https://github.com/blinkk/fileset/compare/fileset-v1.0.0...fileset-v0.7.2) (2026-01-30)


### Features

* add ability to use server as staging only ([8c2d132](https://github.com/blinkk/fileset/commit/8c2d1324c9d9cf499a34ff6a47a6c27f38c47143))
* add cache to manifest lookup ([e12c0c3](https://github.com/blinkk/fileset/commit/e12c0c3e16f432f1b4a8bd5892f3c9e61a577172))
* add release-please integration ([af73ee4](https://github.com/blinkk/fileset/commit/af73ee402285a9aa4590579a5d2247e65214e3cc))
* add retries for uploads with backoff ([cdbdf43](https://github.com/blinkk/fileset/commit/cdbdf4396fe655436338d57896ac346d73dd175b))
* add special content-type for .soy ([a7a8ce6](https://github.com/blinkk/fileset/commit/a7a8ce61c5260534dfcac5e3d1a637b8edfb6231))
* add support for output manifest ([9d90c8c](https://github.com/blinkk/fileset/commit/9d90c8c72f87249aa84d92bcaca2608d5adbda55))
* allow specifying gcp project in cli ([449b2b2](https://github.com/blinkk/fileset/commit/449b2b2a7ba403f5ab8e75238171b8a12ddc97ac))
* enable sameSite:none for iframed staging environments ([5c8a521](https://github.com/blinkk/fileset/commit/5c8a521a67825a4c2196907315cd0cbb21a20f71))
* handle clean urls e.g. /foo.html -&gt; /foo/ ([33adcf6](https://github.com/blinkk/fileset/commit/33adcf6af775bfec4495b5059df26ddd61ca5c7b))
* persist ncr value across navigation ([fde8718](https://github.com/blinkk/fileset/commit/fde8718fdf03a340f3ff0b781eb0c5838c46f5fd))
* support custom staging urls in cli output ([da3e8a1](https://github.com/blinkk/fileset/commit/da3e8a1c6f4eeaa92354dd36be985e7fdcca2703))
* switch to npm trusted publishers for secure publishing ([ac6aa46](https://github.com/blinkk/fileset/commit/ac6aa4690d913c42765be1bd597135de51e2cb51))


### Bug Fixes

* avoid infinite redirect loop ([b0811fa](https://github.com/blinkk/fileset/commit/b0811fad715890697fac1bcc687cc956b60fb163))
* clarify link naming ([0d6a257](https://github.com/blinkk/fileset/commit/0d6a257e0a433901516f1d1f163d974db037d036))
* dashboard domain cli output ([9e00d19](https://github.com/blinkk/fileset/commit/9e00d19ba20f3e59fc804de2cee98645ca267f46))
* ensure package is prepared before publish ([7978c08](https://github.com/blinkk/fileset/commit/7978c085b8aebbb15ba7de17567bc0f66b9a0d3e))
* ensure unhandled promises fail ([4fb2f02](https://github.com/blinkk/fileset/commit/4fb2f02a0bc3157d6b2c7dabbbb1593edb598f70))
* exception handling ([bcbbf5c](https://github.com/blinkk/fileset/commit/bcbbf5c7b101b535f75036f7fdaf01a1c186f238))
* fix issue with missing config file ([bb792ab](https://github.com/blinkk/fileset/commit/bb792abd14f3443da6503df76a4a9db1fb52d802))
* improve error reporting on upload ([ed28e24](https://github.com/blinkk/fileset/commit/ed28e24110c6277943cdcaf3cadcd6765049556d))
* issue parsing cookies ([47beeec](https://github.com/blinkk/fileset/commit/47beeeca3c036d872e23b3b0bec6e87e832c462e))
* issue with superfluous -dot- ([39cb318](https://github.com/blinkk/fileset/commit/39cb3182174fc4d2886b5a20106fdead7f8b264c))
* issue with using BASE_URL and links ([62be29f](https://github.com/blinkk/fileset/commit/62be29fa123bfbf8fdb0479fcbaa6dc18f1efff3))
* passport import ([3a06780](https://github.com/blinkk/fileset/commit/3a06780c967cb780345dad409b623f035367ae13))
* preserve query string when redirecting ([fb8226b](https://github.com/blinkk/fileset/commit/fb8226b3c64660ad31bf3668023156e540afb385))
* replace colors with chalk ([0961a38](https://github.com/blinkk/fileset/commit/0961a380b3a7b418ae036dc9f0402ea7b07c662c))
* revert "fix: issue with superfluous -dot-" ([8a4d8c7](https://github.com/blinkk/fileset/commit/8a4d8c7ae5e97adad0312045738883e4537d89a5))
* support case insensitive trailing slash redirects ([210741a](https://github.com/blinkk/fileset/commit/210741a5408919789732071766f7e010f868f6b5))
* support deployment from nested directories ([47b585d](https://github.com/blinkk/fileset/commit/47b585d8b36b92508b7dd7779603ca709b0c57bf))
* update webpack ([49c736e](https://github.com/blinkk/fileset/commit/49c736e3d7822839b8687030ae388ef704af9416))
* upgrade isomorphic-git to resolve vuln ([c0a922e](https://github.com/blinkk/fileset/commit/c0a922e0550fca523201327250753cef935b4d4b))
* use base url for links ([9673134](https://github.com/blinkk/fileset/commit/96731344ef396efa7d39ba393c997e5a86001446))
* use case insensitive matching ([3d08252](https://github.com/blinkk/fileset/commit/3d08252e2c219c74844535b550e785b1712f6967))


### Miscellaneous Chores

* release 0.1.4 ([524ea3b](https://github.com/blinkk/fileset/commit/524ea3b127a907e6c1390c3df21494a0634a9b20))
* release 0.1.5 ([44f88c1](https://github.com/blinkk/fileset/commit/44f88c1cbfa745ee9c49dfa5ff83274ac0011252))
* release 0.2.0 ([6c877ba](https://github.com/blinkk/fileset/commit/6c877ba3b9326a06e3ed772682de0d4564b640a9))
* release 0.4.6 ([2c9d399](https://github.com/blinkk/fileset/commit/2c9d39916042a94e710bd037aa463de70f865910))
* release 0.4.7 ([8576fd2](https://github.com/blinkk/fileset/commit/8576fd201092418ce6bbaa7a40d4b1d94e00154a))
* release 0.4.8 ([568a864](https://github.com/blinkk/fileset/commit/568a8649ca3070a7698c62e7ba502c0e2816bebb))
* release 0.7.2 ([ecead30](https://github.com/blinkk/fileset/commit/ecead30e2e7787177179d5f28ff18cac05b54be3))

## [0.7.2](https://github.com/blinkk/fileset/compare/fileset-v0.10.0...fileset-v0.7.2) (2026-01-30)


### Features

* add ability to use server as staging only ([8c2d132](https://github.com/blinkk/fileset/commit/8c2d1324c9d9cf499a34ff6a47a6c27f38c47143))
* add cache to manifest lookup ([e12c0c3](https://github.com/blinkk/fileset/commit/e12c0c3e16f432f1b4a8bd5892f3c9e61a577172))
* add release-please integration ([af73ee4](https://github.com/blinkk/fileset/commit/af73ee402285a9aa4590579a5d2247e65214e3cc))
* add retries for uploads with backoff ([cdbdf43](https://github.com/blinkk/fileset/commit/cdbdf4396fe655436338d57896ac346d73dd175b))
* add special content-type for .soy ([a7a8ce6](https://github.com/blinkk/fileset/commit/a7a8ce61c5260534dfcac5e3d1a637b8edfb6231))
* add support for output manifest ([9d90c8c](https://github.com/blinkk/fileset/commit/9d90c8c72f87249aa84d92bcaca2608d5adbda55))
* allow specifying gcp project in cli ([449b2b2](https://github.com/blinkk/fileset/commit/449b2b2a7ba403f5ab8e75238171b8a12ddc97ac))
* enable sameSite:none for iframed staging environments ([5c8a521](https://github.com/blinkk/fileset/commit/5c8a521a67825a4c2196907315cd0cbb21a20f71))
* handle clean urls e.g. /foo.html -&gt; /foo/ ([33adcf6](https://github.com/blinkk/fileset/commit/33adcf6af775bfec4495b5059df26ddd61ca5c7b))
* persist ncr value across navigation ([fde8718](https://github.com/blinkk/fileset/commit/fde8718fdf03a340f3ff0b781eb0c5838c46f5fd))
* support custom staging urls in cli output ([da3e8a1](https://github.com/blinkk/fileset/commit/da3e8a1c6f4eeaa92354dd36be985e7fdcca2703))
* switch to npm trusted publishers for secure publishing ([ac6aa46](https://github.com/blinkk/fileset/commit/ac6aa4690d913c42765be1bd597135de51e2cb51))


### Bug Fixes

* avoid infinite redirect loop ([b0811fa](https://github.com/blinkk/fileset/commit/b0811fad715890697fac1bcc687cc956b60fb163))
* clarify link naming ([0d6a257](https://github.com/blinkk/fileset/commit/0d6a257e0a433901516f1d1f163d974db037d036))
* dashboard domain cli output ([9e00d19](https://github.com/blinkk/fileset/commit/9e00d19ba20f3e59fc804de2cee98645ca267f46))
* ensure package is prepared before publish ([7978c08](https://github.com/blinkk/fileset/commit/7978c085b8aebbb15ba7de17567bc0f66b9a0d3e))
* ensure unhandled promises fail ([4fb2f02](https://github.com/blinkk/fileset/commit/4fb2f02a0bc3157d6b2c7dabbbb1593edb598f70))
* exception handling ([bcbbf5c](https://github.com/blinkk/fileset/commit/bcbbf5c7b101b535f75036f7fdaf01a1c186f238))
* fix issue with missing config file ([bb792ab](https://github.com/blinkk/fileset/commit/bb792abd14f3443da6503df76a4a9db1fb52d802))
* improve error reporting on upload ([ed28e24](https://github.com/blinkk/fileset/commit/ed28e24110c6277943cdcaf3cadcd6765049556d))
* issue parsing cookies ([47beeec](https://github.com/blinkk/fileset/commit/47beeeca3c036d872e23b3b0bec6e87e832c462e))
* issue with superfluous -dot- ([39cb318](https://github.com/blinkk/fileset/commit/39cb3182174fc4d2886b5a20106fdead7f8b264c))
* issue with using BASE_URL and links ([62be29f](https://github.com/blinkk/fileset/commit/62be29fa123bfbf8fdb0479fcbaa6dc18f1efff3))
* passport import ([3a06780](https://github.com/blinkk/fileset/commit/3a06780c967cb780345dad409b623f035367ae13))
* preserve query string when redirecting ([fb8226b](https://github.com/blinkk/fileset/commit/fb8226b3c64660ad31bf3668023156e540afb385))
* replace colors with chalk ([0961a38](https://github.com/blinkk/fileset/commit/0961a380b3a7b418ae036dc9f0402ea7b07c662c))
* revert "fix: issue with superfluous -dot-" ([8a4d8c7](https://github.com/blinkk/fileset/commit/8a4d8c7ae5e97adad0312045738883e4537d89a5))
* support case insensitive trailing slash redirects ([210741a](https://github.com/blinkk/fileset/commit/210741a5408919789732071766f7e010f868f6b5))
* support deployment from nested directories ([47b585d](https://github.com/blinkk/fileset/commit/47b585d8b36b92508b7dd7779603ca709b0c57bf))
* update webpack ([49c736e](https://github.com/blinkk/fileset/commit/49c736e3d7822839b8687030ae388ef704af9416))
* upgrade isomorphic-git to resolve vuln ([c0a922e](https://github.com/blinkk/fileset/commit/c0a922e0550fca523201327250753cef935b4d4b))
* use base url for links ([9673134](https://github.com/blinkk/fileset/commit/96731344ef396efa7d39ba393c997e5a86001446))
* use case insensitive matching ([3d08252](https://github.com/blinkk/fileset/commit/3d08252e2c219c74844535b550e785b1712f6967))


### Miscellaneous Chores

* release 0.1.4 ([524ea3b](https://github.com/blinkk/fileset/commit/524ea3b127a907e6c1390c3df21494a0634a9b20))
* release 0.1.5 ([44f88c1](https://github.com/blinkk/fileset/commit/44f88c1cbfa745ee9c49dfa5ff83274ac0011252))
* release 0.2.0 ([6c877ba](https://github.com/blinkk/fileset/commit/6c877ba3b9326a06e3ed772682de0d4564b640a9))
* release 0.4.6 ([2c9d399](https://github.com/blinkk/fileset/commit/2c9d39916042a94e710bd037aa463de70f865910))
* release 0.4.7 ([8576fd2](https://github.com/blinkk/fileset/commit/8576fd201092418ce6bbaa7a40d4b1d94e00154a))
* release 0.4.8 ([568a864](https://github.com/blinkk/fileset/commit/568a8649ca3070a7698c62e7ba502c0e2816bebb))
* release 0.7.2 ([ecead30](https://github.com/blinkk/fileset/commit/ecead30e2e7787177179d5f28ff18cac05b54be3))

## [0.11.0](https://github.com/blinkk/fileset/compare/v0.10.0...v0.11.0) (2026-01-30)


### Features

* add retries for uploads with backoff ([cdbdf43](https://github.com/blinkk/fileset/commit/cdbdf4396fe655436338d57896ac346d73dd175b))

## [0.10.0](https://github.com/blinkk/fileset/compare/v0.9.1...v0.10.0) (2024-01-08)


### Features

* handle clean urls e.g. /foo.html -&gt; /foo/ ([33adcf6](https://github.com/blinkk/fileset/commit/33adcf6af775bfec4495b5059df26ddd61ca5c7b))

## [0.9.1](https://github.com/blinkk/fileset/compare/v0.9.0...v0.9.1) (2023-09-14)


### Bug Fixes

* use case insensitive matching ([3d08252](https://github.com/blinkk/fileset/commit/3d08252e2c219c74844535b550e785b1712f6967))

## [0.9.0](https://github.com/blinkk/fileset/compare/v0.8.0...v0.9.0) (2023-08-26)


### Features

* add cache to manifest lookup ([e12c0c3](https://github.com/blinkk/fileset/commit/e12c0c3e16f432f1b4a8bd5892f3c9e61a577172))


### Bug Fixes

* update webpack ([49c736e](https://github.com/blinkk/fileset/commit/49c736e3d7822839b8687030ae388ef704af9416))

## [0.8.0](https://github.com/blinkk/fileset/compare/v0.7.4...v0.8.0) (2022-11-17)


### Features

* add special content-type for .soy ([a7a8ce6](https://github.com/blinkk/fileset/commit/a7a8ce61c5260534dfcac5e3d1a637b8edfb6231))

## [0.7.4](https://github.com/blinkk/fileset/compare/v0.7.3...v0.7.4) (2022-11-02)


### Bug Fixes

* avoid infinite redirect loop ([b0811fa](https://github.com/blinkk/fileset/commit/b0811fad715890697fac1bcc687cc956b60fb163))

## [0.7.3](https://github.com/blinkk/fileset/compare/v0.7.2...v0.7.3) (2022-11-02)


### Bug Fixes

* preserve query string when redirecting ([fb8226b](https://github.com/blinkk/fileset/commit/fb8226b3c64660ad31bf3668023156e540afb385))

## [0.7.2](https://github.com/blinkk/fileset/compare/v0.7.0...v0.7.2) (2022-09-14)


### Bug Fixes

* dashboard domain cli output ([9e00d19](https://github.com/blinkk/fileset/commit/9e00d19ba20f3e59fc804de2cee98645ca267f46))


### Miscellaneous Chores

* release 0.7.2 ([ecead30](https://github.com/blinkk/fileset/commit/ecead30e2e7787177179d5f28ff18cac05b54be3))

## [0.7.0](https://github.com/blinkk/fileset/compare/v0.6.0...v0.7.0) (2022-09-14)


### Features

* support custom staging urls in cli output ([da3e8a1](https://github.com/blinkk/fileset/commit/da3e8a1c6f4eeaa92354dd36be985e7fdcca2703))

## [0.6.0](https://www.github.com/blinkk/fileset/compare/v0.5.1...v0.6.0) (2022-04-01)


### Features

* enable sameSite:none for iframed staging environments ([5c8a521](https://www.github.com/blinkk/fileset/commit/5c8a521a67825a4c2196907315cd0cbb21a20f71))

### [0.5.1](https://www.github.com/blinkk/fileset/compare/v0.5.0...v0.5.1) (2022-02-23)


### Bug Fixes

* issue parsing cookies ([47beeec](https://www.github.com/blinkk/fileset/commit/47beeeca3c036d872e23b3b0bec6e87e832c462e))

## [0.5.0](https://www.github.com/blinkk/fileset/compare/v0.4.16...v0.5.0) (2022-02-23)


### Features

* persist ncr value across navigation ([fde8718](https://www.github.com/blinkk/fileset/commit/fde8718fdf03a340f3ff0b781eb0c5838c46f5fd))

### [0.4.16](https://www.github.com/blinkk/fileset/compare/v0.4.15...v0.4.16) (2022-01-25)


### Bug Fixes

* passport import ([3a06780](https://www.github.com/blinkk/fileset/commit/3a06780c967cb780345dad409b623f035367ae13))

### [0.4.15](https://www.github.com/blinkk/fileset/compare/v0.4.14...v0.4.15) (2022-01-10)


### Bug Fixes

* replace colors with chalk ([0961a38](https://www.github.com/blinkk/fileset/commit/0961a380b3a7b418ae036dc9f0402ea7b07c662c))

### [0.4.14](https://www.github.com/blinkk/fileset/compare/v0.4.13...v0.4.14) (2021-12-08)


### Bug Fixes

* support case insensitive trailing slash redirects ([210741a](https://www.github.com/blinkk/fileset/commit/210741a5408919789732071766f7e010f868f6b5))

### [0.4.13](https://www.github.com/blinkk/fileset/compare/v0.4.12...v0.4.13) (2021-10-29)


### Bug Fixes

* ensure unhandled promises fail ([4fb2f02](https://www.github.com/blinkk/fileset/commit/4fb2f02a0bc3157d6b2c7dabbbb1593edb598f70))

### [0.4.12](https://www.github.com/blinkk/fileset/compare/v0.4.11...v0.4.12) (2021-10-22)


### Bug Fixes

* revert "fix: issue with superfluous -dot-" ([8a4d8c7](https://www.github.com/blinkk/fileset/commit/8a4d8c7ae5e97adad0312045738883e4537d89a5))

### [0.4.11](https://www.github.com/blinkk/fileset/compare/v0.4.10...v0.4.11) (2021-10-18)


### Bug Fixes

* support deployment from nested directories ([47b585d](https://www.github.com/blinkk/fileset/commit/47b585d8b36b92508b7dd7779603ca709b0c57bf))

### [0.4.10](https://www.github.com/blinkk/fileset/compare/v0.4.9...v0.4.10) (2021-09-21)


### Bug Fixes

* exception handling ([bcbbf5c](https://www.github.com/blinkk/fileset/commit/bcbbf5c7b101b535f75036f7fdaf01a1c186f238))

### [0.4.9](https://www.github.com/blinkk/fileset/compare/v0.4.8...v0.4.9) (2021-09-21)


### Bug Fixes

* improve error reporting on upload ([ed28e24](https://www.github.com/blinkk/fileset/commit/ed28e24110c6277943cdcaf3cadcd6765049556d))

### [0.4.8](https://www.github.com/blinkk/fileset/compare/v0.4.7...v0.4.8) (2021-09-21)


### Miscellaneous Chores

* release 0.4.8 ([568a864](https://www.github.com/blinkk/fileset/commit/568a8649ca3070a7698c62e7ba502c0e2816bebb))

### [0.4.7](https://www.github.com/blinkk/fileset/compare/v0.4.6...v0.4.7) (2021-09-21)


### Miscellaneous Chores

* release 0.4.7 ([8576fd2](https://www.github.com/blinkk/fileset/commit/8576fd201092418ce6bbaa7a40d4b1d94e00154a))

### [0.4.6](https://www.github.com/blinkk/fileset/compare/v0.4.5...v0.4.6) (2021-08-23)


### Miscellaneous Chores

* release 0.4.6 ([2c9d399](https://www.github.com/blinkk/fileset/commit/2c9d39916042a94e710bd037aa463de70f865910))

### [0.4.5](https://www.github.com/blinkk/fileset/compare/v0.4.4...v0.4.5) (2021-08-23)


### Bug Fixes

* upgrade isomorphic-git to resolve vuln ([c0a922e](https://www.github.com/blinkk/fileset/commit/c0a922e0550fca523201327250753cef935b4d4b))

### [0.4.4](https://www.github.com/blinkk/fileset/compare/v0.4.3...v0.4.4) (2021-08-11)


### Bug Fixes

* issue with superfluous -dot- ([39cb318](https://www.github.com/blinkk/fileset/commit/39cb3182174fc4d2886b5a20106fdead7f8b264c))

### [0.4.3](https://www.github.com/blinkk/fileset/compare/v0.4.2...v0.4.3) (2021-08-10)


### Bug Fixes

* issue with using BASE_URL and links ([62be29f](https://www.github.com/blinkk/fileset/commit/62be29fa123bfbf8fdb0479fcbaa6dc18f1efff3))

### [0.4.2](https://www.github.com/blinkk/fileset/compare/v0.4.1...v0.4.2) (2021-08-10)


### Bug Fixes

* use base url for links ([9673134](https://www.github.com/blinkk/fileset/commit/96731344ef396efa7d39ba393c997e5a86001446))

### [0.4.1](https://www.github.com/blinkk/fileset/compare/v0.4.0...v0.4.1) (2021-08-08)


### Bug Fixes

* clarify link naming ([0d6a257](https://www.github.com/blinkk/fileset/commit/0d6a257e0a433901516f1d1f163d974db037d036))

## [0.4.0](https://www.github.com/blinkk/fileset/compare/v0.3.0...v0.4.0) (2021-08-07)


### Features

* add support for output manifest ([9d90c8c](https://www.github.com/blinkk/fileset/commit/9d90c8c72f87249aa84d92bcaca2608d5adbda55))

## [0.3.0](https://www.github.com/blinkk/fileset/compare/v0.2.1...v0.3.0) (2021-08-04)


### Features

* allow specifying gcp project in cli ([449b2b2](https://www.github.com/blinkk/fileset/commit/449b2b2a7ba403f5ab8e75238171b8a12ddc97ac))

### [0.2.1](https://www.github.com/blinkk/fileset/compare/v0.2.0...v0.2.1) (2021-05-28)


### Bug Fixes

* ensure package is prepared before publish ([7978c08](https://www.github.com/blinkk/fileset/commit/7978c085b8aebbb15ba7de17567bc0f66b9a0d3e))

## [0.2.0](https://www.github.com/blinkk/fileset/compare/v0.1.5...v0.2.0) (2021-05-28)


### Miscellaneous Chores

* release 0.2.0 ([6c877ba](https://www.github.com/blinkk/fileset/commit/6c877ba3b9326a06e3ed772682de0d4564b640a9))

### [0.1.5](https://www.github.com/blinkk/fileset/compare/v0.1.4...v0.1.5) (2021-05-28)


### Features

* add ability to use server as staging only ([8c2d132](https://www.github.com/blinkk/fileset/commit/8c2d1324c9d9cf499a34ff6a47a6c27f38c47143))


### Bug Fixes

* fix issue with missing config file ([bb792ab](https://www.github.com/blinkk/fileset/commit/bb792abd14f3443da6503df76a4a9db1fb52d802))


### Miscellaneous Chores

* release 0.1.5 ([44f88c1](https://www.github.com/blinkk/fileset/commit/44f88c1cbfa745ee9c49dfa5ff83274ac0011252))

### 0.1.4 (2021-02-15)


### Features

* add release-please integration ([af73ee4](https://www.github.com/blinkkcode/fileset/commit/af73ee402285a9aa4590579a5d2247e65214e3cc))
