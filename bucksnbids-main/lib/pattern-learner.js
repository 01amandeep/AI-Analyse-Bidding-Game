/**
 * PatternLearner class for analyzing player bidding patterns
 * and generating insights and suggestions
 */
export class PatternLearner {
  constructor() {
    this.biddingHistory = []
    this.valueRatios = []
    this.categoryPreferences = {}
    this.rarityPreferences = {}
    this.roundBehavior = {}
    this.budgetManagement = []
    this.winningBids = []
    this.losingBids = []
  }

  /**
   * Learn from a player's bid
   * @param {Object} bidData - Data about the bid
   */
  learnFromBid(bidData) {
    const { item, playerBid, playerBudget, round, totalRounds, result } = bidData

    // Store the bid in history
    this.biddingHistory.push(bidData)

    // Calculate and store bid-to-value ratio
    const bidToValueRatio = playerBid / item.trueValue
    this.valueRatios.push(bidToValueRatio)

    // Update category preferences
    if (!this.categoryPreferences[item.category]) {
      this.categoryPreferences[item.category] = []
    }
    this.categoryPreferences[item.category].push(bidToValueRatio)

    // Update rarity preferences
    if (!this.rarityPreferences[item.rarity]) {
      this.rarityPreferences[item.rarity] = []
    }
    this.rarityPreferences[item.rarity].push(bidToValueRatio)

    // Update round behavior
    if (!this.roundBehavior[round]) {
      this.roundBehavior[round] = []
    }
    this.roundBehavior[round].push(bidToValueRatio)

    // Update budget management
    this.budgetManagement.push(playerBid / playerBudget)

    // Store winning and losing bids
    if (result === "win") {
      this.winningBids.push({
        bid: playerBid,
        value: item.trueValue,
        ratio: bidToValueRatio,
        category: item.category,
        rarity: item.rarity,
        round,
      })
    } else {
      this.losingBids.push({
        bid: playerBid,
        value: item.trueValue,
        ratio: bidToValueRatio,
        category: item.category,
        rarity: item.rarity,
        round,
      })
    }
  }

  /**
   * Generate a bid suggestion based on learned patterns
   * @param {Object} item - Current item data
   * @param {number} playerBudget - Current player budget
   * @param {number} round - Current round number
   * @param {number} totalRounds - Total rounds in the game
   * @returns {number} - Suggested bid amount
   */
  generateBidSuggestion(item, playerBudget, round, totalRounds) {
    // If we don't have enough data, use a simple heuristic
    if (this.valueRatios.length < 3) {
      return Math.floor(((item.estimatedMin + item.estimatedMax) / 2) * 0.8)
    }

    // Calculate average bid-to-value ratio
    const avgRatio = this.valueRatios.reduce((sum, ratio) => sum + ratio, 0) / this.valueRatios.length

    // Get category-specific ratio if available
    let categoryRatio = avgRatio
    if (this.categoryPreferences[item.category] && this.categoryPreferences[item.category].length > 0) {
      categoryRatio =
        this.categoryPreferences[item.category].reduce((sum, ratio) => sum + ratio, 0) /
        this.categoryPreferences[item.category].length
    }

    // Get rarity-specific ratio if available
    let rarityRatio = avgRatio
    if (this.rarityPreferences[item.rarity] && this.rarityPreferences[item.rarity].length > 0) {
      rarityRatio =
        this.rarityPreferences[item.rarity].reduce((sum, ratio) => sum + ratio, 0) /
        this.rarityPreferences[item.rarity].length
    }

    // Get round-specific ratio if available
    let roundRatio = avgRatio
    if (this.roundBehavior[round] && this.roundBehavior[round].length > 0) {
      roundRatio = this.roundBehavior[round].reduce((sum, ratio) => sum + ratio, 0) / this.roundBehavior[round].length
    }

    // Calculate winning bid ratio if available
    let winningRatio = avgRatio
    if (this.winningBids.length > 0) {
      winningRatio = this.winningBids.reduce((sum, bid) => sum + bid.ratio, 0) / this.winningBids.length
    }

    // Combine all factors to generate a suggestion
    const estimatedValue = (item.estimatedMin + item.estimatedMax) / 2
    const baseRatio = (categoryRatio + rarityRatio + roundRatio + winningRatio) / 4

    // Adjust for budget constraints
    const budgetFactor = Math.min(1, playerBudget / (estimatedValue * baseRatio * 1.5))

    // Adjust for round (be more conservative in early rounds)
    const roundFactor = 0.8 + 0.4 * (round / totalRounds)

    // Calculate suggested bid
    let suggestedBid = Math.floor(estimatedValue * baseRatio * budgetFactor * roundFactor)

    // Ensure bid is within budget
    suggestedBid = Math.min(suggestedBid, Math.floor(playerBudget * 0.8))

    return suggestedBid
  }

  /**
   * Generate insights about the player's bidding patterns
   * @returns {Object} - Insights about bidding patterns
   */
  generateInsights() {
    if (this.valueRatios.length === 0) {
      return { message: "Not enough data to generate insights" }
    }

    const avgRatio = this.valueRatios.reduce((sum, ratio) => sum + ratio, 0) / this.valueRatios.length

    // Analyze category preferences
    const categoryInsights = {}
    Object.entries(this.categoryPreferences).forEach(([category, ratios]) => {
      if (ratios.length > 0) {
        const avgCategoryRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
        categoryInsights[category] = {
          avgRatio: avgCategoryRatio,
          relativeTo: avgCategoryRatio / avgRatio,
          count: ratios.length,
        }
      }
    })

    // Analyze rarity preferences
    const rarityInsights = {}
    Object.entries(this.rarityPreferences).forEach(([rarity, ratios]) => {
      if (ratios.length > 0) {
        const avgRarityRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
        rarityInsights[rarity] = {
          avgRatio: avgRarityRatio,
          relativeTo: avgRarityRatio / avgRatio,
          count: ratios.length,
        }
      }
    })

    // Analyze round behavior
    const roundInsights = {}
    Object.entries(this.roundBehavior).forEach(([round, ratios]) => {
      if (ratios.length > 0) {
        const avgRoundRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
        roundInsights[round] = {
          avgRatio: avgRoundRatio,
          relativeTo: avgRoundRatio / avgRatio,
          count: ratios.length,
        }
      }
    })

    // Analyze budget management
    const avgBudgetRatio = this.budgetManagement.reduce((sum, ratio) => sum + ratio, 0) / this.budgetManagement.length

    // Analyze win/loss patterns
    const winRate = this.winningBids.length / (this.winningBids.length + this.losingBids.length)

    return {
      overallBidToValueRatio: avgRatio,
      categoryPreferences: categoryInsights,
      rarityPreferences: rarityInsights,
      roundBehavior: roundInsights,
      budgetManagement: avgBudgetRatio,
      winRate,
      totalBids: this.valueRatios.length,
    }
  }
}
