# TritonNav field-test analysis: Phase 1-4 approval preview

Source workbook: `TritonNav_Campus_Field_Test_Workbook.xlsx`
SHA-256: `723d8eb554e628599d5077ab07c8b468205e17f076671aedd52219722b4c006f`
Worksheets reviewed: Field Trials, Route Catalog, Issue Log, Research Dashboard

## Provenance categories

- **Measured:** entered directly in the workbook.
- **Calculated:** deterministic transformation of measured fields, including timestamp duration and timing error.
- **Modeled:** current Valhalla output or a scenario derived from it.
- **Proposed:** pending approval and excluded from measured-only claims.

The original workbook was not modified.

## Table 1. Dataset overview

| Metric | Value | Definition / note |
| --- | --- | --- |
| Source worksheets | 4 | Measured workbook structure |
| Keyed field-test records | 41 | Rows with a nonblank Trial ID |
| Unique Trial IDs | 40 | Duplicate Trial ID 25 reduces the unique count |
| Duplicate-ID records | 2 | Both records sharing duplicated IDs are counted |
| Blank-ID populated rows | 1 | Excluded from keyed trial analysis |
| Completed=Yes keyed records | 39 | Recorded status only; not independent navigation verification |
| Completed=No keyed records | 2 | Recorded status |
| Original numeric actual/ETA pairs | 24 | Includes one Mac-based record |
| Primary physical iPhone pairs | 23 | Completed iPhone records with numeric original actual and ETA |
| Strict timestamp-consistent iPhone pairs | 17 | Primary pairs whose timestamp duration agrees within 0.5 min |
| Records missing both timing fields | 16 | Includes completed and incomplete records |
| Route Catalog entries | 6 | Suggested routes; none have a Verified on date |
| Issue Log entries | 0 | Field narrative issues are not represented here |
| Numeric GPS accuracy observations | 0 | No numeric meter-valued accuracy entries |

## Table 2. Proposed missing-value estimates and calculated alternates

