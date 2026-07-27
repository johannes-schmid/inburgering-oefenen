"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
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
  questions: { label: "Vragen" },
  validated: { label: "Gevalideerd", color: "#002b6d" },
  notValidated: { label: "Niet gevalideerd", color: "#fe762c" },
} satisfies ChartConfig

interface Props {
  total: number
  validated: number
  notValidated: number
}

export function QuestionsDonutChart({ total, validated, notValidated }: Props) {
  const chartData = [
    { status: "validated", count: validated, fill: "#002b6d" },
    { status: "notValidated", count: notValidated, fill: "#fe762c" },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Vragen overzicht</CardTitle>
        <CardDescription>Validatiestatus van alle vragen</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Vragen
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#002b6d" }} />
          <span className="text-muted-foreground">Gevalideerd</span>
          <span className="font-semibold">{validated}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#fe762c" }} />
          <span className="text-muted-foreground">Nog niet gevalideerd</span>
          <span className="font-semibold">{notValidated}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
