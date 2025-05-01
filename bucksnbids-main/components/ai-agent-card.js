import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain } from "lucide-react"

export function AIAgentCard({ agent, budget, adaptation }) {
  return (
    <Card className="bg-slate-50 border-t-4" style={{ borderTopColor: agent.color }}>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">{agent.avatar}</div>
          <CardTitle className="text-lg">{agent.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-2">
          <Brain className="h-4 w-4 mr-2 text-slate-500" />
          <span className="text-sm text-slate-600">{agent.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              agent.baseStrategy === "conservative"
                ? "outline"
                : agent.baseStrategy === "aggressive"
                  ? "destructive"
                  : agent.baseStrategy === "mimic"
                    ? "secondary"
                    : "default"
            }
          >
            {agent.baseStrategy.charAt(0).toUpperCase() + agent.baseStrategy.slice(1)}
          </Badge>
          <Badge variant="outline" className="bg-slate-100">
            Learning: {agent.learningRate * 100}%
          </Badge>
        </div>
        {budget && (
          <div className="mt-2 text-sm">
            Budget: <span className="font-semibold">${budget}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
