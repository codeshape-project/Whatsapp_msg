
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ORGANIZATIONS } from "../data/dummyData";
import { supabase, backendEnabled } from "../lib/supabase";

const AuthContext = createContext(null);
const readUser = () => {
  try { return JSON.parse(localStorage.getItem("cs_user")); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [settingsVersion, setSettingsVersion] = useState(0);
  useEffect(() => { const refresh = () => setSettingsVersion(v => v + 1); window.addEventListener("organization-settings-updated", refresh); return () => window.removeEventListener("organization-settings-updated", refresh); }, []);
  const login = async (email, password, remember = true, organizationId = ORGANIZATIONS[0].id) => {
    const organization = ORGANIZATIONS.find((item) => item.id === organizationId) || ORGANIZATIONS[0];
    if (backendEnabled) {
      if (!supabase) throw new Error("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message || "Unable to sign in.");
      const u = { email: data.user.email, name: data.user.user_metadata?.name || "Organization Admin", role: "Organization Administrator", organizationId: organization.id, organizationIds: [organization.id], supabaseUserId: data.user.id };
      setUser(u); if (remember) localStorage.setItem("cs_user", JSON.stringify(u)); return u;
    }
    const u = { email: email || `admin@${organization.id}.com`, name: `${organization.name} Admin`, role: "Organization Administrator", organizationId: organization.id, organizationIds: [organization.id] };
    setUser(u); if (remember) localStorage.setItem("cs_user", JSON.stringify(u)); return u;
  };
  const switchOrganization = (organizationId) => {
    if (!user || !user.organizationIds?.includes(organizationId)) return;
    const next = { ...user, organizationId };
    setUser(next);
    localStorage.setItem("cs_user", JSON.stringify(next));
    // Reload the current page so all demo pages re-read organization-scoped state.
    window.dispatchEvent(new CustomEvent("organization-changed", { detail: organizationId }));
  };
  const logout = () => { setUser(null); localStorage.removeItem("cs_user"); };
  const baseOrganization = ORGANIZATIONS.find((item) => item.id === user?.organizationId) || ORGANIZATIONS[0];
  const organization = useMemo(() => { try { const saved = JSON.parse(localStorage.getItem(`wa_settings_${baseOrganization.id}`) || "{}"); return { ...baseOrganization, ...saved, id: baseOrganization.id, type: baseOrganization.type, initials: baseOrganization.initials }; } catch { return baseOrganization; } }, [baseOrganization.id, settingsVersion]);
  return <AuthContext.Provider value={{ user, organization, organizations: ORGANIZATIONS.filter((item) => user?.organizationIds?.includes(item.id)), isAuthenticated: !!user, login, logout, switchOrganization }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
