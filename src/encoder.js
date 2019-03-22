import * as use from '@tensorflow-models/universal-sentence-encoder';

export function loadModel() {
  return use.load();  
}

// Returns a 2D tensor consisting of the 512-dimensional embeddings for each sentence.
// So with two sentences, `embeddings` has the shape [2, 512].
export function embeddingsFor(model, sentences) {
  return model.embed(sentences);
}