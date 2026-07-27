"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
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
  views: { label: "Activiteit" },
  questions: { label: "Vragen beantwoord", color: "#002b6d" },
  exams: { label: "Examens gedaan", color: "#fe762c" },
} satisfies ChartConfig

interface DayData {
  date: string
  questions: number
  exams: number
}

interface Props {
  data: DayData[]
  totalQuestions: number
  totalExams: number
}

export function ActivityLineChart({ data, totalQuestions, totalExams }: Props) {
  const [activeChart, setActiveChart] = React.useState<"questions" | "exams">("questions")

  const totals = { questions: totalQuestions, exams: totalExams }
  const labels = { questions: "Vragen beantwoord", exams: "Examens gedaan" }

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Gebruikersactiviteit</CardTitle>
          <CardDescription>Afgelopen 3 maanden</CardDescription>
        </div>
        <div className="flex">
          {(["questions", "exams"] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-xs text-muted-foreground">{labels[key]}</span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {totals[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("nl-NL", { month: "short", day: "numeric" })
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  nameKey="views"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("nl-NL", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={activeChart === "questions" ? "#002b6d" : "#fe762c"}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
