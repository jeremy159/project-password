export interface ChartPropreties {
  x: d3.ScaleBand<string>;
  y: d3.ScaleLinear<number, number>;
  xAxis: d3.Axis<string>;
  yAxis: d3.Axis<number>;
  color: d3.ScaleOrdinal<string, string>;
}
