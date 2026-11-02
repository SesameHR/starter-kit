// Studio: runs in the browser before the app does. Reports the app's uncaught
// errors and unhandled rejections to Cowork's preview, and nowhere else (see
// src/lib/studio-error-reporter.ts).
import { installStudioErrorReporter } from '@/lib/studio-error-reporter'

installStudioErrorReporter()
