import { spawn } from "node:child_process";

const expoBinary = process.platform === "win32" ? "expo.cmd" : "expo";
const scriptArgs = process.argv.slice(2);
const offline = scriptArgs.includes("--offline");
const forwardedArgs = scriptArgs.filter((arg) => arg !== "--offline");
const env = Object.fromEntries(
  Object.entries(process.env).filter((entry) => entry[1] !== undefined),
);

const child = spawn(expoBinary, ["start", "--clear", ...forwardedArgs], {
  env: {
    ...env,
    ...(offline ? { EXPO_OFFLINE: "1" } : {}),
    EXPO_NO_CACHE: "1",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
