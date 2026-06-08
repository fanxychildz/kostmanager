import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './app.css'

const root = createRoot(document.getElementById('root')!)
root.render(<RouterProvider router={getRouter()} />)
