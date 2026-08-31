# 🤝 Contributing to Living Web

We love your input! We want to make contributing to Living Web as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

---

## 🛠️ Development Workflow

1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the SDK**:
   ```bash
   npm run build
   ```
4. **Run the Test Suite**:
   ```bash
   npm test
   ```
5. **Run the Demo Playground**:
   ```bash
   python3 -m http.server 3000
   # Open http://localhost:3000 in your browser
   ```

---

## 📜 Pull Request Process

1. Ensure any new functionality is covered by tests in the `tests/` directory.
2. Verify that all tests pass (`npm test`) and compilation succeeds (`npm run build`).
3. Update the `README.md` or documentation with details of changes to the interface.
4. Follow the standard Conventional Commits specification (e.g. `feat: add trampoline platform type`, `fix: prevent floor jitter`).
5. Submit the pull request!

---

## ⚖️ License

By contributing to Living Web, you agree that your contributions will be licensed under its **GNU General Public License v3.0 (GPL-3.0)**.
