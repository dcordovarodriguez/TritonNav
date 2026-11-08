# Engineering workflow audit — 2026-11-07

This is the first local review snapshot for the requested weekday engineering system. The initial inspection was read-only with respect to GitHub and Supabase. After reviewing the packet, the user approved a TritonNav review-branch push and draft PR; production and database changes remain outside that approval. Two local files were already untracked before this work in TritonNav (`tritonnav-logo-thumbnail.jpg`, `tritonnav_image.jpeg`); the portfolio already had an untracked `output/` directory. They were left untouched.

## Account and Git identity

- GitHub account: `dcordovarodriguez`.
- Global Git identity: `dcordovarodriguez <dcordovarodriguez@ucsd.edu>`; the authenticated GitHub profile reports the same email and username.
- Whether private contributions are enabled is not exposed by the connected GitHub profile API. It was not changed.

## Repository audit coverage

All nine priority repositories exist on GitHub and report `main` as their default branch. The initial inventory confirmed TritonNav, the portfolio, and the softmax classifier by folder name but missed the BCI checkout because its folder is named `EEGblinkflappybird`. Inspecting Git remotes corrected that mistake. The other five repositories were absent from this workspace and have now been cloned from their existing GitHub repositories. All nine priority repositories now have local checkouts. The initial remote metadata review did not establish their build, test, dependency, or CI health; source audits for the newly located/cloned repositories remain pending.

| Repository | Local state | GitHub findings | CI / tests / build notes |
| --- | --- | --- | --- |
| TritonNav | `feature/campus-intelligence-foundation`, tracks `origin` at the same commit; two pre-existing untracked images | 3 open issues; no open PRs; 5 branches including four feature branches | No Actions workflow existed. 7 test files before this proposal; production build passes. Existing Next.js, campus, routing, indoor data, and iOS checks are present. |
| diegocordova-portfolio | `main`, tracks `origin`; pre-existing untracked `output/` | Private repo; no open issue or PR surfaced | No Actions workflow existed. `bun run check` covers ESLint, Vitest, and production build; a local quality workflow is proposed. Full local verification is still pending because ESLint did not finish in the available run window. |
| facewest | Newly cloned on `main` | Private repo; default branch `main`; latest observed commit syncs the Framer reference (2026-11-02) | README identifies a mobile-first Vite/React app; `package.json` declares `tsc -b && vite build`. No tests script was visible in that manifest. Workflow state not checked from a local checkout. |
| leetcode-solutions | Newly cloned on `main` | Default branch `main`; latest observed solution commit is #10, Regular Expression Matching (2026-10-28); no open issue or PR surfaced | README documents a safe local inbox/add-solution workflow, but also says its helper commits and pushes. Current README count says 9 solved and omits problem #8, despite the #10 commit. No automation was installed. |
| multiclass-softmax-classifier | `main`, clean, tracks `origin` | Latest observed commit packages the classifier for a portfolio (2026-08-14); no open issue or PR surfaced | No Actions workflow, test suite, or build manifest was found in the local checkout. README and `requirements.txt` are present. |
| cogs181-ml-project | Newly cloned on `main` | README describes character-level RNN/LSTM text generation; latest observed commit is the final project submission (2026-03-22) | README is minimal. Environment, reproducibility, CI, and test state need a local source audit. |
| Massive_Memory_Project | Newly cloned on `main` | README points to the experiment site; latest observed commit adds analysis (2026-03-22) | Strong first audit targets are run instructions, data dictionary, experiment provenance, and result reproducibility. CI/test status remains unknown. |
| BCI_Project_FlappyBird | Existing checkout at `EEGblinkflappybird`; working-tree state not yet established | README describes an OpenBCI blink-control pipeline; latest observed commit finalizes the project (2026-03-23) | Public `requirements.txt` uses lower bounds for PsychoPy and BrainFlow. Reproducibility and test/CI status need local inspection. |
| COGS108_Repo | Newly cloned on `main` | Default branch `main`; repository is very small and README contains only a title; latest observed content commit is 2025-04-29 | No test/build configuration was established from the available files. |

Recent meaningful commits and branch names were inspected where available. Staleness of remote branches, deployment configuration, and dependency health for the six repositories initially reviewed only through GitHub are not established by this snapshot.

