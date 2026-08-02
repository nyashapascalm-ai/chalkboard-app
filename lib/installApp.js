export function installChalkboardApp() {
  if (typeof window === "undefined") return;

  const prompt = window.__cbPrompt;

  if (prompt) {
    prompt.prompt();

    if (prompt.userChoice) {
      prompt.userChoice.finally(() => {
        window.__cbPrompt = null;
      });
    }

    return;
  }

  window.alert(
    "To install Chalkboard: use the install icon in Chrome or Edge. On iPhone, choose Share then Add to Home Screen. On Android, open the browser menu and choose Install app.",
  );
}
