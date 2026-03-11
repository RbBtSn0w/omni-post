## [1.2.0](https://github.com/RbBtSn0w/omni-post/compare/v1.1.0...v1.2.0) (2026-03-11)

### ✨ Features

* update logo and title across the application ([ca06405](https://github.com/RbBtSn0w/omni-post/commit/ca06405765bffd4f17018af9ad78899a382119bb))

## [1.1.0](https://github.com/RbBtSn0w/omni-post/compare/v1.0.0...v1.1.0) (2026-03-11)

### ✨ Features

* **backend-node:** finalize parity verification and refactor logging ([12d420c](https://github.com/RbBtSn0w/omni-post/commit/12d420c9eca5c857873a59efa847ece14f6a32ad))
* **backend-node:** implement security hardening, ESM stability, and API parity ([47a5305](https://github.com/RbBtSn0w/omni-post/commit/47a530553909509336ab21d89e7cdc8492363503))
* **backend-node:** re-implement playwright login logic to strictly match python parity for all 5 platforms ([fed0ccf](https://github.com/RbBtSn0w/omni-post/commit/fed0ccf97da2810a8e95a7ab8488317c36e78cd5))
* **backend-node:** update concurrency principle and fix E2E route paths ([0f5eeae](https://github.com/RbBtSn0w/omni-post/commit/0f5eeae371e9e275e0615f3c2adfd6832bf9bcfe))
* complete node.js backend rewrite with improved safety features and platform parity ([ed69465](https://github.com/RbBtSn0w/omni-post/commit/ed69465b469eabcfcf65282cc8a6b5916f3fa64b))
* implement Node.js TypeScript backend (phases 1-6) ([bec501a](https://github.com/RbBtSn0w/omni-post/commit/bec501a2d9d9b6bf331354b531475d9b5b1786bc))
* initialize speck-kit (constitution, templates, and workflows) ([2ca7a6c](https://github.com/RbBtSn0w/omni-post/commit/2ca7a6c1e0a7067e2ff8c5a5cc38cce49f77ae32))
* **spec:** add API and functional parity checklist for node backend rewrite ([df092e6](https://github.com/RbBtSn0w/omni-post/commit/df092e6ddfbbffddf7e4c87b543430814ef86519))
* **spec:** initial design documents for Node.js backend rewrite ([5a00240](https://github.com/RbBtSn0w/omni-post/commit/5a00240357b32f7a2472c011b8eab9f74ae01d9b))

### 🐛 Bug Fixes

* **backend-node:** fix bilibili dispatch test spy expectation ([533c03c](https://github.com/RbBtSn0w/omni-post/commit/533c03c082dd509c24a936bddab01627ab74866b))
* **backend-node:** fix implicit any type error in publish-service ([67ac161](https://github.com/RbBtSn0w/omni-post/commit/67ac161b80f623a1c005da180267b98cafda389f))
* **backend-node:** harden security and add rate limiting to satisfy CodeQL ([fc2dbfc](https://github.com/RbBtSn0w/omni-post/commit/fc2dbfcc026454cba00d1219688001ed2e823bc0))
* **backend-node:** resolve CodeQL incomplete URL sanitization alerts ([112f356](https://github.com/RbBtSn0w/omni-post/commit/112f356bb6df56efaa0cef0ef51223e09747e13b))
* **ci:** replace cycjimmy/semantic-release-action to fix Node 20 Date.prototype.toString error ([b441b98](https://github.com/RbBtSn0w/omni-post/commit/b441b98de057bad60eb7b8b5a06ea082ebe606bf))
* resolve TypeScript errors in account.ts ([74cc755](https://github.com/RbBtSn0w/omni-post/commit/74cc75598673d37ce443fabc9c71ec34e054a901))
* update default formatter for Vue files and comment out Python formatter ([ea5d4ec](https://github.com/RbBtSn0w/omni-post/commit/ea5d4eca39387b7ae8575dcc82b4490e65b9653b))
* update Python interpreter path and improve ESLint configuration ([518f11d](https://github.com/RbBtSn0w/omni-post/commit/518f11db1b461aad805ef2da71dd16272e213e1b))

# 1.0.0 (2026-02-03)


### Bug Fixes

* **ci:** add missing pylint, bandit, and pip-audit to dev dependencies ([61fcb07](https://github.com/RbBtSn0w/omni-post/commit/61fcb07e7cb88c6691062cebf2513d006d1e828a))
* **douyin:** update cover selection logic and 'Complete' button selector ([860c691](https://github.com/RbBtSn0w/omni-post/commit/860c691f8ef54b5d84542b5bebf3f2839ec819fb))
* explicit black/isort config and use venv paths in lint-staged ([7c108a6](https://github.com/RbBtSn0w/omni-post/commit/7c108a61a24192335eb3240869f6ed18d3150817))
* **frontend:** add missing patch method to http utility to fix task cancellation ([95afd38](https://github.com/RbBtSn0w/omni-post/commit/95afd383ecc67d449539e4628a40e1f31edd625d))
* remove unused semantic-release deps to resolve high severity audit issues ([5a66d2c](https://github.com/RbBtSn0w/omni-post/commit/5a66d2c6c8d998c81c0ab81785e6a9c9ede14018))
* **uploader:** update tag limits for Kuaishou and Douyin based on platform testing ([c7a9838](https://github.com/RbBtSn0w/omni-post/commit/c7a9838a080ed80bfc5a55eaa1f6d0d9c292f617))


### Features

* Add architecture documentation and enhance README with detailed project structure and features ([4ac1bc3](https://github.com/RbBtSn0w/omni-post/commit/4ac1bc3315efb851a318159b054d68d189dc89e9))
* Add automated dependency security check system with comprehensive guide and workflows ([608e212](https://github.com/RbBtSn0w/omni-post/commit/608e2120e4c9dafb088012e43d72590c7eb2b511))
* add Bilibili platform support across backend and frontend ([320b5c2](https://github.com/RbBtSn0w/omni-post/commit/320b5c2fc5eedf4544ab48926b24315b31afcbbb))
* Add CodeQL workflow for static analysis of JavaScript and Python. ([8750bd6](https://github.com/RbBtSn0w/omni-post/commit/8750bd6b7c20769dd81cc27cb259ab4c50bf1983))
* Add comprehensive agent and code style guides, including development skills and project-specific prompts ([b2af3aa](https://github.com/RbBtSn0w/omni-post/commit/b2af3aa2b142ad046e901706057d408adb280d9a))
* Add comprehensive Copilot instructions for project setup, architecture, and workflows ([3f9c93e](https://github.com/RbBtSn0w/omni-post/commit/3f9c93e123885f08273ea3ebd768a5ffda2a2523))
* add CONTRIBUTING and LICENSE files ([86d418a](https://github.com/RbBtSn0w/omni-post/commit/86d418af30ba546a859099065c043525223a49d2))
* add GitHub Actions workflows for CI/CD, code quality, and security checks ([0ac2966](https://github.com/RbBtSn0w/omni-post/commit/0ac29669140a38b9e1316d831d8e1c52724a0702))
* add package.json for project configuration and scripts ([2b1cc32](https://github.com/RbBtSn0w/omni-post/commit/2b1cc32b0150f77c4a372a752dd73d631c06e56c))
* add VSCode configuration files for Python development ([535d47b](https://github.com/RbBtSn0w/omni-post/commit/535d47ba160e899720dd6176bf71a0f7d1596365))
* **ci:** implement automated semantic release workflow ([2e189ca](https://github.com/RbBtSn0w/omni-post/commit/2e189ca8e104f32824d4bc52c19dd58fb85d8dbc))
* Configure local Chrome to run in non-headless mode and enhance the debug workflow with UI/browser automation steps. ([3cc63e0](https://github.com/RbBtSn0w/omni-post/commit/3cc63e04f2c331809250ca0045a03b8b9afb3aaf))
* enhance task lifecycle management and uploader polling ([4a371fb](https://github.com/RbBtSn0w/omni-post/commit/4a371fb7a01c70a8aab760336d56fba77e5c5718))
* Initialize AI agent configuration with rules, workflows, instructions, prompts, and development skills for OmniPost. ([942eb53](https://github.com/RbBtSn0w/omni-post/commit/942eb5370a5d128d991be1d746444e6191d30752))
* introduce semantic-release ([b982fed](https://github.com/RbBtSn0w/omni-post/commit/b982fedeaf906426f1c54542891042f0a88579f3))
* introduce semantic-release and ci-cd orchestration ([66d7226](https://github.com/RbBtSn0w/omni-post/commit/66d7226920bbb42fe238cbd36f3e6ad3a58843c4))
* introduce semantic-release and ci-cd orchestration ([8568481](https://github.com/RbBtSn0w/omni-post/commit/8568481c1eba15770b309ef67c6543bd81a5d06a))
* introduce semantic-release and commitlint ([71cd075](https://github.com/RbBtSn0w/omni-post/commit/71cd075447e2e503763ecc36276861556465e662))
* **tests:** add unit tests for various views and components ([7f64c76](https://github.com/RbBtSn0w/omni-post/commit/7f64c760160b9eeb0a486ceba74fab9b8da98b0e))
