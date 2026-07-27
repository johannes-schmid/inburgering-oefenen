"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  correct: {
    label: "% Goed",
    color: "#002b6d",
  },
} satisfies ChartConfig

interface CategoryStat {
  category: string
  correct: number
  total: number
  pct: number
}

interface Props {
  data: CategoryStat[]
}

const SHORT: Record<string, string> = {
  "Geschiedenis en Geografie": "Geschiedenis",
  "Gezondheid en Gezondheidszorg": "Gezondheid",
  "Staatsinrichting en Rechtsstaat": "Staatsinrichting",
  "Onderwijs en Opvoeding": "Onderwijs",
  "Werk en Inkomen": "Werk",
  "Wonen": "Wonen",
  "Instanties": "Instanties",
}

export function CategoryRadarChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.pct - a.pct)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  const chartData = data.map(d => ({
    category: SHORT[d.category] ?? d.category,
    correct: d.pct,
    total: d.total,
  }))

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Score per categorie</CardTitle>
        <CardDescription>Percentage goed beantwoord door gebruikers</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) =>
                    [`${value}% (${item.payload.total} antwoorden)`, "% Goed"]
                  }
                />
              }
            />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <PolarGrid stroke="#e5e7eb" />
            <Radar
              dataKey="correct"
              fill="#002b6d"
              fillOpacity={0.25}
              stroke="#002b6d"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1 text-sm">
        {best && (
          <div className="flex items-center gap-2 font-medium leading-none">
            <span className="w-2 h-2 rounded-full bg-[#002b6d] inline-block" />
            Sterkste categorie: <span className="text-[#002b6d]">{SHORT[best.category] ?? best.category}</span>
            &nbsp;({best.pct}%)
          </div>
        )}
        {worst && worst.category !== best?.category && (
          <div className="flex items-center gap-2 leading-none text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#fe762c] inline-block" />
            Zwakste categorie: <span className="text-[#fe762c]">{SHORT[worst.category] ?? worst.category}</span>
            &nbsp;({worst.pct}%)
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
