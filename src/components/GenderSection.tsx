import { useLocation } from 'wouter';

export function GenderSection() {
  const [, setLocation] = useLocation();

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-sky-600 mb-3">
          Compre por Gênero
        </h2>
        <p className="text-gray-600 text-base">
          Encontre o look perfeito para meninas e meninos
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Meninas */}
        <button
          onClick={() => setLocation('/shop')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-200 via-pink-100 to-rose-100 p-12 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-md">
              <span className="text-5xl">👗</span>
            </div>
            <h3 className="text-3xl font-bold text-pink-700">
              Meninas
            </h3>
            <p className="text-gray-700 text-base">
              Vestidos, saias, blusas e muito mais!
            </p>
          </div>
        </button>

        {/* Meninos */}
        <button
          onClick={() => setLocation('/shop')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-200 via-sky-100 to-cyan-100 p-12 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/80 shadow-md">
              <span className="text-5xl">👔</span>
            </div>
            <h3 className="text-3xl font-bold text-blue-700">
              Meninos
            </h3>
            <p className="text-gray-700 text-base">
              Camisetas, calças, shorts e muito mais!
            </p>
          </div>
        </button>
      </div>
    </section>
  );
}