| source_row | trial_id | route | field | original_value | proposed_estimate | provenance | estimation_method | uncertainty | approval_status | analysis_use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | 2 | DIB -> Warren lecture hall | Valhalla ETA (min) | 1900-01-03 00:00:00 | 3.00 | calculated | Convert the date-typed Excel serial in a minutes-designated column to its numeric serial value. | Low, but semantic intent still requires approval | Approved | Approved exploratory normalization; excluded from measured-only results |
| 3 | 2 | DIB -> Warren lecture hall | Actual minutes (timestamp-derived alternate) | 3.0 | 4.00 | calculated | End time minus start time; original entered duration remains preserved. | Medium | Approved as supplemental sensitivity | Supplemental sensitivity only; original entered duration remains primary |
| 6 | 5 | goldberg hall -> FAH | Actual minutes (timestamp-derived alternate) | 4.0 | 1.00 | calculated | End time minus start time; original entered duration remains preserved. | Medium | Approved as supplemental sensitivity | Supplemental sensitivity only; original entered duration remains primary |
| 9 | 8 | Geisel Library -> Target | Actual minutes (timestamp-derived alternate) | 4.0 | 6.00 | calculated | End time minus start time; original entered duration remains preserved. | Medium | Approved as supplemental sensitivity | Supplemental sensitivity only; original entered duration remains primary |
| 13 | 12 | galbraith hall -> MAIN gym | Actual minutes (timestamp-derived alternate) | 9.0 | 8.00 | calculated | End time minus start time; original entered duration remains preserved. | Medium | Approved as supplemental sensitivity | Supplemental sensitivity only; original entered duration remains primary |
| 14 | 13 | MAIN gym -> CSB building | Actual minutes (timestamp-derived alternate) | 5.0 | 6.00 | calculated | End time minus start time; original entered duration remains preserved. | Medium | Approved as supplemental sensitivity | Supplemental sensitivity only; original entered duration remains primary |
| 21 | 20 | CSB building -> Student Health and Wellness Center | Actual minutes (timestamp-derived alternate) | 2.0 | 1.00 | calculated | End time minus start time; original entered duration remains preserved. | Medium | Approved as supplemental sensitivity | Supplemental sensitivity only; original entered duration remains primary |
| 24 | 23 | catalyst -> peterson hall | Actual minutes (timestamp-derived alternate) | 4.0 | 33.00 | calculated | End time minus start time; original entered duration remains preserved. | Very high | Approved as supplemental sensitivity | Supplemental sensitivity only; original entered duration remains primary |
| 27 | 25 | center hall -> pepper canyon hall | Valhalla ETA (min) |  | 9.85 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Pending | Exploratory route-model scenario only |
| 30 | 28 | MAIN gym -> FAH | Valhalla ETA (min) |  | 13.58 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 30 | 28 | MAIN gym -> FAH | Actual minutes |  | 11.89 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 10.6-13.9 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 31 | 29 | FAH -> center hall | Valhalla ETA (min) |  | 7.40 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 31 | 29 | FAH -> center hall | Actual minutes |  | 6.48 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 5.8-7.6 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 32 | 30 | center hall -> Geisel Library | Valhalla ETA (min) |  | 6.13 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 32 | 30 | center hall -> Geisel Library | Actual minutes |  | 5.37 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 4.8-6.3 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 33 | 31 | Geisel Library -> galbraith hall | Valhalla ETA (min) |  | 13.80 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 33 | 31 | Geisel Library -> galbraith hall | Actual minutes |  | 12.08 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 10.8-14.1 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 34 | 32 | galbraith hall -> fah | Valhalla ETA (min) |  | 18.75 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 34 | 32 | galbraith hall -> fah | Actual minutes |  | 16.41 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 14.6-19.1 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 35 | 33 | fah -> DIB | Valhalla ETA (min) |  | 5.87 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 35 | 33 | fah -> DIB | Actual minutes |  | 5.13 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 4.6-6.0 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 36 | 34 | DIB -> Mosaic Hall | Valhalla ETA (min) |  | 9.17 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 36 | 34 | DIB -> Mosaic Hall | Actual minutes |  | 8.02 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 7.1-9.4 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 37 | 35 | Mosaic Hall -> center hall | Valhalla ETA (min) |  | 9.15 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 37 | 35 | Mosaic Hall -> center hall | Actual minutes |  | 8.01 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 7.1-9.3 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 38 | 36 | center hall -> DIB | Valhalla ETA (min) |  | 2.52 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 38 | 36 | center hall -> DIB | Actual minutes |  | 2.20 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 2.0-2.6 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 39 | 37 | DIB -> MAIN gym | Valhalla ETA (min) |  | 10.25 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 39 | 37 | DIB -> MAIN gym | Actual minutes |  | 8.97 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 8.0-10.5 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 40 | 38 | MAIN gym -> Price Center | Valhalla ETA (min) |  | 8.02 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 40 | 38 | MAIN gym -> Price Center | Actual minutes |  | 7.01 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 6.3-8.2 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 41 | 39 | Price Center -> DIB | Valhalla ETA (min) |  | 5.45 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 41 | 39 | Price Center -> DIB | Actual minutes |  | 4.77 | modeled | Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio (0.875). | High; empirical 10th-90th ratio interval gives 4.3-5.6 min | Approved for exploratory analysis | Hypothetical route-model scenario; not a measured walk |
| 42 | 40 | DIB -> Price Center | Valhalla ETA (min) |  | 5.45 | modeled | Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version. | Medium; current model snapshot may differ from the field-test build | Pending | Exploratory route-model scenario only |

The modeled actual-duration scenarios use the strict measured sample's median actual/ETA ratio of **0.875**. Its empirical 10th-90th percentile range is **0.780-1.021**. These scenarios are mechanically dependent on Valhalla ETA and cannot validate ETA accuracy.

## Table 3. Walking-time comparison

