import re

with open("src/components/Auth.tsx", "r") as f:
    content = f.read()

# Add password state
content = content.replace(
    'const [email, setEmail] = useState("");\n  const [name, setName] = useState("");',
    'const [email, setEmail] = useState("");\n  const [name, setName] = useState("");\n  const [password, setPassword] = useState("");'
)

# Update form validation and submission
old_submit = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }
        const { error: signInError } = await dbService.signIn(email, name);
        if (signInError) throw signInError;
        // In real Supabase, profile update happens after they click the email link.
        if (!isConfigured) {
          await dbService.updateProfile(name, email.split("@")[0] + "@upi");
        }
      } else {
        const { error: signInError } = await dbService.signIn(email);
        if (signInError) throw signInError;
      }

      setSuccess(true);
      if (!isConfigured) {
        setTimeout(() => {
          onAuthSuccess();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };"""

new_submit = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        const { error: signUpError } = await dbService.signUp(email, password, name);
        if (signUpError) throw signUpError;
        
        if (!isConfigured) {
          await dbService.updateProfile(name, email.split("@")[0] + "@upi");
        }
      } else {
        const { error: signInError } = await dbService.signInWithPassword(email, password);
        if (signInError) throw signInError;
      }

      setSuccess(true);
      setTimeout(() => {
        onAuthSuccess();
      }, 800);
      
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace(old_submit, new_submit)

# Update UI elements
email_input = """          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Mail
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.4)",
              }}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input"
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                borderRadius: "12px",
                background: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "all 0.2s",
              }}
            />
          </div>"""

password_input = email_input + """
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="glass-input"
              style={{
                width: "100%",
                padding: "12px 16px 12px 16px",
                borderRadius: "12px",
                background: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "all 0.2s",
              }}
            />
          </div>"""

content = content.replace(email_input, password_input)

# Fix success text
content = content.replace(
    '{isConfigured ? "Check your email! ✉️" : "Welcome aboard! 🌴"}',
    '"Welcome aboard! 🌴"'
)
content = content.replace(
    '{isConfigured ? "We sent a magic sign-in link to your inbox." : "Loading your dashboard..."}',
    '"Loading your dashboard..."'
)

with open("src/components/Auth.tsx", "w") as f:
    f.write(content)

