import re

# Fix App.tsx
with open("src/App.tsx", "r") as f:
    app_code = f.read()
app_code = app_code.replace('import { Auth } from "./components/Auth";', 'import Auth from "./components/Auth";')
app_code = app_code.replace('session.user', 'session?.user')
with open("src/App.tsx", "w") as f:
    f.write(app_code)

# Fix firebaseClient.ts
with open("src/lib/firebaseClient.ts", "r") as f:
    fb = f.read()

getInviteCode = """export const getInviteCode = (): string => {
  const stored = localStorage.getItem("pnp_invite_code");
  if (stored) return stored;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem("pnp_invite_code", code);
  return code;
};"""

fb = fb.replace("export const isFirstVisit", getInviteCode + "\n\nexport const isFirstVisit")
fb = fb.replace("getFriendBalances: async () => {", "resetDb: async () => {},\n  getFriendBalances: async () => {")

with open("src/lib/firebaseClient.ts", "w") as f:
    f.write(fb)

# Fix Settings.tsx
with open("src/components/Settings.tsx", "r") as f:
    s = f.read()
s = s.replace("dbService.resetDb();", "")
with open("src/components/Settings.tsx", "w") as f:
    f.write(s)

