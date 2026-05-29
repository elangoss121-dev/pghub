'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { fasterRun, appData } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createFasterRun(name: string, duration: number) {
  const userId = await getUserId()
  
  const result = await db
    .insert(fasterRun)
    .values({
      userId,
      name,
      duration,
      status: 'completed',
    })
    .returning()

  revalidatePath('/')
  return result[0]
}

export async function getFasterRuns() {
  const userId = await getUserId()
  
  return db
    .select()
    .from(fasterRun)
    .where(eq(fasterRun.userId, userId))
    .orderBy(fasterRun.createdAt)
}

export async function deleteFasterRun(id: number) {
  const userId = await getUserId()
  
  await db
    .delete(fasterRun)
    .where(and(eq(fasterRun.id, id), eq(fasterRun.userId, userId)))

  revalidatePath('/')
}

export async function resetAllData() {
  const userId = await getUserId()
  
  // Delete all faster runs
  await db.delete(fasterRun).where(eq(fasterRun.userId, userId))
  
  // Delete all app data
  await db.delete(appData).where(eq(appData.userId, userId))

  revalidatePath('/')
  return { success: true }
}

export async function getAppData(key: string) {
  const userId = await getUserId()
  
  const result = await db
    .select()
    .from(appData)
    .where(and(eq(appData.userId, userId), eq(appData.key, key)))

  return result[0]?.value || null
}

export async function setAppData(key: string, value: string) {
  const userId = await getUserId()
  
  // Delete existing and insert new to handle upsert
  await db
    .delete(appData)
    .where(and(eq(appData.userId, userId), eq(appData.key, key)))
  
  await db
    .insert(appData)
    .values({
      userId,
      key,
      value,
    })

  revalidatePath('/')
}
