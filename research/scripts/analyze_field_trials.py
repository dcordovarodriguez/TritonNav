#!/usr/bin/env python3
"""Audit TritonNav field trials and generate the Phase 1-4 approval preview."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from collections import Counter
from datetime import date, datetime, time
from pathlib import Path
from statistics import mean, median, stdev

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.lines import Line2D
from matplotlib.patches import FancyBboxPatch
from openpyxl import load_workbook
from openpyxl.utils.datetime import to_excel


OBSERVED = "#0072B2"
EXPLORATORY = "#D55E00"
NEUTRAL = "#6B7280"
SUCCESS = "#009E73"
PURPLE = "#7E57C2"


def serializable(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat(sep=" ")
    if isinstance(value, (date, time)):
        return value.isoformat()
    return value


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def normalized_text(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip()).lower()


def timestamp_minutes(start, end):
    if not isinstance(start, time) or not isinstance(end, time):
        return None
    start_minutes = start.hour * 60 + start.minute + start.second / 60
    end_minutes = end.hour * 60 + end.minute + end.second / 60
    if end_minutes < start_minutes:
        end_minutes += 24 * 60
    return end_minutes - start_minutes


def summary(values):
    clean = [float(v) for v in values if is_number(v)]
    if not clean:
        return {"n": 0, "mean": None, "median": None, "min": None, "max": None, "sd": None}
    return {
        "n": len(clean),
        "mean": mean(clean),
        "median": median(clean),
        "min": min(clean),
        "max": max(clean),
        "sd": stdev(clean) if len(clean) > 1 else None,
    }


def save_table(df, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)


def save_figure(fig, stem, figures_dir):
    figures_dir.mkdir(parents=True, exist_ok=True)
    for suffix in ("png", "pdf", "svg"):
        kwargs = {"bbox_inches": "tight"}
        if suffix == "png":
            kwargs["dpi"] = 300
        fig.savefig(figures_dir / f"{stem}.{suffix}", **kwargs)
    plt.close(fig)


def configure_plots():
    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "font.size": 9,
            "axes.titlesize": 10,
            "axes.labelsize": 9,
            "xtick.labelsize": 8,
            "ytick.labelsize": 8,
            "legend.fontsize": 8,
            "figure.titlesize": 11,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.grid": True,
            "grid.alpha": 0.22,
            "grid.linewidth": 0.6,
        }
    )


def load_trials(workbook_path):
    values_book = load_workbook(workbook_path, data_only=True, read_only=False)
    formula_book = load_workbook(workbook_path, data_only=False, read_only=False)
    ws = values_book["Field Trials"]
    formula_ws = formula_book["Field Trials"]
    headers = [ws.cell(1, col).value for col in range(1, ws.max_column + 1)]
    rows = []
    ghost_rows = []

    for row_number in range(2, ws.max_row + 1):
        values = [ws.cell(row_number, col).value for col in range(1, ws.max_column + 1)]
        if not any(value is not None for value in values):
            continue
        record = dict(zip(headers, values))
        record["source_row"] = row_number
        if record["Trial ID"] is None:
            ghost_rows.append(record)
            continue

        actual = record["Actual minutes"]
        eta = record["Valhalla ETA (min)"]
        timestamp_duration = timestamp_minutes(record["Start time"], record["End time"])
        eta_type = "numeric" if is_number(eta) else "missing"
        eta_numeric = float(eta) if is_number(eta) else None
        eta_serial_proposal = None
        if isinstance(eta, datetime):
            eta_type = "date-typed"
            eta_serial_proposal = float(to_excel(eta))

        actual_numeric = float(actual) if is_number(actual) else None
        timestamp_difference = (
            actual_numeric - timestamp_duration
            if actual_numeric is not None and timestamp_duration is not None
            else None
        )
        device = normalized_text(record["Device / iOS"])
        completed = normalized_text(record["Completed?"])
        issues = normalized_text(record["Issues / observations"])

        rows.append(
            {
                "source_row": row_number,
                "trial_id": record["Trial ID"],
                "date": serializable(record["Date"]),
                "tester_id": record["Tester ID"],
                "route_id": record["Route ID"],
                "origin_original": record["Start"],
                "destination_original": record["Destination"],
                "route_label": f'{record["Start"]} -> {record["Destination"]}',
                "network": record["Network"],
                "device_original": record["Device / iOS"],
                "device_category": "iphone" if "iphone" in device else ("mac" if "mac" in device else "other"),
                "start_time_original": serializable(record["Start time"]),
                "end_time_original": serializable(record["End time"]),
                "actual_minutes_original": actual_numeric,
                "actual_minutes_raw": serializable(actual),
                "timestamp_minutes_calculated": timestamp_duration,
                "actual_minus_timestamp_minutes": timestamp_difference,
                "timestamp_consistent": (
                    abs(timestamp_difference) <= 0.5 if timestamp_difference is not None else None
                ),
                "valhalla_eta_minutes_original": eta_numeric,
                "valhalla_eta_raw": serializable(eta),
                "valhalla_eta_value_type": eta_type,
                "valhalla_eta_serial_proposal": eta_serial_proposal,
                "valhalla_distance_original": serializable(record["Valhalla distance (m)"]),
                "actual_distance_original": serializable(record["Actual distance (m)"]),
                "completed_original": record["Completed?"],
                "completed_category": completed,
                "gps_accuracy_original": serializable(record["GPS accuracy (m)"]),
                "wrong_turns_original": record["Wrong turns"],
                "entrance_correct_original": record["Entrance correct?"],
                "route_line_visible_original": record["Route line visible?"],
                "map_loaded_original": record["Map loaded?"],
                "issues_observations_original": record["Issues / observations"],
                "screenshot_reference": record["Screenshot reference"],
                "app_version_commit": record["App version / commit"],
                "paired_original_numeric": actual_numeric is not None and eta_numeric is not None,
                "primary_measured_eligible": (
                    actual_numeric is not None
                    and eta_numeric is not None
                    and "iphone" in device
                    and completed == "yes"
                ),
                "strict_measured_eligible": (
                    actual_numeric is not None
                    and eta_numeric is not None
                    and "iphone" in device
                    and completed == "yes"
                    and timestamp_difference is not None
                    and abs(timestamp_difference) <= 0.5
                ),
                "documented_issue": bool(issues),
                "source_actual_formula": formula_ws.cell(row_number, 11).value,
            }
        )

    return pd.DataFrame(rows), ghost_rows, values_book, formula_book


def build_issue_table(trials, ghost_rows):
    issues = [
        {
            "issue_id": "DQ-01",
            "scope": "Dataset",
            "category": "Duplicate identifier",
            "affected_records": "Trial ID 25 (source rows 26 and 27)",
            "evidence": "Two distinct route records share the same Trial ID.",
            "severity": "High",
            "retest_or_resolution": "Assign a unique ID before longitudinal or participant-level analysis.",
        },
        {
            "issue_id": "DQ-02",
            "scope": "Dataset",
            "category": "Blank-ID record",
            "affected_records": f"{len(ghost_rows)} row (source row 43)",
            "evidence": "A row with no Trial ID is marked Completed=Yes and is counted by the dashboard completion formula.",
            "severity": "High",
            "retest_or_resolution": "Exclude from keyed trial counts; determine whether it is an accidental template row.",
        },
        {
            "issue_id": "DQ-03",
            "scope": "Dashboard",
            "category": "Completion overcount",
            "affected_records": "Research Dashboard",
            "evidence": "Dashboard reports 40 completed trials; keyed records contain 39 Yes and 2 No statuses.",
            "severity": "High",
            "retest_or_resolution": "Use keyed records only and disclose 39/41 record completion, or 38/40 by unique Trial ID.",
        },
        {
            "issue_id": "DQ-04",
            "scope": "Distance fields",
            "category": "Mixed or ambiguous units",
            "affected_records": "Valhalla and actual distance columns",
            "evidence": "Headers say meters, while values mix decimals, strings ending in ft, and strings such as 0.4m.",
            "severity": "High",
            "retest_or_resolution": "Do not analyze distance until source units are confirmed and normalized in separate columns.",
        },
        {
            "issue_id": "DQ-05",
            "scope": "GPS",
            "category": "Missing numeric accuracy",
            "affected_records": "All keyed trial records",
            "evidence": "No record contains numeric GPS accuracy in meters; two use the qualitative text 'not accurate'.",
            "severity": "Medium",
            "retest_or_resolution": "Capture numeric horizontal accuracy in future physical trials.",
        },
        {
            "issue_id": "DQ-06",
            "scope": "Route linkage",
            "category": "Identifier mismatch",
            "affected_records": "Field Trials versus Route Catalog",
            "evidence": "Trials use numeric route IDs 1-40; catalog uses R01-R06 and no Verified on dates.",
            "severity": "Medium",
            "retest_or_resolution": "Define a stable route key and map every field trial to the intended catalog route.",
        },
        {
            "issue_id": "DQ-07",
            "scope": "Issue Log",
            "category": "Unlogged documented issues",
            "affected_records": "Trials 14, 16, 24, and duplicate Trial ID 25",
            "evidence": "Field Trials contain narrative routing/destination problems, while Issue Log has zero rows.",
            "severity": "High",
            "retest_or_resolution": "Create issue-log entries linked to source row and retest result.",
        },
        {
            "issue_id": "NAV-01",
            "scope": "Trial 14",
            "category": "Routing failure",
            "affected_records": "CSB building -> Marshall College",
            "evidence": "Completed=No; observation says no route and a college diagram was returned.",
            "severity": "High",
            "retest_or_resolution": "Resolve both endpoints using canonical campus IDs and repeat on a physical device.",
        },
        {
            "issue_id": "NAV-02",
            "scope": "Trial 16",
            "category": "Routing and rendering failure",
            "affected_records": "RIMAC -> Seventh College Housing",
            "evidence": "Completed=No; route line and map recorded No; observation says no route returned.",
            "severity": "High",
            "retest_or_resolution": "Add a verified routable coordinate for Seventh College Housing and repeat.",
        },
        {
            "issue_id": "NAV-03",
            "scope": "Trial 24",
            "category": "Destination placement",
            "affected_records": "Peterson Hall -> Sixth Market",
            "evidence": "Observation says Sixth Market was depicted next to DIB and marked wrong.",
            "severity": "High",
            "retest_or_resolution": "Verify the destination coordinate against an official campus source and retest.",
        },
        {
            "issue_id": "NAV-04",
            "scope": "Duplicate Trial ID 25",
            "category": "Destination placement and navigation",
            "affected_records": "Center Hall -> Pepper Canyon Hall",
            "evidence": "No timing; four wrong turns; entrance incorrect; destination reportedly placed at Bonner Hall.",
            "severity": "High",
            "retest_or_resolution": "Correct identity/coordinate, assign a unique trial ID, and repeat the full walk.",
        },
        {
            "issue_id": "DQ-08",
            "scope": "Timing",
            "category": "Timestamp conflicts",
            "affected_records": "Trials 2, 5, 8, 12, 13, 20, and 23",
            "evidence": "Entered actual minutes differ from start/end-derived minutes; Trial 23 differs by 29 minutes.",
            "severity": "High",
            "retest_or_resolution": "Review source notes; retain both values and use strict sensitivity analysis.",
        },
        {
            "issue_id": "DQ-09",
            "scope": "Timing",
            "category": "Interface/routing checks without walk timing",
            "affected_records": "14 completed records",
            "evidence": "Completed=Yes but actual and Valhalla timing values are unavailable; the evaluator clarified these as interface/routing checks rather than physical walks.",
            "severity": "High",
            "retest_or_resolution": "Do not classify as timed walking successes; retain separately as interface/routing checks.",
        },
    ]
    return pd.DataFrame(issues)


def build_estimates(trials, snapshot):
    proposals = []
    date_typed = trials[trials["valhalla_eta_value_type"] == "date-typed"]
    for _, row in date_typed.iterrows():
        proposals.append(
            {
                "source_row": row.source_row,
                "trial_id": row.trial_id,
                "route": row.route_label,
                "field": "Valhalla ETA (min)",
                "original_value": row.valhalla_eta_raw,
                "proposed_estimate": row.valhalla_eta_serial_proposal,
                "provenance": "calculated",
                "estimation_method": "Convert the date-typed Excel serial in a minutes-designated column to its numeric serial value.",
                "uncertainty": "Low, but semantic intent still requires approval",
                "approval_status": "Pending",
                "analysis_use": "Exploratory normalization only",
            }
        )

    conflicts = trials[
        trials["actual_minus_timestamp_minutes"].notna()
        & (trials["actual_minus_timestamp_minutes"].abs() > 0.5)
    ]
    for _, row in conflicts.iterrows():
        uncertainty = "Very high" if abs(row.actual_minus_timestamp_minutes) >= 10 else "Medium"
        proposals.append(
            {
                "source_row": row.source_row,
                "trial_id": row.trial_id,
                "route": row.route_label,
                "field": "Actual minutes (timestamp-derived alternate)",
                "original_value": row.actual_minutes_original,
                "proposed_estimate": row.timestamp_minutes_calculated,
                "provenance": "calculated",
                "estimation_method": "End time minus start time; original entered duration remains preserved.",
                "uncertainty": uncertainty,
                "approval_status": "Review required",
                "analysis_use": "Strict sensitivity check; do not overwrite measured entry",
            }
        )

    strict = trials[trials["strict_measured_eligible"]].copy()
    strict["ratio"] = strict["actual_minutes_original"] / strict["valhalla_eta_minutes_original"]
    ratio_median = float(strict["ratio"].median())
    ratio_p10 = float(strict["ratio"].quantile(0.10))
    ratio_p90 = float(strict["ratio"].quantile(0.90))

    successful = {}
    if snapshot:
        successful = {
            int(item["sourceRow"]): item
            for item in snapshot.get("results", [])
            if item.get("status") == 200
            and item.get("provider") == "valhalla"
            and item.get("isEstimated") is False
            and is_number(item.get("durationSeconds"))
        }

    modeled_rows = []
    for _, row in trials.iterrows():
        item = successful.get(int(row.source_row))
        if not item:
            continue
        eta_minutes = float(item["durationSeconds"]) / 60.0
        distance_m = float(item["distanceMeters"]) if is_number(item.get("distanceMeters")) else None
        original_missing = (
            pd.isna(row.valhalla_eta_minutes_original)
            and row.valhalla_eta_value_type != "date-typed"
        )

        if original_missing:
            proposals.append(
                {
                    "source_row": row.source_row,
                    "trial_id": row.trial_id,
                    "route": row.route_label,
                    "field": "Valhalla ETA (min)",
                    "original_value": None,
                    "proposed_estimate": eta_minutes,
                    "provenance": "modeled",
                    "estimation_method": "Current TritonNav campus resolver and local Valhalla route snapshot; not the historical app version.",
                    "uncertainty": "Medium; current model snapshot may differ from the field-test build",
                    "approval_status": "Pending",
                    "analysis_use": "Exploratory route-model scenario only",
                }
            )

        eligible_actual_scenario = (
            row.device_category == "iphone"
            and row.completed_category == "yes"
            and pd.isna(row.actual_minutes_original)
            and not row.documented_issue
            and int(row.source_row) >= 30
        )
        if eligible_actual_scenario:
            modeled_actual = eta_minutes * ratio_median
            proposals.append(
                {
                    "source_row": row.source_row,
                    "trial_id": row.trial_id,
                    "route": row.route_label,
                    "field": "Actual minutes",
                    "original_value": None,
                    "proposed_estimate": modeled_actual,
                    "provenance": "modeled",
                    "estimation_method": f"Current Valhalla ETA multiplied by strict-sample median actual/ETA ratio ({ratio_median:.3f}).",
                    "uncertainty": f"High; empirical 10th-90th ratio interval gives {eta_minutes * ratio_p10:.1f}-{eta_minutes * ratio_p90:.1f} min",
                    "approval_status": "Pending",
                    "analysis_use": "Exploratory sensitivity only; never a measured field result",
                }
            )
            modeled_rows.append(
                {
                    "source_row": row.source_row,
                    "trial_id": row.trial_id,
                    "route_id": row.route_id,
                    "route_label": row.route_label,
                    "actual_minutes": modeled_actual,
                    "eta_minutes": eta_minutes,
                    "signed_error_minutes": modeled_actual - eta_minutes,
                    "absolute_error_minutes": abs(modeled_actual - eta_minutes),
                    "provenance": "modeled actual scenario from current Valhalla ETA",
                    "distance_meters_current": distance_m,
                }
            )

    return pd.DataFrame(proposals), pd.DataFrame(modeled_rows), {
        "strict_ratio_median": ratio_median,
        "strict_ratio_p10": ratio_p10,
        "strict_ratio_p90": ratio_p90,
    }


def apply_approval_decisions(estimates, approvals):
    """Apply explicit analysis approvals without changing source measurements."""
    if estimates.empty or not approvals:
        return estimates

    approved = estimates.copy()
    decisions = approvals.get("decisions", {})

    if decisions.get("trial2EtaNormalization", {}).get("status") == "approved":
        mask = (
            (approved["trial_id"] == 2)
            & (approved["field"] == "Valhalla ETA (min)")
            & (approved["provenance"] == "calculated")
        )
        approved.loc[mask, "approval_status"] = "Approved"
        approved.loc[mask, "analysis_use"] = "Approved exploratory normalization; excluded from measured-only results"

    if decisions.get("timestampDerivedDurations", {}).get("status") == "approved":
        mask = approved["field"].eq("Actual minutes (timestamp-derived alternate)")
        approved.loc[mask, "approval_status"] = "Approved as supplemental sensitivity"
        approved.loc[mask, "analysis_use"] = "Supplemental sensitivity only; original entered duration remains primary"

    scenario = decisions.get("scenarioFilledRecords", {})
    if scenario.get("status") == "approved":
        scenario_rows = set(scenario.get("sourceRows", []))
        mask = approved["source_row"].isin(scenario_rows) & approved["provenance"].eq("modeled")
        approved.loc[mask, "approval_status"] = "Approved for exploratory analysis"
        approved.loc[mask, "analysis_use"] = "Hypothetical route-model scenario; not a measured walk"

    return approved


def build_tables(trials, ghost_rows, workbook_values, estimates, modeled_rows, ratio_info):
    source_records = len(trials)
    unique_trials = trials["trial_id"].nunique()
    duplicates = int(trials["trial_id"].duplicated(keep=False).sum())
    completed_yes = int((trials["completed_category"] == "yes").sum())
    completed_no = int((trials["completed_category"] == "no").sum())
    numeric_pairs = int(trials["paired_original_numeric"].sum())
    iphone_pairs = int(trials["primary_measured_eligible"].sum())
    strict_pairs = int(trials["strict_measured_eligible"].sum())
    missing_both = int(
        (trials["actual_minutes_original"].isna() & trials["valhalla_eta_minutes_original"].isna()).sum()
    )
    route_catalog = workbook_values["Route Catalog"]
    route_rows = sum(
        1 for row in route_catalog.iter_rows(min_row=2, values_only=True) if any(v is not None for v in row)
    )
    issue_log = workbook_values["Issue Log"]
    issue_rows = sum(
        1 for row in issue_log.iter_rows(min_row=2, values_only=True) if any(v is not None for v in row)
    )

    overview = pd.DataFrame(
        [
            ["Source worksheets", len(workbook_values.sheetnames), "Measured workbook structure"],
            ["Keyed field-test records", source_records, "Rows with a nonblank Trial ID"],
            ["Unique Trial IDs", unique_trials, "Duplicate Trial ID 25 reduces the unique count"],
            ["Duplicate-ID records", duplicates, "Both records sharing duplicated IDs are counted"],
            ["Blank-ID populated rows", len(ghost_rows), "Excluded from keyed trial analysis"],
            ["Completed=Yes keyed records", completed_yes, "Recorded status only; not independent navigation verification"],
            ["Completed=No keyed records", completed_no, "Recorded status"],
            ["Original numeric actual/ETA pairs", numeric_pairs, "Includes one Mac-based record"],
            ["Primary physical iPhone pairs", iphone_pairs, "Completed iPhone records with numeric original actual and ETA"],
            ["Strict timestamp-consistent iPhone pairs", strict_pairs, "Primary pairs whose timestamp duration agrees within 0.5 min"],
            ["Records missing both timing fields", missing_both, "Includes completed and incomplete records"],
            ["Route Catalog entries", route_rows, "Suggested routes; none have a Verified on date"],
            ["Issue Log entries", issue_rows, "Field narrative issues are not represented here"],
            ["Numeric GPS accuracy observations", 0, "No numeric meter-valued accuracy entries"],
        ],
        columns=["Metric", "Value", "Definition / note"],
    )

    primary = trials[trials["primary_measured_eligible"]].copy()
    primary["signed_error_minutes"] = (
        primary["actual_minutes_original"] - primary["valhalla_eta_minutes_original"]
    )
    primary["absolute_error_minutes"] = primary["signed_error_minutes"].abs()
    comparison = primary[
        [
            "source_row",
            "trial_id",
            "route_id",
            "route_label",
            "device_category",
            "actual_minutes_original",
            "valhalla_eta_minutes_original",
            "signed_error_minutes",
            "absolute_error_minutes",
            "timestamp_minutes_calculated",
            "timestamp_consistent",
            "completed_original",
            "issues_observations_original",
        ]
    ].copy()
    comparison["provenance"] = "measured original actual and ETA; error calculated"

    route_performance = trials.copy()
    route_performance["signed_error_minutes"] = (
        route_performance["actual_minutes_original"] - route_performance["valhalla_eta_minutes_original"]
    )
    route_performance["absolute_error_minutes"] = route_performance["signed_error_minutes"].abs()
    route_performance = route_performance[
        [
            "source_row",
            "trial_id",
            "route_id",
            "route_label",
            "device_category",
            "completed_original",
            "actual_minutes_original",
            "valhalla_eta_minutes_original",
            "signed_error_minutes",
            "absolute_error_minutes",
            "route_line_visible_original",
            "map_loaded_original",
            "entrance_correct_original",
            "wrong_turns_original",
            "documented_issue",
            "issues_observations_original",
        ]
    ]

    strict = trials[trials["strict_measured_eligible"]].copy()
    strict["signed"] = strict["actual_minutes_original"] - strict["valhalla_eta_minutes_original"]
    strict["absolute"] = strict["signed"].abs()

    normalized = primary.copy()
    date_typed = trials[
        (trials["device_category"] == "iphone")
        & (trials["completed_category"] == "yes")
        & trials["actual_minutes_original"].notna()
        & (trials["valhalla_eta_value_type"] == "date-typed")
    ].copy()
    if not date_typed.empty:
        date_typed["valhalla_eta_minutes_original"] = date_typed["valhalla_eta_serial_proposal"]
        normalized = pd.concat([normalized, date_typed], ignore_index=True)
    normalized["signed"] = normalized["actual_minutes_original"] - normalized["valhalla_eta_minutes_original"]
    normalized["absolute"] = normalized["signed"].abs()

    timestamp_substituted = normalized.copy()
    timestamp_substituted["supplemental_actual"] = timestamp_substituted["actual_minutes_original"]
    conflict_mask = timestamp_substituted["timestamp_consistent"] == False
    timestamp_substituted.loc[conflict_mask, "supplemental_actual"] = timestamp_substituted.loc[
        conflict_mask, "timestamp_minutes_calculated"
    ]
    timestamp_substituted["signed"] = (
        timestamp_substituted["supplemental_actual"]
        - timestamp_substituted["valhalla_eta_minutes_original"]
    )
    timestamp_substituted["absolute"] = timestamp_substituted["signed"].abs()

    exploratory = pd.DataFrame(
        {
            "actual": list(normalized["actual_minutes_original"]) + list(modeled_rows.get("actual_minutes", [])),
            "eta": list(normalized["valhalla_eta_minutes_original"]) + list(modeled_rows.get("eta_minutes", [])),
        }
    )
    exploratory["signed"] = exploratory["actual"] - exploratory["eta"]
    exploratory["absolute"] = exploratory["signed"].abs()

    summary_rows = []
    for label, frame, actual_col, eta_col, signed_col, absolute_col, note in [
        (
            "Primary measured-only",
            primary,
            "actual_minutes_original",
            "valhalla_eta_minutes_original",
            "signed_error_minutes",
            "absolute_error_minutes",
            "Completed physical iPhone trials with numeric original actual and ETA values",
        ),
        (
            "Strict measured-only",
            strict,
            "actual_minutes_original",
            "valhalla_eta_minutes_original",
            "signed",
            "absolute",
            "Primary records whose timestamp-derived duration agrees within 0.5 min",
        ),
        (
            "Exploratory normalized",
            normalized,
            "actual_minutes_original",
            "valhalla_eta_minutes_original",
            "signed",
            "absolute",
            "Primary records plus the approved date-typed ETA normalization",
        ),
        (
            "Supplemental timestamp-substituted",
            timestamp_substituted,
            "supplemental_actual",
            "valhalla_eta_minutes_original",
            "signed",
            "absolute",
            "Approved sensitivity: timestamp-derived durations replace seven conflicting entered durations only for this supplemental calculation",
        ),
        (
            "Exploratory scenario-filled",
            exploratory,
            "actual",
            "eta",
            "signed",
            "absolute",
            "Normalized set plus 12 high-uncertainty hypothetical route-model scenarios for untimed interface/routing checks",
        ),
    ]:
        actual_stats = summary(frame[actual_col])
        eta_stats = summary(frame[eta_col])
        signed_stats = summary(frame[signed_col])
        absolute_stats = summary(frame[absolute_col])
        summary_rows.append(
            {
                "Analysis set": label,
                "n": actual_stats["n"],
                "Actual mean (min)": actual_stats["mean"],
                "Actual median (min)": actual_stats["median"],
                "Actual SD (min)": actual_stats["sd"],
                "ETA mean (min)": eta_stats["mean"],
                "ETA median (min)": eta_stats["median"],
                "Signed error mean (min)": signed_stats["mean"],
                "Signed error median (min)": signed_stats["median"],
                "Absolute error mean (min)": absolute_stats["mean"],
                "Absolute error median (min)": absolute_stats["median"],
                "Minimum signed error (min)": signed_stats["min"],
                "Maximum signed error (min)": signed_stats["max"],
                "Definition": note,
            }
        )
    summaries = pd.DataFrame(summary_rows)

    return overview, comparison, route_performance, summaries, primary, strict, normalized, exploratory


def create_figures(primary, normalized, exploratory, trials, issues, route_performance, figures_dir):
    configure_plots()

    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    consistent = primary[primary["timestamp_consistent"] == True]
    conflicting = primary[primary["timestamp_consistent"] == False]
    ax.scatter(
        consistent["valhalla_eta_minutes_original"],
        consistent["actual_minutes_original"],
        s=42,
        color=OBSERVED,
        label=f"Observed, timestamp-consistent (n={len(consistent)})",
        zorder=3,
    )
    ax.scatter(
        conflicting["valhalla_eta_minutes_original"],
        conflicting["actual_minutes_original"],
        s=54,
        facecolors="none",
        edgecolors=PURPLE,
        linewidths=1.4,
        label=f"Observed, timestamp conflict (n={len(conflicting)})",
        zorder=3,
    )
    proposed = normalized[~normalized["source_row"].isin(primary["source_row"])]
    if not proposed.empty:
        ax.scatter(
            proposed["valhalla_eta_minutes_original"],
            proposed["actual_minutes_original"],
            marker="D",
            s=58,
            facecolors="none",
            edgecolors=EXPLORATORY,
            label=f"Approved normalization (n={len(proposed)})",
            zorder=3,
        )
    max_value = max(primary["actual_minutes_original"].max(), primary["valhalla_eta_minutes_original"].max()) + 1
    ax.plot([0, max_value], [0, max_value], linestyle="--", color=NEUTRAL, linewidth=1, label="Equal actual and ETA")
    ax.set_xlim(0, max_value)
    ax.set_ylim(0, max_value)
    ax.set_xlabel("Valhalla-estimated walking time (min)")
    ax.set_ylabel("Recorded actual walking time (min)")
    ax.set_title("Actual versus Valhalla-estimated walking time")
    ax.legend(frameon=False, loc="upper left")
    save_figure(fig, "figure_01_actual_vs_valhalla", figures_dir)

    plot = primary.sort_values(["route_id", "trial_id"]).copy()
    plot["signed"] = plot["actual_minutes_original"] - plot["valhalla_eta_minutes_original"]
    fig, ax = plt.subplots(figsize=(7.2, 4.6))
    colors = np.where(plot["timestamp_consistent"] == True, OBSERVED, PURPLE)
    ax.scatter(range(len(plot)), plot["signed"], c=colors, s=38, zorder=3)
    ax.axhline(0, color=NEUTRAL, linestyle="--", linewidth=1)
    ax.set_xticks(range(len(plot)))
    ax.set_xticklabels([f"T{int(v)}" for v in plot["trial_id"]], rotation=60, ha="right")
    ax.set_ylabel("Actual minus Valhalla ETA (min)")
    ax.set_xlabel("Trial ID")
    ax.set_title(f"Per-trial timing error (observed physical trials, n={len(plot)})")
    ax.legend(
        handles=[
            Line2D([0], [0], marker="o", color="none", markerfacecolor=OBSERVED, markeredgecolor=OBSERVED, label="Timestamp-consistent"),
            Line2D([0], [0], marker="o", color="none", markerfacecolor=PURPLE, markeredgecolor=PURPLE, label="Timestamp conflict"),
        ],
        frameon=False,
    )
    save_figure(fig, "figure_02_per_trial_timing_error", figures_dir)

    errors = plot["signed"].to_numpy()
    fig, ax = plt.subplots(figsize=(6.8, 3.8))
    rounded = np.round(errors, 2)
    counts = Counter(rounded)
    for value in sorted(counts):
        for level in range(counts[value]):
            ax.scatter(value, level + 1, color=OBSERVED, s=42, zorder=3)
    ax.axvline(0, color=NEUTRAL, linestyle="--", linewidth=1)
    ax.set_xlabel("Actual minus Valhalla ETA (min)")
    ax.set_ylabel("Stacked observation count")
    ax.set_yticks(range(1, max(counts.values()) + 1))
    ax.set_title(f"Distribution of recorded timing differences (n={len(errors)})")
    save_figure(fig, "figure_03_timing_error_distribution", figures_dir)

    completion = pd.DataFrame(
        {
            "status": ["Completed=Yes", "Completed=No"],
            "numeric_pair": [
                int(((trials.completed_category == "yes") & trials.paired_original_numeric).sum()),
                int(((trials.completed_category == "no") & trials.paired_original_numeric).sum()),
            ],
            "malformed_pair": [
                int(((trials.completed_category == "yes") & (trials.valhalla_eta_value_type == "date-typed")).sum()),
                int(((trials.completed_category == "no") & (trials.valhalla_eta_value_type == "date-typed")).sum()),
            ],
            "missing_pair": [
                int(((trials.completed_category == "yes") & ~trials.paired_original_numeric & (trials.valhalla_eta_value_type != "date-typed")).sum()),
                int(((trials.completed_category == "no") & ~trials.paired_original_numeric & (trials.valhalla_eta_value_type != "date-typed")).sum()),
            ],
        }
    )
    fig, ax = plt.subplots(figsize=(6.8, 4.0))
    x = np.arange(len(completion))
    bottom = np.zeros(len(completion))
    for column, label, color in [
        ("numeric_pair", "Original numeric actual/ETA pair", OBSERVED),
        ("malformed_pair", "Date-typed ETA requiring review", EXPLORATORY),
        ("missing_pair", "Timing pair unavailable", "#B8BDC7"),
    ]:
        values = completion[column].to_numpy()
        bars = ax.bar(x, values, bottom=bottom, label=label, color=color, width=0.62)
        for bar, value, base in zip(bars, values, bottom):
            if value:
                ax.text(bar.get_x() + bar.get_width() / 2, base + value / 2, str(int(value)), ha="center", va="center", fontsize=8)
        bottom += values
    ax.set_xticks(x)
    ax.set_xticklabels(completion["status"])
    ax.set_ylabel("Keyed field-test records")
    ax.set_title("Recorded completion status and timing-data availability")
    ax.legend(frameon=False, loc="upper right")
    save_figure(fig, "figure_04_outcomes_and_completeness", figures_dir)

    categories = pd.DataFrame(
        [
            ["Wrong turns > 0", int((pd.to_numeric(trials.wrong_turns_original, errors="coerce") > 0).sum())],
            ["Narrative issue recorded", int(trials.documented_issue.sum())],
            ["Routing failure", 2],
            ["Incorrect destination placement", 2],
            ["Entrance recorded incorrect", int((trials.entrance_correct_original.astype(str).str.lower() == "no").sum())],
            ["Route line recorded No", int((trials.route_line_visible_original.astype(str).str.lower() == "no").sum())],
            ["Map recorded No", int((trials.map_loaded_original.astype(str).str.lower() == "no").sum())],
        ],
        columns=["category", "count"],
    ).sort_values("count")
    fig, ax = plt.subplots(figsize=(6.8, 4.2))
    ax.barh(categories["category"], categories["count"], color=EXPLORATORY)
    for y, value in enumerate(categories["count"]):
        ax.text(value + 0.12, y, str(int(value)), va="center", fontsize=8)
    ax.set_xlabel("Records (categories are non-mutually exclusive)")
    ax.set_title("Documented navigation and destination issue indicators")
    ax.set_xlim(0, max(categories["count"]) + 1.5)
    save_figure(fig, "figure_05_navigation_issues", figures_dir)

    route_plot = route_performance[
        (route_performance.device_category == "iphone")
        & route_performance.actual_minutes_original.notna()
        & route_performance.valhalla_eta_minutes_original.notna()
    ].sort_values("actual_minutes_original")
    fig, ax = plt.subplots(figsize=(7.2, 6.2))
    y = np.arange(len(route_plot))
    ax.hlines(y, route_plot["actual_minutes_original"], route_plot["valhalla_eta_minutes_original"], color="#C4C8D0", linewidth=1.3)
    ax.scatter(route_plot["actual_minutes_original"], y, color=OBSERVED, s=35, label="Recorded actual")
    ax.scatter(route_plot["valhalla_eta_minutes_original"], y, color=EXPLORATORY, marker="s", s=31, label="Valhalla ETA")
    labels = [f"R{int(r.route_id):02d}: {r.route_label}" for _, r in route_plot.iterrows()]
    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=6.7)
    ax.set_xlabel("Walking time (min)")
    ax.set_title(f"Route-level recorded actual and Valhalla time (n={len(route_plot)})")
    ax.legend(frameon=False, loc="lower right")
    save_figure(fig, "figure_06_route_level_performance", figures_dir)

    fig, ax = plt.subplots(figsize=(8.2, 4.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")

    def box(x, y, w, h, title, subtitle, color, linestyle="-"):
        patch = FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.03,rounding_size=0.08",
            linewidth=1.3,
            edgecolor=color,
            facecolor="white",
            linestyle=linestyle,
        )
        ax.add_patch(patch)
        ax.text(x + w / 2, y + h * 0.65, title, ha="center", va="center", fontsize=7.8, weight="bold")
        ax.text(x + w / 2, y + h * 0.29, subtitle, ha="center", va="center", fontsize=6.3, color="#4B5563")

    def arrow(x1, y1, x2, y2, style="-"):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color="#4B5563", lw=1.2, linestyle=style))

    box(0.15, 3.85, 1.40, 1.0, "User interface", "Next.js / React\nmobile web", OBSERVED)
    box(1.85, 4.55, 1.45, 0.9, "Capacitor iOS", "Hosted WebView\niPhone shell", OBSERVED)
    box(1.85, 3.05, 1.45, 0.9, "MapLibre GL JS", "OpenFreeMap\nroute rendering", OBSERVED)
    box(3.70, 3.85, 1.65, 1.0, "Campus data layer", "Resolver and entrances\nrooms and places", SUCCESS)
    box(5.85, 3.85, 1.55, 1.0, "Next.js API", "Internal walking route\nserver validation", PURPLE)
    box(7.90, 3.85, 1.70, 1.0, "Local Valhalla", "Docker and UCSD tiles\nlocalhost:8002", EXPLORATORY)
    box(7.90, 1.45, 1.70, 1.0, "Remote Valhalla", "Planned HTTPS service\nnot operational", NEUTRAL, linestyle="--")
    box(5.85, 1.45, 1.55, 1.0, "Vercel runtime", "Production Next.js\nrouting unconfigured", NEUTRAL, linestyle="--")

    arrow(1.55, 4.35, 1.85, 5.00)
    arrow(1.55, 4.25, 1.85, 3.50)
    arrow(1.55, 4.35, 3.70, 4.35)
    arrow(5.35, 4.35, 5.85, 4.35)
    arrow(7.40, 4.35, 7.90, 4.35)
    arrow(6.62, 3.85, 6.62, 2.45, style="--")
    arrow(7.40, 1.95, 7.90, 1.95, style="--")
    ax.text(5.0, 5.60, "Operational local evaluation path", ha="center", fontsize=9.4, weight="bold")
    ax.text(7.72, 0.91, "Planned production routing path", ha="center", fontsize=8.1, color="#4B5563")
    ax.text(5.0, 0.25, "Solid: verified local component   |   Dashed: planned or unavailable production service", ha="center", fontsize=7.1, color="#4B5563")
    save_figure(fig, "figure_07_system_architecture", figures_dir)


def dataframe_markdown(df, max_rows=None, float_digits=2):
    frame = df.copy()
    if max_rows is not None:
        frame = frame.head(max_rows)
    for column in frame.columns:
        if pd.api.types.is_float_dtype(frame[column]):
            frame[column] = frame[column].map(lambda x: "" if pd.isna(x) else f"{x:.{float_digits}f}")
    headers = [str(column).replace("|", "\\|") for column in frame.columns]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in frame.itertuples(index=False, name=None):
        cells = []
        for value in row:
            if value is None or (isinstance(value, float) and pd.isna(value)):
                text = ""
            else:
                text = str(value)
            cells.append(text.replace("|", "\\|").replace("\n", " "))
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", required=True)
    parser.add_argument("--output-root", default="research")
    args = parser.parse_args()

    root = Path(args.output_root).resolve()
    data_dir = root / "data"
    tables_dir = root / "tables"
    figures_dir = root / "figures"
    previews_dir = root / "previews"
    for directory in (data_dir, tables_dir, figures_dir, previews_dir, root / "paper"):
        directory.mkdir(parents=True, exist_ok=True)

    workbook_path = Path(args.workbook).resolve()
    source_sha = hashlib.sha256(workbook_path.read_bytes()).hexdigest()
    trials, ghost_rows, workbook_values, _ = load_trials(workbook_path)

    candidates = []
    for _, row in trials.iterrows():
        if pd.isna(row.actual_minutes_original) or pd.isna(row.valhalla_eta_minutes_original):
            candidates.append(
                {
                    "sourceRow": int(row.source_row),
                    "trialId": int(row.trial_id),
                    "routeId": None if pd.isna(row.route_id) else int(row.route_id),
                    "origin": row.origin_original,
                    "destination": row.destination_original,
                    "completed": row.completed_original,
                    "device": row.device_original,
                }
            )
    (data_dir / "missing_route_candidates.json").write_text(json.dumps(candidates, indent=2) + "\n")

    snapshot_path = data_dir / "current_valhalla_snapshot.json"
    snapshot = json.loads(snapshot_path.read_text()) if snapshot_path.exists() else None
    estimates, modeled_rows, ratio_info = build_estimates(trials, snapshot)
    approvals_path = data_dir / "approval_decisions.json"
    approvals = json.loads(approvals_path.read_text()) if approvals_path.exists() else None
    estimates = apply_approval_decisions(estimates, approvals)
    issues = build_issue_table(trials, ghost_rows)
    overview, comparison, route_performance, summaries, primary, strict, normalized, exploratory = build_tables(
        trials, ghost_rows, workbook_values, estimates, modeled_rows, ratio_info
    )

    cleaned = trials.copy()
    cleaned["signed_error_minutes"] = cleaned["actual_minutes_original"] - cleaned["valhalla_eta_minutes_original"]
    cleaned["absolute_error_minutes"] = cleaned["signed_error_minutes"].abs()
    cleaned["record_provenance"] = "source workbook; calculated columns are explicitly named"
    cleaned["evaluation_record_type"] = "other recorded check"
    cleaned.loc[cleaned["primary_measured_eligible"], "evaluation_record_type"] = "physical walking trial with measured timing"
    cleaned.loc[
        (cleaned["completed_category"] == "yes")
        & cleaned["actual_minutes_original"].isna()
        & cleaned["valhalla_eta_minutes_original"].isna(),
        "evaluation_record_type",
    ] = "interface/routing check; not a physical walking trial"
    cleaned.loc[
        (cleaned["completed_category"] == "no"),
        "evaluation_record_type",
    ] = "unsuccessful interface/routing check"

    save_table(cleaned, data_dir / "cleaned_field_trials.csv")
    save_table(overview, tables_dir / "table_01_dataset_overview.csv")
    save_table(estimates, tables_dir / "table_02_proposed_estimates.csv")
    save_table(comparison, tables_dir / "table_03_walking_time_comparison.csv")
    save_table(route_performance, tables_dir / "table_04_route_level_performance.csv")
    save_table(issues, tables_dir / "table_05_navigation_issues.csv")
    save_table(summaries, tables_dir / "table_06_measured_vs_exploratory_statistics.csv")
    if not modeled_rows.empty:
        save_table(modeled_rows, data_dir / "exploratory_modeled_trials.csv")

    preview_tables = {}
    for name, frame in [
        ("Dataset Overview", overview),
        ("Proposed Estimates", estimates),
        ("Walking Time", comparison),
        ("Route Performance", route_performance),
        ("Issues and Retests", issues),
        ("Summary Statistics", summaries),
    ]:
        clean_frame = frame.astype(object).where(pd.notna(frame), None)
        preview_tables[name] = {
            "columns": list(clean_frame.columns),
            "rows": clean_frame.values.tolist(),
        }
    (data_dir / "preview_tables.json").write_text(
        json.dumps(preview_tables, indent=2, default=serializable) + "\n"
    )

    manifest = {
        "sourceWorkbook": workbook_path.name,
        "sourceWorkbookSha256": source_sha,
        "worksheets": workbook_values.sheetnames,
        "keyedRecords": len(trials),
        "uniqueTrialIds": int(trials.trial_id.nunique()),
        "ghostRows": [
            {key: serializable(value) for key, value in row.items()} for row in ghost_rows
        ],
        "primaryMeasuredN": int(primary.shape[0]),
        "strictMeasuredN": int(strict.shape[0]),
        "exploratoryNormalizedN": int(normalized.shape[0]),
        "exploratoryScenarioN": int(exploratory.shape[0]),
        "ratioModel": ratio_info,
        "snapshotAvailable": snapshot is not None,
        "approvalDecisionsApplied": approvals is not None,
        "analysisDefinitions": {
            "primaryMeasured": "Completed iPhone records with numeric original actual and ETA values.",
            "strictMeasured": "Primary records with timestamp-derived duration agreeing within 0.5 minutes.",
            "exploratoryNormalized": "Primary set plus the approved normalization of a date-typed ETA cell.",
            "exploratoryScenario": "Normalized set plus 12 approved high-uncertainty hypothetical route-model scenarios for untimed interface/routing checks; these are not measured walks.",
        },
    }
    (data_dir / "analysis_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (data_dir / "source_workbook_sha256.txt").write_text(f"{source_sha}  {workbook_path.name}\n")

    create_figures(primary, normalized, exploratory, trials, issues, route_performance, figures_dir)

    captions = """# Draft figure captions

