import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import questionsData from '../questions.json'

const prisma = new PrismaClient()

const NIVEAUX = [
  { numero: 1, titre: "Fondamentaux du plan d'affaires", vitesse: 500 },
  { numero: 2, titre: 'Partie rédactionnelle', vitesse: 500 },
  { numero: 3, titre: 'Introduction au plan financier', vitesse: 500 },
  { numero: 4, titre: 'Tableau de financement', vitesse: 500 },
  { numero: 5, titre: 'Compte de résultat', vitesse: 500 },
  { numero: 6, titre: 'Tableau de trésorerie', vitesse: 500 },
  { numero: 7, titre: 'Aides et primes', vitesse: 500 },
  { numero: 8, titre: 'Aides et prêts', vitesse: 500 },
]

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@tetris.local' },
    update: {},
    create: {
      email: 'admin@tetris.local',
      password: await bcrypt.hash('admin1234', 12),
      nom: 'Administrateur',
      role: 'ADMIN',
    },
  })

  for (const n of NIVEAUX) {
    const niveau = await prisma.niveau.upsert({
      where: { numero: n.numero },
      update: {},
      create: n,
    })

    const questions = questionsData.filter((q) => q.categorie === n.titre)
    for (const q of questions) {
      await prisma.question.create({
        data: {
          texte: q.texte,
          source: q.source ?? null,
          choix: q.choix,
          bonneReponse: q.bonneReponse,
          explication: q.explication,
          niveauId: niveau.id,
        },
      })
    }
  }

  console.log('Seed terminé — 8 niveaux, 96 questions')
}

main().catch(console.error).finally(() => prisma.$disconnect())
