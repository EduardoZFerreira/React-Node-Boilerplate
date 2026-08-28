import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ForcedPasswordChangePage } from "./pages/auth/ForcedPasswordChangePage";
import { AppRoutes } from "./routes/AppRoutes";
import { useAuthStore } from "./store/authStore";

function App() {
  const { t } = useTranslation("common");
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-500">{t("loading")}</p>
      </div>
    );
  }

  if (status === "authenticated" && user?.mustResetPassword) {
    return <ForcedPasswordChangePage />;
  }

  return <AppRoutes />;
}

export default App;