**Figure 1. Actual versus Valhalla-estimated walking time.** Recorded physical-iPhone observations are separated by timestamp consistency. The dashed line denotes equality between actual and estimated time. The open diamond is an approved normalization of a date-typed ETA and is not included in the measured-only sample.

**Figure 2. Per-trial timing error.** Signed error is recorded actual time minus Valhalla ETA for completed physical-iPhone trials with numeric original timing values. Positive values indicate that the recorded walk took longer than Valhalla's estimate. Purple markers identify conflicts between entered duration and start/end timestamps.

**Figure 3. Distribution of timing differences.** Each point represents one measured physical-iPhone timing pair, stacked where errors are identical. The zero line indicates agreement with Valhalla. The small single-evaluator sample supports descriptive, not inferential, interpretation.

**Figure 4. Recorded completion and timing-data availability.** Completion status is shown separately from timing completeness. A Yes status does not independently verify successful navigation, and 14 completed records lack a usable original timing pair.

**Figure 5. Navigation and destination issue indicators.** Counts come only from structured workbook fields and written field observations. Categories overlap and therefore must not be summed as a total number of affected trials.

**Figure 6. Route-level recorded and estimated walking time.** Dumbbells compare recorded actual time with Valhalla ETA for each eligible physical-iPhone route record. Route IDs are unique in the workbook, so this figure does not estimate within-route repeatability.

