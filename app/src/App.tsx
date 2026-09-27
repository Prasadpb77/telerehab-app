import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./routes/router";
import InstallPrompt from "./components/InstallPrompt";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      {/* Mounted once at the root so it covers patient, doctor AND public
          pages - no duplication inside individual layouts/pages. */}
      <InstallPrompt />
    </AuthProvider>
  );
}
