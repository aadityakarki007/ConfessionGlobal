//app\sign-in\[[...sign-in]]\page.jsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <SignIn />
    </div>
  );
}