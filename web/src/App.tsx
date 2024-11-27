import { authClient } from "./auth";
import { Login } from "./Login";
import { Stars } from "./Stars";

export function App() {
  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <Stars />
      <Login />
    </div>
  );
}
