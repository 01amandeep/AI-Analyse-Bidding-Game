"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  TrendingUp,
  Target,
  Brain,
  AlertCircle,
  DollarSign,
  LineChart,
  PieChart,
  Lightbulb,
} from "lucide-react"

export function BiddingAnalysis({ playerPatterns, gameHistory, aiAdaptations, gameNumber, allGamesHistory }) {
  // Calculate average bid to value ratio
  const avgBidToValueRatio =
    playerPatterns.valueRatios.length > 0
      ? playerPatterns.valueRatios.reduce((sum, ratio) => sum + ratio, 0) / playerPatterns.valueRatios.length
      : 0

  // Calculate category preferences
  const categoryPreferences = Object.entries(playerPatterns.categoryPreferences)
    .map(([category, value]) => ({
      category,
      value: playerPatterns.valueRatios.length > 0 ? value / playerPatterns.valueRatios.length : 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Calculate rarity preferences
  const rarityPreferences = Object.entries(playerPatterns.rarityPreferences)
    .map(([rarity, value]) => ({
      rarity,
      value: playerPatterns.valueRatios.length > 0 ? value / playerPatterns.valueRatios.length : 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Calculate round behavior
  const roundBehavior =
    playerPatterns.roundBehavior?.map((round, index) => ({
      round: index + 1,
      avgRatio: round?.length > 0 ? round.reduce((sum, ratio) => sum + ratio, 0) / round.length : 0,
    })) || []

  // Calculate win rate
  const winCount = gameHistory.filter((round) => round.winner === "player").length
  const winRate = gameHistory.length > 0 ? (winCount / gameHistory.length) * 100 : 0

  // Calculate AI adaptation insights
  const aiInsights = Object.entries(aiAdaptations).map(([aiId, adaptation]) => ({
    aiId: Number.parseInt(aiId),
    valuePerception: adaptation.valuePerception,
    aggressionLevel: adaptation.aggressionLevel,
    categoryBias: adaptation.categoryBias,
    rarityBias: adaptation.rarityBias,
  }))

  // Generate bidding style description
  const getBiddingStyleDescription = () => {
    if (playerPatterns.valueRatios.length === 0) return "Not enough data to analyze your bidding style."

    let style = ""

    // Analyze aggression level
    if (avgBidToValueRatio > 1.2) {
      style += "You're an aggressive bidder who often bids above item value. "
    } else if (avgBidToValueRatio > 0.8) {
      style += "You're a balanced bidder who bids close to item value. "
    } else {
      style += "You're a conservative bidder who bids below item value. "
    }

    // Analyze category preferences
    if (categoryPreferences.length > 0 && categoryPreferences[0].value > avgBidToValueRatio * 1.2) {
      style += `You show a strong preference for ${categoryPreferences[0].category} items. `
    }

    // Analyze rarity preferences
    if (rarityPreferences.length > 0) {
      if (rarityPreferences[0].rarity === "rare" && rarityPreferences[0].value > avgBidToValueRatio * 1.2) {
        style += "You value rare items highly. "
      } else if (rarityPreferences[0].rarity === "common" && rarityPreferences[0].value > avgBidToValueRatio * 1.2) {
        style += "You tend to focus on common items rather than rare ones. "
      }
    }

    // Analyze round behavior
    if (roundBehavior.length > 1) {
      const firstRound = roundBehavior[0]?.avgRatio || 0
      const lastRound = roundBehavior[roundBehavior.length - 1]?.avgRatio || 0

      if (lastRound > firstRound * 1.3) {
        style += "You become more aggressive in later rounds. "
      } else if (firstRound > lastRound * 1.3) {
        style += "You become more conservative in later rounds. "
      } else {
        style += "Your bidding style remains consistent throughout the game. "
      }
    }

    // Analyze win rate
    if (winRate > 70) {
      style += "You have an excellent win rate!"
    } else if (winRate > 50) {
      style += "You have a good win rate."
    } else if (winRate > 30) {
      style += "Your win rate could use some improvement."
    } else {
      style += "You might want to reconsider your bidding strategy to improve your win rate."
    }

    return style
  }

  // Generate AI adaptation insights
  const getAIAdaptationInsights = () => {
    if (gameNumber <= 1 || aiInsights.length === 0) {
      return "The AI agents haven't adapted to your style yet. Play more games to see how they learn!"
    }

    let insights = ""

    // Find the AI that adapted the most
    const adaptationLevels = aiInsights.map((ai) => {
      const baseValue = ai.aiId === 1 ? 0.3 : ai.aiId === 2 ? 0.8 : 0.5
      return {
        aiId: ai.aiId,
        adaptationLevel: Math.abs(ai.aggressionLevel - baseValue),
      }
    })

    const mostAdapted = adaptationLevels.sort((a, b) => b.adaptationLevel - a.adaptationLevel)[0]

    if (mostAdapted) {
      insights += `${aiInsights.find((ai) => ai.aiId === mostAdapted.aiId)?.aiId} has adapted the most to your playing style. `
    }

    // Check if AIs are becoming more aggressive or conservative
    const avgAggressionChange =
      aiInsights.reduce((sum, ai) => {
        const baseValue = ai.aiId === 1 ? 0.3 : ai.aiId === 2 ? 0.8 : 0.5
        return sum + (ai.aggressionLevel - baseValue)
      }, 0) / aiInsights.length

    if (avgAggressionChange > 0.1) {
      insights += "The AI agents are becoming more aggressive in response to your style. "
    } else if (avgAggressionChange < -0.1) {
      insights += "The AI agents are becoming more conservative in response to your style. "
    } else {
      insights += "The AI agents are making minor adjustments to their strategies. "
    }

    // Check for category biases
    const categoryBiases = {}
    aiInsights.forEach((ai) => {
      Object.entries(ai.categoryBias).forEach(([category, bias]) => {
        categoryBiases[category] = (categoryBiases[category] || 0) + bias
      })
    })

    const avgCategoryBiases = Object.entries(categoryBiases)
      .map(([category, total]) => ({
        category,
        avgBias: total / aiInsights.length,
      }))
      .sort((a, b) => b.avgBias - a.avgBias)

    if (avgCategoryBiases.length > 0 && avgCategoryBiases[0].avgBias > 1.2) {
      insights += `The AI agents are now valuing ${avgCategoryBiases[0].category} items more highly. `
    }

    return insights
  }

  // Generate strategic advice
  const getStrategicAdvice = () => {
    if (playerPatterns.valueRatios.length === 0) return "Play more games to receive strategic advice."

    let advice = ""

    // Advice based on win rate
    if (winRate < 40) {
      if (avgBidToValueRatio < 0.7) {
        advice +=
          "Consider bidding more aggressively. Your conservative approach may be causing you to miss opportunities. "
      } else if (avgBidToValueRatio > 1.2) {
        advice += "You might be bidding too aggressively. Try being more selective about which items you bid high on. "
      }
    }

    // Advice based on round behavior
    if (roundBehavior.length > 1) {
      const firstRound = roundBehavior[0]?.avgRatio || 0
      const lastRound = roundBehavior[roundBehavior.length - 1]?.avgRatio || 0

      if (lastRound < 0.6 && firstRound > 0.8) {
        advice +=
          "You become too conservative in later rounds. Don't be afraid to make strong bids when good opportunities arise. "
      } else if (lastRound > 1.3 && playerPatterns.budgetManagement < 0.3) {
        advice += "Be careful about aggressive bidding in later rounds when your budget is limited. "
      }
    }

    // Advice based on AI adaptations
    if (gameNumber > 1) {
      advice +=
        "The AI agents are learning your patterns. Consider mixing up your strategy occasionally to keep them guessing. "

      // If AI is adapting to category preferences
      const strongCategoryPreference = categoryPreferences.find((cat) => cat.value > avgBidToValueRatio * 1.3)
      if (strongCategoryPreference) {
        advice += `The AI has noticed your preference for ${strongCategoryPreference.category} items. You might find better deals in other categories. `
      }
    }

    if (advice === "") {
      advice = "Your current strategy seems effective. Keep monitoring how the AI adapts to your style."
    }

    return advice
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-purple-500" />
            Bidding Pattern Analysis
          </CardTitle>
          <CardDescription>
            Game #{gameNumber} - Based on {playerPatterns.valueRatios.length} bidding decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Bid to Value Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(avgBidToValueRatio * 100).toFixed(1)}%</div>
                <p className="text-sm text-slate-600">
                  {avgBidToValueRatio > 1 ? "You tend to bid above item value" : "You tend to bid below item value"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
                <p className="text-sm text-slate-600">
                  {winCount} wins out of {gameHistory.length} rounds
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  Budget Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {playerPatterns.budgetManagement ? (playerPatterns.budgetManagement * 100).toFixed(1) + "%" : "N/A"}
                </div>
                <p className="text-sm text-slate-600">
                  {playerPatterns.budgetManagement > 0.7
                    ? "Very conservative with budget"
                    : playerPatterns.budgetManagement > 0.4
                      ? "Balanced budget approach"
                      : "Aggressive budget usage"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Category Preferences
              </h3>
              <div className="space-y-2">
                {categoryPreferences.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{cat.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(cat.value * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{(cat.value * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
                {categoryPreferences.length === 0 && (
                  <p className="text-sm text-slate-500">Not enough data to analyze category preferences</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-rose-500" />
                Round Behavior
              </h3>
              <div className="space-y-2">
                {roundBehavior.map((round, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Round {round.round}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(round.avgRatio * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{(round.avgRatio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
                {roundBehavior.length === 0 && (
                  <p className="text-sm text-slate-500">Not enough data to analyze round behavior</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Your Bidding Style
            </h3>
            <p>{getBiddingStyleDescription()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            AI Adaptation Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{getAIAdaptationInsights()}</p>

          {gameNumber > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {aiInsights.map((ai) => (
                <Card key={ai.aiId} className="bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI #{ai.aiId} Adaptations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Aggression Level:</span>
                      <Badge
                        variant={
                          ai.aggressionLevel > 0.7 ? "destructive" : ai.aggressionLevel > 0.4 ? "secondary" : "outline"
                        }
                      >
                        {ai.aggressionLevel > 0.7 ? "High" : ai.aggressionLevel > 0.4 ? "Medium" : "Low"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Value Perception:</span>
                      <span className="text-sm font-medium">{(ai.valuePerception * 100).toFixed(1)}%</span>
                    </div>
                    {Object.keys(ai.categoryBias).length > 0 && (
                      <div>
                        <span className="text-sm">Top Category Bias:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(ai.categoryBias)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 2)
                            .map(([category, bias]) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}: {(bias * 100).toFixed(0)}%
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Strategic Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{getStrategicAdvice()}</p>
        </CardContent>
      </Card>
    </div>
  )
}
