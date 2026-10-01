# Draft figure captions

**Figure 1. Actual versus Valhalla-estimated walking time.** Recorded physical-iPhone observations are separated by timestamp consistency. The dashed line denotes equality between actual and estimated time. The open diamond is an approved normalization of a date-typed ETA and is not included in the measured-only sample.

**Figure 2. Per-trial timing error.** Signed error is recorded actual time minus Valhalla ETA for completed physical-iPhone trials with numeric original timing values. Positive values indicate that the recorded walk took longer than Valhalla's estimate. Purple markers identify conflicts between entered duration and start/end timestamps.

**Figure 3. Distribution of timing differences.** Each point represents one measured physical-iPhone timing pair, stacked where errors are identical. The zero line indicates agreement with Valhalla. The small single-evaluator sample supports descriptive, not inferential, interpretation.

**Figure 4. Recorded completion and timing-data availability.** Completion status is shown separately from timing completeness. A Yes status does not independently verify successful navigation, and 14 completed records lack a usable original timing pair.

**Figure 5. Navigation and destination issue indicators.** Counts come only from structured workbook fields and written field observations. Categories overlap and therefore must not be summed as a total number of affected trials.

**Figure 6. Route-level recorded and estimated walking time.** Dumbbells compare recorded actual time with Valhalla ETA for each eligible physical-iPhone route record. Route IDs are unique in the workbook, so this figure does not estimate within-route repeatability.

**Figure 7. Verified TritonNav system architecture.** The solid path shows the operational local evaluation stack: hosted Next.js/React interface, Capacitor iOS wrapper, MapLibre/OpenFreeMap visualization, campus resolver, internal walking-route API, and local Docker Valhalla service. Dashed components show the planned production path; remote Valhalla is not currently operational.