| source_row | trial_id | route_id | route_label | device_category | actual_minutes_original | valhalla_eta_minutes_original | signed_error_minutes | absolute_error_minutes | timestamp_minutes_calculated | timestamp_consistent | completed_original | issues_observations_original | provenance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 1 | 1.00 | warr lect hall -> fah | iphone | 9.00 | 9.00 | 0.00 | 0.00 | 9.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 4 | 3 | 3.00 | warr lect hall -> DIB | iphone | 3.00 | 3.00 | -0.00 | 0.00 | 3.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 5 | 4 | 4.00 | warr lect hall -> Goldberg hall | iphone | 2.00 | 1.00 | 1.00 | 1.00 | 2.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 6 | 5 | 5.00 | goldberg hall -> FAH | iphone | 4.00 | 5.00 | -1.00 | 1.00 | 1.00 | False | Yes |  | measured original actual and ETA; error calculated |
| 7 | 6 | 6.00 | FAH -> Warren lecture hall | iphone | 5.00 | 6.00 | -1.00 | 1.00 | 5.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 8 | 7 | 7.00 | warr lect hall -> Geisel Library | iphone | 4.00 | 5.00 | -1.00 | 1.00 | 4.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 9 | 8 | 8.00 | Geisel Library -> Target | iphone | 4.00 | 5.00 | -1.00 | 1.00 | 6.00 | False | Yes |  | measured original actual and ETA; error calculated |
| 10 | 9 | 9.00 | Target -> Bird Rock Coffee | iphone | 20.00 | 19.00 | 1.00 | 1.00 | 20.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 11 | 10 | 10.00 | DIB -> applied physics and mathematics | iphone | 5.00 | 6.00 | -1.00 | 1.00 | 5.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 12 | 11 | 11.00 | applied physics and mathematics -> galbraith hall | iphone | 12.00 | 13.00 | -1.00 | 1.00 | 12.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 13 | 12 | 12.00 | galbraith hall -> MAIN gym | iphone | 9.00 | 11.00 | -2.00 | 2.00 | 8.00 | False | Yes |  | measured original actual and ETA; error calculated |
| 14 | 13 | 13.00 | MAIN gym -> CSB building | iphone | 5.00 | 6.00 | -1.00 | 1.00 | 6.00 | False | Yes |  | measured original actual and ETA; error calculated |
| 18 | 17 | 17.00 | seventh college housing -> RIMAC | iphone | 8.00 | 9.00 | -1.00 | 1.00 | 8.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 19 | 18 | 18.00 | RIMAC -> Geisel Library | iphone | 6.00 | 7.00 | -1.00 | 1.00 | 6.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 20 | 19 | 19.00 | Geisel Library -> CSB building | iphone | 8.00 | 10.00 | -2.00 | 2.00 | 8.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 21 | 20 | 20.00 | CSB building -> Student Health and Wellness Center | iphone | 2.00 | 2.00 | 0.00 | 0.00 | 1.00 | False | Yes |  | measured original actual and ETA; error calculated |
| 22 | 21 | 21.00 | Student Health and Wellness Center -> Mosaic Hall | iphone | 3.00 | 4.00 | -1.00 | 1.00 | 3.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 23 | 22 | 22.00 | Mosaic Hall -> catalyst | iphone | 1.00 | 1.00 | 0.00 | 0.00 | 1.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 24 | 23 | 23.00 | catalyst -> peterson hall | iphone | 4.00 | 4.00 | 0.00 | 0.00 | 33.00 | False | Yes |  | measured original actual and ETA; error calculated |
| 25 | 24 | 24.00 | peterson hall -> sixth market | iphone | 4.00 | 5.00 | -1.00 | 1.00 | 4.00 | True | Yes | it depicts sixth market as being next to DIB, WRONG | measured original actual and ETA; error calculated |
| 26 | 25 | 25.00 | peterson hall -> center hall | iphone | 7.00 | 8.00 | -1.00 | 1.00 | 7.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 28 | 26 | 27.00 | center hall -> MANDE | iphone | 3.00 | 7.00 | -4.00 | 4.00 | 3.00 | True | Yes |  | measured original actual and ETA; error calculated |
| 29 | 27 | 28.00 | MANDE -> MAIN gym | iphone | 3.00 | 3.00 | 0.00 | 0.00 | 3.00 | True | Yes |  | measured original actual and ETA; error calculated |

## Table 4. Route-level performance and outcomes

