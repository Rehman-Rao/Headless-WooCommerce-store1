import "./globals.css";
import AppToaster from "@/components/AppToaster";
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="font-poppins antialiased">
        {children}
        <AppToaster />
      </body>
    </html>
  );
};
export default RootLayout;
