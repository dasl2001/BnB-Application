import "./globals.css";
import Navbar from "./components/Navbar";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>       
        <Navbar />
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}

