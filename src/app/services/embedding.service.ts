import { Injectable } from '@angular/core';
import { InferenceSession } from 'onnxruntime-web';
import * as ort from 'onnxruntime-web';
import { BertTokenizer } from '../utils/tokenizer';

async function loadVocabTxt(path: string): Promise<Record<string, number>> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load vocab: ${res.statusText}`);
  const text = await res.text();

  const vocab: Record<string, number> = {};
  const lines = text.split(/\r?\n/).filter(Boolean);

  lines.forEach((token, idx) => {
    vocab[token] = idx;
  });

  return vocab;
}


function meanPooling(lastHiddenState: any, attentionMask: any) {
  const [_, seqLen, hiddenSize] = lastHiddenState.dims;
  const data = lastHiddenState.data;
  const embedding = new Float32Array(hiddenSize).fill(0);

  let tokenCount = 0;
  for (let i = 0; i < seqLen; i++) {
    if (attentionMask[i] === 1) {
      for (let j = 0; j < hiddenSize; j++) {
        embedding[j] += data[i * hiddenSize + j];
      }
      tokenCount++;
    }
  }

  for (let j = 0; j < hiddenSize; j++) {
    embedding[j] /= tokenCount;
  }

  return embedding;
}

function l2Normalize(vec: any) {
  const norm = Math.sqrt(vec.reduce((sum: any, val: any) => sum + val * val, 0));
  return vec.map((x: any) => x / norm);
}

@Injectable({
  providedIn: 'root'
})
export class EmbeddingService {
  private onnxModel: any;

  private sessionOption: InferenceSession.SessionOptions = {
    executionProviders: ["wasm"],
  }

  public async loadModel() {

    ort.env.wasm.wasmPaths = "/assets/";

    this.onnxModel = await InferenceSession.create('assets/model.onnx', this.sessionOption);

    const vocab = await loadVocabTxt("assets/vocab.txt");
    const tokenizer = new BertTokenizer(vocab, {
      doLowerCase: true,   // use false if you're on a cased model
      stripAccents: true,
    });

    const { inputIds, attentionMask, tokens } = tokenizer.encode(
      "Playing football in Bengaluru!"
    );

    console.log(tokens);
    console.log(inputIds, attentionMask);

    const decoded = tokenizer.decode(inputIds);
    console.log(decoded);

    console.log(this.onnxModel.inputNames);
    console.log(this.onnxModel);

    const tokenTypeIds = Array(inputIds.length).fill(0);

    const feed: any = {
      input_ids: new ort.Tensor("int64", inputIds, [1, inputIds.length]),
      attention_mask: new ort.Tensor("int64", attentionMask, [1, attentionMask.length]),
      token_type_ids: new ort.Tensor("int64", tokenTypeIds, [1, tokenTypeIds.length]),
    }

    const result = await this.onnxModel.run(feed);
    console.log("RESULT ", result);


    const pooled = meanPooling(result.last_hidden_state, attentionMask);
    const normalizedEmbedding = l2Normalize(pooled);

    console.log("Embedding:", normalizedEmbedding);



  }


}