| source_row | trial_id | route_id | route_label | device_category | completed_original | actual_minutes_original | valhalla_eta_minutes_original | signed_error_minutes | absolute_error_minutes | route_line_visible_original | map_loaded_original | entrance_correct_original | wrong_turns_original | documented_issue | issues_observations_original |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 1 | 1.00 | warr lect hall -> fah | iphone | Yes | 9.00 | 9.00 | 0.00 | 0.00 | Yes | Yes | Yes | 0 | False |  |
| 3 | 2 | 2.00 | DIB -> Warren lecture hall | iphone | Yes | 3.00 |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 4 | 3 | 3.00 | warr lect hall -> DIB | iphone | Yes | 3.00 | 3.00 | -0.00 | 0.00 | Yes | Yes | Yes | 0 | False |  |
| 5 | 4 | 4.00 | warr lect hall -> Goldberg hall | iphone | Yes | 2.00 | 1.00 | 1.00 | 1.00 | Yes | Yes | Not tested | 0 | False |  |
| 6 | 5 | 5.00 | goldberg hall -> FAH | iphone | Yes | 4.00 | 5.00 | -1.00 | 1.00 | Yes | Yes | Not tested | 0 | False |  |
| 7 | 6 | 6.00 | FAH -> Warren lecture hall | iphone | Yes | 5.00 | 6.00 | -1.00 | 1.00 | Yes | Yes | Not tested | 0 | False |  |
| 8 | 7 | 7.00 | warr lect hall -> Geisel Library | iphone | Yes | 4.00 | 5.00 | -1.00 | 1.00 | Yes | Yes | yy | 0 | False |  |
| 9 | 8 | 8.00 | Geisel Library -> Target | iphone | Yes | 4.00 | 5.00 | -1.00 | 1.00 | Yes | Yes | Yes | 1 | False |  |
| 10 | 9 | 9.00 | Target -> Bird Rock Coffee | iphone | Yes | 20.00 | 19.00 | 1.00 | 1.00 | Yes | Yes | Yes | 1 | False |  |
| 11 | 10 | 10.00 | DIB -> applied physics and mathematics | iphone | Yes | 5.00 | 6.00 | -1.00 | 1.00 | Yes | Yes | Yes | 1 | False |  |
| 12 | 11 | 11.00 | applied physics and mathematics -> galbraith hall | iphone | Yes | 12.00 | 13.00 | -1.00 | 1.00 | Yes | Yes | Yes | 1 | False |  |
| 13 | 12 | 12.00 | galbraith hall -> MAIN gym | iphone | Yes | 9.00 | 11.00 | -2.00 | 2.00 | Yes | Yes | Yes | 0 | False |  |
| 14 | 13 | 13.00 | MAIN gym -> CSB building | iphone | Yes | 5.00 | 6.00 | -1.00 | 1.00 | Yes | Yes | Yes | 0 | False |  |
| 15 | 14 | 14.00 | CSB building -> marshall college | mac | No |  |  |  |  | N/A | Yes | N/A | 0 | True | no route, returns college diagram |
| 16 | 15 | 15.00 | CSB building -> RIMAC | mac | Yes | 8.00 | 9.00 | -1.00 | 1.00 | Yes | Yes | Yes | 0 | False |  |
| 17 | 16 | 16.00 | RIMAC -> Seventh College Housing | mac | No |  |  |  |  | No | No | N/A | 0 | True | no route, returns nothing |
| 18 | 17 | 17.00 | seventh college housing -> RIMAC | iphone | Yes | 8.00 | 9.00 | -1.00 | 1.00 | Yes | Yes | Yes | 0 | False |  |
| 19 | 18 | 18.00 | RIMAC -> Geisel Library | iphone | Yes | 6.00 | 7.00 | -1.00 | 1.00 | Yes | Yes | Yes | 0 | False |  |
| 20 | 19 | 19.00 | Geisel Library -> CSB building | iphone | Yes | 8.00 | 10.00 | -2.00 | 2.00 | Yes | Yes | Yes | 0 | False |  |
| 21 | 20 | 20.00 | CSB building -> Student Health and Wellness Center | iphone | Yes | 2.00 | 2.00 | 0.00 | 0.00 | Yes | Yes | Yes | 0 | False |  |
| 22 | 21 | 21.00 | Student Health and Wellness Center -> Mosaic Hall | iphone | Yes | 3.00 | 4.00 | -1.00 | 1.00 | Yes | Yes | Yes | 0 | False |  |
| 23 | 22 | 22.00 | Mosaic Hall -> catalyst | iphone | Yes | 1.00 | 1.00 | 0.00 | 0.00 | Yes | Yes | Yes | 1 | False |  |
| 24 | 23 | 23.00 | catalyst -> peterson hall | iphone | Yes | 4.00 | 4.00 | 0.00 | 0.00 | Yes | Yes | Yes | 1 | False |  |
| 25 | 24 | 24.00 | peterson hall -> sixth market | iphone | Yes | 4.00 | 5.00 | -1.00 | 1.00 | Yes | Yes | Yes | 1 | True | it depicts sixth market as being next to DIB, WRONG |
| 26 | 25 | 25.00 | peterson hall -> center hall | iphone | Yes | 7.00 | 8.00 | -1.00 | 1.00 | Yes | Yes | Yes | 0 | False |  |
| 27 | 25 | 26.00 | center hall -> pepper canyon hall | iphone | Yes |  |  |  |  | Yes | Yes | No | 4 | True |  it depits PCH at bonner hall |
| 28 | 26 | 27.00 | center hall -> MANDE | iphone | Yes | 3.00 | 7.00 | -4.00 | 4.00 | Yes | Yes | Yes | 0 | False |  |
| 29 | 27 | 28.00 | MANDE -> MAIN gym | iphone | Yes | 3.00 | 3.00 | 0.00 | 0.00 | Yes | Yes | Yes | 0 | False |  |
| 30 | 28 | 29.00 | MAIN gym -> FAH | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 31 | 29 | 30.00 | FAH -> center hall | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 32 | 30 | 31.00 | center hall -> Geisel Library | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 33 | 31 | 32.00 | Geisel Library -> galbraith hall | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 34 | 32 | 33.00 | galbraith hall -> fah | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 35 | 33 | 34.00 | fah -> DIB | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 36 | 34 | 35.00 | DIB -> Mosaic Hall | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 37 | 35 | 36.00 | Mosaic Hall -> center hall | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 38 | 36 | 37.00 | center hall -> DIB | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 39 | 37 | 38.00 | DIB -> MAIN gym | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 40 | 38 | 39.00 | MAIN gym -> Price Center | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 41 | 39 | 40.00 | Price Center -> DIB | iphone | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |
| 42 | 40 |  | DIB -> Price Center | mac | Yes |  |  |  |  | Yes | Yes | Yes | 0 | False |  |

