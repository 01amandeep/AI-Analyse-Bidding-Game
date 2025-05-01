"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Award, RefreshCw, Brain, History, Zap, Target } from "lucide-react"
import { BiddingAnalysis } from "@/components/bidding-analysis"
import { PatternLearner } from "@/lib/pattern-learner"

// Initial AI agents
const INITIAL_AI_AGENTS = [
  {
    id: 1,
    name: "Cautious Carl",
    avatar: "🤖",
    baseStrategy: "conservative",
    description: "Starts conservative but adapts to your patterns",
    learningRate: 0.3,
    color: "blue",
  },
  {
    id: 2,
    name: "Risky Rachel",
    avatar: "🤖",
    baseStrategy: "aggressive",
    description: "Begins aggressive and learns from your moves",
    learningRate: 0.4,
    color: "red",
  },
  {
    id: 3,
    name: "Balanced Bob",
    avatar: "🤖",
    baseStrategy: "balanced",
    description: "Uses balanced strategy that adapts over time",
    learningRate: 0.25,
    color: "green",
  },
  {
    id: 4,
    name: "Mimic Mike",
    avatar: "🤖",
    baseStrategy: "mimic",
    description: "Tries to copy your bidding patterns",
    learningRate: 0.5,
    color: "purple",
  },
]

// Game settings
const INITIAL_BUDGET = 1000
const ROUNDS_PER_GAME = 5
const ITEM_CATEGORIES = [
  { name: "Antiques", minValue: 100, maxValue: 500, valueMultiplier: 1 },
  { name: "Electronics", minValue: 200, maxValue: 800, valueMultiplier: 0.8 },
  { name: "Art", minValue: 300, maxValue: 1200, valueMultiplier: 1.2 },
  { name: "Collectibles", minValue: 150, maxValue: 600, valueMultiplier: 1.1 },
  { name: "Jewelry", minValue: 400, maxValue: 1500, valueMultiplier: 0.9 },
]

// Item database
const ITEMS = [
  { name: "Vintage Vase", category: "Antiques", rarity: "common" },
  { name: "Antique Clock", category: "Antiques", rarity: "uncommon" },
  { name: "Victorian Desk", category: "Antiques", rarity: "rare" },
  { name: "Smartphone", category: "Electronics", rarity: "common" },
  { name: "Gaming Console", category: "Electronics", rarity: "uncommon" },
  { name: "Rare Computer Prototype", category: "Electronics", rarity: "rare" },
  { name: "Landscape Painting", category: "Art", rarity: "common" },
  { name: "Modern Sculpture", category: "Art", rarity: "uncommon" },
  { name: "Famous Artist Sketch", category: "Art", rarity: "rare" },
  { name: "Comic Book", category: "Collectibles", rarity: "common" },
  { name: "Sports Memorabilia", category: "Collectibles", rarity: "uncommon" },
  { name: "Movie Prop", category: "Collectibles", rarity: "rare" },
  { name: "Silver Bracelet", category: "Jewelry", rarity: "common" },
  { name: "Gold Watch", category: "Jewelry", rarity: "uncommon" },
  { name: "Diamond Necklace", category: "Jewelry", rarity: "rare" },
]

// Rarity multipliers
const RARITY_MULTIPLIERS = {
  common: 1,
  uncommon: 1.5,
  rare: 2.5,
}

