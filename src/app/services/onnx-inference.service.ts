
import { Injectable } from '@angular/core';
import { AutoModel, AutoTokenizer, env, PreTrainedModel, PreTrainedTokenizer } from '@huggingface/transformers';
import { FilesystemCache } from '../helper-class/FilesystemCache';

@Injectable({
  providedIn: 'root'
})
export class OnnxInferenceService {

  private isInitialized = false;

  tokenizer!: PreTrainedTokenizer;
  model!: PreTrainedModel;

  constructor() {
    env.allowRemoteModels = true;     // ✅ Allow downloads initially
    env.allowLocalModels = false;     // ❌ Don't use file paths
    env.useFS = false;                // ❌ Disable default FS
    env.useBrowserCache = false;      // ❌ Disable browser cache
    env.useFSCache = false;           // ❌ Disable default FS cache
    env.useCustomCache = true;        // ✅ Use your cache
    const cache = new FilesystemCache();
    env.customCache = cache; // Use your implementation

    if (env.backends.onnx.wasm) {
      env.backends.onnx.wasm.wasmPaths = '/assets/wasm/'
    }

    if (env.backends.onnx.webgpu) {
      env.backends.onnx.webgpu.profiling = { mode: 'default' };
    }
  }

  public async initModel() {
    try {

      const model_id = "onnx-community/embeddinggemma-300m-ONNX"; 
      this.tokenizer = await AutoTokenizer.from_pretrained(model_id);
      this.model = await AutoModel.from_pretrained(model_id, {
        dtype: "q8", // Options: "fp32" | "q8" | "q4"
        device: "wasm"
      });

      this.isInitialized = true;
    } catch (e) {
      console.error(e);
    }
  }

  public async generateEmbeddings(text: string, type: 'search' | 'content') {
    if (!this.isInitialized || !this.tokenizer || !this.model) {
      throw new Error('Model not initialized. Call initModel() first.');
    }

    try {
      console.log('🔮 Generating embeddings for:', text.substring(0, 50) + '...');

      const prefixes = {
        search: "task: search result | query: ",
        content: "title: none | text: ",
      };

      const query = prefixes[type] + text;

      // Generate embeddings
      const inputs = await this.tokenizer(query, { padding: true });
      const { sentence_embedding } = await this.model(inputs);

      // Extract the embedding array
      const embeddings = Array.from(sentence_embedding.data);

      console.log('✅ Generated embeddings:', embeddings.length, 'dimensions');
      return embeddings;

    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw error;
    }
  }

}
