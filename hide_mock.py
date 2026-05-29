with open("src/components/Auth.tsx", "r") as f:
    content = f.read()

content = content.replace("Sandbox mode — no password required", "")
content = content.replace("Loading your dashboard…", "Authenticating...")

with open("src/components/Auth.tsx", "w") as f:
    f.write(content)