export function BiddingGame() {
  // Game state
  const [gameState, setGameState] = useState("waiting") // waiting, bidding, results, gameOver
  const [currentRound, setCurrentRound] = useState(0)
  const [playerBudget, setPlayerBudget] = useState(INITIAL_BUDGET)
  const [playerBid, setPlayerBid] = useState("")
  const [aiBids, setAiBids] = useState({})
  const [currentItem, setCurrentItem] = useState(null)
  const [gameHistory, setGameHistory] = useState([])
  const [allGamesHistory, setAllGamesHistory] = useState([])
  const [winner, setWinner] = useState(null)
  const [aiAgents, setAiAgents] = useState(INITIAL_AI_AGENTS)
  const [aiBudgets, setAiBudgets] = useState({})
  const [revealedValue, setRevealedValue] = useState(null)
  const [gameNumber, setGameNumber] = useState(0)
  const [playerPatterns, setPlayerPatterns] = useState({
    valueRatios: [], // bid to value ratios
    categoryPreferences: {}, // how much player values each category
    rarityPreferences: {}, // how much player values each rarity
    aggressionLevel: 0.5, // 0-1 scale of bidding aggression
    adaptability: 0.5, // how much player changes strategy
    roundBehavior: [], // behavior changes by round
    budgetManagement: 0.5, // how player manages budget
  })
  const [analysisReady, setAnalysisReady] = useState(false)
  const [patternLearner, setPatternLearner] = useState(null)
  const [aiAdaptations, setAiAdaptations] = useState({})
  const [bidSuggestion, setBidSuggestion] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(false)

  // Initialize pattern learner
  useEffect(() => {
    setPatternLearner(new PatternLearner())
  }, [])

  // Initialize the game
  const startGame = () => {
    // Reset game state
    setGameState("bidding")
    setCurrentRound(1)
    setPlayerBudget(INITIAL_BUDGET)
    setGameHistory([])
    setGameNumber((prevGameNumber) => prevGameNumber + 1)
    setAnalysisReady(false)
    setShowSuggestion(false)

    // Initialize AI budgets
    const initialBudgets = {}
    aiAgents.forEach((ai) => {
      initialBudgets[ai.id] = INITIAL_BUDGET
    })
    setAiBudgets(initialBudgets)

    // Reset AI adaptations if this is a new session
    if (gameNumber === 0) {
      const initialAdaptations = {}
      aiAgents.forEach((ai) => {
        initialAdaptations[ai.id] = {
          valuePerception: 1.0,
          aggressionLevel: ai.baseStrategy === "aggressive" ? 0.8 : ai.baseStrategy === "conservative" ? 0.3 : 0.5,
          categoryBias: {},
          rarityBias: {
            common: 1,
            uncommon: 1.5,
            rare: 2,
          },
          learningRate: ai.learningRate,
        }
      })
      setAiAdaptations(initialAdaptations)
    }

    // Set first item
    selectRandomItem()
  }

  // Select a random item for the current round
  const selectRandomItem = () => {
    const randomItemIndex = Math.floor(Math.random() * ITEMS.length)
    const item = ITEMS[randomItemIndex]

    const category = ITEM_CATEGORIES.find((cat) => cat.name === item.category)
    const rarityMultiplier = RARITY_MULTIPLIERS[item.rarity]

    // Generate a random true value within the range, adjusted by category and rarity
    const baseValue = Math.floor(Math.random() * (category.maxValue - category.minValue + 1) + category.minValue)
    const trueValue = Math.floor(baseValue * category.valueMultiplier * rarityMultiplier)

    // Estimated range is less precise than true value
    const estimatedMin = Math.floor(trueValue * 0.7)
    const estimatedMax = Math.floor(trueValue * 1.3)

    setCurrentItem({
      ...item,
      trueValue,
      estimatedMin,
      estimatedMax,
      category: category.name,
    })

    setRevealedValue(null)
    setAiBids({})
    setPlayerBid("")
    setBidSuggestion(null)
  }

  // Generate AI bid suggestion based on learned patterns
  useEffect(() => {
    if (currentItem && patternLearner && gameNumber > 1 && gameState === "bidding") {
      const suggestion = patternLearner.generateBidSuggestion(currentItem, playerBudget, currentRound, ROUNDS_PER_GAME)
      setBidSuggestion(suggestion)
    }
  }, [currentItem, patternLearner, gameNumber, gameState, playerBudget, currentRound])

  // Handle player bid submission
  const submitBid = () => {
    const bid = Number.parseInt(playerBid)

    if (isNaN(bid) || bid <= 0 || bid > playerBudget) {
      alert("Please enter a valid bid amount within your budget.")
      return
    }

    // Record player's bid pattern
    const bidToValueRatio = bid / currentItem.trueValue
    const bidToEstimateRatio = bid / ((currentItem.estimatedMin + currentItem.estimatedMax) / 2)
    const bidToBudgetRatio = bid / playerBudget

    // Generate AI bids
    const newAiBids = {}
    aiAgents.forEach((ai) => {
      const aiBudget = aiBudgets[ai.id]
      const adaptation = aiAdaptations[ai.id]
      let aiBid = 0

      // Different AI strategies with adaptations
      switch (ai.baseStrategy) {
        case "conservative":
          // Bids between 10-50% of the estimated value, adjusted by adaptations
          aiBid = Math.floor(
            (Math.random() * (currentItem.estimatedMin * 0.5 - currentItem.estimatedMin * 0.1) +
              currentItem.estimatedMin * 0.1) *
              adaptation.valuePerception *
              adaptation.aggressionLevel,
          )
          break
        case "aggressive":
          // Bids between 70-120% of the estimated value, adjusted by adaptations
          aiBid = Math.floor(
            (Math.random() * (currentItem.estimatedMax * 1.2 - currentItem.estimatedMax * 0.7) +
              currentItem.estimatedMax * 0.7) *
              adaptation.valuePerception *
              adaptation.aggressionLevel,
          )
          break
        case "balanced":
          // Bids between 40-90% of the estimated value, adjusted by adaptations
          aiBid = Math.floor(
            (Math.random() * (currentItem.estimatedMax * 0.9 - currentItem.estimatedMin * 0.4) +
              currentItem.estimatedMin * 0.4) *
              adaptation.valuePerception *
              adaptation.aggressionLevel,
          )
          break
        case "mimic":
          // If we have player history, try to mimic their bidding pattern
          if (playerPatterns.valueRatios.length > 0) {
            // Use the average of player's past bid-to-value ratios
            const avgRatio =
              playerPatterns.valueRatios.reduce((sum, ratio) => sum + ratio, 0) / playerPatterns.valueRatios.length
            aiBid = Math.floor(currentItem.trueValue * avgRatio * (Math.random() * 0.4 + 0.8)) // Add some randomness
          } else {
            // Default to balanced strategy if no history
            aiBid = Math.floor(
              (Math.random() * (currentItem.estimatedMax * 0.9 - currentItem.estimatedMin * 0.4) +
                currentItem.estimatedMin * 0.4) *
                adaptation.valuePerception,
            )
          }
          break
      }

      // Apply category and rarity biases if they exist
      if (adaptation.categoryBias[currentItem.category]) {
        aiBid *= adaptation.categoryBias[currentItem.category]
      }

      if (adaptation.rarityBias[currentItem.rarity]) {
        aiBid *= adaptation.rarityBias[currentItem.rarity]
      }

      // Budget management - more conservative in later rounds
      const roundFactor = 1 - ((currentRound - 1) / ROUNDS_PER_GAME) * 0.3
      aiBid = Math.floor(aiBid * roundFactor)

      // Ensure AI doesn't bid more than its budget
      aiBid = Math.min(aiBid, aiBudget)
      newAiBids[ai.id] = aiBid
    })

    setAiBids(newAiBids)

    // Determine the winner
    let highestBid = bid
    let roundWinner = "player"

    Object.entries(newAiBids).forEach(([aiId, aiBid]) => {
      if (aiBid > highestBid) {
        highestBid = aiBid
        roundWinner = Number.parseInt(aiId)
      }
    })

    setWinner(roundWinner)
    setRevealedValue(currentItem.trueValue)

    // Update budgets
    const newPlayerBudget = roundWinner === "player" ? playerBudget - bid + currentItem.trueValue : playerBudget - bid

    setPlayerBudget(newPlayerBudget)

    setAiBudgets((prevBudgets) => {
      const newBudgets = { ...prevBudgets }
      Object.keys(newBudgets).forEach((aiId) => {
        const aiIdNum = Number.parseInt(aiId)
        newBudgets[aiId] =
          roundWinner === aiIdNum
            ? newBudgets[aiId] - newAiBids[aiId] + currentItem.trueValue
            : newBudgets[aiId] - newAiBids[aiId]
      })
      return newBudgets
    })

    // Update game history
    const roundResult = {
      round: currentRound,
      item: currentItem.name,
      category: currentItem.category,
      rarity: currentItem.rarity,
      trueValue: currentItem.trueValue,
      estimatedMin: currentItem.estimatedMin,
      estimatedMax: currentItem.estimatedMax,
      playerBid: bid,
      playerBidToValueRatio: bidToValueRatio,
      playerBidToEstimateRatio: bidToEstimateRatio,
      playerBidToBudgetRatio: bidToBudgetRatio,
      aiBids: newAiBids,
      winner: roundWinner,
      playerBudgetAfter: newPlayerBudget,
      aiBudgetsAfter: { ...aiBudgets },
    }

    setGameHistory((prevHistory) => [...prevHistory, roundResult])

    // Update player patterns
    setPlayerPatterns((prevPatterns) => {
      // Update value ratios
      const newValueRatios = [...prevPatterns.valueRatios, bidToValueRatio]

      // Update category preferences
      const newCategoryPreferences = { ...prevPatterns.categoryPreferences }
      newCategoryPreferences[currentItem.category] =
        (newCategoryPreferences[currentItem.category] || 0) + bidToValueRatio

      // Update rarity preferences
      const newRarityPreferences = { ...prevPatterns.rarityPreferences }
      newRarityPreferences[currentItem.rarity] = (newRarityPreferences[currentItem.rarity] || 0) + bidToValueRatio

      // Update aggression level (higher bids = more aggressive)
      const newAggressionSamples = [...(prevPatterns.aggressionSamples || []), bidToValueRatio]
      const newAggressionLevel = newAggressionSamples.reduce((sum, val) => sum + val, 0) / newAggressionSamples.length

      // Update round behavior
      const newRoundBehavior = [...(prevPatterns.roundBehavior || [])]
      if (!newRoundBehavior[currentRound - 1]) {
        newRoundBehavior[currentRound - 1] = []
      }
      newRoundBehavior[currentRound - 1].push(bidToValueRatio)

      // Update budget management (higher = more conservative with budget)
      const newBudgetManagement = 1 - bidToBudgetRatio

      return {
        ...prevPatterns,
        valueRatios: newValueRatios,
        categoryPreferences: newCategoryPreferences,
        rarityPreferences: newRarityPreferences,
        aggressionLevel: newAggressionLevel,
        aggressionSamples: newAggressionSamples,
        roundBehavior: newRoundBehavior,
        budgetManagement: newBudgetManagement,
      }
    })

    // Feed data to pattern learner
    if (patternLearner) {
      patternLearner.learnFromBid({
        item: currentItem,
        playerBid: bid,
        playerBudget: playerBudget,
        round: currentRound,
        totalRounds: ROUNDS_PER_GAME,
        result: roundWinner === "player" ? "win" : "loss",
      })
    }

    // Check if game should continue
    if (currentRound >= ROUNDS_PER_GAME) {
      finishGame()
    } else {
      setGameState("results")
    }
  }

  // Finish the current game
  const finishGame = () => {
    // Calculate final scores and determine overall winner
    const finalScores = calculateScores()
    const overallResult = determineOverallWinner()

    // Add game to all games history
    const gameResult = {
      gameNumber,
      rounds: gameHistory,
      finalPlayerBudget: playerBudget,
      finalAiBudgets: { ...aiBudgets },
      winner: overallResult.winner,
      playerPatterns: { ...playerPatterns },
    }

    setAllGamesHistory((prevHistory) => [...prevHistory, gameResult])

    // Update AI adaptations based on this game
    updateAIAdaptations()

    setGameState("gameOver")
    setAnalysisReady(true)
  }

  // Update AI adaptations based on player patterns
  const updateAIAdaptations = () => {
    if (gameHistory.length === 0) return

    setAiAdaptations((prevAdaptations) => {
      const newAdaptations = { ...prevAdaptations }

      aiAgents.forEach((ai) => {
        const adaptation = newAdaptations[ai.id]
        const learningRate = adaptation.learningRate

        // Adjust value perception based on player's bidding patterns
        const avgPlayerRatio =
          playerPatterns.valueRatios.reduce((sum, ratio) => sum + ratio, 0) / playerPatterns.valueRatios.length
        adaptation.valuePerception = adaptation.valuePerception * (1 - learningRate) + avgPlayerRatio * learningRate

        // Adjust aggression level
        adaptation.aggressionLevel =
          adaptation.aggressionLevel * (1 - learningRate) + playerPatterns.aggressionLevel * learningRate

        // Adjust category biases
        Object.entries(playerPatterns.categoryPreferences).forEach(([category, preference]) => {
          const normalizedPreference = preference / playerPatterns.valueRatios.length
          adaptation.categoryBias[category] =
            (adaptation.categoryBias[category] || 1) * (1 - learningRate) + normalizedPreference * learningRate
        })

        // Adjust rarity biases
        Object.entries(playerPatterns.rarityPreferences).forEach(([rarity, preference]) => {
          const normalizedPreference = preference / playerPatterns.valueRatios.length
          adaptation.rarityBias[rarity] =
            (adaptation.rarityBias[rarity] || 1) * (1 - learningRate) + normalizedPreference * learningRate
        })
      })

      return newAdaptations
    })
  }

  // Move to the next round
  const nextRound = () => {
    setCurrentRound((prevRound) => prevRound + 1)
    setGameState("bidding")
    selectRandomItem()
  }

  // Calculate final scores
  const calculateScores = () => {
    // Player score is remaining budget
    const playerScore = playerBudget

    // AI scores are their remaining budgets
    const aiScores = {}
    aiAgents.forEach((ai) => {
      aiScores[ai.id] = aiBudgets[ai.id]
    })

    return {
      player: playerScore,
      ai: aiScores,
    }
  }

  // Determine the overall winner
  const determineOverallWinner = () => {
    const scores = calculateScores()
    let highestScore = scores.player
    let overallWinner = "player"

    Object.entries(scores.ai).forEach(([aiId, score]) => {
      if (score > highestScore) {
        highestScore = score
        overallWinner = Number.parseInt(aiId)
      }
    })

    return {
      winner: overallWinner,
      score: highestScore,
    }
  }

  return (
    <div className="space-y-6">
      {gameState === "waiting" && (
        <Card>
          <CardHeader>
            <CardTitle>AI Learning Bidding Game</CardTitle>
            <CardDescription>Compete against AI agents that learn from your bidding patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  How It Works
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Each game consists of {ROUNDS_PER_GAME} rounds of bidding on various items</li>
                  <li>The AI agents analyze your bidding patterns and adapt their strategies</li>
                  <li>After each game, you'll receive an analysis of your bidding style</li>
                  <li>The more you play, the smarter the AI becomes!</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">AI Agents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiAgents.map((ai) => (
                    <Card key={ai.id} className="bg-slate-50 border-t-4" style={{ borderTopColor: ai.color }}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl">{ai.avatar}</div>
                          <CardTitle className="text-lg">{ai.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center mb-2">
                          <Brain className="h-4 w-4 mr-2 text-slate-500" />
                          <span className="text-sm text-slate-600">{ai.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              ai.baseStrategy === "conservative"
                                ? "outline"
                                : ai.baseStrategy === "aggressive"
                                  ? "destructive"
                                  : ai.baseStrategy === "mimic"
                                    ? "secondary"
                                    : "default"
                            }
                          >
                            {ai.baseStrategy.charAt(0).toUpperCase() + ai.baseStrategy.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-100">
                            Learning: {ai.learningRate * 100}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={startGame} size="lg" className="gap-2">
                  <Zap className="h-5 w-5" />
                  Start Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(gameState === "bidding" || gameState === "results") && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Round {currentRound} of {ROUNDS_PER_GAME}
              </h2>
              <p className="text-slate-600">Your Budget: ${playerBudget}</p>
            </div>
            <Progress value={(currentRound / ROUNDS_PER_GAME) * 100} className="w-1/3" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span>Current Item: {currentItem?.name}</span>
                  <Badge variant="outline">{currentItem?.category}</Badge>
                  <Badge
                    variant={
                      currentItem?.rarity === "rare"
                        ? "destructive"
                        : currentItem?.rarity === "uncommon"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {currentItem?.rarity}
                  </Badge>
                </div>
                {revealedValue && <span>True Value: ${revealedValue}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Estimated Value Range: ${currentItem?.estimatedMin} - ${currentItem?.estimatedMax}
              </p>

              {gameState === "bidding" ? (
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <Input
                          type="number"
                          placeholder="Enter your bid"
                          value={playerBid}
                          onChange={(e) => setPlayerBid(e.target.value)}
                          min="1"
                          max={playerBudget}
                        />
                      </div>
                    </div>
                    <Button onClick={submitBid}>Place Bid</Button>
                  </div>

                  {bidSuggestion && gameNumber > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSuggestion(!showSuggestion)}
                        className="text-xs"
                      >
                        {showSuggestion ? "Hide Suggestion" : "Show AI Suggestion"}
                      </Button>

                      {showSuggestion && (
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span>
                            Suggested bid: <strong>${bidSuggestion}</strong>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setPlayerBid(bidSuggestion.toString())}
                          >
                            Use
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Your Bid</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">${playerBid}</p>
                        <p className="text-sm text-slate-500">
                          {Math.round((playerBid / currentItem.trueValue) * 100)}% of true value
                        </p>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      {aiAgents.map((ai) => (
                        <div
                          key={ai.id}
                          className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border-l-4"
                          style={{ borderLeftColor: ai.color }}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{ai.avatar}</span>
                            <span>{ai.name}</span>
                          </div>
                          <span className="font-bold">${aiBids[ai.id]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-100 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-bold">Round Winner</h3>
                    </div>
                    <p className="text-xl">
                      {winner === "player"
                        ? "You won this round!"
                        : `${aiAgents.find((ai) => ai.id === winner)?.name} won this round!`}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {winner === "player"
                        ? `You paid $${playerBid} and received an item worth $${currentItem.trueValue}`
                        : `You lost your bid of $${playerBid}`}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={nextRound}>{currentRound < ROUNDS_PER_GAME ? "Next Round" : "Finish Game"}</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {gameHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Current Game History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gameHistory.map((round, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border-b">
                      <div>
                        <p className="font-medium">
                          Round {round.round}: {round.item}
                        </p>
                        <div className="flex gap-2 text-sm text-slate-600">
                          <span>Value: ${round.trueValue}</span>
                          <Badge variant="outline" className="text-xs">
                            {round.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {round.rarity}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          Winner:{" "}
                          {round.winner === "player" ? "You" : aiAgents.find((ai) => ai.id === round.winner)?.name}
                        </p>
                        <p className="text-sm text-slate-600">Your bid: ${round.playerBid}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {gameState === "gameOver" && (
        <Tabs defaultValue="results">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="results">Game Results</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Game Over!</CardTitle>
                <CardDescription>Game #{gameNumber} Complete</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-slate-100 p-6 rounded-lg text-center">
                    <h3 className="text-xl font-bold mb-2">Final Results</h3>
                    {(() => {
                      const { winner, score } = determineOverallWinner()
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-center items-center space-x-2">
                            <Award className="h-8 w-8 text-yellow-500" />
                            <p className="text-2xl font-bold">
                              {winner === "player"
                                ? "You Won!"
                                : `${aiAgents.find((ai) => ai.id === winner)?.name} Won!`}
                            </p>
                          </div>
                          <p>Winning Budget: ${score}</p>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Your Final Budget</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">${playerBudget}</p>
                        <p className="text-sm text-slate-600">
                          {playerBudget > INITIAL_BUDGET
                            ? `Profit: $${playerBudget - INITIAL_BUDGET}`
                            : `Loss: $${INITIAL_BUDGET - playerBudget}`}
                        </p>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      {aiAgents.map((ai) => (
                        <div
                          key={ai.id}
                          className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border-l-4"
                          style={{ borderLeftColor: ai.color }}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{ai.avatar}</span>
                            <span>{ai.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">${aiBudgets[ai.id]}</span>
                            <p className="text-xs text-slate-600">
                              {aiBudgets[ai.id] > INITIAL_BUDGET
                                ? `+$${aiBudgets[ai.id] - INITIAL_BUDGET}`
                                : `-$${INITIAL_BUDGET - aiBudgets[ai.id]}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button onClick={startGame} className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Play Again</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <BiddingAnalysis
              playerPatterns={playerPatterns}
              gameHistory={gameHistory}
              aiAdaptations={aiAdaptations}
              gameNumber={gameNumber}
              allGamesHistory={allGamesHistory}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
