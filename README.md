# NotesSync

Notessync is mobile application that runs on-device/offline models on android devices, have persistent storage with sqlite.
It is an Android application for storing and semantically searching through notes using vector embeddings. The app leverages Transformers.js with custom caching and a custom SQLite plugin with sqlite-vec extension for high-performance vector similarity search.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.1.

## Features

- Semantic Search: Find notes by meaning using vector similarity search
- Vector Embeddings: Powered by Transformers.js embedding models
- Custom SQLite Plugin: Built with io.requery library for runtime SQLite extension (sqlite-vec) support
- SQLite-Vec Extension: High-performance vector similarity search in SQLite
- Offline-First: All processing and storage happens locally on device
- Custom Model Caching: Loads models/configs from device filesystem instead of network
- Note Management: Add, search, and organize your notes with AI powered search.

## Stack

Frontend: Angular
Mobile Framework: Capacitor
AI/ML: Transformers.js with custom caching system
Database: Custom SQLite plugin using io.requery library (using Capacitor Custom Plugin on `/plugins`)
Vector Search: sqlite-vec extension for similarity search
Platform: Android (using Android's built-in SQLite doesn't support extensions)

## Installation

# Clone the repository

```
git clone https://github.com/mystica2000/notessync.git
npm install
```

### To Run on android:

```
npm run build
```

- Open up the project in android studio, `/android` folder
- Run the app on available device

#### If using usb and want to debug,

- After running the app, go to the browser on system and navigate to ```chrome://inspect```
- Inspect the app, check network tab

## How it works:

### Architecture Overview

## Model

- uses Transformer.js custom cache env to load models to device
- On first time running the app, cache miss so it downloads the [onnx-community/embeddinggemma-300m-ONNX](https://huggingface.co/onnx-community/embeddinggemma-300m-ONNX) model from the hugging face hub.
- On subsequent requests, cache hit so it loads the model from local FileSystem - Directory.DATA

```typescript
import { env } from '@huggingface/transformers';

env.allowRemoteModels = true; // ✅ Allow downloads initially
env.allowLocalModels = false; // ❌ Don't use file paths
env.useFS = false; // ❌ Disable default FS
env.useBrowserCache = false; // ❌ Disable browser cache
env.useFSCache = false; // ❌ Disable default FS cache
env.useCustomCache = true; // ✅ Use your cache
const cache = new FilesystemCache();
env.customCache = cache; // Use your implementation

if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = '/assets/wasm/';
}
```
<img width="929" height="418" alt="image" src="https://github.com/user-attachments/assets/48fb51ef-427c-4413-b110-4bc7c13d176f" />


## Storage

Custom SQLite Plugin: Built using io.requery library because Android's built-in SQLite doesn't support the sqlite-vec extension needed for vector operations

- Generate embeddings and store with sqlite-vec extension
- Perform vector similarity search using sqlite-vec for fast, accurate results

## Semantic Search Process

User enters search query in the search bar
Query is converted to vector embedding using cached Transformers.js model
sqlite-vec extension performs high-speed vector similarity search
Results ranked by semantic similarity and displayed

## Semantic Search

Search "happy moments" to find notes about joy, celebration, good times
Search "work tasks" to find notes about deadlines, meetings, projects
Search "food ideas" to find notes about recipes, restaurants, cooking

<img width="805" height="502" alt="image" src="https://github.com/user-attachments/assets/91c4331f-f5c2-4fb7-9e9f-9289d0b34c04" />

## Project Structure

```
├── src/
│   ├── app/           # Angular app components
│   ├── assets/        # Static assets including WASM files
│   └── ...
├── plugins/           # Custom Capacitor SQLite plugin
├── android/           # Android platform files
└── ...
```

