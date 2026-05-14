import Link from "next/link";

export default function ClassCard({ classItem }) {
  const href = `/navigation?building=${classItem.buildingId}&room=${encodeURIComponent(classItem.room)}`;

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
        <Link className="primary-link" href={href}>
          Go now
        </Link>
      </div>
    </article>
  );
}
