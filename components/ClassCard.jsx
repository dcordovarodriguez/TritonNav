"use client";

import Link from "next/link";
import { buildNavigationHref } from "@/lib/navigation";
import { useNavigationStore } from "@/store/useNavigationStore";

export default function ClassCard({ classItem }) {
  const selectDestination = useNavigationStore((state) => state.selectDestination);
  const href = buildNavigationHref(classItem.buildingId, classItem.room);

  return (
    <article className="class-card">
      <div className="class-card-top">
        <p className="building-short">{classItem.building}</p>
        <span className="class-time">{classItem.time}</span>
      </div>

      <h3>{classItem.course}</h3>
      <p className="muted-copy">
        Room {classItem.room} in {classItem.buildingName}
      </p>

      <div className="card-actions">
        <Link
          className="primary-link"
          href={href}
          onClick={() =>
            selectDestination({
              building: classItem.buildingId,
              room: classItem.room,
              label: `${classItem.course} • ${classItem.buildingName}`,
              source: "schedule"
            })
          }
        >
          Go now
        </Link>
      </div>
    </article>
  );
}
