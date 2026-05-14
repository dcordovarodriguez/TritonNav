import Link from "next/link";

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="brand-block">
        <Link className="brand-mark" href="/">
          TritonNav
        </Link>
        <p className="brand-subtitle">UCSD indoor-ready class navigation starter</p>
      </div>

      <nav className="site-nav">
        <Link href="/">Schedule</Link>
        <Link href="/search">Search</Link>
        <Link href="/navigation?building=cse&room=1202">Demo Route</Link>
      </nav>
    </header>
  );
}
