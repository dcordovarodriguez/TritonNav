# Campus refresh review

This document records the scope, sources, and review notes for the campus expansion.

## Changes

- Add eight operational GIS building locations: Brian C. Malk Hall, Coalition, Alianza, Umoja, Sankofa, Podemos, Rya and Vela.
- Add the 19 in-use Registrar classroom and lecture hall rows under Malk Hall and Coalition. Capacity zero in the source is treated as unknown.
- Associate the new buildings with Marshall and Eighth College where appropriate. Search and destination details use the existing design.
- Show building-centroid locations on the map; walking directions for these buildings remain unavailable until an entrance is verified. No indoor coordinates or accessibility claims have been invented.

## Sources

- UC San Diego Buildings Campus Map service, building points and operational status: https://admin-enterprise-gis.ucsd.edu/server/rest/services/Buildings/Buildings_Campus_Map/MapServer
- UC San Diego Facilities classroom attributes: https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes
- Snapshots were retrieved November 7, 2026, Pacific Time; the timestamp is included with each record.

## Review notes

The GIS service currently labels the Triton Center buildings as construction, while newer UCSD announcements describe phased openings; those records require reconciliation before import. The GIS points are building locations, not entrance anchors. The existing campus-data validation reports five pre-existing alias collisions and a pair of near-identical centroids.

The manually dispatched campus-data audit completed successfully and created issue #10: https://github.com/dcordovarodriguez/TritonNav/issues/10