**Figure 7. Verified TritonNav system architecture.** The solid path shows the operational local evaluation stack: hosted Next.js/React interface, Capacitor iOS wrapper, MapLibre/OpenFreeMap visualization, campus resolver, internal walking-route API, and local Docker Valhalla service. Dashed components show the planned production path; remote Valhalla is not currently operational.
"""
    (previews_dir / "figure_captions.md").write_text(captions)

    preview = f"""# TritonNav field-test analysis: Phase 1-4 approval preview

Source workbook: `{workbook_path.name}`
SHA-256: `{source_sha}`
Worksheets reviewed: {', '.join(workbook_values.sheetnames)}

## Provenance categories

- **Measured:** entered directly in the workbook.
- **Calculated:** deterministic transformation of measured fields, including timestamp duration and timing error.
- **Modeled:** current Valhalla output or a scenario derived from it.
- **Proposed:** pending approval and excluded from measured-only claims.

The original workbook was not modified.

## Table 1. Dataset overview

{dataframe_markdown(overview)}

## Table 2. Proposed missing-value estimates and calculated alternates

{dataframe_markdown(estimates, float_digits=2)}

The modeled actual-duration scenarios use the strict measured sample's median actual/ETA ratio of **{ratio_info['strict_ratio_median']:.3f}**. Its empirical 10th-90th percentile range is **{ratio_info['strict_ratio_p10']:.3f}-{ratio_info['strict_ratio_p90']:.3f}**. These scenarios are mechanically dependent on Valhalla ETA and cannot validate ETA accuracy.

