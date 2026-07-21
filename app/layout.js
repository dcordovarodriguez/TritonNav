import "@/styles/globals.css";
import Navbar from "@/components/Layout/Navbar";
import Container from "@/components/Layout/Container";

const CANONICAL_URL = "https://tritonnav.diegocordova.net";

export const metadata = {
  title: "TritonNav",
  description: "A UCSD-focused campus navigation app for schedule-aware routing and live map handoff.",
  metadataBase: new URL(CANONICAL_URL),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "TritonNav",
    description: "UCSD-focused campus navigation for buildings, rooms, colleges, and landmarks.",
    url: CANONICAL_URL,
    siteName: "TritonNav",
    type: "website"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <Navbar />
          <Container>{children}</Container>
        </div>
      </body>
    </html>
  );
}
