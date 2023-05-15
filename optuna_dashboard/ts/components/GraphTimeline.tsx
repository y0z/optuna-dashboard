import * as plotly from "plotly.js-dist-min"
import React, { FC, useEffect } from "react"
import { Grid, Typography, useTheme } from "@mui/material"
import { plotlyDarkTemplate } from "./PlotlyDarkMode"

const plotDomId = "graph-timeline"

const makeHovertext = (trial: Trial): string => {
  return JSON.stringify(
    {
      number: trial.number,
      values: trial.values,
      params: trial.params
        .map((p) => [p.name, p.param_external_value])
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
    },
    undefined,
    "  "
  ).replace(/\n/g, "<br>")
}

export const GraphTimeline: FC<{
  study: StudyDetail | null
}> = ({ study }) => {
  const theme = useTheme()

  const trials = study?.trials!

  useEffect(() => {
    if (study !== null) {
      plotTimeline(trials, theme.palette.mode)
    }
  }, [trials, theme.palette.mode])

  return (
    <Grid container direction="row">
      <Grid
        item
        xs={3}
        container
        direction="column"
        sx={{ paddingRight: theme.spacing(2) }}
      >
        <Typography
          variant="h6"
          sx={{ margin: "1em 0", fontWeight: theme.typography.fontWeightBold }}
        >
          Timeline
        </Typography>
      </Grid>
      <Grid item xs={9}>
        <div id={plotDomId} />
      </Grid>
    </Grid>
  )
}

const plotTimeline = (trials: Trial[], mode: string) => {
  const cm = {
    Complete: "blue",
    Fail: "red",
    Pruned: "orange",
    Running: "green",
    Waiting: "gray",
  }

  if (document.getElementById(plotDomId) === null) {
    return
  }

  const layout: Partial<plotly.Layout> = {
    margin: {
      l: 50,
      t: 0,
      r: 50,
      b: 0,
    },
    xaxis: {
      title: "Datetime",
      type: "date",
    },
    yaxis: {
      title: "Trial",
    },
    template: mode === "dark" ? plotlyDarkTemplate : {},
  }

  plotly.react(plotDomId, [], layout)
  for (const s of Object.keys(cm)) {
    const bars = trials.filter((t) => t.state === s)
    if (bars.length === 0) {
      continue
    }
    const trace: plotly.Data = {
      type: "bar",
      name: s,
      x: bars.map(
        (b) => b.datetime_complete!.getTime() - b.datetime_start!.getTime()
      ),
      y: bars.map((b) => b.number),
      base: bars.map((b) => b.datetime_start!.toISOString()),
      text: bars.map((b) => makeHovertext(b)),
      hovertemplate: "%{text}<extra>" + s + "</extra>",
      orientation: "h",
      marker: { color: cm[s] },
      textposition: "none", // Avoid drawing hovertext in a bar.
    }
    plotly.addTraces(plotDomId, trace)
  }
}
