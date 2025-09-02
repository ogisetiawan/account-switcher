import * as React from "react"

interface HeaderProps {
  currentSite: string
}

export const Header: React.FC<HeaderProps> = ({ currentSite }) => {
  return (
    <header className="bg-slate-800 text-white p-4 text-center">
      <h1 className="text-lg font-semibold mb-2">
        Account Switcher
      </h1>
      <div className="text-sm opacity-90 font-normal">
        {currentSite}
      </div>
    </header>
  )
}
