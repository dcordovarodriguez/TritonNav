# Legitimate work to ship

Each item is a real product or engineering outcome with evidence that can be reviewed. These are candidates for issues and branches; nothing here creates artificial activity or commits.

## Product design and UX

### Make classroom destinations understandable

- **Project:** TritonNav
- **Issue:** `feat: make campus classroom search clear and trustworthy`
- **User outcome:** Searching `MALK B90` or `COA 125` shows the canonical building, room type, published capacity, floor, and the source date. “Directions” targets a verified outdoor building entrance. It does not claim an indoor route.
- **Review evidence:** Search-flow screenshots at phone and desktop sizes; keyboard/focus pass; tests for aliases and missing/unknown data.
- **Commit after approval:** `feat(search): add verified classroom destination details`

### Improve the portfolio case-study path

- **Project:** diegocordova-portfolio
- **Issue:** `design: improve recruiter path through project case studies`
- **User outcome:** A visitor can scan role, problem, contribution, process, outcome, and evidence without scrolling through repeated narrative. Keep claims tied to existing project artifacts.
- **Review evidence:** Before/after captures at 320, 390, tablet, and desktop widths; route/link check; alt-text and keyboard review.
- **Commit after approval:** `design(portfolio): clarify case study scanning and evidence`

### Bring Face West interactions to a consistent mobile finish

- **Project:** Face West
- **Issue:** `design: tighten mobile Explore and capture states`
- **User outcome:** Explore filters, the capture flow, and return navigation behave consistently with the Framer reference at narrow widths; camera access remains opt-in.
- **Review evidence:** Screen recording or screenshots for feed, Explore, filter, capture permission, denied permission, and back navigation; build and TypeScript check.
- **Commit after approval:** `fix(facewest): stabilize mobile explore and capture states`

## Frontend and full-stack engineering

### Add a read-only campus search endpoint

- **Project:** TritonNav
- **Issue:** `feat: expose canonical campus search for web and mobile clients`
- **User outcome:** A typed server endpoint searches the existing local building/room/alias data and returns only fields supported by provenance, with a building-level route anchor.
- **Review evidence:** API contract, resolver and API tests, invalid-query/error tests, build output, and a short client-flow capture.
- **Commit after approval:** `feat(api): add canonical campus destination search`
- **Scope guard:** Keep data in the repository. This does not reactivate Supabase or add service keys.

### Improve production route failure feedback

- **Project:** TritonNav
- **Issue:** `fix: make route availability and fallback state explicit`
- **User outcome:** The UI distinguishes a route from a destination lookup, shows a useful retry state when the Valhalla service is unavailable, and does not imply accessibility routing that the provider has not verified.
- **Review evidence:** Tests for success, timeout, provider error, and unavailable configuration; screenshots of each user-visible state.
- **Commit after approval:** `fix(routing): clarify provider availability states`

## Campus data and GIS

### Verify and add Ridge Walk North buildings

- **Project:** TritonNav
- **Issue:** `data: verify Ridge Walk North campus destinations`
- **User outcome:** Confirm Malk Hall, Alianza, Umoja, Coalition, CMRR, map labels, aliases, geometry, lifecycle, and public destinations against current UCSD sources. Add only records with a canonical building identity and a verified routing anchor.
- **Review evidence:** Source URLs and checked dates per field; map comparison; coordinate/alias validation; explicit unknowns for entrances and interior paths.
- **Commit after approval:** `data(campus): add verified Ridge Walk North destinations`
- **Do not include:** guessed door locations, room coordinates, or wheelchair-accessibility claims.

### Reconcile the official classroom inventory

- **Project:** TritonNav
- **Issue:** `data: reconcile UCSD Registrar classrooms with campus destinations`
- **User outcome:** Select the official, in-use Registrar rows that belong in TritonNav, link each to one canonical building, and expose capacity/seating/media only when the source provides them.
- **Review evidence:** `ridge-walk-north-classrooms.md`, unmatched-building report, and a proposed data-only diff; no UI release until room search behavior is reviewed.
- **Commit after approval:** `data(classrooms): add sourced Registrar room attributes`

## Machine learning and research engineering

### Make the softmax classifier reproducible

- **Project:** multiclass-softmax-classifier
- **Issue:** `research: make classifier evaluation reproducible`
- **User outcome:** Record the dataset shape/schema and split policy, set deterministic seeds, and provide one command that reruns training and emits actual metrics and a confusion matrix.
- **Review evidence:** Environment file, tests for data/label shape and numerical stability, and generated metrics from a real run. Report the seed and split; do not claim improved accuracy unless measured.
- **Commit after approval:** `research(classifier): add reproducible evaluation pipeline`

### Turn the RNN/LSTM comparison into a rerunnable experiment

- **Project:** cogs181-ml-project
- **Issue:** `research: document and reproduce RNN/LSTM text generation`
- **User outcome:** Document corpus provenance, train/validation split, model settings, seed, and a single run path. Recompute evaluation results from the checked-in or properly sourced data.
- **Review evidence:** Environment lock, run instructions, model-comparison table generated by the run, and a small smoke test.
- **Commit after approval:** `research(cogs181): make model comparison reproducible`

### Reproduce the Massive Memory figures

- **Project:** Massive_Memory_Project
- **Issue:** `research: make analysis figures reproducible from source data`
- **User outcome:** Identify the source inputs and processing steps for each published figure and provide scripts that regenerate those figures without changing the underlying results.
- **Review evidence:** Data dictionary, pinned analysis environment, figure checksums or visual review, and a clear note for any unavailable source.
- **Commit after approval:** `research(memory): script figure reproduction`

### Add a deterministic offline BCI evaluation path

- **Project:** BCI_Project_FlappyBird
- **Issue:** `research: validate blink classifier with recorded offline input`
- **User outcome:** Replay existing approved recordings through the blink pipeline and report confusion matrix, latency, and failure cases from a documented split.
- **Review evidence:** Pinned environment, data-use note, deterministic preprocessing test, and metrics only from an actual run.
- **Commit after approval:** `test(bci): add offline blink pipeline evaluation`

## Algorithm practice

### Close the LeetCode #8 tracking gap

- **Project:** leetcode-solutions
- **Issue:** `leetcode: solve 8 string to integer (atoi)`
- **User outcome:** Solve the problem independently, submit an accepted result, then use the existing `inbox/` workflow to add one solution and one coherent commit.
- **Review evidence:** Accepted solution, concise approach, complexity, updated index, and repository checks.
- **Commit after approval:** `leetcode: add 8 string to integer atoi`

The README currently lists #1–#7, #9, and #10, so #8 is a real gap. The daily issue automation should not create this issue until the LeetCode workflow has been reviewed and enabled.

## Review package for every proposed update

Before approval, show one compact packet containing:

1. The issue and user outcome.
2. Changed files and a readable diff.
3. Test/build results and data/source evidence.
4. Screenshots or a short recording for UI work.
5. Risks and explicitly unknown facts.
6. The proposed branch and one meaningful commit message.
7. Whether the update is ready for a draft PR, a local demo, or a deployment preview.

The live site is updated only through a reviewed change and the normal deployment path. This audit did not publish to `tritonnav.diegocordova.net` or alter production infrastructure.
