// FILE: src/app/components/HiringSignalsCard.tsx
'use client'
import React from 'react'
import { useHiringSignals } from '@/app/hooks/useHiringSignals'

interface HiringSignal {
  id: string
  signal_type: string
  title: string
  description: string
  confidence_score: number
  source_url?: string
  detected_at: string
  metadata?: Record<string, any>
  companies: {
    name: string
    industry: string | null
  }
}

const getSignalIcon = (signalType: string) => {
  const icons = {
    funding: '💰',
    team_expansion: '👥',
    product_launch: '🚀',
    office_opening: '🏢',
    leadership_change: '👔',
    job_posting: '💼'
  }
  return icons[signalType as keyof typeof icons] || '📊'
}

const getSignalColor = (signalType: string) => {
  const colors = {
    funding: 'bg-green-100 text-green-800 border-green-200',
    team_expansion: 'bg-blue-100 text-blue-800 border-blue-200',
    product_launch: 'bg-purple-100 text-purple-800 border-purple-200',
    office_opening: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    leadership_change: 'bg-red-100 text-red-800 border-red-200',
    job_posting: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
  return colors[signalType as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

const HiringSignalsCard: React.FC = () => {
  const { signals, loading, error } = useHiringSignals()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hiring Signals</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hiring Signals</h2>
        <p className="text-red-600">Error loading signals: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Hiring Signals</h2>
        <span className="text-sm text-gray-500">{signals.length} recent signals</span>
      </div>

      {signals.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500 mb-2">No hiring signals yet</p>
          <p className="text-sm text-gray-400">Start tracking companies to see hiring signals here</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {signals.map((signal) => (
            <div key={signal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getSignalIcon(signal.signal_type)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSignalColor(signal.signal_type)}`}>
                    {signal.signal_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(signal.detected_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400">Confidence:</span>
                  <span className="text-xs font-medium text-gray-600">{signal.confidence_score}/10</span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">{signal.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{signal.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-600">{signal.companies.name}</span>
                {signal.source_url && (
                  <a 
                    href={signal.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View Source →
                  </a>
                )}
              </div>

              {signal.metadata && Object.keys(signal.metadata).length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {Object.entries(signal.metadata).map(([key, value]) => (
                    <span key={key} className="mr-3">
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HiringSignalsCard