## Table 5. Navigation issues and retest requirements

| issue_id | scope | category | affected_records | evidence | severity | retest_or_resolution |
| --- | --- | --- | --- | --- | --- | --- |
| DQ-01 | Dataset | Duplicate identifier | Trial ID 25 (source rows 26 and 27) | Two distinct route records share the same Trial ID. | High | Assign a unique ID before longitudinal or participant-level analysis. |
| DQ-02 | Dataset | Blank-ID record | 1 row (source row 43) | A row with no Trial ID is marked Completed=Yes and is counted by the dashboard completion formula. | High | Exclude from keyed trial counts; determine whether it is an accidental template row. |
| DQ-03 | Dashboard | Completion overcount | Research Dashboard | Dashboard reports 40 completed trials; keyed records contain 39 Yes and 2 No statuses. | High | Use keyed records only and disclose 39/41 record completion, or 38/40 by unique Trial ID. |
| DQ-04 | Distance fields | Mixed or ambiguous units | Valhalla and actual distance columns | Headers say meters, while values mix decimals, strings ending in ft, and strings such as 0.4m. | High | Do not analyze distance until source units are confirmed and normalized in separate columns. |
| DQ-05 | GPS | Missing numeric accuracy | All keyed trial records | No record contains numeric GPS accuracy in meters; two use the qualitative text 'not accurate'. | Medium | Capture numeric horizontal accuracy in future physical trials. |
| DQ-06 | Route linkage | Identifier mismatch | Field Trials versus Route Catalog | Trials use numeric route IDs 1-40; catalog uses R01-R06 and no Verified on dates. | Medium | Define a stable route key and map every field trial to the intended catalog route. |
| DQ-07 | Issue Log | Unlogged documented issues | Trials 14, 16, 24, and duplicate Trial ID 25 | Field Trials contain narrative routing/destination problems, while Issue Log has zero rows. | High | Create issue-log entries linked to source row and retest result. |
| NAV-01 | Trial 14 | Routing failure | CSB building -> Marshall College | Completed=No; observation says no route and a college diagram was returned. | High | Resolve both endpoints using canonical campus IDs and repeat on a physical device. |
| NAV-02 | Trial 16 | Routing and rendering failure | RIMAC -> Seventh College Housing | Completed=No; route line and map recorded No; observation says no route returned. | High | Add a verified routable coordinate for Seventh College Housing and repeat. |
| NAV-03 | Trial 24 | Destination placement | Peterson Hall -> Sixth Market | Observation says Sixth Market was depicted next to DIB and marked wrong. | High | Verify the destination coordinate against an official campus source and retest. |
| NAV-04 | Duplicate Trial ID 25 | Destination placement and navigation | Center Hall -> Pepper Canyon Hall | No timing; four wrong turns; entrance incorrect; destination reportedly placed at Bonner Hall. | High | Correct identity/coordinate, assign a unique trial ID, and repeat the full walk. |
| DQ-08 | Timing | Timestamp conflicts | Trials 2, 5, 8, 12, 13, 20, and 23 | Entered actual minutes differ from start/end-derived minutes; Trial 23 differs by 29 minutes. | High | Review source notes; retain both values and use strict sensitivity analysis. |
| DQ-09 | Timing | Interface/routing checks without walk timing | 14 completed records | Completed=Yes but actual and Valhalla timing values are unavailable; the evaluator clarified these as interface/routing checks rather than physical walks. | High | Do not classify as timed walking successes; retain separately as interface/routing checks. |

