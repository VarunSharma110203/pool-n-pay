import re

with open("src/components/Auth.tsx", "r") as f:
    content = f.read()

# Add isConfigured
content = content.replace(
    'const [error, setError] = useState("");',
    'const [error, setError] = useState("");\n  const isConfigured = dbService.isConfigured();'
)

# Fix timeout
content = content.replace(
    'setSuccess(true);\n      setTimeout(() => {\n        onAuthSuccess();\n      }, 800);',
    'setSuccess(true);\n      if (!isConfigured) {\n        setTimeout(() => {\n          onAuthSuccess();\n        }, 800);\n      }'
)

# Fix "Welcome aboard" text
content = content.replace(
    'Welcome aboard! 🌴',
    '{isConfigured ? "Check your email! ✉️" : "Welcome aboard! 🌴"}'
)

# Fix "Loading your dashboard" text
content = content.replace(
    'Loading your dashboard…',
    '{isConfigured ? "We sent a magic sign-in link to your inbox." : "Loading your dashboard..."}'
)

# Fix Sandbox mode text
content = content.replace(
    'Sandbox mode — no password required',
    '{!isConfigured ? "Sandbox mode — no password required" : ""}'
)

with open("src/components/Auth.tsx", "w") as f:
    f.write(content)

