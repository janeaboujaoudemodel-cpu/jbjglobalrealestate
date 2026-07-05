import PasskeyManager from '@/components/account/PasskeyManager';

export default function AccountPasskeys() {
  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Security · Passkeys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the passkeys you use to sign in with Face ID, Touch ID, Windows Hello or a security key.
          </p>
        </header>
        <PasskeyManager />
      </div>
    </main>
  );
}