## Table 3. Walking-time comparison

{dataframe_markdown(comparison, float_digits=2)}

## Table 4. Route-level performance and outcomes

{dataframe_markdown(route_performance, float_digits=2)}

## Table 5. Navigation issues and retest requirements

{dataframe_markdown(issues)}

## Table 6. Measured-only versus exploratory summary statistics

{dataframe_markdown(summaries, float_digits=2)}

## Inclusion and exclusion effects

- The primary measured-only set contains **{len(primary)}** completed physical-iPhone records with numeric original actual and ETA values.
- The strict set contains **{len(strict)}** records after requiring agreement between entered duration and timestamp-derived duration within 0.5 minutes.
- The exploratory normalized set contains **{len(normalized)}** records after adding one pending date-typed ETA normalization.
- The scenario-filled set contains **{len(exploratory)}** records after adding high-uncertainty modeled actual durations. It is a sensitivity scenario, not an enlarged measured sample.
- Mac-based records, missing timing pairs, and failed routes are excluded from timing-accuracy claims but retained in completeness and reliability reporting.

## Approval questions

1. Approve or reject the Trial 2 ETA normalization from a date-typed Excel value to 3.0 minutes.
2. Decide whether timestamp-derived alternates should replace, supplement, or remain excluded from the manuscript's primary table.
3. Approve or reject the high-uncertainty scenario-filled analysis for a clearly labeled sensitivity appendix.
4. Confirm whether the duplicate Trial ID 25 should be renumbered in a future source-workbook revision.
5. Confirm whether completed but untimed records represent physical walks or only successful destination/route rendering checks.
"""
    (previews_dir / "phase_1_4_approval_preview.md").write_text(preview)

    audit = f"""# Data-quality and exclusions report

## Workbook integrity

The workbook contains four worksheets: Field Trials, Route Catalog, Issue Log, and Research Dashboard. The source file hash is `{source_sha}`. Analysis was performed on a separate copy in memory; no cells in the source workbook were changed.

## Key findings

- There are {len(trials)} keyed field-test records but {int(trials.trial_id.nunique())} unique Trial IDs because Trial ID 25 appears twice.
- One additional populated row has no Trial ID but is marked Completed=Yes. The dashboard counts that row in its completed total while excluding it from total trials.
- Keyed records contain {int((trials.completed_category == 'yes').sum())} Yes and {int((trials.completed_category == 'no').sum())} No completion statuses. Completion status is not treated as proof of successful navigation.
- {int(trials.paired_original_numeric.sum())} records contain numeric original actual/ETA pairs; {int(trials.primary_measured_eligible.sum())} are completed physical-iPhone records.
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
"""
    (previews_dir / "data_quality_and_exclusions.md").write_text(audit)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
