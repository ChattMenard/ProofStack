import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '../../../lib/requireAuth'
import { getUserCostStats, getCostByProvider, formatCost } from '../../../lib/costTracking'
import { withRateLimit } from '../../../lib/rateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { days = 30 } = req.query

  try {
    const [stats, breakdown] = await Promise.all([
      getUserCostStats(user.id),
      getCostByProvider(user.id, parseInt(days as string, 10))
    ])

    return res.status(200).json({
      summary: stats ? {
        totalCost: formatCost(Number(stats.total_cost_usd)),
        totalCostUsd: Number(stats.total_cost_usd),
        requestCount: Number(stats.request_count),
        last30DaysCost: formatCost(Number(stats.last_30_days_cost)),
        last30DaysCostUsd: Number(stats.last_30_days_cost),
        last7DaysCost: formatCost(Number(stats.last_7_days_cost)),
        last7DaysCostUsd: Number(stats.last_7_days_cost),
        todayCost: formatCost(Number(stats.today_cost)),
        todayCostUsd: Number(stats.today_cost)
      } : null,
      breakdown: breakdown.map((item: any) => ({
        provider: item.provider,
        model: item.model_name,
        requestCount: Number(item.request_count),
        totalCost: formatCost(Number(item.total_cost_usd)),
        totalCostUsd: Number(item.total_cost_usd),
        avgCost: formatCost(Number(item.avg_cost_usd)),
        avgCostUsd: Number(item.avg_cost_usd)
      }))
    })
  } catch (err: any) {
    console.error('Cost stats error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch cost stats' })
  }
}

// Export with rate limiting
export default withRateLimit(handler)
