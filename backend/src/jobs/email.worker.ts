/**
 * Email Worker - Re-export from email.processor.ts
 * 
 * This file maintains backwards compatibility by re-exporting
 * the email worker from the new email.processor.ts file.
 */

export { emailWorker, closeEmailWorker } from './email.processor';
