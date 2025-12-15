# MoveCoder: AI-Powered CLI Coding Agent for Movement Network

![MoveCoder Logo](./move-logo.jpeg)


## Overview
MoveCoder is an intelligent CLI tool designed to streamline smart contract development on the Movement Network, a high-performance Layer 1 blockchain powered by the MoveVM and Move programming language. Built as an extension of the open-source CodebuffAI project, MoveCoder acts as an AI agent that generates, edits, tests, and deploys Move smart contracts using natural language prompts. It integrates Better-Auth for secure CLI authentication, enabling features like user-specific project management and API-gated AI access.

Whether you're building DeFi protocols, NFTs, or other dApps, MoveCoder accelerates your workflow by automating repetitive tasks while ensuring Move's safety features (e.g., resource ownership, error handling) are respected. It's ideal for both novice and experienced blockchain developers looking to boost productivity in the terminal.

## Key Features
- **Natural Language Code Generation:** Describe your smart contract idea in plain English (e.g., "Create a basic NFT minting module with royalties"), and MoveCoder generates compilable Move code.
- **Intelligent Code Editing:** Edit existing modules with commands like `movecoder edit "Add access control to lending protocol" --file lending.move`.
- **Build, Test, & Deploy Automation:** Integrates with Movement CLI/SDK to compile (`movement move build`), run unit tests, and deploy to testnet/devnet.
- **Secure Authentication:** Uses Better-Auth for user login, project history, and protected AI calls (e.g., rate-limiting or premium models).
- **Project Management:** List, load, and version-control projects in a git-integrated repo.
- **Multi-Model AI Support:** Choose from various LLMs (e.g., Grok, open-source alternatives) for code tasks, with prompts tuned for Move syntax.
- **Templates & Starters:** Pre-loaded Move examples for common dApps (e.g., lending, tokens) pulled from Movement's dev resources.

## Installation

### Prerequisites
- Node.js (v18+)
- TypeScript (installed via npm/bun)
- Movement CLI (install via `cargo install movement-cli` or from Movement docs)
- Git for version control

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/movecoder.git
   cd movecoder
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up Better-Auth:
   - Run `npx better-auth init` to generate auth schemas.
   - Generate secrets: `npx better-auth secret`.
   - (Optional) Set up a lightweight backend server for auth API.
4. Configure AI models:
   - Add API keys for preferred LLMs in `.env` (e.g., `GROK_API_KEY=yourkey`).
5. Build the CLI:
   ```bash
   bun run build
   ```
6. Install globally (optional):
   ```bash
   npm link
   ```

## Usage

### Setup CLI Command
To use the `movecoder` command directly in your terminal, you need to link the project locally:

1.  **Build the project:**
    ```bash
    bun run build
    ```
2.  **Link the package:**
    ```bash
    bun link
    ```
    *Note: If you prefer npm, you can run `npm link` instead.*

Now you can run `movecoder` from anywhere in your terminal!

### Configuration
MoveCoder is configured to use the **x402** model by default for AI generation. Ensure you have the appropriate API keys set in your `.env` file if required for this model.

### Payments & Premium Features
MoveCoder integrates **Coinbase's x402 protocol** to handle payments for premium features, such as high-volume code generation, advanced model access, and specialized template usage. This allows for instant, HTTP-based stablecoin transactions directly within the CLI workflow.

### Authentication
MoveCoder uses a local server for authentication.

1.  **Start the Auth Server** (in a separate terminal):
    ```bash
    movecoder start-server
    ```
2.  **Create an Account:**
    ```bash
    movecoder signup --email user@example.com --password mysecurepass --name "Dev User"
    ```
3.  **Login:**
    ```bash
    movecoder login --email user@example.com --password mysecurepass
    ```

### Basic Commands
- **Login:** Authenticate to access protected features.
  ```bash
  movecoder login --email user@example.com --password yourpass
  ```
- **Generate Code:**
  ```bash
  movecoder generate "Build a Move module for a simple token faucet"
  ```
- **Edit Code:**
  ```bash
  movecoder edit "Implement error handling for overflow" --file token.move
  ```
- **Build & Test:**
  ```bash
  movecoder build --project mydapp
  movecoder test --unit
  ```
- **Deploy:**
  ```bash
  movecoder deploy --network testnet --module mymodule
  ```
- **Help:**
  ```bash
  movecoder --help
  ```

### Development Mode
For rapid development without rebuilding, you can still use:
```bash
bun run src/index.ts [command]
```

## Architecture
MoveCoder extends Codebuff's core for NL-to-code processing and CLI interactions. It adds:
- Move-specific prompt engineering for safe, idiomatic code.
- Integration with Movement tools for end-to-end workflows.
- Better-Auth backend for session management and DB storage (e.g., via Prisma).

## Contributing
We welcome contributions! Fork the repo, create a branch, and submit a PR. Focus areas: Move template expansions, AI prompt improvements, or backend enhancements.

## License
MIT License. See LICENSE for details.

## Contact
For issues or suggestions, open a GitHub issue or reach out on X @yourhandle.