## TritonNav baseline and public data

Current local records are 54 buildings, 23 rooms, 23 entrances, 8 colleges, 8 housing entries, 11 places, and 11 districts. The eight required undergraduate colleges are present. The room schema currently uses fields such as `id`, `buildingId`, `number`, `name`, `floor`, and `preferredEntranceId`; it has no Registrar code, capacity, source URL, or room-level accessibility/media model. This audit does not migrate that schema.

The app currently uses repository-local JavaScript data and does not query Supabase. Existing GIS, indoor-data, routing, and campus resolver checks are in place. The checked-in roadmap/technical audit contains an older recommendation for Supabase/PostGIS, which should be revisited in light of actual current data size and query needs.

The current public UCSD ArcGIS service returns 752 point features and 654 footprint features. Its point layer exposes lifecycle status, Facility IDs, names, aliases, addresses, and coordinates. The points include off-core UCSD locations, so the generated comparison uses a broad campus-core envelope as a discovery filter; its 554 unmatched records in that envelope are candidates, not automatically new TritonNav destinations. The high candidate count needs filtering and human triage before it becomes a weekly issue checklist.

The live public UCSD Facilities SpreadsheetML export contains 163 room rows, including 136 rows marked both Registrar-controlled and in-use with a room type of Classroom or Lecture Hall. Room matching uses qualified names or a room number within the same canonical building. The current local room records match 13 of those, leaving 123 comparison candidates. Building links are made only by exact normalized building name/alias; 80 of 163 total Facilities room rows remain unlinked to current canonical buildings.

Ridge Walk North currently has 19 Facilities rows across Brian C. Malk Hall and Coalition: 15 are typed `Classroom`, 4 `Lecture Hall`; 17 have positive capacity values; wheelchair-space fields and media worksheet data are present for all 19. This published inventory does not simply reconcile to “19 general-assignment classrooms plus one lecture hall.” The report lists each Facilities row verbatim for review; it adds no room coordinate or route.

The live GIS layer contains operational records for Brian C. Malk Hall, Alianza, Umoja, Coalition, and the Center for Memory and Recording Research. Those names are not present in the current 54-building dataset. The GIS feature attributes do not expose the printable-map building labels 262–266, so the identifiers supplied in the request were not independently confirmed from this service. No separate GIS feature named Glass Center was found; it remains unverified as a standalone destination.

Triton Center requires source reconciliation. The GIS layer currently marks Triton Administrative Services, Triton Health and Wellness, and Triton Alumni and Welcome Center as `Construction`; it did not return a separate Strauss Gallery/Celebration Hall feature in the targeted name search. Current UCSD communications describe phased openings, so the GIS lifecycle fields should not be used alone to call these destinations open or closed. No Triton Center records were imported.

The comparison/validation scripts report five existing cross-entity alias collisions: “pepper canyon,” “sixth,” “new sixth,” “sixth college neighborhood,” and “warren.” They are warnings for future resolver review. Structural validation found no broken current room/building/entrance references, invalid coordinates, or missing college entries. The existing `npm run lint` command currently fails because `next lint` is interpreted as a project path by the installed Next.js CLI; the prepared CI workflow therefore runs the passing test/build checks and leaves lint repair as a separate issue.

## TritonNav deployment boundary

The connected Vercel account reports the project `triton-nav` attached to `tritonnav.diegocordova.net`, with the custom domain verified. The current production deployment is `READY` on `main` at commit `f9aa144`; the existing feature branch also has a `READY` preview deployment. No deployment was triggered during this audit. Once changes are pushed to a review branch, Vercel Git integration is expected to create a preview deployment. A push/merge to `main` can update the live domain. Therefore approval packets must label **local review**, **preview deploy**, and **production release** separately; approval to prepare a change is not approval to release it to production.

## Supabase decision

