import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ObjectiveBoard } from './components/ObjectiveBoard/ObjectiveBoard'
import { AgentSwitcher } from './components/AgentManager/AgentSwitcher'

import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="min-h-screen bg-black text-white">
        <header className="glass border-b border-white/10 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-display text-neon-purple">Anti-Gravity</h1>
          <AgentSwitcher 
            agents={[]}
            activeAgent="hermes"
            onAgentChange={() => {}}
            onConfigure={() => {}}
          />
        </header>
        <ObjectiveBoard />
      </div>
    )
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)