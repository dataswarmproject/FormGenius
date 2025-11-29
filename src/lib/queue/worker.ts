#!/usr/bin/env node

import { startWorker } from './submission-queue'

console.log('Starting background worker...')

const worker = startWorker()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...')
  await worker.close()
  process.exit(0)
})

console.log('Worker started successfully')