- Existing project `nsablcergvivjmxtzyun` is `INACTIVE`.
- Project/table inspection reports that the database may not be accessible while inactive; migrations and extension details could not be verified. A security-advisor call returned no lint items, but this is not a substitute for a live database audit.
- The app has no Supabase runtime client/query path. Data remains small enough for static JavaScript today, and the source is infrequently refreshed and useful offline.
- **Recommendation: keep repo-local data for now; reconsider a hybrid/PostGIS design if live corrections, user submissions, high-frequency updates, or spatial queries become real product requirements.** PostGIS is a reasonable future choice for proximity/bounding-box queries; it does not justify restoring this inactive project today.
- No restore, SQL, migration, or project mutation was performed.

## Automation proposal

| Day | Proposed operating task | Current local preparation |
| --- | --- | --- |
| Monday | Product health queue for TritonNav, portfolio, and Face West; report real build, route, responsive, docs, and accessibility findings | Cross-repo issue workflow is proposed only; private repos require per-repo workflows or carefully scoped access. |
| Tuesday | Fetch UCSD GIS and public Facilities classroom/media sources, compare current data, validate, and update one review issue | TritonNav scripts and a Tuesday Actions workflow are prepared. Workflow only reads public sources and can create/update one dated issue; it does not edit dataset files or create a PR. |
| Wednesday | Rotate an ML/data reproducibility audit among the five ML/research repos | Proposed as an issue queue. No research results will be generated or rewritten by automation. |
| Thursday | Portfolio / Face West / TritonNav UI quality checks | Portfolio quality workflow is prepared; Face West and cross-project browser checks remain to be prepared in its checkout. |
| Friday | Summarize merged work, PRs, issues, data changes, and meaningful documentation/release recommendations | Proposed as an issue/summary job. No release/tag is automatic. |

All scheduled GitHub Actions use UTC cron and document the America/Los_Angeles conversion. The prepared TritonNav Tuesday schedule is `0 17 * * 2` (09:00 PDT / 10:00 PST). Each workflow supports manual dispatch, uses concurrency controls, and has least-privilege permissions. No scheduled job creates commits or merges PRs.

The LeetCode README currently has a tracking gap: it lists #1–#7, #9, and #10, so #8 String to Integer (atoi) is the next numeric gap to confirm before the daily issue workflow selects a problem. The existing `scripts/add_solution.py` safely uses the `inbox/` flow; it stages, commits, and pushes when run. That script will not be invoked by scheduled automation. The README count and index should be reconciled during the new local source audit.

## Security and review gates

The tracked TritonNav file scan found no common API-token, GitHub-token, or service-role key patterns; the only tracked `.env*` file found was the documented `infrastructure/valhalla/.env.example`. This limited pattern scan is not a full secret scanner, and the six repositories initially inspected remotely have not yet received a local secret scan. No credentials are included in the proposed Actions workflows. The workflows never auto-merge.

This document records the initial review packet. The user subsequently approved committing and pushing the TritonNav packet to its review branch; production release remains a separate decision. The Actions will not exist on GitHub or run until a human reviews and merges them through the normal branch/PR process. See [Legitimate work to ship](./ship-ready-work-ideas.md) for scoped UX, frontend, full-stack, GIS, ML/research, and LeetCode examples with acceptance evidence and proposed commit messages. For every update, the approval packet should identify the exact repository/branch, summarize the outcome, enumerate changed files, show test/build and data evidence, link the full diff, list unresolved facts, propose one commit message, and state whether the request is to keep local, push for a preview, or release to production.

## Initial review decision

The TritonNav campus-data pipeline and quality checks, plus a portfolio quality workflow, are ready for review locally. The complete cross-repository operating system is **not yet ready**: all nine local checkouts are now available, but cross-repository Monday/Wednesday/Friday issue automation and the LeetCode issue workflow are not prepared, and full security/dependency/deployment audits remain outstanding for the six repositories initially inspected remotely. No campus data PR is ready because building links, entrance anchors, campus boundaries, and lifecycle conflicts still require review.

## Pre-push checks after approval

The final review fixed a missing write of the Ridge Walk North Markdown report and changed room matching so that the same bare room number in two buildings cannot suppress a candidate. The corrected comparison reports 123 classroom candidates (previously 120). Artifact upload paths are now explicit. `npm test` passes all 108 tests and `npm run build` passes; campus validation passes 189 checks with six existing warnings and no problems. No runtime campus dataset, UI, or Supabase changes are included.
