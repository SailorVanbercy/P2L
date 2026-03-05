import { prisma } from '@/lib/prisma'

export default async function AdminQuestionsPage() {
  const niveaux = await prisma.niveau.findMany({
    include: {
      questions: { orderBy: { id: 'asc' } },
    },
    orderBy: { numero: 'asc' },
  })

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold text-white">Questions par niveau</h1>

      <div className="space-y-8">
        {niveaux.map((n) => (
          <div key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              <span className="mr-2 text-indigo-400">Niveau {n.numero}</span>
              <span className="text-slate-400 text-sm">{n.titre}</span>
              <span className="ml-3 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                {n.questions.length} questions
              </span>
            </h2>

            <div className="space-y-3">
              {n.questions.map((q, i) => (
                <div key={q.id} className="rounded-lg border border-white/5 bg-white/5 p-4">
                  <p className="mb-2 text-sm font-medium text-white">
                    <span className="mr-2 text-slate-500">{i + 1}.</span>
                    {q.texte}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {q.choix.map((c, ci) => (
                      <span
                        key={ci}
                        className={`rounded px-2 py-1 text-xs ${ci === q.bonneReponse ? 'bg-green-500/20 text-green-400' : 'text-slate-400'}`}
                      >
                        {String.fromCharCode(65 + ci)}. {c}
                      </span>
                    ))}
                  </div>
                  {q.explication && (
                    <p className="mt-2 text-xs text-slate-500 italic">{q.explication}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
