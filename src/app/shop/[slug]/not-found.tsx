export default function ShopNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Estabelecimento não encontrado</h1>
      <p className="text-muted-foreground mt-2">
        Este estabelecimento não existe ou não está disponível no momento.
      </p>
    </main>
  );
}
