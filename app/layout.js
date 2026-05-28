import "@/styles/globals.css";
import Navbar from "@/components/Layout/Navbar";
import Container from "@/components/Layout/Container";

export const metadata = {
  title: "TritonNav",
  description: "A UCSD-focused campus navigation app for schedule-aware routing and live map handoff."
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
