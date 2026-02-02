# Tech Stack Decision

## Context and Problem Statement

We want to be able to create an interacive visualisation with quick rendering and high usability

## Considered Options

* C# + React(TS) + D3(SVG)
* Mudblazor(C#) + SVG
* Python + Manim

## Decision Outcome

Chosen option: "C# + React(TS) + D3(SVG)", because React is based on reusable components, D3 is good for a deterministic layout with many interactive features where SVG secures fast rendering. 
C# is easily maintainable and supports database integrations well. Furthermore, C# supplies the data driving the visualisations.
