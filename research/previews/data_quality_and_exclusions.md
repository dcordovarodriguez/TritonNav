# Data-quality and exclusions report

## Workbook integrity

The workbook contains four worksheets: Field Trials, Route Catalog, Issue Log, and Research Dashboard. The source file hash is `723d8eb554e628599d5077ab07c8b468205e17f076671aedd52219722b4c006f`. Analysis was performed on a separate copy in memory; no cells in the source workbook were changed.

## Key findings

- There are 41 keyed field-test records but 40 unique Trial IDs because Trial ID 25 appears twice.
- One additional populated row has no Trial ID but is marked Completed=Yes. The dashboard counts that row in its completed total while excluding it from total trials.
- Keyed records contain 39 Yes and 2 No completion statuses. Completion status is not treated as proof of successful navigation.
- 24 records contain numeric original actual/ETA pairs; 23 are completed physical-iPhone records.
- Seven entered actual durations conflict with timestamp-derived duration by more than 0.5 minutes. Trial 23 differs by 29 minutes and requires source review.
- No keyed trial contains numeric GPS accuracy in meters.
- Distance entries mix decimals, feet strings, and ambiguous values despite meter-labeled headers. Distance analysis is therefore blocked pending unit clarification.
- The Route Catalog contains six suggested routes, but Field Trials use a different identifier system and none of the catalog routes has a verification date.
- The Issue Log is empty even though four Field Trial observations describe routing or destination problems.
- Browser versus native-WebView execution is not explicitly encoded. Device values distinguish iPhone from Mac only.

## Timing-analysis exclusions

The primary timing analysis excludes Mac records, incomplete trials, nonnumeric timing cells, and records without a numeric actual/ETA pair. The strict sensitivity set additionally excludes timestamp conflicts. Failed and untimed trials remain in the outcome and issue summaries.

## Interpretation constraint

All records identify the tester as Diego. Repeated routes therefore represent repeated observations by one evaluator, not independent participants. No significance tests or population-level claims are warranted.
