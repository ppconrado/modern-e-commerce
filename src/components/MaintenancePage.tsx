export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50">
      <h1 className="text-4xl font-bold text-yellow-700 mb-4">Loja em manutenção</h1>
      <p className="text-lg text-yellow-800 mb-8">Estamos realizando melhorias. Por favor, volte em breve.</p>
      <span className="text-sm text-yellow-600">Se você é administrador, acesse normalmente pelo painel.</span>
    </div>
  );
}
