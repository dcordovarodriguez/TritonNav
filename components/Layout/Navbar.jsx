import Link from "next/link";

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="brand-block">
        <p className="brand-badge">UC San Diego Design Showcase</p>
        <Link className="brand-mark" href="/">
          TritonNav
        </Link>
        <p className="brand-subtitle">UCSD-focused campus wayfinding for classes, rooms, and routes</p>
      </div>

      <nav className="site-nav">
        <Link href="/">Schedule</Link>
        <Link href="/search">Search</Link>
        <Link href="/navigation?building=cse&room=1202">Demo Route</Link>
      </nav>
    </header>
  );
}
