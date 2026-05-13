# Architectural Foundation

The workstation is built on a strictly asset-agnostic and simulation-centric architecture.

## Core Concepts
- **AssetType**: A top-level classification (`CRYPTO`, `STOCK`, `ETF`) that determines the context of the data and simulation.
- **MarketProvider**: An abstraction layer that decouples data retrieval from the source (e.g., CCXT, Yahoo Finance, or Local CSV).
- **SimulatedMarket**: A local, deterministic engine that manages virtual balances and positions. It ensures no real orders are ever leaked.
- **Decision Journaling**: An append-only log of `Signal` objects containing a point-in-time snapshot of the market state and reasoning.
- **Replayability**: The ability to reconstruct the market context at any decision point for analysis.

## Local-First Constraints
- Persistence is handled via lightweight local formats (JSON/SQLite).
- No external authentication or cloud-sync systems.
- Heavy focus on Monographs (Single-User Research Workstations).