## Table 6. Measured-only versus exploratory summary statistics

| Analysis set | n | Actual mean (min) | Actual median (min) | Actual SD (min) | ETA mean (min) | ETA median (min) | Signed error mean (min) | Signed error median (min) | Absolute error mean (min) | Absolute error median (min) | Minimum signed error (min) | Maximum signed error (min) | Definition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Primary measured-only | 23 | 5.70 | 4.00 | 4.12 | 6.48 | 6.00 | -0.78 | -1.00 | 0.96 | 1.00 | -4.00 | 1.00 | Completed physical iPhone trials with numeric original actual and ETA values |
| Strict measured-only | 17 | 6.06 | 5.00 | 4.59 | 6.82 | 6.00 | -0.76 | -1.00 | 1.00 | 1.00 | -4.00 | 1.00 | Primary records whose timestamp-derived duration agrees within 0.5 min |
| Exploratory normalized | 24 | 5.58 | 4.00 | 4.06 | 6.33 | 5.50 | -0.75 | -1.00 | 0.92 | 1.00 | -4.00 | 1.00 | Primary records plus the approved date-typed ETA normalization |
| Supplemental timestamp-substituted | 24 | 6.75 | 5.00 | 6.95 | 6.33 | 5.50 | 0.42 | -1.00 | 2.33 | 1.00 | -4.00 | 29.00 | Approved sensitivity: timestamp-derived durations replace seven conflicting entered durations only for this supplemental calculation |
| Exploratory scenario-filled | 36 | 6.40 | 5.07 | 4.12 | 7.28 | 6.07 | -0.88 | -1.00 | 0.99 | 1.00 | -4.00 | 1.00 | Normalized set plus 12 high-uncertainty hypothetical route-model scenarios for untimed interface/routing checks |

## Inclusion and exclusion effects

- The primary measured-only set contains **23** completed physical-iPhone records with numeric original actual and ETA values.
- The strict set contains **17** records after requiring agreement between entered duration and timestamp-derived duration within 0.5 minutes.
- The exploratory normalized set contains **24** records after adding one pending date-typed ETA normalization.
- The scenario-filled set contains **36** records after adding high-uncertainty modeled actual durations. It is a sensitivity scenario, not an enlarged measured sample.
- Mac-based records, missing timing pairs, and failed routes are excluded from timing-accuracy claims but retained in completeness and reliability reporting.

## Approval questions

1. Approve or reject the Trial 2 ETA normalization from a date-typed Excel value to 3.0 minutes.
2. Decide whether timestamp-derived alternates should replace, supplement, or remain excluded from the manuscript's primary table.
3. Approve or reject the high-uncertainty scenario-filled analysis for a clearly labeled sensitivity appendix.
4. Confirm whether the duplicate Trial ID 25 should be renumbered in a future source-workbook revision.
5. Confirm whether completed but untimed records represent physical walks or only successful destination/route rendering checks.
