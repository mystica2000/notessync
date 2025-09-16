
import { Injectable } from '@angular/core';
import { env, FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';
import { FilesystemCache } from '../helper-class/FilesystemCache';

@Injectable({
  providedIn: 'root'
})
export class InferenceService {

  #inference!: FeatureExtractionPipeline;
  private isInitialized = false;

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
  }

  public async initModel() {
    try {
      this.#inference = await pipeline<"feature-extraction">('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2', { device: 'auto', model_file_name: 'model_qint8_arm64' });

      this.isInitialized = true;
    } catch (e) {
      console.error(e);
    }
  }

  public async generateEmbeddings(text: string) {
    if (!this.isInitialized || !this.#inference) {
      throw new Error('Model not initialized. Call initModel() first.');
    }

    try {
      console.log('🔮 Generating embeddings for:', text.substring(0, 50) + '...');

      // Generate embeddings
      const result = await this.#inference(text, {
        pooling: 'mean',
        normalize: true
      });

      // Extract the embedding array
      const embeddings = Array.from(result.data);

      console.log('✅ Generated embeddings:', embeddings.length, 'dimensions');
      return embeddings;

    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw error;
    }
  }

}
